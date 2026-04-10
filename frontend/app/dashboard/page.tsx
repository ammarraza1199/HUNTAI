/**
 * frontend/app/dashboard/page.tsx
 * HuntAI - AI Job Hunter Agent
 * Main Command Center Dashboard
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
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
        location: "Remote",
        experience_level: "mid",
        platforms: ["linkedin", "naukri", "indeed"]
    });

    // Live Streaming Core Logic
    const startPipeline = async (config?: any) => {
        const finalConfig = config || huntPrefs;
        const groqKey = config?.groq_key || localStorage.getItem('huntai_groq_key');
        
        if (!groqKey) {
            toast.error("Groq API Key missing.");
            setIsLaunchModalOpen(true);
            return;
        }

        // Save key for future runs automatically
        if (config?.groq_key) localStorage.setItem('huntai_groq_key', config.groq_key);

        setHuntPrefs(finalConfig);
        setIsLaunchModalOpen(false);
        setStatus("running");
        setJobs([]);
        setLogs([]);
        setProgress({ phase: 1, percent: 0 });

        try {
            // 1. Initialize Run via Backend
            const startReq = {
                query: finalConfig.query,
                location: finalConfig.location,
                experience_level: finalConfig.experience_level,
                platforms: finalConfig.platforms,
                engine: "playwright",
                resume_data: {} // Mocked or from previous step
            };
            const { run_id } = await api.post<any>("/api/start-pipeline", startReq, true);
            setCurrentRunId(run_id);

            // 2. Connect to SSE Stream
            await api.streamPipeline(run_id, groqKey, (event: LogEntry) => {
                if (event.type === 'log') {
                    setLogs(prev => [...prev, event]);
                } else if (event.type === 'job') {
                    setJobs(prev => [event.job!, ...prev]);
                } else if (event.type === 'progress') {
                    setProgress({ phase: event.phase as number, percent: event.percent || 0 });
                } else if (event.type === 'complete') {
                    setStatus("complete");
                    toast.success("Pipeline completed successfully!");
                } else if (event.type === 'error') {
                    setStatus("failed");
                    toast.error(event.message || "Pipeline error occurred.");
                    if (event.fatal) setStatus("failed");
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
                        {huntPrefs.query} · {huntPrefs.location}
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
                                <StatsBar total={jobs.length} avgScore={jobs.length > 0 ? (jobs.reduce((a, b) => a + b.match_score, 0) / jobs.length) : 0} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Phase 7 Zone D: Job Grid Cards */}
                    {jobs.length === 0 && status === "idle" ? (
                        <EmptyState />
                    ) : (
                        <JobGrid jobs={jobs} status={status} />
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
