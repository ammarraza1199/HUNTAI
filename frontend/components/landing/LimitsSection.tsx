/**
 * frontend/components/landing/LimitsSection.tsx
 * HuntAI - AI Job Hunter Agent
 * Transparent Limits Display for User Trust
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Info, CheckCircle2 } from "lucide-react";

const LimitsSection: React.FC = () => {
    const limits = [
        { label: "Job runs per day", value: "3 per user" },
        { label: "Jobs per run", value: "30 Total" },
        { label: "Resume file size", value: "5MB max" },
        { label: "Groq API key", value: "BYO (User Key)" },
        { label: "Platforms", value: "3 Boards" },
        { label: "Data stored", value: "30 Day History" },
        { label: "Export format", value: ".xlsx + .csv" }
    ];

    return (
        <section id="limits" className="container mx-auto px-4 py-32 md:py-48 max-w-5xl">
            
            {/* Heading */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/5 text-yellow-400 w-fit mx-auto mb-8">
                <Info className="w-4 h-4" />
                <span className="text-sm font-medium">Free forever. Here's how.</span>
            </div>

            <div className="text-center mb-16 px-4">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Transparent <span className="text-gradient">Usage Limits</span></h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                    We keep HuntAI free by leveraging your own API keys. No subscriptions, just intelligent automation.
                </p>
            </div>

            {/* Limits Board */}
            <div className="glass rounded-[2rem] p-4 p-8 md:p-12 border border-white/10 relative">
                
                {/* Background Shadow Glow */}
                <div className="absolute inset-0 bg-yellow-500/5 blur-[100px] -z-10 rounded-full" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {limits.map((l, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="flex items-center justify-between py-4 border-b border-white/5 last:border-0"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                <span className="font-medium text-zinc-300">{l.label}</span>
                            </div>
                            <span className="text-lg font-mono font-bold text-white">
                                {l.value}
                            </span>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-2">Why limit job runs?</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            To ensure high platform availability and avoid mass-scraping detection, we limit daily runs per account. 
                            Your personal Groq key handles all LLM costs — we don't have to touch your data or your wallet.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LimitsSection;
