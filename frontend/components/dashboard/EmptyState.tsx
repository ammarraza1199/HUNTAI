/**
 * frontend/components/dashboard/EmptyState.tsx
 * HuntAI - AI Job Hunter Agent
 * Visual placeholder when no jobs are active
 */

import React from "react";
import { Zap, Search, Target, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const EmptyState: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] glass rounded-3xl border border-white/5 p-12 text-center relative overflow-hidden">
            {/* Background Decorative Rings */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/5 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full opacity-20" />
            </div>

            <div className="relative z-10 space-y-8 flex flex-col items-center max-w-lg">
                <div className="relative">
                    <motion.div
                        animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 10, -10, 0]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 relative z-10"
                    >
                        <Zap className="w-12 h-12 text-white fill-current" />
                    </motion.div>
                    
                    {/* Pulsing Aura */}
                    <div className="absolute inset-0 bg-indigo-500 rounded-3xl animate-ping opacity-20" />
                </div>

                <div className="space-y-3">
                    <h2 className="text-3xl font-black text-white tracking-tight">Your Pipeline is Idle</h2>
                    <p className="text-muted-foreground font-medium leading-relaxed">
                        Ready to launch your AI job search? Specify your preferences and hit <span className="text-indigo-400 font-bold">"Launch Hunt"</span> to begin scraping and scoring opportunities in real-time.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-6 w-full pt-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                            <Search className="w-5 h-5 text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Scraping</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                            <Target className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Scoring</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Applying</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmptyState;
