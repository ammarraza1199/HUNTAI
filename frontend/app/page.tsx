/**
 * frontend/app/page.tsx
 * HuntAI - AI Job Hunter Agent
 * Main Landing Page Entrypoint
 */

import React from "react";
import Navbar from "@/components/shared/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import LimitsSection from "@/components/landing/LimitsSection";
import FooterSection from "@/components/shared/FooterSection";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-background">
      
      {/* ─── Global Components ─────────────────────────────────────────────────── */}
      <Navbar />

      {/* ─── Page Sections ────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full flex flex-col items-center">
        
        {/* Hero Section (Search/Title/Visuals) */}
        <HeroSection />

        {/* Features Content (Benefits) */}
        <FeaturesSection />

        {/* How It Works (Step-by-step Process) */}
        <HowItWorksSection />

        {/* Usage Limits (Trust & Transparency) */}
        <LimitsSection />

      </main>

      {/* ─── Global Footer ─────────────────────────────────────────────────────── */}
      <FooterSection />

      {/* ─── Floating Background Orbs ──────────────────────────────────────────── */}
      <div className="fixed top-[15%] left-[5%] w-[350px] h-[350px] bg-indigo-500/10 blur-[130px] -z-10 rounded-full animate-pulse" />
      <div className="fixed bottom-[15%] right-[5%] w-[450px] h-[450px] bg-cyan-500/10 blur-[150px] -z-10 rounded-full animate-pulse" />
      
    </div>
  );
}
