#!/usr/bin/env python3
"""
Initialize Lead Pipeline database tables and default data.

This script creates the pipeline_stages, leads, referral_sources, 
lead_tasks, and lead_activities tables, and populates pipeline_stages 
with default stages (Incoming, Ongoing, Closed/Won).
"""

from database import get_db, db_manager
from models import Base, PipelineStage, ReferralSource, Lead, LeadTask, LeadActivity
from sqlalchemy import inspect
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def table_exists(table_name):
    """Check if a table exists in the database"""
    db = next(get_db())
    inspector = inspect(db.bind)
    exists = table_name in inspector.get_table_names()
    db.close()
    return exists

def init_pipeline():
    """Initialize pipeline tables and default data"""
    try:
        logger.info("Starting pipeline initialization...")
        
        # Create tables if they don't exist
        logger.info("Creating pipeline tables...")
        db_manager.create_tables()
        
        # Initialize default pipeline stages
        db = next(get_db())
        
        # Check if stages already exist
        existing_stages = db.query(PipelineStage).count()
        if existing_stages > 0:
            logger.info(f"Pipeline stages already exist ({existing_stages} stages). Skipping initialization.")
            db.close()
            return
        
        # Create default stages
        stages = [
            PipelineStage(
                name="Incoming Leads",
                order_index=1,
                color="#eab308"  # Yellow
            ),
            PipelineStage(
                name="Ongoing Leads",
                order_index=2,
                color="#3b82f6"  # Blue
            ),
            PipelineStage(
                name="Closed/Won",
                order_index=3,
                color="#22c55e"  # Green
            )
        ]
        
        for stage in stages:
            db.add(stage)
            logger.info(f"Created stage: {stage.name}")
        
        db.commit()
        logger.info("✅ Pipeline initialization complete!")
        
        # Display summary
        logger.info("\nPipeline Summary:")
        logger.info(f"  - {len(stages)} pipeline stages created")
        logger.info(f"  - Stages: {', '.join([s.name for s in stages])}")
        
        db.close()
        
    except Exception as e:
        logger.error(f"❌ Error initializing pipeline: {str(e)}")
        raise

if __name__ == "__main__":
    init_pipeline()

