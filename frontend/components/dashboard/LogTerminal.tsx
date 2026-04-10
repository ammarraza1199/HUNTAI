/**
 * frontend/components/dashboard/LogTerminal.tsx
 * HuntAI - AI Job Hunter Agent
 * High-fidelity real-time log terminal with auto-scroll
 */

"use client";

import React, { useEffect, useRef } from "react";
import { Terminal, Copy, Trash2, Maximize2 } from "lucide-react";
import { LogEntry } from "../../types";

interface LogTerminalProps {
    logs: LogEntry[];
    status: string;
}

const LogTerminal: React.FC<LogTerminalProps> = ({ logs, status }) => {
    const terminalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    const copyLogs = () => {
        const text = logs.map(l => `[${l.timestamp}] ${l.level}: ${l.message}`).join("\n");
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="flex flex-col h-[400px] bg-[#0D1117] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
            
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5 relative z-10">
                <div className="flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-zinc-400">
                        Agent Logs <span className="text-zinc-600 line-through">0x2a</span>
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'running' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'} shadow-[0_0_8px_rgba(34,197,94,0.5)]`} />
                </div>
                
                <div className="flex items-center gap-4">
                    <button onClick={copyLogs} className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground transition-colors" title="Copy Logs">
                        <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground transition-colors" title="Maximize">
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Terminal Logs Area */}
            <div 
                ref={terminalRef}
                className="flex-1 p-6 font-mono text-[11px] overflow-y-auto scrollbar-hide space-y-1.5"
            >
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-20 text-center gap-4">
                        <Terminal className="w-10 h-10" />
                        <span className="max-w-[120px] leading-tight">Waiting for pipeline execution...</span>
                    </div>
                ) : (
                    logs.map((log, i) => {
                        const levelColors: any = {
                            'INFO': 'text-zinc-400',
                            'SUCCESS': 'text-green-400 font-bold',
                            'WARNING': 'text-amber-400 font-semibold',
                            'ERROR': 'text-red-400 font-bold underline'
                        };

                        return (
                            <div key={i} className="flex gap-4 group">
                                <span className="opacity-20 select-none group-hover:opacity-60 transition-opacity">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                                </span>
                                <span className={`flex-1 break-all ${levelColors[log.level || 'INFO']}`}>
                                    <span className="opacity-40 mr-2">{'>'}</span> 
                                    {log.message}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom Glow Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        </div>
    );
};

export default LogTerminal;
