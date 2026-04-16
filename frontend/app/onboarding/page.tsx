/**
 * frontend/app/onboarding/page.tsx
 * HuntAI - AI Job Hunter Agent
 * Responsive Onboarding Wizard Layout
 */

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { authAPI } from "../../lib/auth";
import { api } from "../../lib/api";

import StepIndicator from "@/components/onboarding/StepIndicator";
import Step1_ApiKey from "@/components/onboarding/Step1_ApiKey";
import Step2_Resume from "@/components/onboarding/Step2_Resume";
import Step3_JobConfig from "@/components/onboarding/Step3_JobConfig";
import Step4_Platforms from "@/components/onboarding/Step4_Platforms";
import Step5_Settings from "@/components/onboarding/Step5_Settings";

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Global Onboarding State
    const [data, setData] = useState({
        groq_key: "",
        resume: null as File | null,
        resume_parsed: null as any,
        query: "",
        location: "",
        experience_level: "mid",
        platforms: ["linkedin", "naukri", "indeed"],
        engine: "playwright",
        delay: 120,
        max_per_platform: 10
    });

    useEffect(() => {
        const checkUser = () => {
            const userData = authAPI.getUser();
            if (!userData) router.push("/login");
            setUser(userData);
        };
        checkUser();
    }, []);

    const nextStep = () => setStep(prev => Math.min(prev + 1, 5));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleFinish = async () => {
        setLoading(true);
        try {
            // Mock profile update as backend /api/profile is not yet implemented
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Save Groq key locally for security (never DB)
            localStorage.setItem('huntai_groq_key', data.groq_key);

            toast.success("Onboarding complete! Welcome to HuntAI.");
            router.push("/dashboard");
        } catch (err: any) {
            toast.error(err.message || "Failed to finalize onboarding.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
            
            {/* Background elements */}
            <div className="fixed inset-0 grid-bg opacity-20 pointer-events-none" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] -z-10 rounded-full" />

            {/* Header / Logo */}
            <header className="fixed top-8 left-8 flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Zap className="text-white w-5 h-5 fill-current" />
                </div>
                <span className="text-lg font-bold font-mono tracking-tighter">
                    Hunt<span className="text-indigo-400">AI</span>
                </span>
            </header>

            {/* Main Wizard Card */}
            <div className="w-full max-w-xl relative">
                
                {/* Step Progress Info */}
                <div className="flex items-center justify-between mb-8 px-2">
                    <div className="flex flex-col">
                        <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-1">
                            Step {step} of 5
                        </span>
                        <h4 className="text-lg font-bold">
                            {step === 1 && "Connect AI Brain"}
                            {step === 2 && "Setup Resume"}
                            {step === 3 && "Job Preferences"}
                            {step === 4 && "Select Platforms"}
                            {step === 5 && "Final Fine-Tuning"}
                        </h4>
                    </div>
                    <StepIndicator currentStep={step} />
                </div>

                {/* Animated transition area */}
                <div className="glass rounded-[2.5rem] border border-white/10 p-8 min-h-[460px] flex flex-col shadow-2xl relative overflow-hidden">
                    
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="flex-1"
                        >
                            {step === 1 && <Step1_ApiKey data={data} setData={setData} />}
                            {step === 2 && <Step2_Resume data={data} setData={setData} />}
                            {step === 3 && <Step3_JobConfig data={data} setData={setData} />}
                            {step === 4 && <Step4_Platforms data={data} setData={setData} />}
                            {step === 5 && <Step5_Settings data={data} setData={setData} />}
                        </motion.div>
                    </AnimatePresence>

                    {/* Footer Controls */}
                    <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between px-2">
                        <button
                            onClick={prevStep}
                            disabled={step === 1 || loading}
                            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-white transition-colors disabled:opacity-0"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </button>

                        <button
                            onClick={step === 5 ? handleFinish : nextStep}
                            disabled={loading}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-xl transition-all active:scale-95 ${
                                step === 5 ? "bg-green-600 hover:bg-green-700 shadow-green-500/20" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                            }`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {step === 5 ? "Start my first hunt" : "Continue"}
                                    {step === 5 ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </div>

            {/* Background progress percentage */}
            <div className="fixed bottom-12 right-12 text-7xl font-mono font-black opacity-5 pointer-events-none tracking-tighter">
                {step * 20}%
            </div>

        </div>
    );
}
