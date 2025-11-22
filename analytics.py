from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from models import Visit, TimeEntry, Contact, AnalyticsCache, FinancialEntry, SalesBonus
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging
import os
import json

logger = logging.getLogger(__name__)

class AnalyticsEngine:
    """Generate analytics and KPIs for the sales dashboard"""
    
    CACHE_TTL_SECONDS = 900  # 15 minutes
    
    def __init__(self, db: Session):
        self.db = db
    
    def _get_sheet_dashboard_metrics(self) -> Optional[Dict[str, Any]]:
        """Read dashboard totals from cache, refreshing from the sheet if stale."""
        metric_map = {
            'sheet_total_hours': 'total_hours',
            'sheet_total_costs': 'total_costs',
            'sheet_total_commission': 'total_commission',
            'sheet_total_visits': 'total_visits',
        }
        now = datetime.utcnow()
        freshness_threshold = now - timedelta(seconds=self.CACHE_TTL_SECONDS)
        
        cache_entries: Dict[str, AnalyticsCache] = {}
        cached_metrics: Dict[str, Any] = {}
        cache_fresh = True
        
        try:
            entries = self.db.query(AnalyticsCache).filter(
                AnalyticsCache.metric_name.in_(metric_map.keys())
            ).all()
            for entry in entries:
                cache_entries[entry.metric_name] = entry
        except Exception as exc:
            logger.warning(f"Unable to read sheet totals cache: {exc}")
            cache_fresh = False
        
        for metric_name, key in metric_map.items():
            entry = cache_entries.get(metric_name)
            if entry is None:
                cache_fresh = False
                continue
            cached_metrics[key] = float(entry.metric_value)
            if not entry.updated_at or entry.updated_at < freshness_threshold:
                cache_fresh = False
        
        if cache_fresh and len(cached_metrics) == len(metric_map):
            latest_timestamp = max(
                cache_entries[m].updated_at for m in cache_entries if cache_entries[m].updated_at is not None
            )
            cached_metrics["timestamp"] = latest_timestamp or now
            return cached_metrics
        
        # Cache missing or stale; attempt to refresh from sheet
        creds_json = os.getenv('GOOGLE_SERVICE_ACCOUNT_KEY')
        sheet_id = os.getenv('SHEET_ID')
        if not creds_json or not sheet_id:
            return cached_metrics if cached_metrics else None
        
        try:
            import gspread  # type: ignore
            from google.oauth2.service_account import Credentials  # type: ignore
            
            creds_dict = json.loads(creds_json)
            creds = Credentials.from_service_account_info(creds_dict, scopes=[
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ])
            client = gspread.authorize(creds)
            worksheet = client.open_by_key(sheet_id).worksheet('Dashboard')
            
            value_b21 = worksheet.cell(21, 2).value  # Total Hours
            value_b22 = worksheet.cell(22, 2).value  # Total Costs
            value_b23 = worksheet.cell(23, 2).value  # Total Commission/Bonuses
            value_b24 = worksheet.cell(24, 2).value  # Total Visits
            
            def parse_number(raw_value: Optional[str]) -> float:
                if not raw_value:
                    return 0.0
                cleaned = (
                    raw_value.replace('$', '')
                    .replace(',', '')
                    .strip()
                )
                try:
                    return float(cleaned)
                except ValueError:
                    return 0.0
            
            metrics = {
                "total_hours": parse_number(value_b21),
                "total_costs": parse_number(value_b22),
                "total_commission": parse_number(value_b23),
                "total_visits": parse_number(value_b24),
            }
            
            # Update cache with fresh values
            try:
                for metric_name, key in metric_map.items():
                    value = metrics.get(key, 0.0)
                    entry = cache_entries.get(metric_name)
                    if entry is None:
                        entry = AnalyticsCache(
                            metric_name=metric_name,
                            metric_value=value,
                            period='all_time',
                            period_start=now,
                            period_end=now,
                        )
                        self.db.add(entry)
                    else:
                        entry.metric_value = value
                        entry.period = 'all_time'
                        entry.period_start = now
                        entry.period_end = now
                        entry.updated_at = now
                self.db.commit()
            except Exception as exc:
                logger.warning(f"Unable to store sheet totals cache: {exc}")
                self.db.rollback()
            
            metrics["timestamp"] = now
            return metrics
        except Exception as exc:
            logger.warning(f"Unable to load dashboard totals from sheet: {exc}")
            if cached_metrics:
                cached_metrics["timestamp"] = cache_entries[next(iter(cache_entries))].updated_at if cache_entries else None
            return cached_metrics if cached_metrics else None
    
    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Get overall dashboard summary"""
        try:
            sheet_metrics = self._get_sheet_dashboard_metrics()
            
            # Total visits
            if sheet_metrics is not None and sheet_metrics.get("total_visits") is not None:
                total_visits = int(round(sheet_metrics["total_visits"]))
            else:
                total_visits = self.db.query(Visit).count()
            
            # Visits this month
            current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            visits_this_month = self.db.query(Visit).filter(
                Visit.visit_date >= current_month_start
            ).count()
            
            # Total hours worked - from database (synced from Google Sheet B21)
            if sheet_metrics is not None and sheet_metrics.get("total_hours") is not None:
                total_hours = sheet_metrics["total_hours"]
            else:
                total_hours = self.db.query(func.sum(TimeEntry.hours_worked)).scalar() or 0.0
            
            # Hours this month
            hours_this_month = self.db.query(func.sum(TimeEntry.hours_worked)).filter(
                TimeEntry.date >= current_month_start
            ).scalar() or 0
            
            # Total contacts
            total_contacts = self.db.query(Contact).count()
            
            # Unique facilities visited
            unique_facilities = self.db.query(func.count(func.distinct(Visit.business_name))).scalar()
            
            # Financial KPIs - COSTS ONLY (no revenue from visits)
            total_labor_cost = self.db.query(func.sum(FinancialEntry.labor_cost)).scalar() or 0
            total_mileage_cost = self.db.query(func.sum(FinancialEntry.mileage_cost)).scalar() or 0
            total_materials_cost = self.db.query(func.sum(FinancialEntry.materials_cost)).scalar() or 0
            if sheet_metrics is not None and sheet_metrics.get("total_costs") is not None:
                total_costs = sheet_metrics["total_costs"]
            else:
                total_costs = self.db.query(func.sum(FinancialEntry.total_daily_cost)).scalar() or 0.0
            
            # This month costs
            labor_cost_this_month = self.db.query(func.sum(FinancialEntry.labor_cost)).filter(
                FinancialEntry.date >= current_month_start
            ).scalar() or 0
            costs_this_month = self.db.query(func.sum(FinancialEntry.total_daily_cost)).filter(
                FinancialEntry.date >= current_month_start
            ).scalar() or 0
            
            # Sales bonuses (revenue) - from database (synced from Google Sheet B23)
            if sheet_metrics is not None and sheet_metrics.get("total_commission") is not None:
                total_bonuses_earned = sheet_metrics["total_commission"]
            else:
                total_bonuses_earned = self.db.query(func.sum(SalesBonus.bonus_amount)).scalar() or 0.0
            total_bonuses_paid = self.db.query(func.sum(SalesBonus.bonus_amount)).filter(
                SalesBonus.commission_paid == True
            ).scalar() or 0
            
            bonuses_this_month = self.db.query(func.sum(SalesBonus.bonus_amount)).filter(
                SalesBonus.start_date >= current_month_start
            ).scalar() or 0
            
            # Cost per visit (EXCLUDE bonuses - just daily summary costs)
            cost_per_visit = total_costs / total_visits if total_visits > 0 else 0
            
            # Bonus per visit (potential revenue)
            bonus_per_visit = total_bonuses_earned / total_visits if total_visits > 0 else 0
            
            # Emails sent in last 7 days - from database (synced from Gmail API)
            from models import EmailCount
            try:
                email_count_record = self.db.query(EmailCount).order_by(EmailCount.updated_at.desc()).first()
                emails_sent_7_days = email_count_record.emails_sent_7_days if email_count_record else 0
            except Exception as e:
                logger.warning(f"Error getting email count: {str(e)}")
                emails_sent_7_days = 0
            
            if sheet_metrics and sheet_metrics.get("timestamp"):
                timestamp = sheet_metrics["timestamp"]
                if isinstance(timestamp, datetime):
                    last_updated = timestamp.isoformat()
                else:
                    last_updated = str(timestamp)
            else:
                last_updated = datetime.utcnow().isoformat()
            
            return {
                "total_visits": total_visits,
                "visits_this_month": visits_this_month,
                "total_hours": round(total_hours, 2),
                "hours_this_month": round(hours_this_month, 2),
                "total_contacts": total_contacts,
                "unique_facilities": unique_facilities,
                "total_labor_cost": round(total_labor_cost, 2),
                "total_mileage_cost": round(total_mileage_cost, 2),
                "total_materials_cost": round(total_materials_cost, 2),
                "total_costs": round(total_costs, 2),
                "total_bonuses_earned": round(total_bonuses_earned, 2),
                "total_bonuses_paid": round(total_bonuses_paid, 2),
                "total_wages_expenses": round(total_costs, 2), # Just daily summary costs
                "costs_this_month": round(costs_this_month, 2),
                "bonuses_this_month": round(bonuses_this_month, 2),
                "cost_per_visit": round(cost_per_visit, 2),
                "bonus_per_visit": round(bonus_per_visit, 2),
                "emails_sent_7_days": emails_sent_7_days,
                "last_updated": last_updated
            }
            
        except Exception as e:
            logger.error(f"Error getting dashboard summary: {str(e)}")
            return {}
    
    def get_visits_by_month(self, months: int = 12) -> List[Dict[str, Any]]:
        """Get visits grouped by month"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=months * 30)
            
            results = self.db.query(
                func.date_trunc('month', Visit.visit_date).label('month'),
                func.count(Visit.id).label('count')
            ).filter(
                Visit.visit_date >= start_date
            ).group_by(
                func.date_trunc('month', Visit.visit_date)
            ).order_by('month').all()
            
            return [
                {
                    "month": result.month.strftime("%Y-%m"),
                    "count": result.count
                }
                for result in results
            ]
            
        except Exception as e:
            logger.error(f"Error getting visits by month: {str(e)}")
            return []
    
    def get_hours_by_month(self, months: int = 12) -> List[Dict[str, Any]]:
        """Get hours worked grouped by month"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=months * 30)
            
            results = self.db.query(
                func.date_trunc('month', TimeEntry.date).label('month'),
                func.sum(TimeEntry.hours_worked).label('total_hours')
            ).filter(
                TimeEntry.date >= start_date
            ).group_by(
                func.date_trunc('month', TimeEntry.date)
            ).order_by('month').all()
            
            return [
                {
                    "month": result.month.strftime("%Y-%m"),
                    "hours": round(result.total_hours, 2)
                }
                for result in results
            ]
            
        except Exception as e:
            logger.error(f"Error getting hours by month: {str(e)}")
            return []
    
    def get_top_facilities(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get most visited facilities"""
        try:
            results = self.db.query(
                Visit.business_name,
                func.count(Visit.id).label('visit_count')
            ).group_by(
                Visit.business_name
            ).order_by(
                desc('visit_count')
            ).limit(limit).all()
            
            return [
                {
                    "facility": result.business_name,
                    "visits": result.visit_count
                }
                for result in results
            ]
            
        except Exception as e:
            logger.error(f"Error getting top facilities: {str(e)}")
            return []
    
    def _categorize_referral_type(self, business_name: str, address: str = "", notes: str = "") -> str:
        """Categorize a visit by referral type - expanded categorization"""
        text = f"{business_name} {address} {notes}".lower()
        
        # Hospitals (most specific first)
        hospital_keywords = [
            'hospital', 'medical center', 'health center', 'healthcare center', 
            'uchealth', 'centura', 'penrose', 'memorial hospital', 'st. francis',
            'emergency room', 'er', 'emergency department', 'icu', 'ccu'
        ]
        if any(keyword in text for keyword in hospital_keywords):
            return 'Hospitals'
        
        # Veterans Centers (VFW, American Legion)
        veteran_keywords = [
            'vfw', 'american legion', 'legion', 'veterans', 'veteran',
            'legion post', 'veterans center', 'veteran center', 'veterans of foreign wars',
            'vfw post', 'legion hall', 'veterans affairs', 'va center'
        ]
        if any(keyword in text for keyword in veteran_keywords):
            return 'Veterans Centers'
        
        # Assisted Living / Senior Living / Nursing Homes
        assisted_living_keywords = [
            'assisted living', 'senior living', 'nursing home', 'nursing facility',
            'skilled nursing', 'snf', 'long term care', 'ltc', 'care center',
            'memory care', 'independent living', 'retirement community', 'retirement home',
            'elder care', 'residential care', 'adult care', 'elderly care'
        ]
        if any(keyword in text for keyword in assisted_living_keywords):
            return 'Assisted Living/Nursing'
        
        # Doctors Offices / Clinics
        doctor_keywords = [
            'doctor', 'physician', 'medical office', 'clinic', 'medical clinic',
            'family medicine', 'internal medicine', 'urgent care', 'md', 'd.o.',
            'primary care', 'specialist', 'practitioner', 'medical practice',
            'pediatric', 'orthopedic', 'cardiology', 'neurology', 'oncology'
        ]
        if any(keyword in text for keyword in doctor_keywords):
            return 'Doctors Offices'
        
        # Rehabs / Treatment Centers
        rehab_keywords = [
            'rehab', 'rehabilitation', 'recovery', 'treatment center', 'detox',
            'addiction', 'substance abuse', 'drug treatment', 'alcohol treatment',
            'behavioral health', 'mental health', 'psychiatric', 'therapy center'
        ]
        if any(keyword in text for keyword in rehab_keywords):
            return 'Rehabs'
        
        # Home Health/Hospice
        home_health_keywords = [
            'hospice', 'home health', 'homehealth', 'palliative care',
            'pikes peak hospice', 'end of life', 'comfort care',
            'visiting nurse', 'home care', 'homecare', 'in-home care'
        ]
        if any(keyword in text for keyword in home_health_keywords):
            return 'Home Health/Hospice'
        
        # Community Centers / Non-Profits
        community_keywords = [
            'community center', 'senior center', 'community', 'non-profit',
            'nonprofit', 'foundation', 'association', 'society', 'organization'
        ]
        if any(keyword in text for keyword in community_keywords):
            return 'Community Centers'
        
        # Pharmacies / Medical Supply
        pharmacy_keywords = [
            'pharmacy', 'drug store', 'pharmacist', 'cvs', 'walgreens',
            'rite aid', 'medical supply', 'durable medical', 'dme'
        ]
        if any(keyword in text for keyword in pharmacy_keywords):
            return 'Pharmacies/Supply'
        
        # Social Services / Case Management
        social_service_keywords = [
            'case manager', 'case management', 'social worker', 'social services',
            'disability services', 'medicaid', 'medicare', 'insurance',
            'health department', 'public health'
        ]
        if any(keyword in text for keyword in social_service_keywords):
            return 'Social Services'
        
        # Default to "Other" if no match
        return 'Other'
    
    def get_referral_types(self) -> List[Dict[str, Any]]:
        """Get visits categorized by referral type"""
        try:
            # Get all visits
            visits = self.db.query(Visit).all()
            
            # Categorize visits
            referral_counts = {
                'Hospitals': 0,
                'Veterans Centers': 0,
                'Assisted Living/Nursing': 0,
                'Doctors Offices': 0,
                'Rehabs': 0,
                'Home Health/Hospice': 0,
                'Community Centers': 0,
                'Pharmacies/Supply': 0,
                'Social Services': 0,
                'Other': 0
            }
            
            for visit in visits:
                referral_type = self._categorize_referral_type(
                    visit.business_name or "",
                    visit.address or "",
                    visit.notes or ""
                )
                referral_counts[referral_type] += 1
            
            # Convert to list format, excluding "Other" if it's 0 or if we want to show top 5
            results = [
                {"type": k, "count": v}
                for k, v in referral_counts.items()
                if v > 0  # Only include types with visits
            ]
            
            # Sort by count descending
            results.sort(key=lambda x: x['count'], reverse=True)
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting referral types: {str(e)}")
            return []
    
    def get_recent_activity(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent activity across all data types"""
        try:
            activities = []
            
            # Recent visits
            recent_visits = self.db.query(Visit).order_by(
                desc(Visit.visit_date)
            ).limit(limit).all()
            
            for visit in recent_visits:
                activities.append({
                    "type": "visit",
                    "description": f"Visit to {visit.business_name}",
                    "date": visit.visit_date.isoformat(),
                    "details": {
                        "stop": visit.stop_number,
                        "address": visit.address,
                        "city": visit.city
                    }
                })
            
            # Recent time entries
            recent_time = self.db.query(TimeEntry).order_by(
                desc(TimeEntry.created_at)
            ).limit(limit).all()
            
            for entry in recent_time:
                activities.append({
                    "type": "time_entry",
                    "description": f"Logged {entry.hours_worked} hours",
                    "date": entry.created_at.isoformat(),
                    "details": {
                        "date": entry.date.isoformat(),
                        "hours": entry.hours_worked
                    }
                })
            
            # Recent contacts
            recent_contacts = self.db.query(Contact).order_by(
                desc(Contact.created_at)
            ).limit(limit).all()
            
            for contact in recent_contacts:
                activities.append({
                    "type": "contact",
                    "description": f"Added contact: {contact.name or contact.company}",
                    "date": contact.created_at.isoformat(),
                    "details": {
                        "name": contact.name,
                        "company": contact.company,
                        "phone": contact.phone,
                        "email": contact.email
                    }
                })
            
            # Sort by date and return top N
            activities.sort(key=lambda x: x['date'], reverse=True)
            return activities[:limit]
            
        except Exception as e:
            logger.error(f"Error getting recent activity: {str(e)}")
            return []
    
    def get_weekly_summary(self) -> Dict[str, Any]:
        """Get this week's summary"""
        try:
            # Start of this week (Monday)
            today = datetime.now()
            start_of_week = today - timedelta(days=today.weekday())
            start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Visits this week
            visits_this_week = self.db.query(Visit).filter(
                Visit.visit_date >= start_of_week
            ).count()
            
            # Hours this week
            hours_this_week = self.db.query(func.sum(TimeEntry.hours_worked)).filter(
                TimeEntry.date >= start_of_week
            ).scalar() or 0
            
            # New contacts this week
            contacts_this_week = self.db.query(Contact).filter(
                Contact.created_at >= start_of_week
            ).count()
            
            return {
                "visits_this_week": visits_this_week,
                "hours_this_week": round(hours_this_week, 2),
                "contacts_this_week": contacts_this_week,
                "week_start": start_of_week.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting weekly summary: {str(e)}")
            return {}
    
    def get_financial_summary(self) -> Dict[str, Any]:
        """Get comprehensive financial summary"""
        try:
            # Total financials - COSTS ONLY (no revenue from visits)
            total_costs = self.db.query(func.sum(FinancialEntry.total_daily_cost)).scalar() or 0
            
            # This month
            current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            costs_this_month = self.db.query(func.sum(FinancialEntry.total_daily_cost)).filter(
                FinancialEntry.date >= current_month_start
            ).scalar() or 0
            
            # Cost breakdown
            total_labor_cost = self.db.query(func.sum(FinancialEntry.labor_cost)).scalar() or 0
            total_mileage_cost = self.db.query(func.sum(FinancialEntry.mileage_cost)).scalar() or 0
            total_materials_cost = self.db.query(func.sum(FinancialEntry.materials_cost)).scalar() or 0
            
            # Visit metrics
            total_visits = self.db.query(Visit).count()
            cost_per_visit = total_costs / total_visits if total_visits > 0 else 0
            
            return {
                "total_costs": round(total_costs, 2),
                "costs_this_month": round(costs_this_month, 2),
                "total_labor_cost": round(total_labor_cost, 2),
                "total_mileage_cost": round(total_mileage_cost, 2),
                "total_materials_cost": round(total_materials_cost, 2),
                "cost_per_visit": round(cost_per_visit, 2)
            }
            
        except Exception as e:
            logger.error(f"Error getting financial summary: {str(e)}")
            return {}
    
    def get_revenue_by_month(self, months: int = 12) -> List[Dict[str, Any]]:
        """Get costs grouped by month (no revenue from visits)"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=months * 30)
            
            results = self.db.query(
                func.date_trunc('month', FinancialEntry.date).label('month'),
                func.sum(FinancialEntry.total_daily_cost).label('costs')
            ).filter(
                FinancialEntry.date >= start_date
            ).group_by(
                func.date_trunc('month', FinancialEntry.date)
            ).order_by('month').all()
            
            return [
                {
                    "month": result.month.strftime("%Y-%m"),
                    "revenue": 0,  # No revenue from visits
                    "costs": round(result.costs, 2),
                    "profit": round(0 - result.costs, 2)  # Negative profit (costs only)
                }
                for result in results
            ]
            
        except Exception as e:
            logger.error(f"Error getting revenue by month: {str(e)}")
            return []
    
    def get_costs_by_month(self, months: int = 12) -> List[Dict[str, Any]]:
        """Get costs grouped by month - exclude future months"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=months * 30)
            # Don't include future months - only up to current month
            current_month_start = datetime(end_date.year, end_date.month, 1)
            
            results = self.db.query(
                func.date_trunc('month', FinancialEntry.date).label('month'),
                func.sum(FinancialEntry.total_daily_cost).label('costs')
            ).filter(
                FinancialEntry.date >= start_date,
                FinancialEntry.date < current_month_start.replace(day=1) if end_date.day == 1 else func.date_trunc('month', FinancialEntry.date) <= func.date_trunc('month', current_month_start)
            ).group_by(
                func.date_trunc('month', FinancialEntry.date)
            ).order_by('month').all()
            
            # Filter out future months in Python (more reliable)
            filtered_results = []
            for result in results:
                result_month = result.month
                # Only include months up to and including the current month
                if result_month.year < end_date.year or (result_month.year == end_date.year and result_month.month <= end_date.month):
                    filtered_results.append({
                        "month": result_month.strftime("%Y-%m"),
                        "costs": round(result.costs, 2)
                    })
            
            return filtered_results
            
        except Exception as e:
            logger.error(f"Error getting costs by month: {str(e)}")
            return []
