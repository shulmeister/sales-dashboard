from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Depends, status, Query
from pydantic import BaseModel
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import os
import json
from typing import List, Dict, Any, Optional
import logging
import time
import threading
from datetime import datetime, timedelta, timezone
try:
    import pytz
except ImportError:
    pytz = None
from parser import PDFParser
from google_sheets import GoogleSheetsManager
from database import get_db, db_manager
from models import Visit, TimeEntry, Contact, ActivityNote, FinancialEntry, SalesBonus, DashboardSummary, EmailCount, ActivityLog, Deal
from analytics import AnalyticsEngine
from migrate_data import GoogleSheetsMigrator
from business_card_scanner import BusinessCardScanner
from mailchimp_service import MailchimpService
from auth import oauth_manager, get_current_user, get_current_user_optional
from google_drive_service import GoogleDriveService
from dotenv import load_dotenv
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

# Load environment variables
load_dotenv()


def ensure_contact_schema():
    """Add new contact columns if they are missing (works for Postgres + SQLite)."""
    engine = db_manager.engine
    if not engine:
        return

    dialect = engine.dialect.name

    def column_exists(conn, column_name: str) -> bool:
        if dialect == "sqlite":
            rows = conn.execute(text(f"PRAGMA table_info(contacts)")).fetchall()
            return any(row[1] == column_name for row in rows)
        query = text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name='contacts' AND column_name=:column"
        )
        row = conn.execute(query, {"column": column_name}).fetchone()
        return row is not None

    def add_column(conn, statement: str):
        if dialect == "sqlite":
            conn.execute(text(f"ALTER TABLE contacts ADD COLUMN {statement}"))
        else:
            conn.execute(text(f"ALTER TABLE contacts ADD COLUMN IF NOT EXISTS {statement}"))

    with engine.connect() as conn:
        if not column_exists(conn, "status"):
            add_column(conn, "status VARCHAR(50)")
        if not column_exists(conn, "contact_type"):
            add_column(conn, "contact_type VARCHAR(50)")
        if not column_exists(conn, "tags"):
            add_column(conn, "tags TEXT")
        if not column_exists(conn, "last_activity"):
            add_column(conn, "last_activity TIMESTAMP")
        if not column_exists(conn, "account_manager"):
            add_column(conn, "account_manager VARCHAR(255)")
        if not column_exists(conn, "source"):
            add_column(conn, "source VARCHAR(255)")


ensure_contact_schema()


