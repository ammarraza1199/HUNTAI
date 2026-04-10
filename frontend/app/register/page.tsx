/**
 * frontend/app/register/page.tsx
 * HuntAI - AI Job Hunter Agent
 * Register Page with Split Layout
 */

import React from "react";
import AuthForm from "@/components/auth/AuthForm";
import Link from "next/link";
import { Zap, Quote } from "lucide-react";

export default function RegisterPage() {
  const quotes = [
    { text: "Found 3 interviews in my first run.", author: "Arjun S., AI Dev" },
    { text: "Saved me 20 hours of manual searching.", author: "Sarah L., Backend Eng" },
    { text: "The match score is scary accurate.", author: "Michael K., ML Scientist" }
  ];

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      
      {/* ─── Global Background Elements ────────────────────────────────────────── */}
      <div className="fixed inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />


      {/* ─── Left Brand Panel (Desktop Only) ─────────────────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 relative z-10 p-20 justify-between bg-black/40 border-r border-white/5">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer w-fit">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center transform rotate-3 group-hover:rotate-0 transition-transform">
                <Zap className="text-white w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-bold font-mono tracking-tighter">
                Hunt<span className="text-indigo-400">AI</span>
            </span>
        </Link>

        {/* Dynamic Quote Section */}
        <div className="max-w-md">
            <div className="mb-8 w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-cyan-400">
                <Quote className="w-6 h-6 fill-current" />
            </div>
            <h3 className="text-4xl font-bold mb-6 tracking-tight leading-tight italic">
                "{quotes[0].text}"
            </h3>
            <p className="text-xl font-medium text-muted-foreground">
                — {quotes[0].author}
            </p>
        </div>

        {/* Sidebar Footer */}
        <div className="flex items-center gap-8 text-xs text-muted-foreground font-bold tracking-widest uppercase">
            <span>Powered by Groq</span>
            <span>Open Source Agent</span>
            <span>MIT License</span>
        </div>

        {/* Animated Flying Job Pills (Decor) */}
        <div className="absolute top-[20%] right-[-10%] flex flex-col gap-4 opacity-10 select-none -z-10 animate-float">
            <div className="px-6 py-3 bg-white border border-white rounded-full text-black font-bold whitespace-nowrap -rotate-6">AI Engineer</div>
            <div className="px-6 py-3 bg-indigo-600 rounded-full text-white font-bold whitespace-nowrap translate-x-20 rotate-12">ML Ops</div>
            <div className="px-6 py-3 bg-white border border-white rounded-full text-black font-bold whitespace-nowrap rotate-6">Full Stack</div>
        </div>
      </div>

      {/* ─── Right Form Panel ────────────────────────────────────────────────── */}
      <div className="flex-1 lg:flex-[1] flex items-center justify-center p-8 z-10">
        <AuthForm type="register" />
      </div>

    </div>
  );
}
