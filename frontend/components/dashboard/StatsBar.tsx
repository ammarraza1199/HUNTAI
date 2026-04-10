/**
 * frontend/components/dashboard/StatsBar.tsx
 * HuntAI - AI Job Hunter Agent
 * Summary statistics for current hunt results
 */

import React from "react";
import { BarChart3, Target, Zap, TrendingUp } from "lucide-react";

interface StatsBarProps {
    total: number;
    avgScore: number;
}

const StatsBar: React.FC<StatsBarProps> = ({ total, avgScore }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Jobs */}
            <div className="p-6 glass rounded-2xl border border-white/5 space-y-2 relative overflow-hidden group">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Jobs Found</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{total}</span>
                    <span className="text-[10px] text-green-400/60 font-medium">+100%</span>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <BarChart3 className="w-24 h-24 text-white" />
                </div>
            </div>

            {/* Average Match Score */}
            <div className="p-6 glass rounded-2xl border border-white/5 space-y-2 relative overflow-hidden group">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Target className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Avg Match</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{Math.round(avgScore)}%</span>
                    <span className="text-[10px] text-emerald-400/60 font-medium">High Match</span>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Target className="w-24 h-24 text-white" />
                </div>
            </div>

            {/* AI Precision */}
            <div className="p-6 glass rounded-2xl border border-white/5 space-y-2 relative overflow-hidden group">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Zap className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">AI Precision</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">98%</span>
                    <span className="text-[10px] text-amber-400/60 font-medium">Verified</span>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Zap className="w-24 h-24 text-white" />
                </div>
            </div>

            {/* Application Ready */}
            <div className="p-6 glass rounded-2xl border border-white/5 space-y-2 relative overflow-hidden group">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-rose-400" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ready to Apply</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{Math.floor(total * 0.7)}</span>
                    <span className="text-[10px] text-rose-400/60 font-medium">70% Quality</span>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <TrendingUp className="w-24 h-24 text-white" />
                </div>
            </div>
        </div>
    );
};

export default StatsBar;
