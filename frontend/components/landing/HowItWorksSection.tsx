/**
 * frontend/components/landing/HowItWorksSection.tsx
 * HuntAI - AI Job Hunter Agent
 * 4 Step Linear Pipeline Visualization
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileUp, Sliders, Cpu, Download } from "lucide-react";

interface StepProps {
    num: number;
    title: string;
    description: string;
    icon: React.ReactNode;
}

const Step: React.FC<StepProps> = ({ num, title, description, icon }) => {
    return (
        <div className="flex flex-col items-center text-center group">
            <div className="relative mb-8">
                {/* Number Badge */}
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xl z-10 border-4 border-background">
                    {num}
                </div>
                
                {/* Icon Container */}
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shadow-indigo-500/10">
                    {icon}
                </div>
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed px-4">
                {description}
            </p>
        </div>
    );
};

const HowItWorksSection: React.FC = () => {
    const steps = [
        {
            num: 1,
            title: "Upload Resume",
            description: "Provide a PDF/DOCX of your resume. AI extracts skills and experiences.",
            icon: <FileUp className="w-7 h-7" />
        },
        {
            num: 2,
            title: "Set Job Roles",
            description: "Define job roles (e.g. AI Engineer), locations, and platforms to scrape.",
            icon: <Sliders className="w-7 h-7" />
        },
        {
            num: 3,
            title: "AI Scrapes & Scores",
            description: "Agent launches browsers and uses Llama-3 to score every job.",
            icon: <Cpu className="w-7 h-7" />
        },
        {
            num: 4,
            title: "Export Results",
            description: "Download a master Excel report with matching scores and cover letters.",
            icon: <Download className="w-7 h-7" />
        }
    ];

    return (
        <section id="how-it-works" className="container mx-auto px-4 py-32 md:py-48 max-w-6xl">
            <div className="text-center mb-24">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">The 4 Step <span className="text-indigo-500 underline decoration-indigo-500/20 underline-offset-8">Execution Pipeline</span></h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    A linear, highly efficient automation workflow built for developers and engineers.
                </p>
            </div>

            <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                {/* Connecting Lines (Desktop only) */}
                <div className="hidden lg:block absolute top-[30px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-indigo-600/30 to-transparent -z-10" />
                
                {steps.map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                    >
                        <Step {...s} />
                    </motion.div>
                ))}
            </div>

            {/* Bottom CTA to move to register */}
            <div className="mt-24 text-center">
                <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-lg font-bold rounded-xl shadow-lg transition-transform active:scale-95 group">
                    Start your first run 
                    <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </button>
            </div>
        </section>
    );
};

export default HowItWorksSection;
