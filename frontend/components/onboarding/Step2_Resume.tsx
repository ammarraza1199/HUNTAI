/**
 * frontend/components/onboarding/Step2_Resume.tsx
 * HuntAI - AI Job Hunter Agent
 * Phase 6 Step 2: Upload your resume
 */

"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle2, ChevronRight, X, Cpu } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";

interface Step2Props {
    data: any;
    setData: React.Dispatch<React.SetStateAction<any>>;
}

const Step2_Resume: React.FC<Step2Props> = ({ data, setData }) => {
    const [uploading, setUploading] = useState(false);
    const [parsed, setParsed] = useState<any>(data.resume_parsed);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setData(prev => ({ ...prev, resume: file }));
        await processResume(file);
    }, [data.groq_key]);

    const processResume = async (file: File) => {
        if (!data.groq_key) {
            toast.error("Please connect your Groq API key in Step 1 first.");
            return;
        }

        setUploading(true);
        try {
            // Actual API call to backend /api/parse-resume
            const res = await api.uploadResume(file, data.groq_key);
            setParsed(res);
            setData(prev => ({ ...prev, resume_parsed: res }));
            toast.success("Resume parsed successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to parse resume.");
        } finally {
            setUploading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        multiple: false
    });

    return (
        <div className="flex flex-col gap-6 h-full">
            
            <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold">Upload your resume</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Provide your latest PDF or Word resume. Our AI extracts your core skills and experiences to match you perfectly.
                </p>
            </div>

            {/* Drag and Drop Zone */}
            {!parsed ? (
                <div 
                    {...getRootProps()} 
                    className={`h-48 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                        isDragActive ? "border-indigo-500 bg-indigo-500/10 scale-95" : "border-white/10 glass hover:bg-white/5 active:scale-[0.98]"
                    }`}
                >
                    <input {...getInputProps()} />
                    <div className={`p-4 rounded-full bg-indigo-500/10 text-indigo-400 ${uploading ? "animate-bounce" : ""}`}>
                        <Upload className="w-8 h-8" />
                    </div>
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                           <span className="text-sm font-bold animate-pulse text-indigo-300">Phase 1: AI Parsing...</span>
                           <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                               <div className="h-full bg-indigo-500 animate-shimmer" />
                           </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <span className="text-sm font-bold text-white">Drop your resume here</span>
                            <p className="text-xs text-muted-foreground mt-1">PDF or DOCX • Max 5MB</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative group glass p-6 rounded-3xl border border-green-500/20 bg-green-500/5 transition-all">
                    {/* Success Header */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400">
                                <FileText className="w-5 h-5 fill-current" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">{parsed.name}</h4>
                                <p className="text-xs text-muted-foreground">{parsed.experience_years} years experience detected</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => { setParsed(null); setData(prev => ({ ...prev, resume_parsed: null })); }} 
                            className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Skill Preview */}
                    <div className="flex flex-col gap-3">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                            <Cpu className="w-3 h-3" /> Core Skills Detected
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {parsed.skills?.slice(0, 8).map((s: string) => (
                                <span key={s} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-indigo-200">
                                    {s}
                                </span>
                            ))}
                            {(parsed.skills?.length || 0) > 8 && (
                                <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-medium text-muted-foreground italic">
                                    +{(parsed.skills?.length || 0) - 8} more
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Why do we need this? (Optional Context) */}
            <div className="mt-auto px-1">
                <p className="text-[10px] text-muted-foreground italic text-center">
                    "AI parsing ensures our scrapers find roles that align perfectly with your career history, maximizing your match scores."
                </p>
            </div>

        </div>
    );
};

export default Step2_Resume;
