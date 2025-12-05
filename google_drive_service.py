import os
import io
import logging
import requests
from typing import Optional, Tuple
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import json

logger = logging.getLogger(__name__)

class GoogleDriveService:
    """Service for interacting with Google Drive API"""
    
    def __init__(self):
        self.creds = None
        self.service = None
        self.enabled = False
        
        try:
            # Check for service account key in environment variable
            creds_json = os.getenv('GOOGLE_SERVICE_ACCOUNT_KEY')
            if creds_json:
                creds_dict = json.loads(creds_json)
                self.creds = service_account.Credentials.from_service_account_info(
                    creds_dict,
                    scopes=['https://www.googleapis.com/auth/drive.readonly']
                )
                self.service = build('drive', 'v3', credentials=self.creds)
                self.enabled = True
                logger.info("Google Drive service initialized successfully")
            else:
                logger.warning("GOOGLE_SERVICE_ACCOUNT_KEY not found. Google Drive service disabled.")
        except Exception as e:
            logger.error(f"Failed to initialize Google Drive service: {str(e)}")
    
    def download_file_from_url(self, url: str) -> Optional[Tuple[bytes, str, dict]]:
        """
        Download a file from a Google Drive URL
        Returns: (file_content, filename, metadata) or None if failed
        """
        if not self.enabled:
            logger.error("Google Drive service is not enabled")
            return None
            
        try:
            file_id = self._extract_file_id(url)
            if not file_id:
                logger.error(f"Could not extract file ID from URL: {url}")
                return None
                
            # Get file metadata
            file_metadata = self.service.files().get(fileId=file_id, fields='name, mimeType, owners, createdTime').execute()
            filename = file_metadata.get('name', 'downloaded_file')
            mime_type = file_metadata.get('mimeType', '')
            
            logger.info(f"Downloading file: {filename} (ID: {file_id}, Type: {mime_type})")
            
            # Download file content
            request = self.service.files().get_media(fileId=file_id)
            file_io = io.BytesIO()
            downloader = MediaIoBaseDownload(file_io, request)
            
            done = False
            while done is False:
                status, done = downloader.next_chunk()
                # logger.debug(f"Download {int(status.progress() * 100)}%.")
                
            return file_io.getvalue(), filename, file_metadata
            
        except Exception as e:
            logger.error(f"Error downloading file from Drive: {str(e)}")
            return None
            
    def _extract_file_id(self, url: str) -> Optional[str]:
        """Extract Google Drive file ID from URL"""
        # Patterns for Drive URLs
        patterns = [
            r'drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)',
            r'drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)',
            r'docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)'
        ]
        
        import re
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
                
        return None
