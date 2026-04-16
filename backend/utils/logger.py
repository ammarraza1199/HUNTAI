# backend/utils/logger.py
# HuntAI - AI Job Hunter Agent
# Structured JSON logger with Supabase and SSE streaming support

import logging
import json
import os
import sys
import asyncio
import traceback
from datetime import datetime, timezone
from typing import Any, Optional, Dict
from logging.handlers import TimedRotatingFileHandler

class HuntAILogger:
    """
    Structured JSON logger for HuntAI.
    Writes to:
    1. Local Daily JSON Files (/logs/YYYY-MM-DD.json)
    2. Supabase error_logs table (for non-info entries)
    3. Console (Standard Out)
    """
    
    def __init__(self, name: str = "huntai"):
        self.name = name
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # Ensure log directory exists
        self.log_dir = os.path.join(os.getcwd(), "logs")
        os.makedirs(self.log_dir, exist_ok=True)
        
        # Daily rotation file handler
        log_file = os.path.join(self.log_dir, "huntai.log") # Base name, rotated daily
        file_handler = TimedRotatingFileHandler(
            log_file, when="midnight", interval=1, backupCount=30, encoding="utf-8"
        )
        file_handler.suffix = "%Y-%m-%d.json" # Rotated files will be .json
        file_handler.setFormatter(logging.Formatter('%(message)s'))
        self.logger.addHandler(file_handler)
        
        # Stream handler for console
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(logging.Formatter('%(asctime)s [%(levelname)s] %(name)s: %(message)s'))
        self.logger.addHandler(console_handler)

    def _build_entry(self, level: str, message: str, phase: str = None, 
                     platform: str = None, user_id: str = None, run_id: str = None,
                     error_type: str = None, stack_trace: str = None, 
                     job_url: str = None, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": level,
            "user_id": str(user_id) if user_id else None,
            "run_id": str(run_id) if run_id else None,
            "phase": phase,
            "platform": platform,
            "message": message,
            "error_type": error_type,
            "stack_trace": stack_trace,
            "job_url": job_url,
            "metadata": metadata or {},
            "logger_name": self.name
        }

    def _log(self, level_num: int, level_name: str, message: str, **kwargs):
        entry = self._build_entry(level_name, message, **kwargs)
        
        # Write to local file (as JSON string)
        self.logger.log(level_num, json.dumps(entry))

    def info(self, message: str, **kwargs):
        self._log(logging.INFO, "INFO", message, **kwargs)

    def warning(self, message: str, error_type: str = None, **kwargs):
        self._log(logging.WARNING, "WARNING", message, error_type=error_type, **kwargs)

    def error(self, message: str, error_type: str = None, exception: Exception = None, **kwargs):
        stack = "".join(traceback.format_exception(type(exception), exception, exception.__traceback__)) if exception else None
        self._log(logging.ERROR, "ERROR", message, error_type=error_type or (type(exception).__name__ if exception else None), stack_trace=stack, **kwargs)

    def critical(self, message: str, error_type: str = None, exception: Exception = None, **kwargs):
        stack = "".join(traceback.format_exception(type(exception), exception, exception.__traceback__)) if exception else None
        self._log(logging.CRITICAL, "CRITICAL", message, error_type=error_type or (type(exception).__name__ if exception else None), stack_trace=stack, **kwargs)

# Global singleton or instance per run
logger = HuntAILogger()