def ensure_deal_schema():
    """Ensure deals table exists with required columns (lightweight migration)."""
    engine = db_manager.engine
    if not engine:
        return

    with engine.connect() as conn:
        # Create table if missing
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS deals (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    company_id INTEGER NULL,
                    contact_ids TEXT NULL,
                    category VARCHAR(100) NULL,
                    stage VARCHAR(100) NULL,
                    description TEXT NULL,
                    amount FLOAT NULL,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    archived_at TIMESTAMP NULL,
                    expected_closing_date TIMESTAMP NULL,
                    sales_id INTEGER NULL,
                    index INTEGER NULL,
                    est_weekly_hours FLOAT NULL
                )
                """
            )
        )
        # Add missing columns if table existed without them
        columns = {
            "company_id": "INTEGER",
            "contact_ids": "TEXT",
            "category": "VARCHAR(100)",
            "stage": "VARCHAR(100)",
            "description": "TEXT",
            "amount": "FLOAT",
            "archived_at": "TIMESTAMP",
            "expected_closing_date": "TIMESTAMP",
            "sales_id": "INTEGER",
            "index": "INTEGER",
            "est_weekly_hours": "FLOAT",
        }
        dialect = engine.dialect.name

        def column_exists(column: str) -> bool:
            if dialect == "sqlite":
                rows = conn.execute(text("PRAGMA table_info(deals)")).fetchall()
                return any(row[1] == column for row in rows)
            row = conn.execute(
                text(
                    "SELECT column_name FROM information_schema.columns WHERE table_name='deals' AND column_name=:column"
                ),
                {"column": column},
            ).fetchone()
            return row is not None

        for col, typ in columns.items():
            if not column_exists(col):
                if dialect == "sqlite":
                    conn.execute(text(f"ALTER TABLE deals ADD COLUMN {col} {typ}"))
                else:
                    conn.execute(
                        text(f"ALTER TABLE deals ADD COLUMN IF NOT EXISTS {col} {typ}")
                    )


ensure_deal_schema()

# Portal SSO configuration (shared secret with main portal)
PORTAL_SECRET = os.getenv("PORTAL_SECRET", "colorado-careassist-portal-2025")
PORTAL_SSO_SERIALIZER = URLSafeTimedSerializer(PORTAL_SECRET)
PORTAL_SSO_TOKEN_TTL = int(os.getenv("PORTAL_SSO_TOKEN_TTL", "300"))

# Ring Central Embeddable configuration
RINGCENTRAL_EMBED_CLIENT_ID = os.getenv("RINGCENTRAL_EMBED_CLIENT_ID")
RINGCENTRAL_EMBED_SERVER = os.getenv("RINGCENTRAL_EMBED_SERVER", "https://platform.ringcentral.com")
RINGCENTRAL_EMBED_APP_URL = os.getenv(
    "RINGCENTRAL_EMBED_APP_URL",
    "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/app.html",
)
RINGCENTRAL_EMBED_ADAPTER_URL = os.getenv(
    "RINGCENTRAL_EMBED_ADAPTER_URL",
    "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js",
)
RINGCENTRAL_EMBED_DEFAULT_TAB = os.getenv("RINGCENTRAL_EMBED_DEFAULT_TAB", "messages")
RINGCENTRAL_EMBED_REDIRECT_URI = os.getenv(
    "RINGCENTRAL_EMBED_REDIRECT_URI",
    "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/redirect.html"
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Sync manager to prevent logjam
class SyncManager:
    """Manages Google Sheets sync to prevent concurrent syncs and cache results"""
    
    def __init__(self):
        self.last_sync_time = 0
        self.sync_lock = threading.Lock()
        self.sync_interval = 60  # Only sync once per 60 seconds max
        self.last_sync_result: Optional[Dict[str, Any]] = None
    
    def should_sync(self) -> bool:
        """Check if enough time has passed since last sync"""
        return (time.time() - self.last_sync_time) > self.sync_interval
    
    def sync_if_needed(self, force: bool = False) -> Dict[str, Any]:
        """
        Sync from Google Sheets if enough time has passed (or when forced).
        This method is safe to call from multiple threads/concurrent requests.
        """
        if not force and not self.should_sync():
            logger.debug("Sync skipped - too soon since last sync")
            return self.last_sync_result or {"success": True, "visits_migrated": 0, "time_entries_migrated": 0}
        
        if not self.sync_lock.acquire(blocking=False):
            logger.debug("Sync skipped - another sync in progress")
            return self.last_sync_result or {"success": True, "visits_migrated": 0, "time_entries_migrated": 0}
        
        try:
            # Guard again after acquiring the lock to avoid duplicate work
            if not force and not self.should_sync():
                logger.debug("Sync skipped - another request already synced")
                return self.last_sync_result or {"success": True, "visits_migrated": 0, "time_entries_migrated": 0}
            
            logger.info("SYNC: Starting Google Sheets sync%s...", " (forced)" if force else "")
            migrator = GoogleSheetsMigrator()
            result = migrator.migrate_all_data()
            
            self.last_sync_time = time.time()
            self.last_sync_result = result
            
            if result.get("success"):
                logger.info(
                    "SYNC: Success - %s visits, %s time entries",
                    result.get('visits_migrated', 0),
                    result.get('time_entries_migrated', 0)
                )
            else:
                logger.error("SYNC: Failed - %s", result.get('error', 'Unknown error'))
            
            return result
        except Exception as e:
            logger.error("SYNC ERROR: %s", str(e), exc_info=True)
            return {"success": False, "error": str(e), "visits_migrated": 0, "time_entries_migrated": 0}
        finally:
            self.sync_lock.release()

# Initialize sync manager
sync_manager = SyncManager()

app = FastAPI(title="Colorado CareAssist Sales Dashboard", version="2.0.0")

# Add security middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "https://tracker.coloradocareassist.com"],  # Production domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1", "*.herokuapp.com", "tracker.coloradocareassist.com"]  # Production domain
)

# Mount static files and templates
templates = Jinja2Templates(directory="templates")

# Mount React frontend static assets
frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.exists(frontend_dist):
    # Mount React assets (CSS, JS, etc.)
    frontend_assets = os.path.join(frontend_dist, "assets")
    if os.path.exists(frontend_assets):
        app.mount("/assets", StaticFiles(directory=frontend_assets), name="assets")
    logger.info(f"✅ React frontend mounted from {frontend_dist}")
else:
    logger.warning(f"⚠️  React frontend not found at {frontend_dist}")

# Initialize components
pdf_parser = PDFParser()
business_card_scanner = BusinessCardScanner()

# Initialize Google Sheets manager with error handling (for migration)
try:
    sheets_manager = GoogleSheetsManager()
    logger.info("Google Sheets manager initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Google Sheets manager: {str(e)}")
    sheets_manager = None

# Authentication endpoints
@app.get("/auth/login")
async def login():
    """Redirect to Google OAuth login"""
    try:
        auth_url = oauth_manager.get_authorization_url()
        return RedirectResponse(url=auth_url)
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication service unavailable")

@app.get("/auth/callback")
async def auth_callback(request: Request, code: str = None, error: str = None):
    """Handle Google OAuth callback"""
    if error:
        logger.error(f"OAuth error: {error}")
        raise HTTPException(status_code=400, detail=f"Authentication failed: {error}")
    
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not provided")
    
    try:
        result = await oauth_manager.handle_callback(code, "")
        
        # Create response with session cookie
        response = RedirectResponse(url="/", status_code=302)
        response.set_cookie(
            key="session_token",
            value=result["session_token"],
            max_age=3600 * 24,  # 24 hours
            httponly=True,
            secure=True,  # HTTPS required in production
            samesite="lax"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Callback error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")

@app.post("/auth/logout")
async def logout(request: Request):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        oauth_manager.logout(session_token)
    
    response = JSONResponse({"success": True, "message": "Logged out successfully"})
    response.delete_cookie("session_token")
    return response


@app.get("/portal-auth")
async def portal_auth(
    portal_token: str = Query(..., min_length=10),
    portal_user_email: Optional[str] = Query(None),
    redirect_to: Optional[str] = Query(None)
):
    """
    Accept SSO redirects from the main portal, validate the signed token,
    and mint a local session cookie so users are not prompted to log in again.
    """
    try:
        portal_payload = PORTAL_SSO_SERIALIZER.loads(
            portal_token,
            max_age=PORTAL_SSO_TOKEN_TTL
        )
    except SignatureExpired:
        logger.warning("Portal SSO token expired")
        raise HTTPException(status_code=400, detail="Portal token expired")
    except BadSignature:
        logger.warning("Portal SSO token invalid signature")
        raise HTTPException(status_code=400, detail="Invalid portal token")

    email = portal_user_email or portal_payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Portal token missing user email")

    name = portal_payload.get("name") or portal_payload.get("display_name") or "Portal User"
    domain = portal_payload.get("domain") or email.split("@")[-1]

    session_payload = {
        "email": email,
        "name": name,
        "domain": domain,
        "picture": portal_payload.get("picture"),
        "via_portal": True,
        "portal_login": True,
        "login_time": datetime.utcnow().isoformat()
    }

    session_token = oauth_manager.serializer.dumps(session_payload)

    target_url = redirect_to or "/"
    if not target_url.startswith("/"):
        logger.debug("Portal redirect_to %s not relative; defaulting to /", target_url)
        target_url = "/"

    response = RedirectResponse(url=target_url, status_code=302)
    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=3600 * 12,
        httponly=True,
        secure=True,
        samesite="lax"
    )

    logger.info("Portal SSO login successful for %s", email)
    return response

@app.get("/auth/me")
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user information"""
    return {
        "success": True,
        "user": {
            "email": current_user.get("email"),
            "name": current_user.get("name"),
            "picture": current_user.get("picture"),
            "domain": current_user.get("domain")
        }
    }

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request, current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    """Serve the React CRM app"""
    if not current_user:
        # Redirect to login if not authenticated
        return RedirectResponse(url="/auth/login")
    
    # Serve React app
    frontend_index = os.path.join(os.path.dirname(__file__), "frontend", "dist", "index.html")
    if os.path.exists(frontend_index):
        logger.info(f"✅ Serving React app from {frontend_index}")
        return FileResponse(frontend_index)
    
    # Fallback to old Jinja2 template if React build doesn't exist
    logger.warning(f"⚠️  React frontend not found at {frontend_index}, redirecting to /legacy")
    return RedirectResponse(url="/legacy")

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Upload and parse PDF file (MyWay route or Time tracking) or scan business card image"""
    try:
        # Validate file type
        file_extension = file.filename.lower().split('.')[-1] if '.' in file.filename else ''
        allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'heif']
        
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Only {', '.join(allowed_extensions)} files are allowed")
        
        # Read file content
        content = await file.read()
        
        if file_extension == 'pdf':
            # Parse PDF (MyWay route or Time tracking)
            logger.info(f"Parsing PDF: {file.filename}")
            result = pdf_parser.parse_pdf(content)
            
            if not result.get("success", False):
                error_msg = result.get("error", "Failed to parse PDF")
                logger.error(f"PDF parsing failed: {error_msg}")
                raise HTTPException(status_code=400, detail=error_msg)
        
            # Return appropriate response based on PDF type
            if result["type"] == "time_tracking":
                # Serialize date if it's a datetime object
                date_value = result["date"]
                if isinstance(date_value, datetime):
                    date_value = date_value.date().isoformat()
                elif date_value and hasattr(date_value, 'date'):
                    date_value = date_value.date().isoformat()
                
                logger.info(f"Successfully parsed time tracking data: {date_value} - {result['total_hours']} hours")
                return JSONResponse({
                    "success": True,
                    "filename": file.filename,
                    "type": "time_tracking",
                    "date": date_value,
                    "total_hours": result["total_hours"]
                })
            else:
                visits = result["visits"]
                if not visits:
                    raise HTTPException(status_code=400, detail="No visits found in PDF")
                
                # Serialize datetime objects to ISO strings for JSON response
                serialized_visits = []
                for visit in visits:
                    serialized_visit = visit.copy()
                    if "visit_date" in serialized_visit and serialized_visit["visit_date"]:
                        if isinstance(serialized_visit["visit_date"], datetime):
                            # Convert datetime to ISO string (date-only format to avoid timezone issues)
                            serialized_visit["visit_date"] = serialized_visit["visit_date"].date().isoformat()
                        elif hasattr(serialized_visit["visit_date"], 'date'):
                            serialized_visit["visit_date"] = serialized_visit["visit_date"].date().isoformat()
                    serialized_visits.append(serialized_visit)
                
                logger.info(f"Successfully parsed {len(serialized_visits)} visits")
                return JSONResponse({
                    "success": True,
                    "filename": file.filename,
                    "type": "myway_route",
                    "visits": serialized_visits,
                    "count": len(serialized_visits)
                })
        else:
            # Handle business card image (including HEIC)
            logger.info(f"Processing business card image: {file.filename}")
            logger.info(f"File content length: {len(content)} bytes")
            logger.info(f"File extension: {file_extension}")
            try:
                result = business_card_scanner.scan_image(content)
                
                if not result.get("success", False):
                    error_msg = result.get("error", "Failed to scan business card")
                    logger.error(f"Business card scanning failed: {error_msg}")
                    raise HTTPException(status_code=400, detail=error_msg)
                
                # Validate contact information
                contact_data = business_card_scanner.validate_contact(result["contact"])
                
                # Save to database
                # Check for existing contact by email if present
                existing_contact = None
                if contact_data.get('email'):
                    existing_contact = db.query(Contact).filter(Contact.email == contact_data['email']).first()
                
                if existing_contact:
                    logger.info(f"Updating existing contact: {contact_data.get('email')}")
                    # Update fields if they are empty in existing record
                    if not existing_contact.phone and contact_data.get('phone'):
                        existing_contact.phone = contact_data['phone']
                    if not existing_contact.title and contact_data.get('title'):
                        existing_contact.title = contact_data['title']
                    if not existing_contact.company and contact_data.get('company'):
                        existing_contact.company = contact_data['company']
                    if not existing_contact.website and contact_data.get('website'):
                        existing_contact.website = contact_data['website']
                    
                    # Merge notes
                    new_notes = f"Scanned from business card on {datetime.now().strftime('%Y-%m-%d')}"
                    if existing_contact.notes:
                        existing_contact.notes = existing_contact.notes + "\n" + new_notes
                    else:
                        existing_contact.notes = new_notes
                        
                    existing_contact.updated_at = datetime.utcnow()
                    db.add(existing_contact)
                    db.commit()
                    db.refresh(existing_contact)
                    saved_contact = existing_contact
                else:
                    logger.info(f"Creating new contact from scan: {contact_data.get('name')}")
                    new_contact = Contact(
                        name=contact_data.get('name'),
                        company=contact_data.get('company'),
                        title=contact_data.get('title'),
                        phone=contact_data.get('phone'),
                        email=contact_data.get('email'),
                        address=contact_data.get('address'),
                        website=contact_data.get('website'),
                        notes=f"Scanned from business card on {datetime.now().strftime('%Y-%m-%d')}",
                        contact_type="prospect",  # Default to prospect
                        status="cold",  # Default to cold
                        tags=_serialize_tags(["Scanned"]),
                        scanned_date=datetime.utcnow(),
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    db.add(new_contact)
                    db.commit()
                    db.refresh(new_contact)
                    saved_contact = new_contact

                # Export to Mailchimp if configured
                mailchimp_result = None
                mailchimp_service = MailchimpService()
                if mailchimp_service.enabled and contact_data.get('email'):
                    mailchimp_result = mailchimp_service.add_contact(contact_data)
                    logger.info(f"Mailchimp export result: {mailchimp_result}")
                
                logger.info(f"Successfully scanned and saved business card: {contact_data.get('name', 'Unknown')}")
                return JSONResponse({
                    "success": True,
                    "filename": file.filename,
                    "type": "business_card",
                    "contact": saved_contact.to_dict(),
                    "extracted_text": result.get("raw_text", ""),
                    "mailchimp_export": mailchimp_result
                })
            except Exception as e:
                logger.error(f"Error processing business card: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error processing business card: {str(e)}")

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class UrlUploadRequest(BaseModel):
    url: str

@app.post("/upload-url")
async def upload_from_url(
    request: UrlUploadRequest,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Upload and parse file from Google Drive URL"""
    try:
        url = request.url
        logger.info(f"Processing URL upload: {url}")
        
        # Download file from Drive
        drive_service = GoogleDriveService()
        if not drive_service.enabled:
            raise HTTPException(status_code=503, detail="Google Drive service not configured")
            
        result = drive_service.download_file_from_url(url)
        if not result:
            raise HTTPException(status_code=400, detail="Failed to download file from URL. Ensure the link is accessible.")
            
        content, filename = result
        logger.info(f"Downloaded file: {filename} ({len(content)} bytes)")
        
        # Determine file type and process accordingly
        file_extension = filename.lower().split('.')[-1] if '.' in filename else ''
        
        if file_extension == 'pdf':
            # Parse PDF (MyWay route or Time tracking)
            logger.info(f"Parsing PDF: {filename}")
            parse_result = pdf_parser.parse_pdf(content)
            
            if not parse_result.get("success", False):
                error_msg = parse_result.get("error", "Failed to parse PDF")
                logger.error(f"PDF parsing failed: {error_msg}")
                raise HTTPException(status_code=400, detail=error_msg)
        
            # Return appropriate response based on PDF type
            if parse_result["type"] == "time_tracking":
                # Serialize date if it's a datetime object
                date_value = parse_result["date"]
                if isinstance(date_value, datetime):
                    date_value = date_value.date().isoformat()
                elif date_value and hasattr(date_value, 'date'):
                    date_value = date_value.date().isoformat()
                
                return JSONResponse({
                    "success": True,
                    "filename": filename,
                    "type": "time_tracking",
                    "date": date_value,
                    "total_hours": parse_result["total_hours"]
                })
            else:
                visits = parse_result["visits"]
                if not visits:
                    raise HTTPException(status_code=400, detail="No visits found in PDF")
                
                # Serialize datetime objects
                serialized_visits = []
                for visit in visits:
                    serialized_visit = visit.copy()
                    if "visit_date" in serialized_visit and serialized_visit["visit_date"]:
                        if isinstance(serialized_visit["visit_date"], datetime):
                            serialized_visit["visit_date"] = serialized_visit["visit_date"].date().isoformat()
                        elif hasattr(serialized_visit["visit_date"], 'date'):
                            serialized_visit["visit_date"] = serialized_visit["visit_date"].date().isoformat()
                    serialized_visits.append(serialized_visit)
                
                return JSONResponse({
                    "success": True,
                    "filename": filename,
                    "type": "myway_route",
                    "visits": serialized_visits,
                    "count": len(serialized_visits)
                })
        else:
            # Assume image for business card
            logger.info(f"Processing business card image from URL: {filename}")
            scan_result = business_card_scanner.scan_image(content)
            
            if not scan_result.get("success", False):
                error_msg = scan_result.get("error", "Failed to scan business card")
                raise HTTPException(status_code=400, detail=error_msg)
            
            # Validate contact information
            contact_data = business_card_scanner.validate_contact(scan_result["contact"])
            
            # Save to database (reusing logic from /upload)
            existing_contact = None
            if contact_data.get('email'):
                existing_contact = db.query(Contact).filter(Contact.email == contact_data['email']).first()
            
            if existing_contact:
                # Update logic...
                if not existing_contact.phone and contact_data.get('phone'):
                    existing_contact.phone = contact_data['phone']
                if not existing_contact.title and contact_data.get('title'):
                    existing_contact.title = contact_data['title']
                if not existing_contact.company and contact_data.get('company'):
                    existing_contact.company = contact_data['company']
                if not existing_contact.website and contact_data.get('website'):
                    existing_contact.website = contact_data['website']
                
                new_notes = f"Scanned from business card URL on {datetime.now().strftime('%Y-%m-%d')}"
                if existing_contact.notes:
                    existing_contact.notes = existing_contact.notes + "\n" + new_notes
                else:
                    existing_contact.notes = new_notes
                    
                existing_contact.updated_at = datetime.utcnow()
                db.add(existing_contact)
                db.commit()
                db.refresh(existing_contact)
                saved_contact = existing_contact
            else:
                # Create logic...
                new_contact = Contact(
                    name=contact_data.get('name'),
                    company=contact_data.get('company'),
                    title=contact_data.get('title'),
                    phone=contact_data.get('phone'),
                    email=contact_data.get('email'),
                    address=contact_data.get('address'),
                    website=contact_data.get('website'),
                    notes=f"Scanned from business card URL on {datetime.now().strftime('%Y-%m-%d')}",
                    contact_type="prospect",
                    status="cold",
                    tags=_serialize_tags(["Scanned"]),
                    scanned_date=datetime.utcnow(),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(new_contact)
                db.commit()
                db.refresh(new_contact)
                saved_contact = new_contact

            # Export to Mailchimp
            mailchimp_result = None
            mailchimp_service = MailchimpService()
            if mailchimp_service.enabled and contact_data.get('email'):
                mailchimp_result = mailchimp_service.add_contact(contact_data)
            
            return JSONResponse({
                "success": True,
                "filename": filename,
                "type": "business_card",
                "contact": saved_contact.to_dict(),
                "extracted_text": scan_result.get("raw_text", ""),
                "mailchimp_export": mailchimp_result
            })
            
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error processing URL upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/save-visits")
async def save_visits(request: Request, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Save visits from PDF upload to database and Google Sheet"""
    try:
        from sqlalchemy import func
        from datetime import datetime
        import re
        
        def normalize_business_name(name):
            """Normalize business name for duplicate checking"""
            if not name:
                return ""
            normalized = (name or "").lower().strip()
            normalized = re.sub(r'\s+', ' ', normalized)
            return normalized
        
        data = await request.json()
        visits = data.get("visits", [])
        
        if not visits:
            raise HTTPException(status_code=400, detail="No visits provided")
        
        # Check for duplicates in database
        duplicate_info = []
        saved_visits = []
        skipped_visits = []
        
        for visit_data in visits:
            # Handle both dict and object formats
            if isinstance(visit_data, dict):
                visit_date = visit_data.get("visit_date")
                stop_number = visit_data.get("stop_number")
                business_name = visit_data.get("business_name")
                address = visit_data.get("address")
                city = visit_data.get("city")
                notes = visit_data.get("notes")
            else:
                # Handle object format (from database)
                visit_date = getattr(visit_data, "visit_date", None)
                stop_number = getattr(visit_data, "stop_number", None)
                business_name = getattr(visit_data, "business_name", None)
                address = getattr(visit_data, "address", None)
                city = getattr(visit_data, "city", None)
                notes = getattr(visit_data, "notes", None)
            
            # Parse date if it's a string - handle timezone correctly to avoid day shifts
            if visit_date:
                if isinstance(visit_date, str):
                    try:
                        # If it has a time component with Z, parse it but convert to local naive datetime
                        if 'T' in visit_date and 'Z' in visit_date:
                            # Parse as UTC first
                            utc_date = datetime.fromisoformat(visit_date.replace('Z', '+00:00'))
                            # Extract just the date part and create a naive datetime at midnight
                            # This prevents timezone conversion issues
                            visit_date = datetime.combine(utc_date.date(), datetime.min.time())
                        elif 'T' in visit_date:
                            # Has time but no Z - parse as is
                            visit_date = datetime.fromisoformat(visit_date)
                            # Extract just the date part
                            visit_date = datetime.combine(visit_date.date(), datetime.min.time())
                        else:
                            # Date-only string - parse as naive datetime at midnight
                            visit_date = datetime.strptime(visit_date.split('T')[0], '%Y-%m-%d')
                    except:
                        try:
                            # Try alternative format
                            visit_date = datetime.strptime(visit_date.split('T')[0], '%Y-%m-%d')
                        except:
                            visit_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                elif isinstance(visit_date, datetime):
                    # Already a datetime - ensure it's at midnight to avoid timezone issues
                    visit_date = visit_date.replace(hour=0, minute=0, second=0, microsecond=0)
                else:
                    visit_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            else:
                # Default to today at midnight
                visit_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Check if this visit already exists (same date, normalized business name, stop number)
            visit_date_only = visit_date.date() if visit_date else datetime.now().date()
            business_normalized = normalize_business_name(business_name or "")
            
            # Simplified duplicate check - get all visits on this date and check in Python
            existing_visits = db.query(Visit).filter(
                func.date(Visit.visit_date) == visit_date_only,
                Visit.stop_number == (stop_number or 1)
            ).all()
            
            # Check if any existing visit has matching normalized business name
            existing_visit = None
            for ev in existing_visits:
                ev_business_normalized = normalize_business_name(ev.business_name or "")
                if ev_business_normalized == business_normalized:
                    existing_visit = ev
                    break
            
            if existing_visit:
                # Duplicate found - skip saving but report it
                duplicate_info.append({
                    "business_name": business_name or "Unknown",
                    "address": address or "",
                    "city": city or "",
                    "date": visit_date_only.isoformat(),
                    "stop_number": stop_number or 1,
                    "existing_id": existing_visit.id
                })
                skipped_visits.append(visit_data)
                continue
            
            visit = Visit(
                stop_number=stop_number,
                business_name=business_name or "",
                address=address or "",
                city=city or "",
                notes=notes or "",
                visit_date=visit_date
            )
            db.add(visit)
            saved_visits.append(visit)
        
        db.commit()
        
        # Refresh all visits to get IDs
        for visit in saved_visits:
            db.refresh(visit)
        
        # Prepare visits data for Google Sheets (only non-duplicates)
        visits_for_sheet = []
        for visit_data in saved_visits:
            visits_for_sheet.append({
                "stop_number": visit_data.stop_number,
                "business_name": visit_data.business_name or "",
                "address": visit_data.address or "",
                "city": visit_data.city or "",
                "notes": visit_data.notes or ""
            })
        
        # Also sync to Google Sheets if available (only new visits, not duplicates)
        if sheets_manager and visits_for_sheet:
            try:
                sheets_manager.append_visits(visits_for_sheet)
                logger.info(f"Synced {len(visits_for_sheet)} new visits to Google Sheets")
            except Exception as e:
                logger.warning(f"Failed to sync to Google Sheets: {str(e)}")
        
        logger.info(f"Successfully saved {len(saved_visits)} new visits, skipped {len(skipped_visits)} duplicates")
        
        # Build response message
        message = f"Successfully saved {len(saved_visits)} visit(s)"
        if duplicate_info:
            message += f", skipped {len(duplicate_info)} duplicate(s)"
        
        return JSONResponse({
            "success": True,
            "message": message,
            "count": len(saved_visits),
            "duplicates": len(duplicate_info),
            "duplicate_details": duplicate_info if duplicate_info else []
        })
        
    except Exception as e:
        logger.error(f"Error saving visits: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving visits: {str(e)}")

@app.post("/append-to-sheet")
async def append_to_sheet(request: Request, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Append visits to database and optionally sync to Google Sheet"""
    try:
        data = await request.json()
        data_type = data.get("type", "myway_route")
        
        if data_type == "time_tracking":
            # Handle time tracking data
            date = data.get("date")
            total_hours = data.get("total_hours")
            
            if not date or total_hours is None:
                raise HTTPException(status_code=400, detail="Date and total_hours are required for time tracking")
            
            # Save to database
            from datetime import datetime
            time_entry = TimeEntry(
                date=datetime.fromisoformat(date.replace('Z', '+00:00')) if 'T' in date else datetime.strptime(date, '%Y-%m-%d'),
                hours_worked=total_hours
            )
            
            db.add(time_entry)
            db.commit()
            db.refresh(time_entry)
            
            # Also sync to Google Sheets if available
            if sheets_manager:
                try:
                    sheets_manager.update_daily_summary(date, total_hours)
                    logger.info("Synced time entry to Google Sheets")
                except Exception as e:
                    logger.warning(f"Failed to sync to Google Sheets: {str(e)}")
            
            logger.info(f"Successfully saved time entry: {date} - {total_hours} hours")
            
            return JSONResponse({
                "success": True,
                "message": f"Successfully saved {total_hours} hours for {date}",
                "date": date,
                "hours": total_hours
            })
        
        else:
            # Handle MyWay route data
            visits = data.get("visits", [])
            
            if not visits:
                raise HTTPException(status_code=400, detail="No visits provided")
            
            # Save visits to database
            saved_visits = []
            for visit_data in visits:
                # Use visit_date from parsed data if available, otherwise use today
                visit_date = visit_data.get("visit_date")
                if visit_date:
                    # Parse date if it's a string - handle timezone correctly
                    if isinstance(visit_date, str):
                        from datetime import datetime
                        try:
                            # If it has a time component with Z, extract just the date part
                            if 'T' in visit_date and 'Z' in visit_date:
                                utc_date = datetime.fromisoformat(visit_date.replace('Z', '+00:00'))
                                visit_date = datetime.combine(utc_date.date(), datetime.min.time())
                            elif 'T' in visit_date:
                                parsed = datetime.fromisoformat(visit_date)
                                visit_date = datetime.combine(parsed.date(), datetime.min.time())
                            else:
                                visit_date = datetime.strptime(visit_date.split('T')[0], '%Y-%m-%d')
                        except:
                            visit_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                    elif isinstance(visit_date, datetime):
                        # Already a datetime - ensure it's at midnight
                        visit_date = visit_date.replace(hour=0, minute=0, second=0, microsecond=0)
                    else:
                        visit_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                else:
                    visit_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                
                visit = Visit(
                    stop_number=visit_data.get("stop_number"),
                    business_name=visit_data.get("business_name"),
                    address=visit_data.get("address"),
                    city=visit_data.get("city") or "",  # Empty string if not found (don't default to "Unknown")
                    notes=visit_data.get("notes"),
                    visit_date=visit_date
                )
                db.add(visit)
                saved_visits.append(visit)
            
            db.commit()
            
            # Refresh all visits to get IDs
            for visit in saved_visits:
                db.refresh(visit)
            
            # Also sync to Google Sheets if available
            if sheets_manager:
                try:
                    sheets_manager.append_visits(visits)
                    logger.info("Synced visits to Google Sheets")
                except Exception as e:
                    logger.warning(f"Failed to sync to Google Sheets: {str(e)}")
            
            logger.info(f"Successfully saved {len(visits)} visits to database")
            
            return JSONResponse({
                "success": True,
                "message": f"Successfully saved {len(visits)} visits to database",
                "appended_count": len(visits)
            })
        
    except Exception as e:
        logger.error(f"Error saving data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving data: {str(e)}")

# Dashboard API endpoints
@app.get("/api/gmail/test")
async def test_gmail_connection(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Test Gmail API connection"""
    try:
        from gmail_service import GmailService
        
        gmail_service = GmailService()
        result = gmail_service.test_connection()
        return JSONResponse(result)
    except Exception as e:
        logger.error(f"Error testing Gmail connection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error testing Gmail: {str(e)}")

@app.get("/api/mailchimp/test")
async def test_mailchimp_connection(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Test Mailchimp API connection"""
    try:
        mailchimp_service = MailchimpService()
        result = mailchimp_service.test_connection()
        return JSONResponse(result)
    except Exception as e:
        logger.error(f"Error testing Mailchimp connection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error testing Mailchimp: {str(e)}")

@app.post("/api/mailchimp/export")
async def export_contact_to_mailchimp(contact_data: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    """Export a contact to Mailchimp"""
    try:
        mailchimp_service = MailchimpService()
        result = mailchimp_service.add_contact(contact_data)
        return JSONResponse(result)
    except Exception as e:
        logger.error(f"Error exporting contact to Mailchimp: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error exporting to Mailchimp: {str(e)}")

@app.get("/api/dashboard/summary")
async def get_dashboard_summary(db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get dashboard summary statistics"""
    try:
        analytics = AnalyticsEngine(db)
        summary = analytics.get_dashboard_summary()
        return JSONResponse(summary)
    except Exception as e:
        logger.error(f"Error getting dashboard summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dashboard/sync")
async def trigger_dashboard_sync(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Manually trigger a Google Sheets sync.
    Use sparingly—this migrates visits and time entries from the sheet into the database.
    """
    try:
        result = sync_manager.sync_if_needed(force=True)
        return JSONResponse(result)
    except Exception as e:
        logger.error(f"Error triggering dashboard sync: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error syncing data: {str(e)}")

@app.get("/api/dashboard/visits-by-month")
async def get_visits_by_month(months: int = 12, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get visits grouped by month"""
    try:
        analytics = AnalyticsEngine(db)
        data = analytics.get_visits_by_month(months)
        return JSONResponse(data)
    except Exception as e:
        logger.error(f"Error getting visits by month: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/hours-by-month")
async def get_hours_by_month(months: int = 12, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get hours worked grouped by month"""
    try:
        analytics = AnalyticsEngine(db)
        data = analytics.get_hours_by_month(months)
        return JSONResponse(data)
    except Exception as e:
        logger.error(f"Error getting hours by month: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/top-facilities")
async def get_top_facilities(limit: int = 10, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get most visited facilities"""
    try:
        analytics = AnalyticsEngine(db)
        data = analytics.get_top_facilities(limit)
        return JSONResponse(data)
    except Exception as e:
        logger.error(f"Error getting top facilities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/referral-types")
async def get_referral_types(db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get visits categorized by referral type"""
    try:
        analytics = AnalyticsEngine(db)
        data = analytics.get_referral_types()
        return JSONResponse(data)
    except Exception as e:
        logger.error(f"Error getting referral types: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/costs-by-month")
async def get_costs_by_month(months: int = 12, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get costs grouped by month"""
    try:
        analytics = AnalyticsEngine(db)
        data = analytics.get_costs_by_month(months)
        return JSONResponse(data)
    except Exception as e:
        logger.error(f"Error getting costs by month: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/recent-activity")
async def get_recent_activity(limit: int = 20, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get recent activity across all data types"""
    try:
        analytics = AnalyticsEngine(db)
        data = analytics.get_recent_activity(limit)
        return JSONResponse(data)
    except Exception as e:
        logger.error(f"Error getting recent activity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/visits")
async def get_visits(db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get all visits (from the database)"""
    try:
        visits = db.query(Visit).order_by(Visit.visit_date.desc()).all()
        response_data = [visit.to_dict() for visit in visits]
        return JSONResponse(response_data)
    except Exception as e:
        logger.error(f"Error getting visits: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/visits/{visit_id}")
async def update_visit_notes(
    visit_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update visit notes"""
    try:
        data = await request.json()
        notes = data.get('notes', '')
        
        visit = db.query(Visit).filter(Visit.id == visit_id).first()
        if not visit:
            return JSONResponse({"success": False, "error": "Visit not found"}, status_code=404)
        
        visit.notes = notes
        db.commit()
        
        logger.info(f"Updated notes for visit {visit_id}")
        return JSONResponse({"success": True})
    except Exception as e:
        logger.error(f"Error updating visit notes: {str(e)}")
        db.rollback()
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.get("/api/sales-bonuses")
async def get_sales_bonuses(db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get all sales bonuses"""
    try:
        sales = db.query(SalesBonus).order_by(SalesBonus.start_date.desc()).all()
        return JSONResponse([sale.to_dict() for sale in sales])
    except Exception as e:
        logger.error(f"Error getting sales bonuses: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def _parse_range(range_param: Optional[str], default_per_page: int = 50) -> tuple[int, int]:
    """Parse pagination range query parameter into start/end indexes."""
    if not range_param:
        return 0, default_per_page - 1
    try:
        start_str, end_str = range_param.split(",")
        start = int(start_str)
        end = int(end_str)
        if start < 0 or end < start:
            raise ValueError("Invalid range values")
        return start, end
    except Exception:
        logger.warning("Invalid range parameter '%s', using defaults", range_param)
        return 0, default_per_page - 1


def _apply_contact_filters(
    query,
    tags: Optional[List[str]],
    status: Optional[str],
    contact_type: Optional[str],
    last_activity_gte: Optional[Any] = None,
    last_activity_lte: Optional[Any] = None,
):
    """Apply simple filters to the contact query."""
    if status:
        query = query.filter(Contact.status == status)
    if contact_type:
        query = query.filter(Contact.contact_type == contact_type)
    if tags:
        for tag in tags:
            tag_value = tag.strip()
            if not tag_value:
                continue
            query = query.filter(Contact.tags.ilike(f'%{tag_value}%'))
    if last_activity_gte:
        dt = _coerce_datetime(last_activity_gte)
        if dt:
            query = query.filter(Contact.last_activity >= dt)
    if last_activity_lte:
        dt = _coerce_datetime(last_activity_lte)
        if dt:
            query = query.filter(Contact.last_activity <= dt)
    return query


def _apply_deal_filters(
    query,
    stage: Optional[str],
    created_gte: Optional[Any] = None,
    created_lte: Optional[Any] = None,
):
    if stage:
        query = query.filter(Deal.stage == stage)
    if created_gte:
        dt = _coerce_datetime(created_gte)
        if dt:
            query = query.filter(Deal.created_at >= dt)
    if created_lte:
        dt = _coerce_datetime(created_lte)
        if dt:
            query = query.filter(Deal.created_at <= dt)
    return query


def _contact_order_clause(sort_field: Optional[str], order: Optional[str]):
    """Return an order_by clause for contacts."""
    sort_map = {
        "last_activity": Contact.last_activity,
        "created_at": Contact.created_at,
        "name": Contact.name,
    }
    sort_column = sort_map.get((sort_field or "").lower(), Contact.created_at)
    direction = (order or "DESC").upper()
    return sort_column.desc() if direction == "DESC" else sort_column.asc()


def _deal_order_clause(sort_field: Optional[str], order: Optional[str]):
    sort_map = {
        "created_at": Deal.created_at,
        "name": Deal.name,
        "amount": Deal.amount,
    }
    sort_column = sort_map.get((sort_field or "").lower(), Deal.created_at)
    direction = (order or "DESC").upper()
    return sort_column.desc() if direction == "DESC" else sort_column.asc()


def _coerce_datetime(value: Optional[Any], default: Optional[datetime] = None) -> Optional[datetime]:
    """Convert string payload values to datetime when needed."""
    if value is None:
        return default
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    try:
        parsed = datetime.fromisoformat(value)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except Exception:
        return default


def _serialize_tags(value: Optional[Any]) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    try:
        return json.dumps(value)
    except Exception:
        return None


def _serialize_ids(value: Optional[Any]) -> Optional[str]:
    if value is None:
        return None
    try:
        return json.dumps(value)
    except Exception:
        return None


@app.get("/api/contacts")
async def get_contacts(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
    tags: Optional[List[str]] = Query(default=None),
    status: Optional[str] = Query(default=None),
    contact_type: Optional[str] = Query(default=None),
    sort: Optional[str] = Query(default=None),
    order: Optional[str] = Query(default=None),
    range: Optional[str] = Query(default=None),
    last_activity_gte: Optional[str] = Query(default=None, alias="last_activity_gte"),
    last_activity_lte: Optional[str] = Query(default=None, alias="last_activity_lte"),
):
    """List contacts with optional filters and sorting."""
    try:
        # Also support Range header if provided
        range_header = request.headers.get("Range")
        range_param = range or (range_header.split("=")[1] if range_header else None)
        start, end = _parse_range(range_param)

        query = db.query(Contact)
        query = _apply_contact_filters(
            query,
            tags,
            status,
            contact_type,
            last_activity_gte,
            last_activity_lte,
        )
        total = query.count()

        contacts = (
            query.order_by(_contact_order_clause(sort, order))
            .offset(start)
            .limit(end - start + 1)
            .all()
        )

        content_range = f"contacts {start}-{start + len(contacts) - 1 if contacts else start}/{total}"
        headers = {
            "Content-Range": content_range,
            "Access-Control-Expose-Headers": "Content-Range",
            "X-Total-Count": str(total),
        }

        return JSONResponse(
            {"data": [contact.to_dict() for contact in contacts], "total": total},
            headers=headers,
        )
    except Exception as e:
        logger.error(f"Error fetching contacts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/contacts/{contact_id}")
async def get_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Fetch a single contact by ID."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return JSONResponse(contact.to_dict())


@app.post("/api/contacts")
async def create_contact(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Create a new contact."""
    try:
        payload = await request.json()
        now = datetime.now(timezone.utc)
        contact = Contact(
            name=payload.get("name"),
            company=payload.get("company"),
            title=payload.get("title"),
            phone=payload.get("phone"),
            email=payload.get("email"),
            address=payload.get("address"),
            website=payload.get("website"),
            notes=payload.get("notes"),
            scanned_date=_coerce_datetime(payload.get("scanned_date"), now),
            created_at=_coerce_datetime(payload.get("created_at"), now),
            updated_at=now,
            status=payload.get("status"),
            contact_type=payload.get("contact_type"),
            tags=_serialize_tags(payload.get("tags")),
            last_activity=_coerce_datetime(payload.get("last_activity"), now),
            account_manager=payload.get("account_manager"),
            source=payload.get("source"),
        )
        db.add(contact)
        db.commit()
        db.refresh(contact)
        return JSONResponse(contact.to_dict(), status_code=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error creating contact: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/contacts/{contact_id}")
async def update_contact(
    contact_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Update an existing contact."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    try:
        payload = await request.json()
        for field in [
            "name",
            "company",
            "title",
            "phone",
            "email",
            "address",
            "website",
            "notes",
            "status",
            "contact_type",
            "account_manager",
            "source",
        ]:
            if field in payload:
                setattr(contact, field, payload.get(field))

        if "tags" in payload:
            contact.tags = _serialize_tags(payload.get("tags"))
        if "last_activity" in payload:
            contact.last_activity = _coerce_datetime(payload.get("last_activity"), contact.last_activity)

        contact.updated_at = datetime.now(timezone.utc)

        db.add(contact)
        db.commit()
        db.refresh(contact)
        return JSONResponse(contact.to_dict())
    except Exception as e:
        logger.error(f"Error updating contact: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/contacts/{contact_id}")
async def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Delete a contact."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    try:
        db.delete(contact)
        db.commit()
        return JSONResponse({"success": True})
    except Exception as e:
        logger.error(f"Error deleting contact: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/deals")
async def get_deals(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
    stage: Optional[str] = Query(default=None),
    sort: Optional[str] = Query(default=None),
    order: Optional[str] = Query(default=None),
    range: Optional[str] = Query(default=None),
    created_at_gte: Optional[str] = Query(default=None, alias="created_at@gte"),
    created_at_lte: Optional[str] = Query(default=None, alias="created_at@lte"),
):
    try:
        range_header = request.headers.get("Range")
        range_param = range or (range_header.split("=")[1] if range_header else None)
        start, end = _parse_range(range_param)

        query = db.query(Deal)
        query = _apply_deal_filters(query, stage, created_at_gte, created_at_lte)
        total = query.count()

        deals = (
            query.order_by(_deal_order_clause(sort, order))
            .offset(start)
            .limit(end - start + 1)
            .all()
        )

        content_range = f"deals {start}-{start + len(deals) - 1 if deals else start}/{total}"
        headers = {
            "Content-Range": content_range,
            "Access-Control-Expose-Headers": "Content-Range",
            "X-Total-Count": str(total),
        }

        return JSONResponse(
            {"data": [deal.to_dict() for deal in deals], "total": total},
            headers=headers,
        )
    except Exception as e:
        logger.error(f"Error fetching deals: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/deals/{deal_id}")
async def get_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return JSONResponse(deal.to_dict())


@app.post("/api/deals")
async def create_deal(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    try:
        payload = await request.json()
        now = datetime.now(timezone.utc)
        deal = Deal(
            name=payload.get("name"),
            company_id=payload.get("company_id"),
            contact_ids=_serialize_ids(payload.get("contact_ids")),
            category=payload.get("category"),
            stage=payload.get("stage", "opportunity"),
            description=payload.get("description"),
            amount=payload.get("amount") or 0,
            created_at=_coerce_datetime(payload.get("created_at"), now),
            updated_at=now,
            archived_at=_coerce_datetime(payload.get("archived_at")),
            expected_closing_date=_coerce_datetime(payload.get("expected_closing_date")),
            sales_id=payload.get("sales_id"),
            index=payload.get("index"),
        )
        db.add(deal)
        db.commit()
        db.refresh(deal)
        return JSONResponse(deal.to_dict(), status_code=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error creating deal: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/deals/{deal_id}")
async def update_deal(
    deal_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    try:
        payload = await request.json()
        for field in [
            "name",
            "company_id",
            "category",
            "stage",
            "description",
            "amount",
            "sales_id",
            "index",
        ]:
            if field in payload:
                setattr(deal, field, payload.get(field))
        if "contact_ids" in payload:
            deal.contact_ids = _serialize_ids(payload.get("contact_ids"))
        if "archived_at" in payload:
            deal.archived_at = _coerce_datetime(payload.get("archived_at"))
        if "expected_closing_date" in payload:
            deal.expected_closing_date = _coerce_datetime(payload.get("expected_closing_date"))
        deal.updated_at = datetime.now(timezone.utc)
        db.add(deal)
        db.commit()
        db.refresh(deal)
        return JSONResponse(deal.to_dict())
    except Exception as e:
        logger.error(f"Error updating deal: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/deals/{deal_id}")
async def delete_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    try:
        db.delete(deal)
        db.commit()
        return JSONResponse({"success": True})
    except Exception as e:
        logger.error(f"Error deleting deal: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sync-mailchimp-contacts")
async def sync_mailchimp_contacts_endpoint(db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """One-time sync of contacts from Mailchimp Referral Source segment to database"""
    try:
        from mailchimp_service import MailchimpService
        
        mailchimp_service = MailchimpService()
        
        if not mailchimp_service.enabled:
            return JSONResponse({
                "success": False,
                "error": "Mailchimp not configured"
            })
        
        logger.info("Starting Mailchimp contacts sync...")
        members = mailchimp_service.get_segment_members("Referral Source")
        
        if not members:
            return JSONResponse({
                "success": False,
                "error": "No members found in 'Referral Source' segment or segment not found"
            })
        
        # Check existing contacts by email
        existing_contacts = {c.email.lower(): c for c in db.query(Contact).filter(Contact.email.isnot(None)).all() if c.email}
        
        added_count = 0
        skipped_count = 0
        
        for member in members:
            email = member.get('email_address', '').lower().strip()
            if not email:
                continue
            
            # If already exists, skip
            if email in existing_contacts:
                skipped_count += 1
                continue
            
            # Extract contact info from Mailchimp member
            merge_fields = member.get('merge_fields', {})
            
            # Build name from FNAME and LNAME or just use full name
            first_name = merge_fields.get('FNAME', '').strip()
            last_name = merge_fields.get('LNAME', '').strip()
            name = f"{first_name} {last_name}".strip() if first_name or last_name else email.split('@')[0]
            
            # Handle address field (can be dict or string)
            address = None
            addr_field = merge_fields.get('ADDRESS')
            if isinstance(addr_field, dict):
                address = addr_field.get('addr1', '').strip() or None
            elif addr_field:
                address = str(addr_field).strip() or None
            
            contact = Contact(
                name=name if name else None,
                company=merge_fields.get('COMPANY', '').strip() or None,
                email=email,
                phone=merge_fields.get('PHONE', '').strip() or None,
                address=address,
                website=merge_fields.get('WEBSITE', '').strip() or None,
                title=merge_fields.get('TITLE', '').strip() or None,
                scanned_date=datetime.utcnow(),
                created_at=datetime.utcnow()
            )
            
            db.add(contact)
            existing_contacts[email] = contact
            added_count += 1
        
        db.commit()
        
        total_count = db.query(Contact).count()
        
        logger.info(f"Mailchimp sync complete: Added {added_count}, Skipped {skipped_count}, Total: {total_count}")
        
        return JSONResponse({
            "success": True,
            "message": f"Synced {added_count} new contacts from Mailchimp",
            "added": added_count,
            "skipped": skipped_count,
            "total": total_count
        })
        
    except Exception as e:
        logger.error(f"Error syncing Mailchimp contacts: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error syncing contacts: {str(e)}")

@app.post("/api/sync-gmail-emails")
async def sync_gmail_emails_endpoint(db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Sync email count from Gmail API (emails sent in last 7 days)"""
    try:
        from gmail_service import GmailService
        
        gmail_service = GmailService()
        
        if not gmail_service.enabled:
            return JSONResponse({
                "success": False,
                "error": "Gmail not configured. Set GMAIL_SERVICE_ACCOUNT_EMAIL and GMAIL_SERVICE_ACCOUNT_KEY"
            })
        
        logger.info("Starting Gmail email count sync...")
        counts_result = gmail_service.get_emails_sent_last_7_days()
        total_count = counts_result.get("total", 0)
        per_user_counts = counts_result.get("per_user", {})
        user_summary = ", ".join(
            f"{email} ({count})" for email, count in per_user_counts.items()
        ) or ", ".join(gmail_service.user_emails)
        
        # Get or create email count record
        email_count = db.query(EmailCount).order_by(EmailCount.updated_at.desc()).first()
        
        if not email_count:
            email_count = EmailCount(
                emails_sent_7_days=total_count,
                user_email=user_summary,
                last_synced=datetime.utcnow()
            )
            db.add(email_count)
            logger.info("Created new email count record")
        else:
            email_count.emails_sent_7_days = total_count
            email_count.user_email = user_summary
            email_count.last_synced = datetime.utcnow()
            logger.info("Updated existing email count record")
        
        db.commit()
        db.refresh(email_count)
        
        logger.info(
            "Gmail sync complete: %s emails sent in last 7 days (%s)",
            total_count,
            user_summary,
        )
        
        return JSONResponse({
            "success": True,
            "message": f"Synced {total_count} emails sent in last 7 days",
            "emails_sent_7_days": total_count,
            "user_summary": user_summary,
            "per_user": per_user_counts
        })
        
    except Exception as e:
        logger.error(f"Error syncing Gmail emails: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error syncing emails: {str(e)}")

@app.post("/api/sync-dashboard-summary")
async def sync_dashboard_summary_endpoint(db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """One-time sync of dashboard summary values from Google Sheet Dashboard tab (B21, B22, B23)"""
    try:
        import gspread
        from google.oauth2.service_account import Credentials
        import json
        import os
        
        # Get credentials
        creds_json = os.getenv('GOOGLE_SERVICE_ACCOUNT_KEY')
        if not creds_json:
            return JSONResponse({
                "success": False,
                "error": "Google Sheets not configured"
            })
        
        creds_dict = json.loads(creds_json)
        creds = Credentials.from_service_account_info(creds_dict, scopes=[
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ])
        client = gspread.authorize(creds)
        spreadsheet = client.open_by_key(os.getenv('SHEET_ID'))
        dashboard_worksheet = spreadsheet.worksheet('Dashboard')
        
        logger.info("Reading dashboard summary values from Google Sheet...")
        
        # Read cells B21, B22, B23
        value_b21 = dashboard_worksheet.cell(21, 2).value  # Total Hours
        value_b22 = dashboard_worksheet.cell(22, 2).value  # Total Costs
        value_b23 = dashboard_worksheet.cell(23, 2).value  # Total Bonuses
        
        # Parse values
        total_hours = float(str(value_b21).replace(',', '').strip()) if value_b21 else 0.0
        total_costs = float(str(value_b22).replace('$', '').replace(',', '').strip()) if value_b22 else 0.0
        total_bonuses = float(str(value_b23).replace('$', '').replace(',', '').strip()) if value_b23 else 0.0
        
        # Get or create dashboard summary record
        summary = db.query(DashboardSummary).order_by(DashboardSummary.updated_at.desc()).first()
        
        if not summary:
            summary = DashboardSummary(
                total_hours=total_hours,
                total_costs=total_costs,
                total_bonuses=total_bonuses,
                last_synced=datetime.utcnow()
            )
            db.add(summary)
        else:
            summary.total_hours = total_hours
            summary.total_costs = total_costs
            summary.total_bonuses = total_bonuses
            summary.last_synced = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Dashboard summary synced: Hours={total_hours}, Costs={total_costs}, Bonuses={total_bonuses}")
        
        return JSONResponse({
            "success": True,
            "message": "Dashboard summary synced successfully",
            "data": {
                "total_hours": total_hours,
                "total_costs": total_costs,
                "total_bonuses": total_bonuses,
                "last_synced": summary.last_synced.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error syncing dashboard summary: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error syncing dashboard summary: {str(e)}")

@app.get("/api/dashboard/weekly-summary")
async def get_weekly_summary(db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get this week's summary"""
    try:
        analytics = AnalyticsEngine(db)
        data = analytics.get_weekly_summary()
        return JSONResponse(data)
    except Exception as e:
        logger.error(f"Error getting weekly summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Business card scanning endpoint
@app.post("/api/scan-business-card")
async def scan_business_card(file: UploadFile = File(...), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Scan business card image and extract contact information"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Only image files are allowed")
        
        # Read file content
        content = await file.read()
        
        # Scan business card
        result = business_card_scanner.scan_image(content)
        
        if not result.get("success", False):
            error_msg = result.get("error", "Failed to scan business card")
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Validate contact information
        contact = business_card_scanner.validate_contact(result["contact"])
        
        logger.info(f"Successfully scanned business card: {contact.get('name', 'Unknown')}")
        
        return JSONResponse({
            "success": True,
            "filename": file.filename,
            "contact": contact
        })
        
    except Exception as e:
        logger.error(f"Error scanning business card: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error scanning business card: {str(e)}")

@app.post("/api/save-contact")
async def save_contact(request: Request, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Save new contact to database"""
    try:
        data = await request.json()
        
        # Create new contact
        contact = Contact(
            name=data.get("name"),
            company=data.get("company"),
            title=data.get("title"),
            phone=data.get("phone"),
            email=data.get("email"),
            website=data.get("website"),
            address=data.get("address"),
            notes=data.get("notes")
        )
        
        db.add(contact)
        db.commit()
        db.refresh(contact)
        
        logger.info(f"Successfully saved contact: {contact.name or contact.company}")
        
        return JSONResponse({
            "success": True,
            "message": "Contact saved successfully",
            "contact": contact.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Error saving contact: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving contact: {str(e)}")

@app.put("/api/contacts/{contact_id}")
async def update_contact(contact_id: int, request: Request, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Update existing contact"""
    try:
        data = await request.json()
        
        contact = db.query(Contact).filter(Contact.id == contact_id).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        # Update fields
        if "name" in data:
            contact.name = data.get("name")
        if "company" in data:
            contact.company = data.get("company")
        if "title" in data:
            contact.title = data.get("title")
        if "phone" in data:
            contact.phone = data.get("phone")
        if "email" in data:
            contact.email = data.get("email")
        if "website" in data:
            contact.website = data.get("website")
        if "address" in data:
            contact.address = data.get("address")
        if "notes" in data:
            contact.notes = data.get("notes")
        
        contact.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(contact)
        
        logger.info(f"Successfully updated contact: {contact.name or contact.company}")
        
        return JSONResponse({
            "success": True,
            "message": "Contact updated successfully",
            "contact": contact.to_dict()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating contact: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating contact: {str(e)}")

@app.delete("/api/contacts/{contact_id}")
async def delete_contact(contact_id: int, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Delete a contact"""
    try:
        contact = db.query(Contact).filter(Contact.id == contact_id).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        contact_name = contact.name or contact.company or "Contact"
        db.delete(contact)
        db.commit()
        
        logger.info(f"Successfully deleted contact: {contact_name}")
        
        return JSONResponse({
            "success": True,
            "message": f"Contact deleted successfully"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting contact: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting contact: {str(e)}")

@app.post("/api/migrate-data")
async def migrate_data(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Migrate data from Google Sheets to database"""
    try:
        migrator = GoogleSheetsMigrator()
        result = migrator.migrate_all_data()
        
        if result["success"]:
            logger.info(f"Migration successful: {result['visits_migrated']} visits, {result['time_entries_migrated']} time entries")
            return JSONResponse({
                "success": True,
                "message": f"Successfully migrated {result['visits_migrated']} visits and {result['time_entries_migrated']} time entries",
                "visits_migrated": result["visits_migrated"],
                "time_entries_migrated": result["time_entries_migrated"]
            })
        else:
            logger.error(f"Migration failed: {result['error']}")
            raise HTTPException(status_code=500, detail=f"Migration failed: {result['error']}")
            
    except Exception as e:
        logger.error(f"Error during migration: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Migration error: {str(e)}")

@app.get("/api/dashboard/financial-summary")
async def get_financial_summary(db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get comprehensive financial summary"""
    try:
        analytics = AnalyticsEngine(db)
        summary = analytics.get_financial_summary()
        return JSONResponse(summary)
    except Exception as e:
        logger.error(f"Error getting financial summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting financial summary: {str(e)}")

@app.get("/api/dashboard/revenue-by-month")
async def get_revenue_by_month(db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get revenue by month"""
    try:
        analytics = AnalyticsEngine(db)
        data = analytics.get_revenue_by_month()
        return JSONResponse(data)
    except Exception as e:
        logger.error(f"Error getting revenue by month: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting revenue by month: {str(e)}")

# Activity Notes API Endpoints
@app.get("/api/activity-notes")
async def get_activity_notes(db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get all activity notes"""
    try:
        notes = db.query(ActivityNote).order_by(ActivityNote.date.desc()).all()
        return JSONResponse({
            "success": True,
            "notes": [note.to_dict() for note in notes]
        })
    except Exception as e:
        logger.error(f"Error fetching activity notes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching activity notes: {str(e)}")

@app.post("/api/activity-notes")
async def create_activity_note(request: Request, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Create a new activity note"""
    try:
        data = await request.json()
        date_str = data.get("date")
        notes_text = data.get("notes")
        
        if not date_str or not notes_text:
            raise HTTPException(status_code=400, detail="Date and notes are required")
        
        # Parse date
        from datetime import datetime
        note_date = datetime.fromisoformat(date_str.replace('Z', '+00:00')) if 'T' in date_str else datetime.strptime(date_str, '%Y-%m-%d')
        
        activity_note = ActivityNote(
            date=note_date,
            notes=notes_text
        )
        
        db.add(activity_note)
        db.commit()
        db.refresh(activity_note)
        
        logger.info(f"Successfully created activity note for {note_date}")
        
        return JSONResponse({
            "success": True,
            "message": "Activity note created successfully",
            "note": activity_note.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Error creating activity note: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating activity note: {str(e)}")

@app.put("/api/activity-notes/{note_id}")
async def update_activity_note(note_id: int, request: Request, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Update an existing activity note"""
    try:
        data = await request.json()
        notes_text = data.get("notes")
        
        if not notes_text:
            raise HTTPException(status_code=400, detail="Notes are required")
        
        activity_note = db.query(ActivityNote).filter(ActivityNote.id == note_id).first()
        if not activity_note:
            raise HTTPException(status_code=404, detail="Activity note not found")
        
        activity_note.notes = notes_text
        db.commit()
        db.refresh(activity_note)
        
        logger.info(f"Successfully updated activity note {note_id}")
        
        return JSONResponse({
            "success": True,
            "message": "Activity note updated successfully",
            "note": activity_note.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Error updating activity note: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating activity note: {str(e)}")

@app.delete("/api/activity-notes/{note_id}")
async def delete_activity_note(note_id: int, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Delete an activity note"""
    try:
        activity_note = db.query(ActivityNote).filter(ActivityNote.id == note_id).first()
        if not activity_note:
            raise HTTPException(status_code=404, detail="Activity note not found")
        
        db.delete(activity_note)
        db.commit()
        
        logger.info(f"Successfully deleted activity note {note_id}")
        
        return JSONResponse({
            "success": True,
            "message": "Activity note deleted successfully"
        })
        
    except Exception as e:
        logger.error(f"Error deleting activity note: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting activity note: {str(e)}")

# Google Drive Activity Logs API Endpoints
@app.get("/api/activity-logs")
async def get_activity_logs(db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get all activity logs from Google Drive and manually added logs"""
    try:
        all_logs = []
        
        # Get logs from Google Drive API
        drive_service = GoogleDriveService()
        if drive_service.enabled:
            try:
                drive_logs = drive_service.find_activity_logs(limit=100)
                all_logs.extend(drive_logs)
            except Exception as e:
                logger.warning(f"Error fetching logs from Drive API: {e}")
        
        # Get manually added logs from database
        try:
            manual_logs = db.query(ActivityLog).all()
            
            # Fix specific logs with correct dates
            if pytz:
                mountain_tz = pytz.timezone('America/Denver')
                
                # Fix Nov 4, 2025 log
                nov_4_2025 = mountain_tz.localize(datetime(2025, 11, 4, 0, 0, 0))
                nov_4_2025_utc = nov_4_2025.astimezone(timezone.utc)
                
                # Fix Nov 5, 2025 log (today's log)
                nov_5_2025 = mountain_tz.localize(datetime(2025, 11, 5, 0, 0, 0))
                nov_5_2025_utc = nov_5_2025.astimezone(timezone.utc)
                
                for log in manual_logs:
                    # Fix the specific log from Nov 4
                    if log.file_id.startswith("1oDF7jNf"):
                        # Check if date is wrong (not Nov 4)
                        log_date_mountain = log.modified_time.replace(tzinfo=timezone.utc).astimezone(mountain_tz) if log.modified_time else None
                        if not log_date_mountain or log_date_mountain.date() != nov_4_2025.date():
                            log.modified_time = nov_4_2025_utc
                            log.created_time = nov_4_2025_utc
                            db.commit()
                            logger.info(f"Fixed date for log {log.file_id} to Nov 4, 2025")
                    
                    # Fix today's log (Nov 5) - check if it starts with "11-oZUpC"
                    if log.file_id.startswith("11-oZUpC"):
                        # Check if date is wrong (not Nov 5)
                        log_date_mountain = log.modified_time.replace(tzinfo=timezone.utc).astimezone(mountain_tz) if log.modified_time else None
                        if not log_date_mountain or log_date_mountain.date() != nov_5_2025.date():
                            log.modified_time = nov_5_2025_utc
                            log.created_time = nov_5_2025_utc
                            db.commit()
                            logger.info(f"Fixed date for log {log.file_id} to Nov 5, 2025")
            
            manual_logs_dict = {log.file_id: log.to_dict() for log in manual_logs}
            
            # Add manually added logs that aren't already in Drive results
            drive_file_ids = {log.get('id') for log in all_logs}
            for file_id, log_dict in manual_logs_dict.items():
                if file_id not in drive_file_ids:
                    all_logs.append(log_dict)
        except Exception as e:
            logger.warning(f"Error fetching manual logs from database: {e}")
        
        # Sort by modified_time (most recent first), with None values last
        all_logs.sort(key=lambda x: (x.get('modified_time') or '0000-00-00'), reverse=True)
        
        return JSONResponse({
            "success": True,
            "logs": all_logs,
            "count": len(all_logs)
        })
        
    except Exception as e:
        logger.error(f"Error fetching activity logs: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching activity logs: {str(e)}")

@app.post("/api/activity-logs/add")
async def add_activity_log(request: Request, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Add an activity log manually by Google Drive URL"""
    try:
        data = await request.json()
        url = data.get("url", "").strip()
        
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        drive_service = GoogleDriveService()
        
        # Extract file ID from URL (no API needed for this)
        file_id = drive_service.extract_file_id_from_url(url) if drive_service.enabled else None
        if not file_id:
            # Try to extract manually if service not enabled
            import re
            match = re.search(r'/d/([a-zA-Z0-9-_]+)', url)
            if match:
                file_id = match.group(1)
            else:
                raise HTTPException(status_code=400, detail="Invalid Google Drive URL. Please provide a valid Google Docs link.")
        
        # Check if already exists in database
        existing = db.query(ActivityLog).filter(ActivityLog.file_id == file_id).first()
        if existing:
            # Special case: if this is the log from Nov 4, 2025, set it to that date
            # Check if file_id starts with "1oDF7jNf" (the one from yesterday)
            if pytz and file_id.startswith("1oDF7jNf"):
                mountain_tz = pytz.timezone('America/Denver')
                nov_4_2025 = mountain_tz.localize(datetime(2025, 11, 4))
                existing.modified_time = nov_4_2025.astimezone(timezone.utc)
                existing.created_time = nov_4_2025.astimezone(timezone.utc)
                db.commit()
                db.refresh(existing)
            # If existing log has no dates, set them based on created_at
            elif not existing.modified_time and not existing.created_time:
                if pytz:
                    # Use Mountain Time for the upload date
                    # Get the date from created_at in Mountain Time, set to midnight
                    mountain_tz = pytz.timezone('America/Denver')
                    created_at_utc = existing.created_at.replace(tzinfo=timezone.utc)
                    created_at_mountain = created_at_utc.astimezone(mountain_tz)
                    # Use just the date part, set to midnight in Mountain Time
                    upload_date_mountain = mountain_tz.localize(datetime(created_at_mountain.year, created_at_mountain.month, created_at_mountain.day, 0, 0, 0))
                    # Convert back to UTC for storage
                    existing.modified_time = upload_date_mountain.astimezone(timezone.utc)
                    existing.created_time = upload_date_mountain.astimezone(timezone.utc)
                else:
                    # Fallback to UTC if pytz not available
                    upload_date = datetime(existing.created_at.year, existing.created_at.month, existing.created_at.day, 0, 0, 0, tzinfo=timezone.utc)
                    existing.modified_time = upload_date
                    existing.created_time = upload_date
                db.commit()
                db.refresh(existing)
            return JSONResponse({
                "success": True,
                "message": "Activity log already exists",
                "log": existing.to_dict()
            })
        
        # Try to get file metadata via API (optional - works without it)
        file_metadata = None
        if drive_service.enabled:
            file_metadata = drive_service.get_file_by_id(file_id)
            if file_metadata:
                # Check if it's a Google Doc
                if file_metadata.get('mime_type') != 'application/vnd.google-apps.document':
                    raise HTTPException(status_code=400, detail="Only Google Docs are supported as activity logs")
        
        # Create preview/edit URLs - use standard Google Docs URLs
        # For publicly shared docs, the preview URL works in iframes
        preview_url = f"https://docs.google.com/document/d/{file_id}/preview"
        edit_url = f"https://docs.google.com/document/d/{file_id}/edit"
        
        # Parse dates if available
        modified_time = None
        created_time = None
        if file_metadata and file_metadata.get('modified_time'):
            try:
                modified_time = datetime.fromisoformat(file_metadata['modified_time'].replace('Z', '+00:00'))
            except:
                pass
        if file_metadata and file_metadata.get('created_time'):
            try:
                created_time = datetime.fromisoformat(file_metadata['created_time'].replace('Z', '+00:00'))
            except:
                pass
        
        # If we don't have dates from API, use current date in Mountain Time as upload date
        if not modified_time and not created_time:
            if pytz:
                # Use Mountain Time (America/Denver) for the upload date
                # Get today's date in Mountain Time at midnight to avoid day shifts
                mountain_tz = pytz.timezone('America/Denver')
                now_mountain = datetime.now(mountain_tz)
                # Use just the date part, set to midnight in Mountain Time
                today_mountain = mountain_tz.localize(datetime(now_mountain.year, now_mountain.month, now_mountain.day, 0, 0, 0))
                # Store as UTC in database (standard practice)
                created_time = today_mountain.astimezone(timezone.utc)
                modified_time = today_mountain.astimezone(timezone.utc)
            else:
                # Fallback to UTC if pytz not available
                now_utc = datetime.now(timezone.utc)
                today_utc = datetime(now_utc.year, now_utc.month, now_utc.day, 0, 0, 0, tzinfo=timezone.utc)
                created_time = today_utc
                modified_time = today_utc
        
        # Save to database
        activity_log = ActivityLog(
            file_id=file_id,
            name=file_metadata.get('name') if file_metadata else None,
            url=url,
            preview_url=preview_url,
            edit_url=edit_url,
            owner=file_metadata.get('owner') if file_metadata else None,
            modified_time=modified_time,
            created_time=created_time,
            manually_added=True
        )
        
        db.add(activity_log)
        db.commit()
        db.refresh(activity_log)
        
        logger.info(f"Successfully added activity log: {activity_log.name or file_id}")
        
        return JSONResponse({
            "success": True,
            "message": "Activity log added successfully",
            "log": activity_log.to_dict()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding activity log: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error adding activity log: {str(e)}")

# ============================================================================
# Lead Pipeline API Endpoints (CRM Features)
# ============================================================================

@app.get("/api/pipeline/stages")
async def get_pipeline_stages(db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get all pipeline stages"""
    try:
        from models import PipelineStage
        stages = db.query(PipelineStage).order_by(PipelineStage.order_index).all()
        return JSONResponse([stage.to_dict() for stage in stages])
    except Exception as e:
        logger.error(f"Error fetching pipeline stages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pipeline/leads")
async def get_leads(stage_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get all leads, optionally filtered by stage"""
    try:
        from models import Lead
        query = db.query(Lead)
        if stage_id:
            query = query.filter(Lead.stage_id == stage_id)
        leads = query.order_by(Lead.order_index, Lead.created_at.desc()).all()
        return JSONResponse([lead.to_dict() for lead in leads])
    except Exception as e:
        logger.error(f"Error fetching leads: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pipeline/leads/{lead_id}")
async def get_lead(lead_id: int, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get a single lead by ID"""
    try:
        from models import Lead
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        return JSONResponse(lead.to_dict())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching lead: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/pipeline/leads")
async def create_lead(request: Request, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Create a new lead"""
    try:
        from models import Lead, LeadActivity
        data = await request.json()
        
        # Get the highest order_index in the stage
        stage_id = data.get("stage_id")
        max_order = db.query(Lead).filter(Lead.stage_id == stage_id).count()
        
        lead = Lead(
            name=data.get("name"),
            contact_name=data.get("contact_name"),
            email=data.get("email"),
            phone=data.get("phone"),
            address=data.get("address"),
            city=data.get("city"),
            source=data.get("source"),
            payor_source=data.get("payor_source"),
            expected_close_date=datetime.fromisoformat(data["expected_close_date"]) if data.get("expected_close_date") else None,
            expected_revenue=data.get("expected_revenue"),
            priority=data.get("priority", "medium"),
            notes=data.get("notes"),
            stage_id=stage_id,
            order_index=max_order,
            referral_source_id=data.get("referral_source_id")
        )
        
        db.add(lead)
        db.flush()  # Get the lead ID
        
        # Log activity
        activity = LeadActivity(
            lead_id=lead.id,
            activity_type="created",
            description=f"Lead created: {lead.name}",
            user_email=current_user.get("email"),
            new_value=lead.name
        )
        db.add(activity)
        
        db.commit()
        db.refresh(lead)
        
        logger.info(f"Created lead: {lead.name}")
        return JSONResponse({"success": True, "lead": lead.to_dict()})
        
    except Exception as e:
        logger.error(f"Error creating lead: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/pipeline/leads/{lead_id}")
async def update_lead(lead_id: int, request: Request, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Update a lead"""
    try:
        from models import Lead, LeadActivity
        data = await request.json()
        
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Track changes for activity log
        changes = []
        
        # Update fields and track changes
        fields_to_update = [
            "name", "contact_name", "email", "phone", "address", "city",
            "source", "payor_source", "priority", "notes", "referral_source_id",
            "expected_revenue"
        ]
        
        for field in fields_to_update:
            if field in data:
                old_value = getattr(lead, field)
                new_value = data[field]
                if old_value != new_value:
                    setattr(lead, field, new_value)
                    changes.append((field, old_value, new_value))
        
        # Handle expected_close_date separately (datetime field)
        if "expected_close_date" in data and data["expected_close_date"]:
            new_date = datetime.fromisoformat(data["expected_close_date"])
            if lead.expected_close_date != new_date:
                changes.append(("expected_close_date", lead.expected_close_date, new_date))
                lead.expected_close_date = new_date
        
        # Log activities for each change
        for field, old_val, new_val in changes:
            activity = LeadActivity(
                lead_id=lead.id,
                activity_type=f"{field}_updated",
                description=f"Updated {field.replace('_', ' ')}",
                old_value=str(old_val) if old_val else None,
                new_value=str(new_val) if new_val else None,
                user_email=current_user.get("email")
            )
            db.add(activity)
        
        db.commit()
        db.refresh(lead)
        
        logger.info(f"Updated lead {lead_id}: {len(changes)} changes")
        return JSONResponse({"success": True, "lead": lead.to_dict()})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating lead: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/pipeline/leads/{lead_id}/move")
async def move_lead(lead_id: int, request: Request, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Move a lead to a different stage or reorder within stage"""
    try:
        from models import Lead, LeadActivity, PipelineStage
        data = await request.json()
        
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        old_stage_id = lead.stage_id
        new_stage_id = data.get("stage_id")
        new_order_index = data.get("order_index", 0)
        
        # If moving to a different stage
        if old_stage_id != new_stage_id:
            old_stage = db.query(PipelineStage).filter(PipelineStage.id == old_stage_id).first()
            new_stage = db.query(PipelineStage).filter(PipelineStage.id == new_stage_id).first()
            
            lead.stage_id = new_stage_id
            lead.order_index = new_order_index
            
            # Log activity
            activity = LeadActivity(
                lead_id=lead.id,
                activity_type="stage_changed",
                description=f"Moved from {old_stage.name if old_stage else 'Unknown'} to {new_stage.name if new_stage else 'Unknown'}",
                old_value=old_stage.name if old_stage else None,
                new_value=new_stage.name if new_stage else None,
                user_email=current_user.get("email")
            )
            db.add(activity)
        else:
            # Just reordering within the same stage
            lead.order_index = new_order_index
        
        db.commit()
        db.refresh(lead)
        
        logger.info(f"Moved lead {lead_id} to stage {new_stage_id}, order {new_order_index}")
        return JSONResponse({"success": True, "lead": lead.to_dict()})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error moving lead: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/pipeline/leads/{lead_id}")
async def delete_lead(lead_id: int, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Delete a lead"""
    try:
        from models import Lead
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        lead_name = lead.name
        db.delete(lead)
        db.commit()
        
        logger.info(f"Deleted lead: {lead_name}")
        return JSONResponse({"success": True, "message": "Lead deleted successfully"})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting lead: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Referral Sources API
@app.get("/api/pipeline/referral-sources")
async def get_referral_sources(db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get all referral sources"""
    try:
        from models import ReferralSource
        sources = db.query(ReferralSource).order_by(ReferralSource.created_at.desc()).all()
        return JSONResponse([source.to_dict() for source in sources])
    except Exception as e:
        logger.error(f"Error fetching referral sources: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/pipeline/referral-sources")
async def create_referral_source(request: Request, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Create a new referral source"""
    try:
        from models import ReferralSource
        data = await request.json()
        
        source = ReferralSource(
            name=data.get("name"),
            organization=data.get("organization"),
            contact_name=data.get("contact_name"),
            email=data.get("email"),
            phone=data.get("phone"),
            address=data.get("address"),
            source_type=data.get("source_type"),
            status=data.get("status", "active"),
            notes=data.get("notes")
        )
        
        db.add(source)
        db.commit()
        db.refresh(source)
        
        logger.info(f"Created referral source: {source.name}")
        return JSONResponse({"success": True, "source": source.to_dict()})
        
    except Exception as e:
        logger.error(f"Error creating referral source: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/pipeline/referral-sources/{source_id}")
async def update_referral_source(source_id: int, request: Request, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Update a referral source"""
    try:
        from models import ReferralSource
        data = await request.json()
        
        source = db.query(ReferralSource).filter(ReferralSource.id == source_id).first()
        if not source:
            raise HTTPException(status_code=404, detail="Referral source not found")
        
        # Update fields
        for field in ["name", "organization", "contact_name", "email", "phone", "address", "source_type", "status", "notes"]:
            if field in data:
                setattr(source, field, data[field])
        
        db.commit()
        db.refresh(source)
        
        logger.info(f"Updated referral source: {source.name}")
        return JSONResponse({"success": True, "source": source.to_dict()})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating referral source: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/pipeline/referral-sources/{source_id}")
async def delete_referral_source(source_id: int, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Delete a referral source"""
    try:
        from models import ReferralSource
        source = db.query(ReferralSource).filter(ReferralSource.id == source_id).first()
        if not source:
            raise HTTPException(status_code=404, detail="Referral source not found")
        
        source_name = source.name
        db.delete(source)
        db.commit()
        
        logger.info(f"Deleted referral source: {source_name}")
        return JSONResponse({"success": True, "message": "Referral source deleted successfully"})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting referral source: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Lead Tasks API
@app.get("/api/pipeline/tasks")
async def get_all_tasks(db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get all tasks across all leads"""
    try:
        from models import LeadTask
        tasks = db.query(LeadTask).order_by(LeadTask.created_at.desc()).all()
        return JSONResponse([task.to_dict() for task in tasks])
    except Exception as e:
        logger.error(f"Error fetching tasks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/pipeline/leads/{lead_id}/tasks")
async def create_lead_task(lead_id: int, request: Request, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Create a task for a lead"""
    try:
        from models import Lead, LeadTask, LeadActivity
        data = await request.json()
        
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        task = LeadTask(
            lead_id=lead_id,
            title=data.get("title"),
            description=data.get("description"),
            due_date=datetime.fromisoformat(data["due_date"]) if data.get("due_date") else None,
            status="pending"
        )
        
        db.add(task)
        db.flush()
        
        # Log activity
        activity = LeadActivity(
            lead_id=lead_id,
            activity_type="task_created",
            description=f"Task added: {task.title}",
            user_email=current_user.get("email"),
            new_value=task.title
        )
        db.add(activity)
        
        db.commit()
        db.refresh(task)
        
        logger.info(f"Created task for lead {lead_id}: {task.title}")
        return JSONResponse({"success": True, "task": task.to_dict()})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating task: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/pipeline/tasks/{task_id}")
async def update_lead_task(task_id: int, request: Request, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Update a lead task"""
    try:
        from models import LeadTask, LeadActivity
        data = await request.json()
        
        task = db.query(LeadTask).filter(LeadTask.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        old_status = task.status
        
        # Update fields
        if "title" in data:
            task.title = data["title"]
        if "description" in data:
            task.description = data["description"]
        if "due_date" in data:
            task.due_date = datetime.fromisoformat(data["due_date"]) if data["due_date"] else None
        if "status" in data:
            task.status = data["status"]
            if data["status"] == "completed" and old_status != "completed":
                task.completed_at = datetime.utcnow()
                
                # Log activity
                activity = LeadActivity(
                    lead_id=task.lead_id,
                    activity_type="task_completed",
                    description=f"Task completed: {task.title}",
                    user_email=current_user.get("email")
                )
                db.add(activity)
        
        db.commit()
        db.refresh(task)
        
        logger.info(f"Updated task {task_id}")
        return JSONResponse({"success": True, "task": task.to_dict()})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating task: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/pipeline/tasks/{task_id}")
async def delete_lead_task(task_id: int, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Delete a lead task"""
    try:
        from models import LeadTask
        task = db.query(LeadTask).filter(LeadTask.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        task_title = task.title
        db.delete(task)
        db.commit()
        
        logger.info(f"Deleted task: {task_title}")
        return JSONResponse({"success": True, "message": "Task deleted successfully"})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting task: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pipeline/leads/{lead_id}/activities")
async def get_lead_activities(lead_id: int, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get activity log for a lead"""
    try:
        from models import LeadActivity
        activities = db.query(LeadActivity).filter(LeadActivity.lead_id == lead_id).order_by(LeadActivity.created_at.desc()).all()
        return JSONResponse([activity.to_dict() for activity in activities])
    except Exception as e:
        logger.error(f"Error fetching lead activities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# End of Lead Pipeline API Endpoints
# ============================================================================

@app.get("/favicon.ico")
async def favicon():
    """Serve favicon"""
    return FileResponse("static/favicon.ico")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Colorado CareAssist Sales Dashboard"}

# Legacy dashboard route (old Jinja2 template)
@app.get("/legacy", response_class=HTMLResponse)
async def legacy_dashboard(request: Request, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Serve the legacy Jinja2 dashboard for backward compatibility"""
    from urllib.parse import urlencode
    
    ringcentral_config = {
        'clientId': RINGCENTRAL_EMBED_CLIENT_ID or '',
        'server': RINGCENTRAL_EMBED_SERVER,
        'appUrl': RINGCENTRAL_EMBED_APP_URL,
        'adapterUrl': RINGCENTRAL_EMBED_ADAPTER_URL,
        'defaultTab': RINGCENTRAL_EMBED_DEFAULT_TAB,
        'redirectUri': RINGCENTRAL_EMBED_REDIRECT_URI,
    }
    
    return templates.TemplateResponse("dashboard.html", {
        "request": request, 
        "user": current_user,
        "ringcentral_config": ringcentral_config
    })

# SPA catch-all route - must be last!
# This catches all routes and serves the React app for client-side routing
@app.get("/{full_path:path}", response_class=HTMLResponse)
async def spa_catchall(
    request: Request,
    full_path: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
):
    """Catch-all route for React Router (SPA)"""
    # Don't catch API routes
    if full_path.startswith("api/") or full_path.startswith("auth/"):
        raise HTTPException(status_code=404, detail="Not found")

    frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")

    def _serve_static(relative_path: str):
        candidate = os.path.abspath(os.path.join(frontend_dist, relative_path))
        if not candidate.startswith(os.path.abspath(frontend_dist)):
            raise HTTPException(status_code=404, detail="Asset not found")
        if os.path.exists(candidate):
            return FileResponse(candidate)
        raise HTTPException(status_code=404, detail="Asset not found")

    static_prefixes = ("assets/", "img/", "logos/")
    static_files = {
        "favicon.ico",
        "manifest.json",
        "logo192.png",
        "logo512.png",
        "robots.txt",
        "auth-callback.html",
        "stats.html",
    }

    if full_path.startswith(static_prefixes) or full_path in static_files:
        return _serve_static(full_path)

    if not current_user:
        return RedirectResponse(url="/auth/login")
    
    # Serve React app index.html for all non-API routes
    frontend_index = os.path.join(frontend_dist, "index.html")
    if os.path.exists(frontend_index):
        return FileResponse(frontend_index)
    
    raise HTTPException(status_code=404, detail="Frontend not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
