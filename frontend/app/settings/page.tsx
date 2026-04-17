/**
 * frontend/app/settings/page.tsx
 * HuntAI - AI Job Hunter Agent
 * Phase 13: Account & Configuration Settings
 */

"use client";

import React, { useState, useEffect } from "react";
import { 
    Settings, Key, Monitor, Coffee, Zap, User, 
    ShieldCheck, Trash2, LogOut, CheckCircle2, 
    AlertCircle, Save, HelpCircle, ChevronRight, ChevronDown,
    Loader2, Trash, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";
import { authAPI } from "../../lib/auth";
import { Profile, Usage } from "../../types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"api" | "prefs" | "account" | "usage">("api");
    const [profile, setProfile] = useState<Profile | null>(null);
    const [usage, setUsage] = useState<Usage | null>(null);
    const [newGroqKey, setNewGroqKey] = useState("");
    const [isEngineDropdownOpen, setIsEngineDropdownOpen] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const user = authAPI.getUser();
            if (!user) return router.push("/login");

            // Fetch usage from real backend
            const usage_data = await api.get<Usage>('/api/usage');
            
            // Fetch real profile
            const profile_data = await api.get<Profile>('/api/profile');

            setProfile(profile_data);
            setUsage(usage_data);
        } catch (err: any) {
            toast.error("Failed to load settings.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!profile) return;
        setSaving(true);
        try {
            await api.post('/api/profile', {
                full_name: profile.full_name,
                default_engine: profile.default_engine,
                default_delay: profile.default_delay,
                default_max_per_platform: profile.default_max_per_platform
            });
            toast.success("Preferences saved successfully.");
        } catch (err: any) {
            toast.error("Failed to update preferences.");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateGroqKey = () => {
        if (!newGroqKey.startsWith("gsk_")) {
            toast.error("Invalid Groq Key format.");
            return;
        }
        localStorage.setItem("huntai_groq_key", newGroqKey);
        toast.success("API Key updated locally.");
        setNewGroqKey("");
    };

    const handleSignOut = () => {
        authAPI.logout();
    };

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin opacity-20" /></div>;

    return (
        <div className="flex flex-col gap-10 max-w-5xl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-10">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
                    <p className="text-sm text-muted-foreground">Manage your AI brain connection, scraping preferences, and account privacy.</p>
                </div>
            </div>

            <div className="flex flex-col gap-10">
                
                {/* Horizontal Navigation Tabs (Aligned UI) */}
                <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
                    {[
                        { id: "api", icon: <Key className="w-4 h-4" />, name: "API Key" },
                        { id: "prefs", icon: <Monitor className="w-4 h-4" />, name: "Preferences" },
                        { id: "account", icon: <User className="w-4 h-4" />, name: "Account" },
                        { id: "usage", icon: <Zap className="w-4 h-4" />, name: "Usage & Limits" }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            //@ts-ignore
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
                                activeTab === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                            }`}
                        >
                            {tab.icon}
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Content Area (Now Full Width and Aligned) */}
                <div className="flex flex-col gap-8 min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {/* ─── API KEY SECTION ────────────────────────────────────────────────── */}
                        {activeTab === "api" && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-xl font-bold">Groq AI Connection</h4>
                                    <div className="p-6 glass rounded-2xl border border-indigo-500/10 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 font-mono text-xl font-bold">
                                                G
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold">Llama-3 Integration</span>
                                                <span className="text-xs text-muted-foreground font-mono">gsk_••••••••••••••••••••</span>
                                            </div>
                                        </div>
                                        <div className="p-2 border border-green-500/20 bg-green-500/10 text-green-400 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Validated
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-muted-foreground">Update API Key</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="password" 
                                            placeholder="Paste new gsk_ key..." 
                                            value={newGroqKey}
                                            onChange={(e) => setNewGroqKey(e.target.value)}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                                        />
                                        <button 
                                            //@ts-ignore
                                            onClick={handleUpdateGroqKey}
                                            className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-500/20"
                                        >
                                            Update
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-2 px-1">
                                        <HelpCircle className="w-3 h-3" /> Get your key at <a href="https://console.groq.com" target="_blank" className="text-indigo-400 underline">console.groq.com</a>. We never store this key in our cloud.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* ─── PREFERENCES SECTION ─────────────────────────────────────────────── */}
                        {activeTab === "prefs" && profile && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-10">
                                <h4 className="text-xl font-bold">Scraping Preferences</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-muted-foreground flex items-center gap-2"><Monitor className="w-4 h-4" /> Default Engine</label>
                                        
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setIsEngineDropdownOpen(!isEngineDropdownOpen)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex items-center justify-between font-bold"
                                            >
                                                <span>
                                                    {profile.default_engine === "playwright" && "Standard (Playwright)"}
                                                    {profile.default_engine === "sb" && "Stealth (SeleniumBase)"}
                                                    {profile.default_engine === "nd" && "Ghost (Nodriver)"}
                                                </span>
                                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isEngineDropdownOpen ? "rotate-180" : ""}`} />
                                            </button>

                                            <AnimatePresence>
                                                {isEngineDropdownOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="absolute z-50 w-full mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black"
                                                    >
                                                        {[
                                                            { id: "playwright", name: "Standard (Playwright)" },
                                                            { id: "sb", name: "Stealth (SeleniumBase)" },
                                                            { id: "nd", name: "Ghost (Nodriver)" }
                                                        ].map((engine) => (
                                                            <div
                                                                key={engine.id}
                                                                onClick={() => {
                                                                    setProfile({...profile, default_engine: engine.id as any});
                                                                    setIsEngineDropdownOpen(false);
                                                                }}
                                                                className={`px-4 py-3 text-sm cursor-pointer transition-all ${
                                                                    profile.default_engine === engine.id 
                                                                        ? "bg-indigo-600 text-white" 
                                                                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                                                }`}
                                                            >
                                                                {engine.name}
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-muted-foreground flex items-center gap-2"><Coffee className="w-4 h-4" /> Human Delay (s)</label>
                                        <input 
                                            type="number" 
                                            value={profile.default_delay}
                                            onChange={(e) => setProfile({...profile, default_delay: parseInt(e.target.value)})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono font-bold"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-muted-foreground flex items-center gap-2"><Zap className="w-4 h-4" /> Jobs Per Platform</label>
                                        <input 
                                            type="number" 
                                            value={profile.default_max_per_platform}
                                            onChange={(e) => setProfile({...profile, default_max_per_platform: parseInt(e.target.value)})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono font-bold"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="w-fit flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Default Preferences
                                </button>
                            </motion.div>
                        )}

                        {/* ─── USAGE SECTION ──────────────────────────────────────────────────── */}
                        {activeTab === "usage" && usage && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-10">
                                <h4 className="text-xl font-bold">Execution Usage & Limits</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="p-6 glass rounded-2xl border border-white/5 flex flex-col gap-2">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Used Today</span>
                                        <span className="text-4xl font-mono font-black text-indigo-400">{usage.runs_today}/{usage.runs_limit}</span>
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-4">
                                            <div className="h-full bg-indigo-500" style={{ width: `${(usage.runs_today / usage.runs_limit) * 100}%` }} />
                                        </div>
                                    </div>
                                    <div className="p-6 glass rounded-2xl border border-white/5 flex flex-col gap-2">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Jobs Scraped All-time</span>
                                        <span className="text-4xl font-mono font-black text-green-400">{usage.total_jobs || 0}</span>
                                        <p className="text-[10px] text-muted-foreground font-medium mt-auto">Across {usage.total_runs || 0} successful hunts.</p>
                                    </div>
                                    <div className="p-6 glass rounded-2xl border border-white/5 flex flex-col gap-2">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Reset Window</span>
                                        <span className="text-4xl font-mono font-black text-amber-400">
                                            {Math.max(0, Math.ceil((new Date(usage.resets_at).getTime() - new Date().getTime()) / (1000 * 60 * 60)))}h
                                        </span>
                                        <p className="text-[10px] text-muted-foreground font-medium mt-auto">Until daily limit resets.</p>
                                    </div>
                                </div>
                                <div className="p-8 glass rounded-3xl border border-indigo-500/10 flex items-start gap-4">
                                    <Info className="w-6 h-6 text-indigo-400 mt-1" />
                                    <div className="space-y-4">
                                        <h5 className="font-bold">Why is there a limit?</h5>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            To ensure the platform remains stable and avoids being globally blocked by job boards, we enforce a soft limit of <span className="text-indigo-200 font-bold">3 AI Hunts per day</span> per user. This is reset at midnight UTC every day.
                                        </p>
                                        <button className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 hover:underline">
                                            Apply for higher limits <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ─── ACCOUNT SECTION ────────────────────────────────────────────────── */}
                        {activeTab === "account" && profile && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-12">
                                <div className="space-y-6">
                                    <h4 className="text-xl font-bold">Account Privacy</h4>
                                    <div className="p-8 glass rounded-[2.5rem] border border-red-500/5 bg-red-500/[0.02] space-y-6">
                                        <div className="space-y-2">
                                            <h5 className="text-sm font-bold text-red-400 uppercase tracking-widest">Danger Zone</h5>
                                            <p className="text-xs text-muted-foreground leading-relaxed">The following actions are destructive and cannot be reversed once executed.</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl gap-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-bold">Delete Account & Data</span>
                                                <span className="text-[10px] text-muted-foreground">Wipe all resume data, history, and profile settings.</span>
                                            </div>
                                            <button className="px-6 py-2 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all">
                                                Delete Everything
                                            </button>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl gap-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-bold">Sign Out of All Devices</span>
                                                <span className="text-[10px] text-muted-foreground">Invalidate all existing session tokens.</span>
                                            </div>
                                            <button onClick={handleSignOut} className="px-6 py-2 border border-white/10 text-white hover:bg-white/5 rounded-xl text-xs font-bold transition-all">
                                                Sign Out All
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>

        </div>
    );
}
