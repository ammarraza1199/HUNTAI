import json
import logging
import math
from datetime import datetime
from typing import List, Dict, Any, Optional

import gspread
from google.oauth2.service_account import Credentials

from backend import config

logger = logging.getLogger(__name__)

# Cache of existing Job IDs in the sheet to prevent duplicates
_EXISTING_IDS = set()

def _format_freshness(hours: float) -> str:
    """Converts a float of hours into a human-readable string."""
    if hours == float('inf') or hours is None:
        return "Unknown ⏱️"
    if hours < 1:
        return "Just Now ⚡"
    if hours < 2:
        return "1 hr ago"
    if hours < 24:
        return f"{int(hours)} hrs ago"
    return "Yesterday"

def init_sheet() -> Optional[gspread.Worksheet]:
    """Authenticates with Google Sheets API and returns a formatted Worksheet."""
    creds_file = config.BASE_DIR / config.GOOGLE_SHEETS_CREDENTIALS_FILE
    if not creds_file.exists():
        logger.error("Google Sheets credentials not found at %s", creds_file)
        return None
        
    try:
        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive"
        ]
        credentials = Credentials.from_service_account_file(
            str(creds_file), scopes=scopes
        )
        gc = gspread.authorize(credentials)
        
        # Open the spreadsheet
        spreadsheet = gc.open_by_key(config.GOOGLE_SHEETS_SPREADSHEET_ID)
        
        # Generate worksheet name based on today's date
        today_str = datetime.now().strftime("%Y-%m-%d")
        daily_sheet_name = f"Jobs_{today_str}"
        
        try:
            worksheet = spreadsheet.worksheet(daily_sheet_name)
        except gspread.exceptions.WorksheetNotFound:
            logger.info("Worksheet '%s' not found. Creating it...", daily_sheet_name)
            worksheet = spreadsheet.add_worksheet(title=daily_sheet_name, rows=2000, cols=20)
            
            # ─── Premium Header & Setup ─────────────────────────────────────
            worksheet.append_row(config.SHEET_HEADERS)
            
            # Format Headers (Bold, Grey, Frozen)
            header_fmt = {
                "backgroundColor": {"red": 0.15, "green": 0.15, "blue": 0.2}, # Dark Blue/Grey
                "textFormat": {"bold": True, "fontSize": 11, "foregroundColor": {"red": 1.0, "green": 1.0, "blue": 1.0}}
            }
            worksheet.format("A1:N1", header_fmt)
            worksheet.freeze(rows=1)
            
            # ─── Column Widths ──────────────────────────────────────────────
            # A:Platform, B:Title, C:Company, D:Score, E:How Fresh, F:Location, G:Skills, H:Sugg, I:Letter, J:Salary, K:URL, L:HR, M:ID, N:Scraped
            worksheet.set_column_width("B:B", 250) # Title
            worksheet.set_column_width("C:C", 200) # Company
            worksheet.set_column_width("D:D", 80)  # Score
            worksheet.set_column_width("E:E", 110) # Freshness
            worksheet.set_column_width("G:G", 250) # Missing Skills
            worksheet.set_column_width("H:H", 250) # Suggestions
            worksheet.set_column_width("I:I", 400) # Cover Letter
            worksheet.set_column_width("K:K", 150) # URL
            
            # ─── Enable Wrapping ───
            worksheet.format("G:I", {"wrapStrategy": "WRAP"})
            
            # ─── Center Align Score ───
            worksheet.format("D:E", {"horizontalAlignment": "CENTER"})

            # ─── ADD CONDITIONAL FORMATTING (Colors) ─────────────────────
            # Use gspread batch_update to set conditional formatting for Column D (Score)
            body = {
                "requests": [
                    {
                        "addConditionalFormatRule": {
                            "rule": {
                                "ranges": [{"sheetId": worksheet._properties['sheetId'], "startRowIndex": 1, "startColumnIndex": 3, "endColumnIndex": 4}],
                                "booleanRule": {
                                    "condition": {"type": "NUMBER_GREATER_EQUAL", "values": [{"userEnteredValue": "85"}]},
                                    "format": {"backgroundColor": {"red": 0.8, "green": 1.0, "blue": 0.8}, "textFormat": {"bold": True}}
                                }
                            },
                            "index": 0
                        }
                    },
                    {
                        "addConditionalFormatRule": {
                            "rule": {
                                "ranges": [{"sheetId": worksheet._properties['sheetId'], "startRowIndex": 1, "startColumnIndex": 3, "endColumnIndex": 4}],
                                "booleanRule": {
                                    "condition": {"type": "NUMBER_BETWEEN", "values": [{"userEnteredValue": "70"}, {"userEnteredValue": "84"}]},
                                    "format": {"backgroundColor": {"red": 1.0, "green": 1.0, "blue": 0.8}}
                                }
                            },
                            "index": 1
                        }
                    },
                    {
                        "addConditionalFormatRule": {
                            "rule": {
                                "ranges": [{"sheetId": worksheet._properties['sheetId'], "startRowIndex": 1, "startColumnIndex": 3, "endColumnIndex": 4}],
                                "booleanRule": {
                                    "condition": {"type": "NUMBER_LESS", "values": [{"userEnteredValue": "50"}]},
                                    "format": {"backgroundColor": {"red": 1.0, "green": 0.8, "blue": 0.8}}
                                }
                            },
                            "index": 2
                        }
                    }
                ]
            }
            # Execute the conditional formatting (requires full spreadsheet access)
            try:
                spreadsheet.batch_update(body)
            except Exception as fe:
                logger.warning("Conditional formatting failed: %s", fe)

        return worksheet
    except Exception as e:
        logger.error("Failed to initialize Google Sheets connection: %s", e)
        return None

