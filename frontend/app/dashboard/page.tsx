/**
 * frontend/app/dashboard/page.tsx
 * HuntAI - AI Job Hunter Agent
 * Main Command Center Dashboard
 */

"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Zap, Play, Square, Coffee, Settings, ChevronRight, BarChart3, Clock, Globe } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";
import { Job, LogEntry, PipelineStatus } from "../../types";

import PipelineBar from "@/components/dashboard/PipelineBar";
import LogTerminal from "@/components/dashboard/LogTerminal";
import JobGrid from "@/components/dashboard/JobGrid";
import StatsBar from "@/components/dashboard/StatsBar";
import EmptyState from "@/components/dashboard/EmptyState";
import LaunchModal from "@/components/dashboard/LaunchModal";

export default function DashboardPage() {
    const [status, setStatus] = useState<PipelineStatus>("idle");
    const [jobs, setJobs] = useState<Job[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [progress, setProgress] = useState({ phase: 0, percent: 0 });
    const [currentRunId, setCurrentRunId] = useState<string | null>(null);

    // New Launch State
    const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
    const [huntPrefs, setHuntPrefs] = useState({
        query: "AI Engineer",
        experience_level: "mid",
        platforms: ["linkedin", "naukri", "indeed"],
        max_per_platform: 20,
        resume_data: null as any
    });

    // Auto-Discovery & Reconnection Effect
    useEffect(() => {
        const discoverActiveRun = async () => {
            try {
                const data = await api.get<any>("/api/active-run");
                if (data.run_id && status === "idle") {
                    console.log("Found active session:", data.run_id);
                    toast.info("Resuming your active search...");
                    startPipeline(null, data.run_id);
                }
            } catch (err) {
                console.warn("Active run discovery skipped:", err);
            }
        };
        discoverActiveRun();
    }, []);

    // Live Streaming Core Logic
    const startPipeline = async (config?: any, resumedRunId?: string) => {
        const finalConfig = config || huntPrefs;
        const groqKey = config?.groq_key || localStorage.getItem('huntai_groq_key') || "";
        
        if (!groqKey) {
            toast.error("Groq API Key missing.");
            setIsLaunchModalOpen(true);
            return;
        }

        // Save key for future runs automatically
        if (config?.groq_key) localStorage.setItem('huntai_groq_key', config.groq_key);

        setStatus("running");
        if (!resumedRunId) {
            setJobs([]);
            setLogs([]);
        }
        setProgress({ phase: 1, percent: 10 });

        try {
            let run_id = resumedRunId;

            if (!run_id) {
                let resumeData = finalConfig.resume_data;

                // 1. Auto-Parse Resume if file is provided in config
                if (config?.resume) {
                    setLogs(prev => [...prev, { 
                        type: 'log',
                        level: 'INFO', 
                        message: "📑 New resume detected. Parsing career history...", 
                        phase: 'parsing',
                        timestamp: new Date().toISOString()
                    }]);
                    try {
                        resumeData = await api.uploadResume(config.resume, groqKey);
                        setLogs(prev => [...prev, { 
                            type: 'log',
                            level: 'SUCCESS', 
                            message: `✅ Profile identified: ${resumeData.name}`, 
                            phase: 'parsing',
                            timestamp: new Date().toISOString()
                        }]);
                    } catch (err: any) {
                        toast.error("Resume parsing failed. Hunt aborted.");
                        setLogs(prev => [...prev, { 
                            type: 'log',
                            level: 'ERROR', 
                            message: `❌ Critical Error: ${err.message}`, 
                            phase: 'parsing',
                            timestamp: new Date().toISOString()
                        }]);
                        setStatus("failed");
                        return; // DO NOT JUMP TO NEXT STEP
                    }
                }

                if (!resumeData) {
                    setLogs(prev => [...prev, { 
                        type: 'log',
                        level: 'WARNING', 
                        message: "⚠️ No resume data provided. Matching will be less precise.", 
                        phase: 'parsing',
                        timestamp: new Date().toISOString()
                    }]);
                    resumeData = { skills: [], experience: [] };
                }

                setHuntPrefs({ ...finalConfig, resume_data: resumeData });
                setIsLaunchModalOpen(false);

                // 2. Initialize Run via Backend
                const startReq = {
                    query: finalConfig.query,
                    experience_level: finalConfig.experience_level,
                    platforms: finalConfig.platforms,
                    max_per_platform: finalConfig.max_per_platform,
                    engine: "playwright",
                    resume_data: resumeData
                };
                const res = await api.post<any>("/api/start-pipeline", startReq, true);
                run_id = res.run_id;
            } else {
                setIsLaunchModalOpen(false);
            }

            setCurrentRunId(run_id!);

            // 2. Connect to SSE Stream
            await api.streamPipeline(run_id!, groqKey, finalConfig, (event: any) => {
                // The new pipeline.py emits data nested inside an 'event.data' object
                const payload = event.data;

                if (event.type === 'log') {
                    setLogs(prev => [...prev, { ...payload, timestamp: event.timestamp }]);
                } else if (event.type === 'job') {
                    if (payload && payload.job) {
                        setJobs(prev => [payload.job, ...prev]);
                    }
                } else if (event.type === 'progress') {
                    if (payload) {
                        setProgress({
                            phase: (payload.phase as number),
                            percent: (payload.percent as number) || 0
                        });
                    }
                } else if (event.type === 'complete') {
                    setStatus("complete");
                    setProgress({ phase: 4, percent: 100 });
                    toast.success("All phases finalized. Hunt successful!");
                    // The backend closes the stream, which is fine.
                } else if (event.type === 'error') {
                    // Only show error if we aren't already complete
                    if (status !== 'complete') {
                        setStatus("failed");
                        const errMsg = payload?.message || "Pipeline error occurred.";
                        toast.error(errMsg);
                    }
                }
            });

        } catch (err: any) {
            setStatus("failed");
            toast.error(err.message || "Failed to start pipeline.");
        }
    };

    const stopPipeline = () => {
        setStatus("idle");
        toast.warning("Pipeline execution halted by user.");
    };

    // Phase 12: Advanced Result Ranking (Sorting by Match Score)
    // We sort by score DESC, and then by TITLE ASC to maintain stable order for equal scores
    const sortedJobs = useMemo(() => {
        return [...jobs].sort((a, b) => {
            const scoreA = a.match_score || 0;
            const scoreB = b.match_score || 0;
            if (scoreB !== scoreA) return scoreB - scoreA;
            return a.title.localeCompare(b.title);
        });
    }, [jobs]);

    return (
        <div className="flex flex-col gap-10">

            <LaunchModal
                isOpen={isLaunchModalOpen}
                onClose={() => setIsLaunchModalOpen(false)}
                onLaunch={startPipeline}
                initialData={huntPrefs}
            />

            {/* Phase 7 Zone A: Pipeline Control Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/5">
                <PipelineBar currentPhase={progress.phase} percent={progress.percent} />

                <div className="flex items-center gap-4">
                    {/* Launch Section */}
                    {status === "running" ? (
                        <button
                            onClick={stopPipeline}
                            className="px-6 py-3 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 font-bold rounded-xl transition-all flex items-center gap-2 group shadow-xl shadow-amber-500/5 active:scale-95"
                        >
                            <Square className="w-5 h-5 fill-current" />
                            Stop Pipeline
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsLaunchModalOpen(true)}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center gap-3 group shadow-xl shadow-indigo-500/20 active:scale-95"
                        >
                            <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            {status === "idle" ? "Launch Hunt" : "Run New Hunt →"}
                        </button>
                    )}

                    {/* Quick Config Chip */}
                    <button
                        onClick={() => setIsLaunchModalOpen(true)}
                        className="hidden sm:flex px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold text-muted-foreground transition-all items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        {huntPrefs.query} · {huntPrefs.experience_level}
                    </button>
                </div>
            </div>

            {/* Main Dashboard Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Left Column (Main Results Area) */}
                <div className="lg:col-span-8 flex flex-col gap-10">

                    {/* Phase 7 Zone C: Stats Bar (Only shown if results exist) */}
                    <AnimatePresence>
                        {jobs.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                            >
                                <StatsBar
                                    total={jobs.length}
                                    avgScore={jobs.length > 0 ? (jobs.reduce((acc, job) => acc + (job?.match_score || 0), 0) / jobs.length) : 0}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Phase 7 Zone D: Job Grid Cards */}
                    {jobs.length === 0 && status === "idle" ? (
                        <EmptyState />
                    ) : (
                        <JobGrid jobs={sortedJobs} status={status} />
                    )}
                </div>

                {/* Right Column (Sidebar Logs Area) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Phase 7 Zone B: Live Log Terminal */}
                    <LogTerminal logs={logs} status={status} />

                    {/* Small context info */}
                    <div className="p-6 glass rounded-3xl border border-white/5 opacity-50 space-y-4">
                        <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold">Estimated completion: 4-6 mins</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold text-wrap">Scraping: LinkedIn, Indeed, Naukri active</span>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}
