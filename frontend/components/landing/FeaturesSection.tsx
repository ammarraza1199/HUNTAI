/**
 * frontend/components/landing/FeaturesSection.tsx
 * HuntAI - AI Job Hunter Agent
 * Features Grid 2x3 (Desktop) / 1-col (Mobile)
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Globe, Cpu, Terminal, Target, FileText, Download } from "lucide-react";

interface FeatureCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, delay }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            className="group glass p-8 rounded-2xl hover:bg-white/5 transition-all cursor-default border border-white/10 hover:border-indigo-500/30"
        >
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <div className="text-indigo-400 group-hover:text-indigo-300 transition-colors">
                    {icon}
                </div>
            </div>
            <h3 className="text-xl font-bold mb-3 tracking-tight">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
};

const FeaturesSection: React.FC = () => {
    const features = [
        {
            title: "Multi-Platform Scraping",
            description: "Automatically search and extract jobs from LinkedIn, Naukri, and Indeed. No manual copy-pasting required.",
            icon: <Globe className="w-6 h-6" />,
            delay: 0.1
        },
        {
            title: "AI Match Scoring",
            description: "Get a match score from 0–100 powered by Llama-3. Understand exactly how well you fit the role.",
            icon: <Cpu className="w-6 h-6" />,
            delay: 0.2
        },
        {
            title: "Live Streaming Logs",
            description: "Watch the pipeline run in real-time. Transparent feedback on every scraping and AI step.",
            icon: <Terminal className="w-6 h-6" />,
            delay: 0.3
        },
        {
            title: "Skill Gap Analysis",
            description: "AI identifies exactly which technical and soft skills are missing from your resume per job description.",
            icon: <Target className="w-6 h-6" />,
            delay: 0.4
        },
        {
            title: "Tailored Cover Letters",
            description: "Generate unique, high-conversion cover letters personalized for every single job you match with.",
            icon: <FileText className="w-6 h-6" />,
            delay: 0.5
        },
        {
            title: "One-Click Excel Export",
            description: "Download all analyzed jobs into a professionally styled Excel sheet with color-coded results.",
            icon: <Download className="w-6 h-6" />,
            delay: 0.6
        }
    ];

    return (
        <section id="features" className="container mx-auto px-4 py-32 md:py-48 relative">
            <div className="absolute inset-0 bg-indigo-500/5 blur-[120px] -z-10 rounded-full" />
            
            <div className="max-w-xl mx-auto text-center mb-20">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Everything you need to <span className="text-gradient">hunt smarter</span></h2>
                <p className="text-lg text-muted-foreground">
                    HuntAI handles the boring manual labor so you can focus on mastering the interview.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {features.map((f, i) => (
                    <FeatureCard key={i} {...f} />
                ))}
            </div>
        </section>
    );
};

export default FeaturesSection;
