/**
 * frontend/app/history/page.tsx
 * HuntAI - AI Job Hunter Agent
 * Phase 12: Past Runs History Table
 */

"use client";

import React, { useState, useEffect } from "react";
import { 
    Clock, Search, Download, Trash2, 
    ExternalLink, ChevronDown, ChevronUp, CheckCircle2, 
    AlertCircle, Loader2, Calendar, LayoutGrid, List as ListIcon 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";
import { JobRun, Job } from "../../types";
import { toast } from "sonner";

import JobCard from "@/components/dashboard/JobCard";

export default function HistoryPage() {
    const [runs, setRuns] = useState<JobRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
    const [runJobs, setRunJobs] = useState<Job[]>([]);
    const [jobsLoading, setJobsLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await api.get<JobRun[]>('/api/runs');
            setRuns(data || []);
        } catch (err: any) {
            toast.error("Failed to load history.");
        } finally {
            setLoading(false);
        }
    };

    const toggleRun = async (runId: string) => {
        if (expandedRunId === runId) {
            setExpandedRunId(null);
            return;
        }

        setExpandedRunId(runId);
        setJobsLoading(true);
        try {
            const data = await api.get<Job[]>(`/api/runs/${runId}/jobs`);
            setRunJobs(data || []);
        } catch (err: any) {
            toast.error("Failed to load jobs for this run.");
        } finally {
            setJobsLoading(false);
        }
    };

    const deleteRun = async (runId: string) => {
        if (!confirm("Are you sure? This will delete all jobs and logs for this run.")) return;
        
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/runs/${runId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('huntai_access_token')}`
                }
            });
            setRuns(runs.filter(r => r.id !== runId));
            toast.success("Run deleted.");
        } catch (err: any) {
            toast.error("Delete failed.");
        }
    };

    const downloadExcel = async (runId: string) => {
        toast.info("Preparing your Excel report...");
        try {
            const token = localStorage.getItem('huntai_access_token');
            const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/runs/${runId}/export/excel?token=${token}`;
            
            // Professional download trigger
            const link = document.createElement('a');
            link.href = url;
            link.download = `HuntAI_Report_${runId}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success("Download started!");
        } catch (err) {
            toast.error("Failed to download report.");
        }
    };

    return (
        <div className="flex flex-col gap-8">
            
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">AI Hunt History</h1>
                    <p className="text-sm text-muted-foreground">View results and download Excel reports from your previous job searches.</p>
                </div>
                <button 
                    onClick={fetchHistory}
                    className="p-3 glass hover:bg-white/5 rounded-xl text-muted-foreground transition-all"
                >
                    <Clock className="w-5 h-5" />
                </button>
            </div>

            {/* History List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 opacity-20">
                    <Loader2 className="w-10 h-10 animate-spin" />
                </div>
            ) : runs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 glass rounded-[2.5rem] border border-dashed border-white/5 opacity-40 text-center gap-4">
                    <Calendar className="w-10 h-10" />
                    <p className="font-bold">No runs found yet.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {runs.map((run, index) => (
                        <div key={run.id} className="flex flex-col">
                            {/* Run Row */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex items-center justify-between p-6 glass rounded-2xl border cursor-pointer group transition-all ${
                                    expandedRunId === run.id ? "bg-indigo-600/10 border-indigo-500/30" : "border-white/5 hover:bg-white/5"
                                }`}
                                onClick={() => toggleRun(run.id)}
                            >
                                <div className="flex items-center gap-6">
                                    {/* Date & Icon */}
                                    <div className="hidden sm:flex flex-col items-center gap-1 min-w-[80px]">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                            {new Date(run.started_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                        <span className="text-xs font-mono font-bold text-white">
                                            {new Date(run.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    
                                    {/* Info */}
                                    <div className="flex flex-col">
                                        <h4 className="text-lg font-bold group-hover:text-indigo-400 transition-colors">
                                            {run.query}
                                        </h4>
                                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                            {run.location} · {run.platforms.length} platforms · {run.status === 'complete' ? 'Success' : 'Active'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    {/* Stats */}
                                    <div className="hidden md:flex items-center gap-8 text-center">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Matches</span>
                                            <span className="text-sm font-mono font-bold">{run.total_jobs_found}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Avg Score</span>
                                            <span className="text-sm font-mono font-bold text-green-400">{run.avg_match_score || 0}%</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); downloadExcel(run.id); }} 
                                            className="p-3 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-xl transition-all"
                                            title="Download Excel"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteRun(run.id); }} 
                                            className="p-3 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <div className={`p-2 transition-transform duration-300 ${expandedRunId === run.id ? "rotate-180 text-indigo-400" : "text-muted-foreground"}`}>
                                            <ChevronDown className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Expanded Jobs Area */}
                            <AnimatePresence>
                                {expandedRunId === run.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-8 pt-4 pb-12 flex flex-col gap-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h5 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">
                                                    Results Overview ({runJobs.length})
                                                </h5>
                                                <div className="flex items-center gap-2">
                                                    <LayoutGrid className="w-4 h-4 text-indigo-400" />
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Grid View</span>
                                                </div>
                                            </div>

                                            {jobsLoading ? (
                                                <div className="flex items-center justify-center p-20">
                                                    <Loader2 className="w-8 h-8 animate-spin text-white/20" />
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {runJobs.map((job, jIdx) => (
                                                        <JobCard key={job.id} job={job} index={jIdx} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}
