/**
 * frontend/components/dashboard/LaunchModal.tsx
 * HuntAI - AI Job Hunter Agent
 * Form to configure hunt preferences before launch
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Zap, Briefcase, ChevronRight, Upload, FileText, ChevronDown } from "lucide-react";

interface LaunchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLaunch: (config: any) => void;
    initialData?: any;
}

const LaunchModal: React.FC<LaunchModalProps> = ({ isOpen, onClose, onLaunch, initialData }) => {
    const [formData, setFormData] = useState({
        query: initialData?.query || "",
        location: initialData?.location || "Remote",
        experience_level: initialData?.experience_level || "mid",
        platforms: initialData?.platforms || ["linkedin", "naukri", "indeed"],
        max_per_platform: initialData?.max_per_platform || 20,
        groq_key: localStorage.getItem('huntai_groq_key') || "",
        resume: null as File | null
    });

    const togglePlatform = (p: string) => {
        setFormData(prev => ({
            ...prev,
            platforms: prev.platforms.includes(p)
                ? prev.platforms.filter((x: string) => x !== p)
                : [...prev.platforms, p]
        }));
    };

    const [isExpDropdownOpen, setIsExpDropdownOpen] = useState(false);
    const [isParsing, setIsParsing] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg glass rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Configure Your Hunt</h2>
                        <p className="text-sm text-muted-foreground mt-1">Specify your target and AI preferences.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">

                    {/* Job Title & Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Job Title</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                                <input
                                    type="text"
                                    value={formData.query}
                                    onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                                    placeholder="e.g. Backend Engineer"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Target Location</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g. Remote, UK, India"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Experience Level & Search Depth */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Experience</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                                    <button
                                        type="button"
                                        onClick={() => setIsExpDropdownOpen(!isExpDropdownOpen)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex items-center justify-between font-bold"
                                    >
                                        <span className="capitalize">{formData.experience_level}</span>
                                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isExpDropdownOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isExpDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute z-50 w-full mt-2 bg-[#1A1A1A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                                            >
                                                {[
                                                    { id: "entry", label: "Entry" },
                                                    { id: "mid", label: "Mid-Level" },
                                                    { id: "senior", label: "Senior" },
                                                    { id: "lead", label: "Lead" }
                                                ].map((lvl) => (
                                                    <div
                                                        key={lvl.id}
                                                        onClick={() => {
                                                            setFormData({ ...formData, experience_level: lvl.id });
                                                            setIsExpDropdownOpen(false);
                                                        }}
                                                        className={`px-4 py-3 text-sm cursor-pointer transition-all ${
                                                            formData.experience_level === lvl.id 
                                                                ? "bg-indigo-600 text-white" 
                                                                : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                                        }`}
                                                    >
                                                        {lvl.label}
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                        </div>
                        <div className="space-y-2">
                             <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Search Depth</label>
                             <div className="flex items-center justify-center h-[58px] bg-white/5 border border-white/10 rounded-2xl">
                                <input 
                                    type="number"
                                    value={formData.max_per_platform}
                                    onChange={(e) => setFormData({ ...formData, max_per_platform: parseInt(e.target.value) || 20 })}
                                    className="w-12 bg-transparent text-indigo-400 font-bold text-center focus:outline-none"
                                    min="5"
                                    max="50"
                                />
                             </div>
                        </div>
                    </div>

                    {/* Target Platforms */}
                    <div className="space-y-4 pt-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Target Platforms</label>
                        <div className="flex gap-3">
                            {["linkedin", "naukri", "indeed"].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => togglePlatform(p)}
                                    className={`flex-1 py-3 px-2 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all ${formData.platforms.includes(p)
                                            ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400"
                                            : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* API Key (Optional Update) */}
                    <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Groq API Key (Stored Locally)</label>
                        <div className="relative">
                            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                            <input
                                type="password"
                                value={formData.groq_key}
                                onChange={(e) => setFormData({ ...formData, groq_key: e.target.value })}
                                placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Resume Upload Section */}
                    <div className="space-y-3 pt-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Your Resume (PDF/DOCX)</label>
                        {!formData.resume ? (
                            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-2xl cursor-pointer bg-white/5 hover:bg-indigo-500/5 transition-all group">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.docx"
                                    onChange={(e) => setFormData({ ...formData, resume: e.target.files?.[0] || null })}
                                />
                                <Upload className="w-6 h-6 text-muted-foreground group-hover:text-indigo-400 group-hover:-translate-y-1 transition-all mb-2" />
                                <span className="text-xs font-bold text-muted-foreground group-hover:text-indigo-300">Click to upload your resume</span>
                            </label>
                        ) : (
                            <div className="flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-white max-w-[150px] truncate">{formData.resume.name}</span>
                                        <span className="text-[10px] text-indigo-300/60 font-bold uppercase tracking-tighter">Ready for parsing</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFormData({ ...formData, resume: null })}
                                    className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-red-400 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 bg-white/5 border-t border-white/5 flex gap-4">
                    <button
                        onClick={onClose}
                        disabled={isParsing}
                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-muted-foreground transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            // isParsing serves as our 'Lock' here
                            setIsParsing(true);
                            onLaunch(formData);
                        }}
                        disabled={!formData.query || !formData.groq_key || isParsing}
                        className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
                    >
                        {isParsing ? (
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Launching...
                            </div>
                        ) : (
                            <>
                                Launch AI Hunt <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default LaunchModal;
