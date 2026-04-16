/**
 * frontend/components/dashboard/JobCard.tsx
 * HuntAI - AI Job Hunter Agent
 * Phase 7 Zone D: Job Match Result Card
 */

"use client";

import React, { useState } from "react";
import { 
    ExternalLink, MapPin, Clock, 
    ChevronDown, ChevronUp, Copy,
    CheckCircle2, AlertTriangle, FileText, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Job } from "../../types";

interface JobCardProps {
    job: Job;
    index: number;
}

const JobCard: React.FC<JobCardProps> = ({ job, index }) => {
    const [expanded, setExpanded] = useState<"suggestion" | "cover_letter" | null>(null);

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500 fill-green-500 stroke-green-500";
        if (score >= 60) return "text-amber-500 fill-amber-500 stroke-amber-500";
        return "text-red-500 fill-red-500 stroke-red-500";
    };

    const getScoreBorder = (score: number) => {
        if (score >= 80) return "border-green-500/20 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]";
        if (score >= 60) return "border-amber-500/20 bg-amber-500/5";
        return "border-red-500/20 bg-red-500/5";
    };

    const platformColor: any = {
        'linkedin': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
        'naukri': 'text-red-400 bg-red-400/10 border-red-400/20',
        'indeed': 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className={`flex flex-col p-6 glass rounded-3xl border transition-all ${getScoreBorder(job.match_score)}`}
        >
            {/* Top Row: Meta & Score */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-4 min-w-0">
                    <img 
                        src={job.platform === 'linkedin' ? 'https://cdn-icons-png.flaticon.com/512/174/174857.png' : 
                             job.platform === 'naukri' ? 'https://img.naukimg.com/s/0/0/i/naukri-identity/naukri_Logo.png' : 
                             'https://www.indeed.com/favicon.ico'}
                        className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 object-contain p-2"
                        alt={`${job.platform} icon`}
                    />
                    <div className="flex flex-col min-w-0">
                        <span 
                            onClick={() => window.open(job.job_url, '_blank')}
                            className="text-sm font-bold text-muted-foreground tracking-tight underline hover:text-white transition-all cursor-pointer"
                        >
                            {job.company}
                        </span>
                        <h3 className="text-xl font-bold leading-tight truncate text-white">
                            {job.title}
                        </h3>
                    </div>
                </div>

                {/* Match Score Ring (SVG) */}
                <div className="relative flex-shrink-0 group cursor-default">
                    <svg className="w-14 h-14 -rotate-90">
                        <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                        <motion.circle 
                            cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" 
                            strokeDasharray={151}
                            initial={{ strokeDashoffset: 151 }}
                            animate={{ strokeDashoffset: 151 - (151 * job.match_score) / 100 }}
                            transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                            className={`${getScoreColor(job.match_score)}`}
                        />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-black text-white">
                        {job.match_score}%
                    </span>
                </div>
            </div>

            {/* Mid Row: Info Chips */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <MapPin className="w-3 h-3" /> {job.location}
                </div>
                <div className={`px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-widest ${platformColor[job.platform]}`}>
                    {job.platform}
                </div>
                {job.work_style && (
                    <div className={`px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-widest ${
                        job.work_style === 'Remote' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                        job.work_style === 'Hybrid' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        'bg-white/5 border-white/10 text-muted-foreground'
                    }`}>
                        {job.work_style}
                    </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <Clock className="w-3 h-3" /> {job.posted_hours > 0 ? `${Math.round(job.posted_hours)}h ago` : 'Recently'}
                </div>
            </div>

            {/* Missing Skills Row */}
            <div className="flex flex-col gap-2 mb-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" /> Missing Skills
                </span>
                <div className="flex flex-wrap gap-2">
                    {job.match_score > 0 ? (
                        job.missing_skills.length > 0 ? (
                            job.missing_skills.map(s => (
                                <span key={s} className="px-3 py-1 bg-red-400/5 text-red-300 border border-red-400/10 rounded-lg text-xs font-medium">
                                    {s}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-green-400 font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" /> Fully Matched!
                            </span>
                        )
                    ) : (
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest animate-pulse">
                            Awaiting AI Analysis...
                        </span>
                    )}
                </div>
            </div>

            {/* Collapsible Suggestion & Cover Letter */}
            <div className="flex flex-col gap-2 mt-auto">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setExpanded(expanded === "suggestion" ? null : "suggestion")}
                        className={`flex-1 p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                            expanded === "suggestion" ? "bg-indigo-600 border-indigo-600 text-white" : "glass border-white/10 text-muted-foreground hover:bg-white/5"
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5" /> AI Suggestion
                        </span>
                        {expanded === "suggestion" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button 
                        onClick={() => setExpanded(expanded === "cover_letter" ? null : "cover_letter")}
                        className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                            expanded === "cover_letter" ? "bg-indigo-600 border-indigo-600 text-white" : "glass border-white/10 text-muted-foreground hover:bg-white/5"
                        }`}
                    >
                        <FileText className="w-3.5 h-3.5" />
                    </button>
                </div>

                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-black/20 rounded-2xl border border-white/5 p-4 overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                    {expanded === "suggestion" ? "AI Strategic Advice" : "Generated Cover Letter"}
                                </span>
                                <button onClick={() => {}} className="p-1 hover:bg-white/10 rounded-md text-muted-foreground transition-colors group">
                                    <Copy className="w-3.5 h-3.5 group-active:text-indigo-400" />
                                </button>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                                {expanded === "suggestion" ? job.suggestion : job.cover_letter}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 mt-6 pt-6 border-t border-white/5">
                <button 
                    onClick={() => window.open(job.job_url, '_blank')}
                    className="flex-1 py-3 bg-white text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xl hover:scale-[0.98] transition-all"
                >
                    Apply Now <ExternalLink className="w-4 h-4" />
                </button>
                <button className="p-3 border border-white/10 rounded-xl hover:bg-white/5 text-muted-foreground group">
                    <CheckCircle2 className="w-5 h-5 group-hover:text-indigo-400 transition-colors" />
                </button>
            </div>

        </motion.div>
    );
};

export default JobCard;
