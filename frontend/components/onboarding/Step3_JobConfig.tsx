/**
 * frontend/components/onboarding/Step3_JobConfig.tsx
 * HuntAI - AI Job Hunter Agent
 * Phase 6 Step 3: What role are you hunting?
 */

"use client";

import React from "react";
import { Search, MapPin, Target, Briefcase } from "lucide-react";

interface Step3Props {
    data: any;
    setData: React.Dispatch<React.SetStateAction<any>>;
}

const Step3_JobConfig: React.FC<Step3Props> = ({ data, setData }) => {
    
    const roles = ["Software Engineer", "Data Scientist", "AI Engineer", "Product Manager", "Backend Developer"];
    const levels = [
        { id: "entry", label: "Entry" },
        { id: "mid", label: "Mid" },
        { id: "senior", label: "Senior" },
        { id: "lead", label: "Lead" }
    ];

    const quickLocations = ["Remote", "Hybrid", "Bengaluru", "Hyderabad", "Pune"];

    return (
        <div className="flex flex-col gap-6 h-full">
            
            <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold">What role are you hunting?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Set your target job titles and locations. HuntAI uses these to filter job boards across the web.
                </p>
            </div>

            {/* Job Title Input */}
            <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Job Title
                </label>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="e.g. Senior AI Engineer"
                        value={data.query}
                        onChange={(e) => setData({ ...data, query: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                    />
                </div>
                {/* Suggestions */}
                {!data.query && (
                    <div className="flex flex-wrap gap-2 mt-1">
                        {roles.map(r => (
                            <button
                                key={r}
                                onClick={() => setData({ ...data, query: r })}
                                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-muted-foreground transition-colors"
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Location Input */}
            <div className="flex flex-col gap-3 mt-2">
                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Target Location
                </label>
                <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="e.g. Remote, Hyderabad"
                        value={data.location}
                        onChange={(e) => setData({ ...data, location: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                    />
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                    {quickLocations.map(l => (
                        <button
                            key={l}
                            onClick={() => {
                                const current = data.location.includes(l) ? data.location : data.location ? `${data.location}, ${l}` : l;
                                setData({ ...data, location: current });
                            }}
                            className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-muted-foreground transition-colors"
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {/* Experience Level */}
            <div className="flex flex-col gap-3 mt-2">
                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Target className="w-4 h-4" /> Experience Level
                </label>
                <div className="grid grid-cols-4 gap-2 bg-white/5 border border-white/10 p-1.5 rounded-2xl">
                    {levels.map(l => (
                        <button
                            key={l.id}
                            onClick={() => setData({ ...data, experience_level: l.id })}
                            className={`py-2 rounded-xl text-xs font-bold transition-all ${
                                data.experience_level === l.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-95" : "text-muted-foreground hover:bg-white/5"
                            }`}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default Step3_JobConfig;
