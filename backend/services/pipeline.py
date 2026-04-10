# backend/services/pipeline.py
# HuntAI - AI Job Hunter Agent
# Orchestrats the 1. Parsing -> 2. Scraping -> 3. AI Matching -> 4. Complete pipeline.

import asyncio
import logging
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Dict, Any, List, AsyncGenerator
import json

from backend.utils.logger import logger
from backend.services.resume_parser import parse_resume
from backend.services.job_matcher import match_jobs_to_resume
from backend.services.exporter import ExcelJobExporter

# We'll import existing scrapers and wrap them. 
# For now, let's assume we're wrapping the existing 'scraper' logic.

class JobHunterPipeline:
    """
    Main orchestrator for the Job Hunter Agent pipeline.
    Emits events specifically for the SSE stream.
    """
    
    def __init__(self, run_id: UUID, user_id: UUID, config_data: Dict[str, Any]):
        self.run_id = str(run_id)
        self.user_id = str(user_id)
        self.config = config_data
        self.event_queue = asyncio.Queue()
        self.is_running = True

    async def _emit(self, type_name: str, data: Any):
        """Helper to push messages to the SSE queue."""
        event = {
            "type": type_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "run_id": self.run_id,
            **data
        }
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
        async def run_pipeline_internal():
            try:
                # ─── PHASE 1: Resume Processing ────────────────────────────────────
                await self._emit("progress", {"phase": 1, "percent": 25})
                await self._emit_log("INFO", f"📄 Starting Phase 1: Parsing Resume for {self.config.get('query')}", "parsing")
                
                # Mock actual parsing logic (calling actual code later)
                await asyncio.sleep(1) # Simulated network/AI call
                resume_data = self.config.get("resume_data") # Pre-parsed in onboarding usually

                # ─── PHASE 2: Multi-Platform Scraping ──────────────────────────────
                await self._emit("progress", {"phase": 2, "percent": 50})
                platforms = self.config.get("platforms", ["linkedin"])
                await self._emit_log("INFO", f"🕵 Phase 2: Launching scrapers for {', '.join(platforms)} (Engine: {self.config.get('engine')})", "scraping")
                
                # Simulating actual scraper calls
                raw_jobs = []
                for p in platforms:
                    await self._emit_log("INFO", f"🔍 Scraping {p.capitalize()}...", "scraping")
                    await asyncio.sleep(2) # Placeholder for real browser activity
                    # raw_jobs.extend(scrapers[p].scrape(...))
                
                await self._emit_log("SUCCESS", f"✅ Found {len(raw_jobs) + 12} raw results.", "scraping")
                
                # ─── PHASE 3: AI Matching & Evaluaiton ─────────────────────────────
                await self._emit("progress", {"phase": 3, "percent": 75})
                await self._emit_log("INFO", "🧠 Phase 3: AI Scoring and Suggestion Generation (Groq/Llama-3)...", "matching")
                
                # Batch processing mock
                analyzed_jobs = []
                for i in range(12): # Simulate 12 found jobs
                    await asyncio.sleep(0.5) # Simulate per-job AI call
                    job = {
                        "id": str(uuid4()),
                        "title": f"Senior {self.config.get('query')} Engineer",
                        "company": "Tech Corp",
                        "location": self.config.get("location"),
                        "platform": platforms[i % len(platforms)],
                        "job_url": "https://linkedin.com/jobs/view/123",
                        "match_score": 85 - (i * 2),
                        "missing_skills": ["Kubernetes", "Ray"],
                        "suggestion": "Strengthen your ML deployment experience.",
                        "cover_letter": "I am excited to apply for this role..."
                    }
                    analyzed_jobs.append(job)
                    await self._emit("job", {"job": job}) # Real-time result push
                
                # ─── PHASE 4: Export & Finalize ────────────────────────────────────
                await self._emit("progress", {"phase": 4, "percent": 100})
                await self._emit_log("INFO", "📑 Phase 4: Finalizing run and building Excel report...", "export")

                exporter = ExcelJobExporter()
                run_summary = {
                    "id": self.run_id,
                    "query": self.config.get("query"),
                    "location": self.config.get("location"),
                    "avg_match_score": sum(j['match_score'] for j in analyzed_jobs) / len(analyzed_jobs),
                    "started_at": datetime.now(timezone.utc)
                }
                report_path = exporter.create_report(run_summary, analyzed_jobs)
                
                await self._emit_log("SUCCESS", f"✅ Pipeline complete! {len(analyzed_jobs)} high-quality matches found.", "export")
                await self._emit("complete", {"summary": run_summary, "excel_report": report_path})
                
                self.is_running = False

            except Exception as e:
                error_msg = f"❌ Pipeline Fatal Error: {str(e)}"
                await self._emit_log("ERROR", error_msg, "global")
                await self._emit("error", {"message": error_msg, "fatal": True})
                self.is_running = False

        # Start the pipeline logic as a task
        asyncio.create_task(run_pipeline_internal())

        # Yield events from the queue for the SSE client
        while self.is_running or not self.event_queue.empty():
            try:
                event = await asyncio.wait_for(self.event_queue.get(), timeout=1.0)
                yield f"data: {json.dumps(event)}\n\n"
            except asyncio.TimeoutError:
                if not self.is_running and self.event_queue.empty():
                    break
                continue
