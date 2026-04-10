/**
 * frontend/components/dashboard/PipelineBar.tsx
 * HuntAI - AI Job Hunter Agent
 * Visual pipeline stage progress bar
 */

import React from "react";
import { Check, Loader2, FileText, Globe, Cpu, Download } from "lucide-react";
import { motion } from "framer-motion";

interface PipelineBarProps {
    currentPhase: number;
    percent: number;
}

const PipelineBar: React.FC<PipelineBarProps> = ({ currentPhase, percent }) => {
    const phases = [
        { id: 1, name: "Parsing", icon: <FileText className="w-4 h-4" /> },
        { id: 2, name: "Scraping", icon: <Globe className="w-4 h-4" /> },
        { id: 3, name: "AI Match", icon: <Cpu className="w-4 h-4" /> },
        { id: 4, name: "Complete", icon: <Download className="w-4 h-4" /> }
    ];

    return (
        <div className="flex-1 flex max-w-2xl px-4 py-3 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden">
            
            {/* Background Percentage Fill */}
            <motion.div
                layoutId="pipeline-progress"
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                className="absolute inset-y-0 left-0 bg-indigo-600/10 group-hover:bg-indigo-600/20 transition-all duration-700"
            />
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/5 overflow-hidden">
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: percent / 100 }}
                    className="h-full bg-indigo-500 origin-left transition-all duration-700 shadow-[0_0_8px_rgba(99,102,241,1)]"
                />
            </div>

            <div className="relative z-10 w-full flex items-center justify-between">
                {phases.map((p, idx) => {
                    const isActive = p.id === currentPhase;
                    const isCompleted = p.id < currentPhase;
                    
                    return (
                        <div key={p.id} className="flex items-center group relative lg:px-4">
                            <div className="flex flex-col items-center gap-1.5 transition-all">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-xl ${
                                    isActive ? "bg-indigo-600 text-white scale-110 shadow-indigo-600/30" : 
                                    isCompleted ? "bg-green-600 text-white" : 
                                    "bg-white/10 text-muted-foreground"
                                }`}>
                                    {isCompleted ? <Check className="w-4 h-4" /> : 
                                     isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                                     p.icon}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                    isActive ? "text-indigo-400" : 
                                    isCompleted ? "text-green-400 opacity-60" : 
                                    "text-muted-foreground"
                                }`}>
                                    {p.name}
                                </span>
                            </div>
                            
                            {/* Connector (Desktop) */}
                            {idx < phases.length - 1 && (
                                <div className="hidden lg:block w-12 h-[1px] mx-2 transition-all bg-white/10" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PipelineBar;
