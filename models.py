from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import json

Base = declarative_base()

class Visit(Base):
    """Visit records from MyWay route PDFs"""
    __tablename__ = "visits"
    
    id = Column(Integer, primary_key=True, index=True)
    stop_number = Column(Integer, nullable=False)
    business_name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    city = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    visit_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        # Format visit_date as date-only string (YYYY-MM-DD) to avoid timezone issues
        visit_date_str = None
        if self.visit_date:
            # Use date() to get just the date part, avoiding timezone conversion
            visit_date_str = self.visit_date.date().isoformat() if hasattr(self.visit_date, 'date') else str(self.visit_date).split('T')[0]
        
        return {
            "id": self.id,
            "stop_number": self.stop_number,
            "business_name": self.business_name,
            "address": self.address,
            "city": self.city,
            "notes": self.notes,
            "visit_date": visit_date_str,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class TimeEntry(Base):
    """Time tracking entries from time tracking PDFs"""
    __tablename__ = "time_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False)
    hours_worked = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat() if self.date else None,
            "hours_worked": self.hours_worked,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Contact(Base):
    """Business contacts from scanned business cards"""
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    title = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    website = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    scanned_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(String(50), nullable=True)
    contact_type = Column(String(50), nullable=True)  # prospect, referral, client
    tags = Column(Text, nullable=True)  # JSON-encoded string list
    last_activity = Column(DateTime, nullable=True)
    account_manager = Column(String(255), nullable=True)
    source = Column(String(255), nullable=True)
    
    def to_dict(self):
        tag_list = []
        if self.tags:
            try:
                tag_list = json.loads(self.tags)
            except json.JSONDecodeError:
                tag_list = [tag.strip() for tag in self.tags.split(",") if tag.strip()]
        return {
            "id": self.id,
            "name": self.name,
            "company": self.company,
            "title": self.title,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "website": self.website,
            "notes": self.notes,
            "scanned_date": self.scanned_date.isoformat() if self.scanned_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "status": self.status,
            "contact_type": self.contact_type,
            "tags": tag_list,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
            "account_manager": self.account_manager,
            "source": self.source,
        }

class FinancialEntry(Base):
    """Financial tracking entries from daily summary data"""
    __tablename__ = "financial_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False)
    hours_worked = Column(Float, nullable=False)
    labor_cost = Column(Float, nullable=False)  # Hour Total ($) - $20/hour
    miles_driven = Column(Float, nullable=True)
    mileage_cost = Column(Float, nullable=True)  # Mileage Cost ($) - $0.70/mile
    materials_cost = Column(Float, nullable=True)  # Gas/Treats/Materials ($) - cookies, gas, etc
    total_daily_cost = Column(Float, nullable=False)  # Total Daily Cost ($)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat() if self.date else None,
            "hours_worked": self.hours_worked,
            "labor_cost": self.labor_cost,
            "miles_driven": self.miles_driven,
            "mileage_cost": self.mileage_cost,
            "materials_cost": self.materials_cost,
            "total_daily_cost": self.total_daily_cost,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class SalesBonus(Base):
    """Sales bonuses from closed sales"""
    __tablename__ = "sales_bonuses"
    
    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String(255), nullable=False)
    bonus_amount = Column(Float, nullable=False)  # $250 or $350
    commission_paid = Column(Boolean, default=False)
    start_date = Column(DateTime, nullable=True)
    wellsky_status = Column(String(100), nullable=True)
    status = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "client_name": self.client_name,
            "bonus_amount": self.bonus_amount,
            "commission_paid": self.commission_paid,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "wellsky_status": self.wellsky_status,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class ActivityNote(Base):
    """Activity notes for tracking daily activities and observations"""
    __tablename__ = "activity_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat() if self.date else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class AnalyticsCache(Base):
    """Cached analytics data for performance"""
    __tablename__ = "analytics_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    metric_name = Column(String(100), nullable=False, index=True)
    metric_value = Column(Float, nullable=False)
    period = Column(String(50), nullable=False)  # daily, weekly, monthly, yearly
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "metric_name": self.metric_name,
            "metric_value": self.metric_value,
            "period": self.period,
            "period_start": self.period_start.isoformat() if self.period_start else None,
            "period_end": self.period_end.isoformat() if self.period_end else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class DashboardSummary(Base):
    """Synced dashboard summary values from Google Sheet Dashboard tab"""
    __tablename__ = "dashboard_summary"
    
    id = Column(Integer, primary_key=True, index=True)
    total_hours = Column(Float, nullable=False, default=0.0)  # From B21
    total_costs = Column(Float, nullable=False, default=0.0)  # From B22
    total_bonuses = Column(Float, nullable=False, default=0.0)  # From B23
    last_synced = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "total_hours": self.total_hours,
            "total_costs": self.total_costs,
            "total_bonuses": self.total_bonuses,
            "last_synced": self.last_synced.isoformat() if self.last_synced else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class EmailCount(Base):
    """Cached email count from Gmail API (emails sent in last 7 days)"""
    __tablename__ = "email_count"
    
    id = Column(Integer, primary_key=True, index=True)
    emails_sent_7_days = Column(Integer, nullable=False, default=0)
    user_email = Column(String, nullable=False)  # Email of the user whose emails we're counting
    last_synced = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "emails_sent_7_days": self.emails_sent_7_days,
            "user_email": self.user_email,
            "last_synced": self.last_synced.isoformat() if self.last_synced else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class ActivityLog(Base):
    """Manually added activity logs from Google Drive URLs"""
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String(255), nullable=False, unique=True, index=True)  # Google Drive file ID
    name = Column(String(500), nullable=True)  # Document name (if available via API)
    url = Column(Text, nullable=False)  # Original Google Drive URL
    preview_url = Column(Text, nullable=False)  # Preview URL
    edit_url = Column(Text, nullable=True)  # Edit URL
    owner = Column(String(255), nullable=True)  # Owner email (if available)
    modified_time = Column(DateTime, nullable=True)  # Last modified (if available via API)
    created_time = Column(DateTime, nullable=True)  # Created time (if available via API)
    manually_added = Column(Boolean, default=True)  # Flag to distinguish from Drive API discovered logs
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.file_id,  # Use file_id as the ID for consistency with Drive API results
            "name": self.name or f'Activity Log ({self.file_id[:8]}...)',
            "modified_time": self.modified_time.isoformat() if self.modified_time else None,
            "created_time": self.created_time.isoformat() if self.created_time else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,  # Include created_at for fallback
            "preview_url": self.preview_url,
            "edit_url": self.edit_url,
            "owner": self.owner or 'Unknown',
            "manually_added": self.manually_added
        }

