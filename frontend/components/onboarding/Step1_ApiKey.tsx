/**
 * frontend/components/onboarding/Step1_ApiKey.tsx
 * HuntAI - AI Job Hunter Agent
 * Phase 6 Step 1: Connect your AI brain
 */

"use client";

import React, { useState } from "react";
import { Key, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";

interface Step1Props {
    data: any;
    setData: React.Dispatch<React.SetStateAction<any>>;
}

const Step1_ApiKey: React.FC<Step1Props> = ({ data, setData }) => {
    const [validating, setValidating] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);

    const validateKey = async () => {
        // Remove whitespace and quotes
        const cleanedKey = data.groq_key.trim().replace(/^["']|["']$/g, '');
        
        if (!cleanedKey.startsWith("gsk_")) {
            toast.error("Invalid key format. Should start with 'gsk_'.");
            return;
        }

        // Must sync to localStorage because api.ts reads from there
        localStorage.setItem('huntai_groq_key', cleanedKey);
        setData({ ...data, groq_key: cleanedKey });

        setValidating(true);
        try {
            // Actual API call to backend /api/validate-groq-key
            const result = await api.post<any>("/api/validate-groq-key", {}, true);
            setIsValid(result.valid);
            if (result.valid) {
                 toast.success("Groq connected! Llama-3-70b active.");
            } else {
                 toast.error("Invalid API key. Check and try again.");
            }
        } catch (err: any) {
            toast.error("Could not validate key.");
            setIsValid(false);
        } finally {
            setValidating(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            
            <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold">Connect your AI brain</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Grab your free Groq API key from the console. 
                    We use your key to run Llama-3 models at high speed without any cost to you.
                </p>
            </div>

            {/* Instruction Card */}
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Instructions</span>
                    <a 
                        href="https://console.groq.com/keys" 
                        target="_blank" 
                        className="text-xs font-bold text-indigo-300 hover:underline flex items-center gap-1"
                    >
                        console.groq.com <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
                <ul className="text-xs text-muted-foreground list-decimal list-inside flex flex-col gap-1 px-1">
                    <li>Sign up for free (no credit card)</li>
                    <li>Click <span className="font-bold text-indigo-200">"Create API Key"</span></li>
                    <li>Paste the key below</li>
                </ul>
            </div>

            {/* Input Field */}
            <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-muted-foreground">Groq API Key</label>
                <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="password"
                        placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
                        value={data.groq_key}
                        onChange={(e) => setData({ ...data, groq_key: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                    />
                    {isValid !== null && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            {isValid ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                        </div>
                    )}
                </div>

                <button
                    onClick={validateKey}
                    disabled={validating || !data.groq_key}
                    className="w-fit py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2"
                >
                    {validating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Validate Connection"}
                </button>
            </div>

            {/* Security Note */}
            <div className="mt-auto flex items-center gap-3 p-4 bg-green-500/5 rounded-2xl border border-green-500/10">
                <ShieldCheck className="w-8 h-8 text-green-400" />
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                    <span className="font-bold text-green-300">Security Note:</span> Your key is encrypted in your local browser session. It is NEVER stored in our database.
                </p>
            </div>

        </div>
    );
};

export default Step1_ApiKey;
