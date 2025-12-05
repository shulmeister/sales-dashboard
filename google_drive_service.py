import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

class GoogleDriveService:
    """Service for integrating with Google Drive API to find activity logs using domain-wide delegation"""
    
    def __init__(self):
        self.service_account_email = os.getenv('GMAIL_SERVICE_ACCOUNT_EMAIL')
        self.service_account_key = os.getenv('GOOGLE_SERVICE_ACCOUNT_KEY')
        self.user_email = os.getenv('GMAIL_USER_EMAIL', 'maryssa@coloradocareassist.com')
        
        if not all([self.service_account_key]):
            logger.warning("Google Drive credentials not configured. Drive functionality will be disabled.")
            self.enabled = False
        else:
            self.enabled = True
            self.service = None
            self._build_service()
    
    def _build_service(self):
        """Build Google Drive service with domain-wide delegation"""
        if not self.enabled:
            return
        
        try:
            # Parse service account key JSON
            credentials_info = json.loads(self.service_account_key)
            
            # Create credentials with domain-wide delegation
            credentials = service_account.Credentials.from_service_account_info(
                credentials_info,
                scopes=['https://www.googleapis.com/auth/drive.readonly']
            )
            
            # Delegate domain-wide authority to impersonate the user
            delegated_credentials = credentials.with_subject(self.user_email)
            
            # Build Drive service
            self.service = build('drive', 'v3', credentials=delegated_credentials)
            logger.info(f"Google Drive service initialized with domain-wide delegation for {self.user_email}")
            
            # Create credentials WITHOUT domain-wide delegation for public/shared file access
            public_credentials = service_account.Credentials.from_service_account_info(
                credentials_info,
                scopes=['https://www.googleapis.com/auth/drive.readonly']
            )
            self.public_service = build('drive', 'v3', credentials=public_credentials)
            logger.info("Google Drive public service initialized")
            
        except Exception as e:
            logger.error(f"Error building Google Drive service: {str(e)}")
            self.enabled = False
            self.service = None
    
    def find_activity_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Find all activity logs from Maryssa"""
        if not self.enabled or not self.service:
            logger.warning("Google Drive service not available")
            return []
        
        try:
            # Search for Google Docs that contain "Activity Log" in the name
            # Since we're using domain-wide delegation, we can search for files owned by Maryssa
            query = (
                "name contains 'Activity Log' and "
                "mimeType = 'application/vnd.google-apps.document' and "
                "trashed = false"
            )
            
            activity_logs = []
            page_token = None
            
            while True:
                try:
                    if page_token:
                        results = self.service.files().list(
                            q=query,
                            pageSize=100,
                            fields="nextPageToken, files(id, name, modifiedTime, createdTime, webViewLink, webContentLink, owners)",
                            orderBy="modifiedTime desc",
                            pageToken=page_token,
                            corpora='user'  # Search only user's files when using domain-wide delegation
                        ).execute()
                    else:
                        results = self.service.files().list(
                            q=query,
                            pageSize=100,
                            fields="nextPageToken, files(id, name, modifiedTime, createdTime, webViewLink, webContentLink, owners)",
                            orderBy="modifiedTime desc",
                            corpora='user'  # Search only user's files when using domain-wide delegation
                        ).execute()
                    
                    files = results.get('files', [])
                    
                    for file in files:
                        # With domain-wide delegation, we can access all files owned by Maryssa
                        owners = file.get('owners', [])
                        owner_emails = [owner.get('emailAddress', '').lower() for owner in owners]
                        
                        # Create preview URL (for embedding)
                        file_id = file['id']
                        preview_url = f"https://docs.google.com/document/d/{file_id}/preview"
                        edit_url = f"https://docs.google.com/document/d/{file_id}/edit"
                        
                        # Parse dates
                        modified_time = None
                        created_time = None
                        try:
                            if file.get('modifiedTime'):
                                modified_time = datetime.fromisoformat(file['modifiedTime'].replace('Z', '+00:00'))
                            if file.get('createdTime'):
                                created_time = datetime.fromisoformat(file['createdTime'].replace('Z', '+00:00'))
                        except Exception as e:
                            logger.warning(f"Error parsing date for file {file.get('name')}: {e}")
                        
                        activity_logs.append({
                            'id': file_id,
                            'name': file.get('name', 'Untitled'),
                            'modified_time': modified_time.isoformat() if modified_time else None,
                            'created_time': created_time.isoformat() if created_time else None,
                            'preview_url': preview_url,
                            'edit_url': edit_url,
                            'owner': owner_emails[0] if owner_emails else 'Unknown'
                        })
                    
                    page_token = results.get('nextPageToken')
                    if not page_token or len(activity_logs) >= limit:
                        break
                        
                except HttpError as error:
                    logger.error(f"Google Drive API error: {error}")
                    break
            
            # Sort by modified time (most recent first) and limit results
            activity_logs.sort(key=lambda x: x['modified_time'] or '', reverse=True)
            activity_logs = activity_logs[:limit]
            
            logger.info(f"Found {len(activity_logs)} activity logs")
            return activity_logs
            
        except Exception as e:
            logger.error(f"Error finding activity logs: {str(e)}", exc_info=True)
            return []
    
    def get_file_by_id(self, file_id: str) -> Optional[Dict[str, Any]]:
        """Get file metadata by file ID - works with shared/public files"""
        if not self.enabled or not self.service:
            logger.warning("Google Drive service not available")
            return None
        
        try:
            # Try to get file with supportsAllDrives to access shared files
            # Use supportsAllDrives=True to access files in shared drives or files shared with the user
            file_metadata = self.service.files().get(
                fileId=file_id,
                fields="id, name, modifiedTime, createdTime, webViewLink, webContentLink, owners, mimeType, shared",
                supportsAllDrives=True
            ).execute()
            
            # Create preview URL (for embedding)
            preview_url = f"https://docs.google.com/document/d/{file_id}/preview"
            edit_url = f"https://docs.google.com/document/d/{file_id}/edit"
            
            # Parse dates
            modified_time = None
            created_time = None
            try:
                if file_metadata.get('modifiedTime'):
                    modified_time = datetime.fromisoformat(file_metadata['modifiedTime'].replace('Z', '+00:00'))
                if file_metadata.get('createdTime'):
                    created_time = datetime.fromisoformat(file_metadata['createdTime'].replace('Z', '+00:00'))
            except Exception as e:
                logger.warning(f"Error parsing date for file {file_metadata.get('name')}: {e}")
            
            owners = file_metadata.get('owners', [])
            owner_emails = [owner.get('emailAddress', '').lower() for owner in owners]
            
            return {
                'id': file_id,
                'name': file_metadata.get('name', 'Untitled'),
                'modified_time': modified_time.isoformat() if modified_time else None,
                'created_time': created_time.isoformat() if created_time else None,
                'preview_url': preview_url,
                'edit_url': edit_url,
                'owner': owner_emails[0] if owner_emails else 'Unknown',
                'mime_type': file_metadata.get('mimeType', '')
            }
            
        except HttpError as error:
            error_details = error.error_details if hasattr(error, 'error_details') else []
            error_reason = None
            error_message = str(error)
            
            if error_details:
                for detail in error_details:
                    if 'reason' in detail:
                        error_reason = detail.get('reason')
                    if 'message' in detail:
                        error_message = detail.get('message', error_message)
            
            logger.error(f"Error getting file by ID: {error_message}, reason: {error_reason}, status: {error.resp.status}")
            
            # If it's a permission error, try to provide more helpful information
            if error.resp.status == 404 or error_reason in ['notFound', 'insufficientFilePermissions']:
                # Try one more time without supportsAllDrives in case it's a permission issue
                try:
                    logger.info("Retrying file access without supportsAllDrives flag")
                    file_metadata = self.service.files().get(
                        fileId=file_id,
                        fields="id, name, modifiedTime, createdTime, webViewLink, webContentLink, owners, mimeType, shared"
                    ).execute()
                    
                    # If this works, process it the same way
                    preview_url = f"https://docs.google.com/document/d/{file_id}/preview"
                    edit_url = f"https://docs.google.com/document/d/{file_id}/edit"
                    
                    modified_time = None
                    created_time = None
                    try:
                        if file_metadata.get('modifiedTime'):
                            modified_time = datetime.fromisoformat(file_metadata['modifiedTime'].replace('Z', '+00:00'))
                        if file_metadata.get('createdTime'):
                            created_time = datetime.fromisoformat(file_metadata['createdTime'].replace('Z', '+00:00'))
                    except Exception as e:
                        logger.warning(f"Error parsing date: {e}")
                    
                    owners = file_metadata.get('owners', [])
                    owner_emails = [owner.get('emailAddress', '').lower() for owner in owners]
                    
                    return {
                        'id': file_id,
                        'name': file_metadata.get('name', 'Untitled'),
                        'modified_time': modified_time.isoformat() if modified_time else None,
                        'created_time': created_time.isoformat() if created_time else None,
                        'preview_url': preview_url,
                        'edit_url': edit_url,
                        'owner': owner_emails[0] if owner_emails else 'Unknown',
                        'mime_type': file_metadata.get('mimeType', '')
                    }
                except Exception as retry_error:
                    logger.error(f"Retry also failed: {retry_error}")
                    # Return None to indicate failure
                    return None
            
            return None
        except Exception as e:
            logger.error(f"Error getting file by ID: {str(e)}", exc_info=True)
            return None
    
    def extract_file_id_from_url(self, url: str) -> Optional[str]:
        """Extract Google Drive file ID from various URL formats"""
        import re
        
        # Pattern 1: /d/FILE_ID/edit or /d/FILE_ID/view or /d/FILE_ID/
        pattern1 = r'/d/([a-zA-Z0-9_-]+)'
        match1 = re.search(pattern1, url)
        if match1:
            return match1.group(1)
        
        # Pattern 2: ?id=FILE_ID
        pattern2 = r'[?&]id=([a-zA-Z0-9_-]+)'
        match2 = re.search(pattern2, url)
        if match2:
            return match2.group(1)
        
        # If URL is just the file ID
        if re.match(r'^[a-zA-Z0-9_-]+$', url.strip()):
            return url.strip()
        
        return None
    
    def test_connection(self) -> Dict[str, Any]:
        """Test Google Drive API connection"""
        if not self.enabled:
            return {
                "success": False,
                "error": "Google Drive not configured"
            }
        
        try:
            # Try to list files (limited query)
            results = self.service.files().list(
                pageSize=1,
                fields="files(id, name)"
            ).execute()
            
            return {
                "success": True,
                "message": "Google Drive API connection successful"
            }
        except Exception as e:
            logger.error(f"Error testing Google Drive connection: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    def download_file_from_url(self, url: str) -> Optional[tuple[bytes, str]]:
        """
        Download file content from a Google Drive URL.
        Returns a tuple of (file_content, filename) or None if failed.
        """
        if not self.enabled:
            logger.warning("Google Drive service not available")
            return None
            
        # Use public_service if available, otherwise fall back to delegated service
        service_to_use = getattr(self, 'public_service', self.service)
        if not service_to_use:
            logger.warning("No Google Drive service available for download")
            return None
            
        file_id = self.extract_file_id_from_url(url)
        if not file_id:
            logger.error(f"Could not extract file ID from URL: {url}")
            return None
            
        try:
            # Get file metadata first to check name and type
            file_metadata = service_to_use.files().get(
                fileId=file_id,
                fields="name, mimeType, size",
                supportsAllDrives=True
            ).execute()
            
            filename = file_metadata.get('name', 'downloaded_file')
            mime_type = file_metadata.get('mimeType', '')
            
            logger.info(f"Downloading file: {filename} ({mime_type})")
            
            # Download file content
            if "application/vnd.google-apps" in mime_type:
                # Export Google Docs/Sheets/Slides to PDF
                request = service_to_use.files().export_media(
                    fileId=file_id,
                    mimeType='application/pdf'
                )
                filename = os.path.splitext(filename)[0] + '.pdf'
            else:
                # Download binary content
                request = service_to_use.files().get_media(fileId=file_id)
                
            file_content = request.execute()
            return file_content, filename
            
        except Exception as e:
            logger.error(f"Error downloading file from Drive: {str(e)}")
            return None
