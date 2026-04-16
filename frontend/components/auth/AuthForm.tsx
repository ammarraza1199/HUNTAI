"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, Mail, Lock, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authAPI } from "../../lib/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";

interface AuthFormProps {
    type: "login" | "register";
}

const AuthForm: React.FC<AuthFormProps> = ({ type }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"email" | "otp">("email");

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authAPI.sendOTP(email);
            setStep("otp");
            toast.success("OTP sent! Check your email.");
        } catch (err: any) {
            toast.error(err.message || "Failed to send OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authAPI.verifyOTP(email, otp);
            toast.success("Welcome to HuntAI!");
            router.push("/dashboard");
        } catch (err: any) {
            toast.error(err.message || "Invalid OTP.");
        } finally {
            setLoading(false);
        }
    };

    const onGoogleSuccess = async (credentialResponse: any) => {
        setLoading(true);
        try {
            await authAPI.googleLogin(credentialResponse.credential);
            toast.success("Successfully logged in with Google!");
            router.push("/dashboard");
        } catch (err: any) {
            toast.error("Google login failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 glass rounded-3xl border border-white/10 shadow-2xl relative">
            
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gradient mb-3">
                    {step === "email" ? (type === "login" ? "Welcome Back" : "Join the Hunt") : "Security Check"}
                </h2>
                <p className="text-muted-foreground text-sm">
                    {step === "email" 
                        ? (type === "login" ? "Enter your email to receive a secure login code." : "Register to start your AI job search automation.")
                        : `Enter the 6-digit code sent to ${email}`}
                </p>
            </div>

            <AnimatePresence mode="wait">
                {step === "email" ? (
                    <motion.div
                        key="email-step"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        {/* Google Button */}
                        <div className="flex justify-center mb-4">
                            <GoogleLogin 
                                onSuccess={onGoogleSuccess}
                                onError={() => toast.error("Google Sign-In failed.")}
                                theme="filled_black"
                                shape="pill"
                                text="continue_with"
                            />
                        </div>

                        <div className="relative mb-6 text-center text-xs text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-4">
                            <div className="flex-1 h-[1px] bg-white/10" />
                            OR
                            <div className="flex-1 h-[1px] bg-white/10" />
                        </div>

                        {/* Email Form */}
                        <form onSubmit={handleSendOTP} className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-muted-foreground">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="email"
                                        placeholder="name@email.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all text-lg flex items-center justify-center gap-3 group"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Continue with Email"
                                )}
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="otp-step"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <form onSubmit={handleVerifyOTP} className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-muted-foreground">6-Digit Code</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                                    <input
                                        type="text"
                                        placeholder="123456"
                                        required
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white tracking-[0.5em] text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all text-lg flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Verify & Login →"
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep("email")}
                                className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
                            >
                                ← Back to email
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-10 text-center text-sm font-medium text-muted-foreground">
                {type === "login" ? (
                    <>Don't have an account? <Link href="/register" className="text-indigo-400 font-bold hover:text-indigo-300">Join the Hunt</Link></>
                ) : (
                    <>Already hunting with us? <Link href="/login" className="text-indigo-400 font-bold hover:text-indigo-300">Sign in</Link></>
                )}
            </div>
        </div>
    );
};

export default AuthForm;