def write_jobs(job_results: List[Dict[str, Any]]) -> None:
    """
    Append new job rows to the spreadsheet with dynamic formatting.
    """
    global _EXISTING_IDS
    worksheet = init_sheet()
    if not worksheet:
        logger.error("Cannot write to sheets (init failed). Saving to local fallback.")
        _save_local(job_results)
        return
        
    rows_to_insert = []
    
    # Refresh cache for deduplication
    _EXISTING_IDS.clear() 
    try:
        id_col = worksheet.col_values(13) # Job ID is index 13 now
        if len(id_col) > 1:
            _EXISTING_IDS = set(id_col[1:])
    except: pass

    for job in job_results:
        job_id = job.get('job_id')
        if not job_id or job_id in _EXISTING_IDS:
            continue
            
        # Format lists
        missing_skills = ", ".join(job.get("missing_skills", []))
        suggestions = "\n".join(job.get("suggestions", []))
        freshness = _format_freshness(job.get("posted_hours"))
        
        # Mapping exactly to the new SHEET_HEADERS in config.py
        # ["Platform", "Title", "Company", "Score", "How Fresh?", "Location", "Skills", "Sugg", "Letter", "Salary", "URL", "HR", "ID", "Scraped"]
        row = [
            job.get("platform", ""),
            job.get("title", ""),
            job.get("company", ""),
            job.get("score", 0),
            freshness,
            job.get("location", ""),
            missing_skills,
            suggestions,
            job.get("cover_letter", ""),
            job.get("salary", ""),
            job.get("url", ""),
            job.get("hr_contact", ""),
            job_id,
            job.get("scraped_at", "")
        ]
        
        # Sanitize row (handle NaN, Inf)
        sanitized_row = []
        for val in row:
            if isinstance(val, float) and (math.isinf(val) or math.isnan(val)):
                sanitized_row.append("")
            else:
                sanitized_row.append(str(val) if val is not None else "")

        rows_to_insert.append(sanitized_row)
        _EXISTING_IDS.add(job_id)

    if rows_to_insert:
        try:
            worksheet.append_rows(rows_to_insert, value_input_option='USER_ENTERED')
            logger.info("✅ Appended %d new jobs to Google Sheets (Daily Tab).", len(rows_to_insert))
        except Exception as e:
            logger.error("Failed to append rows: %s", e)
            _save_local(job_results)
    else:
        logger.info("No new jobs to write.")

def _save_local(job_results: List[Dict[str, Any]]) -> None:
    """Fallback save to local cache."""
    try:
        existing = []
        if config.CACHE_FILE.exists():
            with open(config.CACHE_FILE, "r", encoding="utf-8") as f:
                try: existing = json.load(f)
                except: pass
        existing.extend(job_results)
        with open(config.CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2)
        logger.info("Saved %d jobs to local fallback cache.", len(job_results))
    except Exception as e:
        logger.error("Local fallback failed: %s", e)