# ============================================================================
# Lead Pipeline Models (CRM Features)
# ============================================================================

class PipelineStage(Base):
    """Pipeline stages for lead/deal management (Incoming, Ongoing, Pending, Closed/Won)"""
    __tablename__ = "pipeline_stages"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)  # e.g., "Incoming", "Ongoing", "Pending", "Closed/Won"
    order_index = Column(Integer, nullable=False, default=0)  # For display order
    weighting = Column(Float, nullable=False, default=1.0)  # Probability weighting for revenue forecasting (0.0-1.0)
    color = Column(String(50), nullable=True, default="#3b82f6")  # Hex color for UI
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    leads = relationship("Lead", back_populates="stage")
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "order_index": self.order_index,
            "weighting": self.weighting,
            "color": self.color,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class ReferralSource(Base):
    """Referral sources for tracking where leads come from"""
    __tablename__ = "referral_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)  # Person or organization name
    organization = Column(String(255), nullable=True)  # Organization name (if person is from org)
    contact_name = Column(String(255), nullable=True)  # Contact person name
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    source_type = Column(String(100), nullable=True)  # e.g., "Healthcare Facility", "Individual", "Agency"
    status = Column(String(50), nullable=False, default="active")  # "incoming", "ongoing", "active", "inactive"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    leads = relationship("Lead", back_populates="referral_source")
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "organization": self.organization,
            "contact_name": self.contact_name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "source_type": self.source_type,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Lead(Base):
    """Leads/Deals in the sales pipeline"""
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)  # Lead/client name
    contact_name = Column(String(255), nullable=True)  # Contact person (if different from lead name)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(255), nullable=True)
    
    # Sales-specific fields
    source = Column(String(100), nullable=True)  # e.g., "Referral", "Direct", "Website", "Cold Call"
    payor_source = Column(String(100), nullable=True)  # e.g., "Medicaid", "Private Pay", "Medicare", "Insurance"
    expected_close_date = Column(DateTime, nullable=True)
    expected_revenue = Column(Float, nullable=True)  # Expected monthly revenue
    priority = Column(String(50), nullable=True, default="medium")  # "high", "medium", "low"
    notes = Column(Text, nullable=True)
    
    # Pipeline management
    stage_id = Column(Integer, ForeignKey("pipeline_stages.id"), nullable=False)
    order_index = Column(Integer, nullable=False, default=0)  # For drag-and-drop ordering within stage
    status = Column(String(50), nullable=False, default="active")  # "active", "closed_won", "closed_lost"
    
    # Referral source relationship
    referral_source_id = Column(Integer, ForeignKey("referral_sources.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)  # When deal was closed (won or lost)
    
    # Relationships
    stage = relationship("PipelineStage", back_populates="leads")
    referral_source = relationship("ReferralSource", back_populates="leads")
    tasks = relationship("LeadTask", back_populates="lead", cascade="all, delete-orphan")
    activities = relationship("LeadActivity", back_populates="lead", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "contact_name": self.contact_name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "city": self.city,
            "source": self.source,
            "payor_source": self.payor_source,
            "expected_close_date": self.expected_close_date.isoformat() if self.expected_close_date else None,
            "expected_revenue": self.expected_revenue,
            "priority": self.priority,
            "notes": self.notes,
            "stage_id": self.stage_id,
            "stage_name": self.stage.name if self.stage else None,
            "order_index": self.order_index,
            "status": self.status,
            "referral_source_id": self.referral_source_id,
            "referral_source_name": self.referral_source.name if self.referral_source else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "closed_at": self.closed_at.isoformat() if self.closed_at else None,
            "tasks": [task.to_dict() for task in self.tasks] if self.tasks else [],
            "activities": [activity.to_dict() for activity in self.activities] if self.activities else []
        }

class LeadTask(Base):
    """Tasks/updates for leads (e.g., Assessment Scheduled, Contract Signed)"""
    __tablename__ = "lead_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    title = Column(String(255), nullable=False)  # e.g., "Assessment Scheduled", "Contract Signed"
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    status = Column(String(50), nullable=False, default="pending")  # "pending", "completed", "cancelled"
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    lead = relationship("Lead", back_populates="tasks")
    
    def to_dict(self):
        return {
            "id": self.id,
            "lead_id": self.lead_id,
            "title": self.title,
            "description": self.description,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "status": self.status,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class LeadActivity(Base):
    """Activity log for tracking all lead changes"""
    __tablename__ = "lead_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    activity_type = Column(String(100), nullable=False)  # e.g., "created", "stage_changed", "notes_updated"
    description = Column(Text, nullable=False)  # Human-readable description
    old_value = Column(Text, nullable=True)  # For change tracking
    new_value = Column(Text, nullable=True)  # For change tracking
    user_email = Column(String(255), nullable=True)  # Who made the change
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    lead = relationship("Lead", back_populates="activities")
    
    def to_dict(self):
        return {
            "id": self.id,
            "lead_id": self.lead_id,
            "activity_type": self.activity_type,
            "description": self.description,
            "old_value": self.old_value,
            "new_value": self.new_value,
            "user_email": self.user_email,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
