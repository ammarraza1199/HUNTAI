/**
 * frontend/components/onboarding/Step4_Platforms.tsx
 * HuntAI - AI Job Hunter Agent
 * Phase 6 Step 4: Choose your platforms
 */

"use client";

import React from "react";
import { CheckCircle2, Globe, Linkedin, Box, Search } from "lucide-react";

interface Step4Props {
    data: any;
    setData: React.Dispatch<React.SetStateAction<any>>;
}

const Step4_Platforms: React.FC<Step4Props> = ({ data, setData }) => {
    
    const platforms = [
        { id: "linkedin", name: "LinkedIn", stat: "~250k jobs/day", desc: "Largest professional network", icon: <Linkedin className="w-5 h-5 text-blue-500 fill-current" /> },
        { id: "naukri", name: "Naukri", stat: "~120k jobs/day", desc: "India's #1 job platform", icon: <Box className="w-5 h-5 text-red-500 fill-current" /> },
        { id: "indeed", name: "Indeed", stat: "Global aggregate", desc: "World wide job search engine", icon: <Search className="w-5 h-5 text-blue-400" /> }
    ];

    const togglePlatform = (id: string) => {
        const current = [...data.platforms];
        if (current.includes(id)) {
            if (current.length === 1) return; // Must have at least 1
            setData({ ...data, platforms: current.filter(p => p !== id) });
        } else {
            setData({ ...data, platforms: [...current, id] });
        }
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            
            <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold">Choose your platforms</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Which job boards should HuntAI monitor for you? Select at least one platform to begin.
                </p>
            </div>

            {/* Platform Grid */}
            <div className="flex flex-col gap-4">
                {platforms.map(p => {
                    const isSelected = data.platforms.includes(p.id);
                    return (
                        <button
                            key={p.id}
                            onClick={() => togglePlatform(p.id)}
                            className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all text-left group ${
                                isSelected ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10" : "border-white/10 hover:bg-white/5 active:scale-[0.98]"
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                    isSelected ? "bg-indigo-500 text-white" : "bg-white/5 text-muted-foreground"
                                }`}>
                                    {p.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-bold ${isSelected ? "text-white" : "text-zinc-400"}`}>{p.name}</span>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{p.stat}</span>
                                </div>
                            </div>
                            
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected ? "border-indigo-500 bg-indigo-500 text-white" : "border-white/10"
                            }`}>
                                {isSelected && <CheckCircle2 className="w-4 h-4 fill-current" />}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Platform Note */}
            <div className="mt-auto flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                <Globe className="w-5 h-5 text-indigo-400 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                    HuntAI uses unique browser agents for each platform to ensure maximum stealth and anti-detection.
                </p>
            </div>

        </div>
    );
};

export default Step4_Platforms;
