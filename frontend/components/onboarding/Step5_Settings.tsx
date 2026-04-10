/**
 * frontend/components/onboarding/Step5_Settings.tsx
 * HuntAI - AI Job Hunter Agent
 * Phase 6 Step 5: Fine-tune your hunt
 */

"use client";

import React from "react";
import { Coffee, ShieldCheck, Zap, Ghost, Monitor } from "lucide-react";

interface Step5Props {
    data: any;
    setData: React.Dispatch<React.SetStateAction<any>>;
}

const Step5_Settings: React.FC<Step5Props> = ({ data, setData }) => {
    
    const engines = [
        { id: "playwright", label: "Standard (Playwright)", icon: <Monitor className="w-4 h-4" /> },
        { id: "sb", label: "Stealth (SeleniumBase)", icon: <ShieldCheck className="w-4 h-4" /> },
        { id: "nd", label: "Ghost (Nodriver)", icon: <Ghost className="w-4 h-4" /> }
    ];

    const formatSeconds = (s: number) => {
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return min > 0 ? `${min}m ${sec > 0 ? sec + 's' : ''}` : `${sec}s`;
    };

    return (
        <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-2 scrollbar-hide">
            
            <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold">Fine-tune your hunt</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Optimize HuntAI behavior to maximize results while avoiding rate limits on job platforms.
                </p>
            </div>

            {/* Scraper Engine Selection */}
            <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Detection Evasion Level
                </label>
                <div className="grid grid-cols-1 gap-2">
                    {engines.map(e => (
                        <button
                            key={e.id}
                            onClick={() => setData({ ...data, engine: e.id })}
                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left group ${
                                data.engine === e.id ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10" : "border-white/10 hover:bg-white/5 active:scale-[0.98]"
                            }`}
                        >
                            <div className={`p-2 rounded-lg transition-all ${
                                data.engine === e.id ? "bg-indigo-500 text-white" : "bg-white/5 text-muted-foreground"
                            }`}>
                                {e.icon}
                            </div>
                            <span className={`text-sm font-bold ${data.engine === e.id ? "text-white" : "text-muted-foreground"}`}>
                                {e.label}
                            </span>
                            {data.engine === e.id && <div className="ml-auto w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Max Results Per Platform */}
            <div className="flex flex-col gap-3 mt-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Max Results per Platform
                    </label>
                    <span className="text-sm font-mono font-bold text-indigo-400">{data.max_per_platform} jobs</span>
                </div>
                <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={data.max_per_platform}
                    onChange={(e) => setData({ ...data, max_per_platform: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
                <p className="text-[10px] text-muted-foreground tracking-wide italic">
                    Up to 30 jobs total maximum per run to maintain performance.
                </p>
            </div>

            {/* Human Delay Slider */}
            <div className="flex flex-col gap-3 mt-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <Coffee className="w-4 h-4" /> Human Delay
                    </label>
                    <span className="text-sm font-mono font-bold text-amber-400">{formatSeconds(data.delay)} pause</span>
                </div>
                <input
                    type="range"
                    min="30"
                    max="300"
                    step="30"
                    value={data.delay}
                    onChange={(e) => setData({ ...data, delay: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-amber-500"
                />
                <p className="text-[10px] text-muted-foreground tracking-wide italic">
                    Mimics human browsing behavior to avoid bot-detection during job searches.
                </p>
            </div>

        </div>
    );
};

export default Step5_Settings;
