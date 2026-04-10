/**
 * frontend/components/auth/AuthForm.tsx
 * HuntAI - AI Job Hunter Agent
 * Shared Login/Register Form with Supabase integration
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, Mail, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AuthFormProps {
    type: "login" | "register";
}

const AuthForm: React.FC<AuthFormProps> = ({ type }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (type === "register") {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName }
                    }
                });
                if (error) throw error;
                toast.success("Account created! Check your email for confirmation.");
                router.push("/onboarding");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success("Welcome back to HuntAI!");
                router.push("/dashboard");
            }
        } catch (err: any) {
            toast.error(err.message || "Authentication failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/dashboard`,
                }
            });
            if (error) throw error;
        } catch (err: any) {
            toast.error("Google login failed.");
        }
    };

    return (
        <div className="w-full max-w-md p-8 glass rounded-3xl border border-white/10 shadow-2xl relative">
            
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gradient mb-3">
                    {type === "login" ? "Welcome Back" : "Join the Hunt"}
                </h2>
                <p className="text-muted-foreground text-sm">
                    {type === "login" 
                        ? "Enter your credentials to access your dashboard." 
                        : "Create an account to start your AI job search automation."}
                </p>
            </div>

            {/* Google Button */}
            <button
                onClick={handleGoogleLogin}
                className="w-full py-3.5 mb-8 glass hover:bg-white/5 border border-white/10 flex items-center justify-center gap-3 font-semibold rounded-2xl transition-all active:scale-95"
            >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5 rounded-full" alt="Google" />
                Continue with Google
            </button>

            <div className="relative mb-8 text-center text-xs text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-4">
                <div className="flex-1 h-[1px] bg-white/10" />
                OR
                <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleAuth} className="flex flex-col gap-6">
                {type === "register" && (
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-muted-foreground">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Ammar Raza"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                            />
                        </div>
                    </div>
                )}

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

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-muted-foreground">Password</label>
                        {type === "login" && (
                            <Link href="/forgot" className="text-xs font-bold text-indigo-400 hover:text-indigo-300">Forgot?</Link>
                        )}
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                        />
                    </div>
                    {type === "register" && password && (
                        <div className="flex gap-1 mt-1 px-1">
                            {[0,1,2,3].map(i => (
                                <div key={i} className={`h-1 flex-1 rounded-full ${password.length >= (i+1)*2 ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "bg-white/10"}`} />
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all text-lg flex items-center justify-center gap-3 group"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            {type === "login" ? "Sign in →" : "Create Account →"}
                        </>
                    )}
                </button>
            </form>

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
