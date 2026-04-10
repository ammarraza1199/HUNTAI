/**
 * frontend/components/shared/FooterSection.tsx
 * HuntAI - AI Job Hunter Agent
 * Simple, minimalist footer
 */

"use client";

import React from "react";
import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";

const FooterSection: React.FC = () => {
    return (
        <footer className="container mx-auto px-4 py-16 md:py-24 border-t border-white/5 relative bg-background/5 backdrop-blur-3xl overflow-hidden mt-32">
            
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-6xl mx-auto mb-16">
                
                {/* Brand Section */}
                <div className="flex flex-col gap-6 col-span-1 md:col-span-2">
                    <Link href="/" className="flex items-center gap-2 group cursor-pointer w-fit">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center transform rotate-3 group-hover:rotate-0 transition-transform">
                            <span className="text-white text-xs font-bold">H</span>
                        </div>
                        <span className="text-xl font-bold font-mono tracking-tighter">
                            Hunt<span className="text-indigo-400">AI</span>
                        </span>
                    </Link>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                        The fully automated, end-to-end AI job board scraper and evaluation pipeline. 
                        Hunt smarter, land your next role with zero manual search effort.
                    </p>
                    <div className="flex items-center gap-4 text-muted-foreground">
                        <Link href="https://github.com/your-username/HuntAI" className="hover:text-white transition-colors"><Github className="w-5 h-5" /></Link>
                        <Link href="https://twitter.com" className="hover:text-indigo-400 transition-colors"><Twitter className="w-5 h-5" /></Link>
                        <Link href="https://linkedin.com" className="hover:text-blue-400 transition-colors"><Linkedin className="w-5 h-5" /></Link>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="flex flex-col gap-6">
                    <h5 className="font-bold text-white uppercase text-xs tracking-widest">Platform</h5>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground font-medium">
                        <Link href="#features" className="hover:text-white">Features</Link>
                        <Link href="#how-it-works" className="hover:text-white">Execution Core</Link>
                        <Link href="#limits" className="hover:text-white">Usage Limits</Link>
                    </div>
                </div>

                {/* Legal / Resources */}
                <div className="flex flex-col gap-6">
                    <h5 className="font-bold text-white uppercase text-xs tracking-widest">Resources</h5>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground font-medium">
                        <Link href="https://github.com/your-username/HuntAI/docs" className="hover:text-white">Documentation</Link>
                        <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
                        <span className="text-xs text-indigo-400 mt-2">Built with Groq & Llama 3</span>
                    </div>
                </div>
            </div>

            {/* Bottom Credit */}
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-12">
                <p className="text-xs text-muted-foreground font-medium">
                    © 2025 HuntAI Agent (MIT License). Open source and free for the community.
                </p>
                <div className="flex items-center gap-6 text-xs text-muted-foreground font-semibold">
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Operational on Vercel</span>
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Powered by Render</span>
                </div>
            </div>
        </footer>
    );
};

export default FooterSection;
