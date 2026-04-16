/**
 * frontend/app/guide/page.tsx
 * HuntAI - AI Job Hunter Agent
 * Interactive User Handbook
 */

"use client";

import React from "react";
import { 
    Zap, Rocket, Target, Shield, 
    FileText, Key, Cpu, Download, 
    ChevronRight, Info, AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";

export default function GuidePage() {
    const steps = [
        {
            title: "Connect Your AI Brain",
            desc: "Add your Groq API Key in the Settings. We recommend Llama-3-70b for the best cover letters, while our system uses Llama-3-8b for lightning-fast job scoring.",
            icon: <Key className="w-6 h-6 text-amber-400" />,
            color: "border-amber-500/10 bg-amber-500/5"
        },
        {
            title: "Upload & Parse",
            desc: "Upload your PDF resume. Our AI extracts your skills, experience years, and core technologies. This data is the foundation of every Match Score.",
            icon: <FileText className="w-6 h-6 text-indigo-400" />,
            color: "border-indigo-500/10 bg-indigo-500/5"
        },
        {
            title: "Launch a Global Hunt",
            desc: "Enter a job title and location. Our scrapers will simultaneously search LinkedIn, Naukri, and Indeed, bypassing bot detection automatically.",
            icon: <Rocket className="w-6 h-6 text-cyan-400" />,
            color: "border-cyan-500/10 bg-cyan-500/5"
        },
        {
            title: "Analyze & Apply",
            desc: "Review match scores. Clicking 'Apply' will launch the official job page. For top matches, the system will even generate a tailored cover letter.",
            icon: <Target className="w-6 h-6 text-green-400" />,
            color: "border-green-500/10 bg-green-500/5"
        }
    ];

    return (
        <div className="flex flex-col gap-12 max-w-4xl">
            
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-white/5 pb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-600/10 rounded-lg">
                        <Zap className="w-6 h-6 text-indigo-500" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Documentation</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight">Master the Hunt</h1>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
                    Welcome to HuntAI. You are now equipped with an autonomous agent designed to bypass the traditional job application grind.
                </p>
            </div>

            {/* Quick Start Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {steps.map((step, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`p-8 rounded-[2.5rem] border ${step.color} space-y-4 hover:border-white/10 transition-all`}
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                            {step.icon}
                        </div>
                        <h3 className="text-xl font-bold">{step.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {step.desc}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Pro Tips Section */}
            <div className="mt-6 p-10 glass rounded-[3rem] border border-white/5 flex flex-col gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                
                <h4 className="text-2xl font-bold flex items-center gap-3">
                    <Shield className="w-6 h-6 text-indigo-400" /> 
                    Pro Tips for Expert Hunters
                </h4>

                <div className="grid grid-cols-1 gap-6 relative z-10">
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-300">01</div>
                        <div className="space-y-1">
                            <h5 className="font-bold text-sm">Use "Stealth Mode" (SB) for Heavy Scans</h5>
                            <p className="text-xs text-muted-foreground leading-relaxed">If you find yourself getting blocked by Naukri or LinkedIn, switch the engine to "SB" in Settings. It uses advanced automation bypassing.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-300">02</div>
                        <div className="space-y-1">
                            <h5 className="font-bold text-sm">Download the Excel Digest</h5>
                            <p className="text-xs text-muted-foreground leading-relaxed">Every hunt generates an Excel report in your "History" tab. It includes all AI analysis, match scores, and direct apply links for offline review.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-300">03</div>
                        <div className="space-y-1">
                            <h5 className="font-bold text-sm">Token Efficiency</h5>
                            <p className="text-xs text-muted-foreground leading-relaxed">Our AI uses a 1,000-character window. This captures the role's essential skills while ensuring you never hit Groq's daily rate limits.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Troubleshooting */}
            <div className="p-8 border-l-2 border-amber-500/20 bg-amber-500/5 rounded-r-[2rem] flex gap-4 items-start">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                    <h5 className="font-bold text-amber-200">Common Issue: Match Score 0%</h5>
                    <p className="text-sm text-amber-500/80 leading-relaxed">This usually happens if the Groq API Key is invalid or rate-limited. Ensure your key starts with <code className="font-mono text-xs bg-amber-500/10 px-1 rounded">gsk_</code> and has remaining tokens in your console.groq.com dashboard.</p>
                </div>
            </div>

        </div>
    );
}
