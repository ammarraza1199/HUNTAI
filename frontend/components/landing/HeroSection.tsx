/**
 * frontend/components/landing/HeroSection.tsx
 * HuntAI - AI Job Hunter Agent
 * Hero Section with Animated Terminal Mockup
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Search, ChevronRight } from "lucide-react";

const TerminalMockup: React.FC = () => {
    const [lines, setLines] = useState<string[]>([]);
    
    const terminalLines = [
        "> Parsing resume: resume_2025.pdf",
        "> Extraction successful. (1.2s)",
        "> Searching LinkedIn for 'AI Engineer' in 'Remote'...",
        "> Searching Naukri for 'AI Engineer' in 'Remote'...",
        "> Found 23 potential jobs. Deduplicating...",
        "> Scoring matches with Llama 3-70b AI...",
        "> Job #1: DeepMind — Match Score: 94/100",
        "> Missing skills identified: Kubernetes, Ray",
        "> Generating custom cover letter... Done.",
        "> [██████████████████░] 92% complete",
        "> Success! results_generated.xlsx ready."
    ];

    useEffect(() => {
        let currentLine = 0;
        const interval = setInterval(() => {
            if (currentLine < terminalLines.length) {
                setLines(prev => [...prev, terminalLines[currentLine]]);
                currentLine++;
            } else {
                setLines([]); // Reset for infinite loop
                currentLine = 0;
            }
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full max-w-2xl mx-auto glass rounded-xl overflow-hidden shadow-2xl border border-white/20">
            {/* Terminal Header */}
            <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest font-semibold">
                    HuntAI Execution Core
                </span>
                <div className="w-10" />
            </div>
            
            {/* Terminal Body */}
            <div className="p-6 h-[260px] font-mono text-sm overflow-hidden flex flex-col justify-end">
                <AnimatePresence mode="popLayout">
                    {lines.map((line, i) => (
                        <motion.div
                            key={`${i}-${line}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`${(line || '').includes('Success') ? 'text-green-400 font-bold' : 
                                         (line || '').includes('Error') ? 'text-red-400' : 
                                         (line || '').includes('Job #1') ? 'text-indigo-400' : 'text-zinc-300'}`}
                        >
                            {line}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

const HeroSection: React.FC = () => {
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center">
            
            {/* Top Badge */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="px-4 py-1.5 mb-8 rounded-full border border-indigo-500/20 bg-indigo-500/5 flex items-center gap-2 group cursor-pointer hover:bg-indigo-500/10 transition-colors"
            >
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-sm font-medium text-indigo-200">
                    Live: Groq Llama 3-70b Integration Active
                </span>
                <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
            </motion.div>

            {/* Main Headlines */}
            <div className="container px-4 mx-auto text-center relative z-10 max-w-4xl">
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]"
                >
                    Apply smarter. <span className="text-gradient">Land faster.</span>
                </motion.h1>
                
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto"
                >
                    HuntAI Pro scrapes LinkedIn, Naukri, and Indeed — then uses AI to score every job against your resume in real-time.
                </motion.p>

                {/* Main CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                >
                    <Link
                        href="/dashboard"
                        className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-lg font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                    >
                        Start free pipeline →
                    </Link>
                    <Link
                        href="/dashboard"
                        className="w-full sm:w-auto px-8 py-4 glass hover:bg-white/10 text-lg font-bold rounded-xl transition-all active:scale-95"
                    >
                        Launch Your First Run
                    </Link>
                </motion.div>

                {/* Trust Badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5, delay: 0.6 }}
                    className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-70 mb-24"
                >
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-400" />
                        <span className="text-sm font-medium">Your API key is never stored</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">Powered by Groq LLM</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-cyan-400" />
                        <span className="text-sm font-medium">100% Open Source Agent</span>
                    </div>
                </motion.div>

                {/* Visual Reveal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="relative px-4"
                >
                    <TerminalMockup />
                    {/* Glow beneath terminal */}
                    <div className="absolute -inset-10 bg-indigo-500/20 blur-[100px] -z-10 rounded-full" />
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;
