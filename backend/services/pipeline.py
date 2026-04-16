# backend/services/pipeline.py
# HuntAI - AI Job Hunter Agent
# Orchestrats the 1. Parsing -> 2. Scraping -> 3. AI Matching -> 4. Complete pipeline.

import asyncio
import logging
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Dict, Any, List, AsyncGenerator
import json
from bson import ObjectId

from backend.utils.logger import logger
from backend.services.resume_parser import parse_resume
from backend.services.job_matcher import match_jobs_to_resume
from backend.services.exporter import ExcelJobExporter
from backend.utils.mongodb import MongoDB
from backend.utils.groq_engine import GroqRateLimitExceeded

# PRODUCTION SCRAPERS (Switching to SeleniumBase for better stealth)
from backend.scrapers.engine_sb.linkedin_sb import LinkedInSBScraper as LinkedInScraper
from backend.scrapers.engine_sb.naukri_sb import NaukriSBScraper as NaukriScraper
from backend.scrapers.engine_sb.indeed_sb import IndeedSBScraper as IndeedScraper

class JobHunterPipeline:
    """
    Main orchestrator for the Job Hunter Agent pipeline.
    Emits events specifically for the SSE stream.
    """
    
    def __init__(self, run_id: UUID, user_id: UUID, config_data: Dict[str, Any], browser_semaphore: asyncio.Semaphore = None):
        self.run_id = str(run_id)
        self.user_id = str(user_id)
        self.config = config_data
        self.browser_semaphore = browser_semaphore
        self.is_running = False
        self.event_queue = asyncio.Queue()
        self.history = [] # Stores last ~50 events for reconnection catch-up
        self.is_running = True
        
        # Scraper instances
        self.scrapers = {
            "linkedin": LinkedInScraper(),
            "naukri": NaukriScraper(),
            "indeed": IndeedScraper()
        }

    def _run_scraper(self, platform: str):
        """Bridge sync scraper to async pipeline via to_thread."""
        try:
            scraper = self.scrapers.get(platform)
            if not scraper: return []
            return scraper.scrape(
                self.config.get("query"), 
                self.config.get("location", "Global"),
                experience_level=self.config.get("experience_level", "entry"),
                max_jobs=self.config.get("max_per_platform", 20)
            )
        except Exception as e:
            logger.error(f"Error running {platform} scraper: {e}")
            return []

    def _sanitize_data(self, data: Any) -> Any:
        """Deep sanitize to replace non-JSON-compliant values (inf, nan) with zeros."""
        if isinstance(data, float):
            import math
            if math.isinf(data) or math.isnan(data):
                return 0
            return data
        elif isinstance(data, dict):
            return {k: self._sanitize_data(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._sanitize_data(x) for x in data]
        return data

    async def _emit(self, event_type: str, data: dict):
        """Internal helper to queue an event."""
        sanitized_data = self._sanitize_data(data)
        event = {"type": event_type, "data": sanitized_data, "timestamp": datetime.now(timezone.utc).isoformat()}
        # Add to history for new listeners
        self.history.append(event)
        if len(self.history) > 100: self.history.pop(0)
        
        await self.event_queue.put(event)

    async def _emit_log(self, level: str, message: str, phase: str = None):
        """Unified logging and event emission."""
        logger.info(message, user_id=self.user_id, run_id=self.run_id, phase=phase)
        await self._emit("log", {"level": level, "message": message, "phase": phase})

    async def run(self) -> AsyncGenerator[str, None]:
        """
        Starts the pipeline and yields formatted SSE data strings.
        This will be executed in a background task by FastAPI.
        """
        # ─── RECONNECTION CATCH-UP ───────────────────────────────────────────
        # Yield all past logs and progress events so the UI can reconstruct state
        for past_event in self.history:
            yield f"data: {json.dumps(past_event, default=str)}\n\n"

        async def run_pipeline_internal():
            from backend.utils.process_cleanup import cleanup_chrome_processes
            try:
                # 🧼 Strategy: Periodic Sanitization to maximize RAM on Render
                cleanup_chrome_processes()
                
                # ─── PHASE 1: Resume Processing ────────────────────────────────────
                await self._emit("progress", {"phase": 1, "percent": 20})
                await self._emit_log("INFO", f"📄 Starting Phase 1: Parsing Resume for {self.config.get('query')}", "parsing")
                await self._emit_log("INFO", "⏳ Note: A thorough search usually takes 8-12 minutes on our cloud servers. Please stay tuned!", "parsing")
                
                # Dynamic API Key Check
                if not self.config.get("GROQ_API_KEY"):
                    raise Exception("Missing GROQ API Key. You must set your own key in settings to run the AI.")
                
                resume_data = self.config.get("resume_data") # Pre-parsed in onboarding usually

                # ─── PHASE 2: Multi-Platform Scraping ──────────────────────────────
                await self._emit("progress", {"phase": 2, "percent": 40})
                platforms = self.config.get("platforms", ["linkedin"])
                
                raw_jobs = []
                
                # Use Semaphore to restrict concurrent browsers to avoid crashing Render/RAM
                if self.browser_semaphore:
                    await self._emit_log("INFO", f"Waiting for computing resources...", "scraping")
                    async with self.browser_semaphore:
                        await self._emit_log("INFO", f"🕵 Phase 2: Launching real scrapers for {', '.join(platforms)}", "scraping")
                        for p in platforms:
                            await self._emit_log("INFO", f"🔍 Scraping {p.capitalize()} for '{self.config.get('query')}'...", "scraping")
                            platform_jobs = await asyncio.to_thread(self._run_scraper, p)
                            raw_jobs.extend(platform_jobs)
                            await self._emit_log("SUCCESS", f"✅ Found {len(platform_jobs)} jobs on {p.capitalize()}.", "scraping")
                else:
                    for p in platforms:
                        await self._emit_log("INFO", f"🔍 Scraping {p.capitalize()} for '{self.config.get('query')}'...", "scraping")
                        platform_jobs = await asyncio.to_thread(self._run_scraper, p)
                        raw_jobs.extend(platform_jobs)
                        await self._emit_log("SUCCESS", f"✅ Found {len(platform_jobs)} jobs on {p.capitalize()}.", "scraping")
                        
                await self._emit_log("SUCCESS", f"✅ Scraping complete. Total raw results: {len(raw_jobs)}", "scraping")
                
                # ─── PHASE 3: AI Matching & Evaluation ─────────────────────────────
                if not raw_jobs:
                    await self._emit_log("WARNING", "⚠️ No jobs found during scraping. Ending pipeline.", "matching")
                    await self._emit("done", {}) # Emit done even on failure
                    self.is_running = False
                    return

                await self._emit("progress", {"phase": 3, "percent": 75})
                await self._emit_log("INFO", "🧠 Phase 3: AI Scoring and Suggestion Generation (Groq)...", "matching")
                
                try:
                    # Use REALLY working job matcher from backend/services/job_matcher.py
                    # This function calls groq_engine.batch_analyze already!
                    analyzed_jobs = await asyncio.to_thread(
                        match_jobs_to_resume, 
                        self.config.get("resume_data", {}), 
                        raw_jobs
                    )

                    for job in analyzed_jobs:
                        await self._emit("job", {"job": job}) # Real-time result push
                except GroqRateLimitExceeded as gle:
                    cooldown = gle.retry_after or "a short period"
                    error_msg = f"⏳ Groq AI Rate Limit Hit. Please try the hunt again after {cooldown} (Groq Cooldown)."
                    await self._emit_log("WARNING", error_msg, "matching")
                    # We can continue with whatever jobs we have (though they might not be analyzed)
                    # or just fail. Given jobs are in raw_jobs, we should probably just stop AI part.
                    analyzed_jobs = raw_jobs 
                    for job in analyzed_jobs:
                        if "match_score" not in job: job["match_score"] = 0
                        await self._emit("job", {"job": job})
                
                # ─── PHASE 4: Export & DB Increments ───────────────────────────────
                await self._emit("progress", {"phase": 4, "percent": 90})
                await self._emit_log("INFO", "📑 Phase 4: Finalizing run and building Excel report...", "export")

                exporter = ExcelJobExporter()
                run_summary = {
                    "id": self.run_id,
                    "query": self.config.get("query"),
                    "location": self.config.get("location"),
                    "avg_match_score": sum(j['match_score'] for j in analyzed_jobs) / len(analyzed_jobs) if analyzed_jobs else 0,
                    "started_at": datetime.now(timezone.utc)
                }
                report_path = exporter.create_report(run_summary, analyzed_jobs)
                
                # Save results to MongoDB for history and dashboard
                db = MongoDB.get_db()
                if db is not None:
                    # 1. User usage is already incremented in start_pipeline (main.py)
                    # We only need to save the run history here.

                    # 2. Save Run Summary
                    runs_col = db["runs"]
                    run_record = {
                        "run_id": self.run_id,
                        "user_id": self.user_id,
                        "query": self.config.get("query"),
                        "location": self.config.get("location"),
                        "platforms": self.config.get("platforms", []),
                        "avg_match_score": run_summary["avg_match_score"],
                        "total_jobs_found": len(analyzed_jobs),
                        "excel_report": report_path,
                        "created_at": datetime.now(timezone.utc),
                        "status": "completed"
                    }
                    await runs_col.replace_one({"run_id": self.run_id}, run_record, upsert=True)

                    # 3. Save Analyzed Jobs in Bulk
                    if analyzed_jobs:
                        jobs_col = db["jobs"]
                        db_jobs = []
                        for j in analyzed_jobs:
                            # Avoid mutating the original dict shared with real-time UI
                            j_copy = j.copy()
                            j_copy["run_id"] = self.run_id
                            j_copy["user_id"] = self.user_id
                            j_copy["scraped_at"] = datetime.now(timezone.utc)
                            db_jobs.append(j_copy)
                        
                        # Clean up any existing partial data for this run
                        await jobs_col.delete_many({"run_id": self.run_id})
                        await jobs_col.insert_many(db_jobs)

                await self._emit_log("SUCCESS", f"✅ Pipeline complete! {len(analyzed_jobs)} high-quality matches found.", "export")
                await self._emit("progress", {"phase": 4, "percent": 100})
                await self._emit("complete", {"summary": run_summary, "excel_report": report_path})
                await self._emit("done", {}) # Final closure signal
                
                self.is_running = False

            except Exception as e:
                error_msg = f"❌ Pipeline Fatal Error: {str(e)}"
                await self._emit_log("ERROR", error_msg, "global")
                await self._emit("error", {"message": error_msg, "fatal": True})
                self.is_running = False

        # Start the pipeline logic as a task ONLY if it hasn't started yet
        if not hasattr(self, "_task_started"):
            self._task_started = True
            asyncio.create_task(run_pipeline_internal())

        # Yield events from the queue for the SSE client
        while self.is_running or not self.event_queue.empty():
            try:
                # Use a shorter timeout to send heartbeats
                event = await asyncio.wait_for(self.event_queue.get(), timeout=5.0)
                yield f"data: {json.dumps(event, default=str)}\n\n"
            except asyncio.TimeoutError:
                if not self.is_running and self.event_queue.empty():
                    break
                # Send a heartbeat to keep the SSE connection alive
                yield ": heartbeat\n\n"
                continue
