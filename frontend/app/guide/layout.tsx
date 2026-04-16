/**
 * frontend/app/guide/layout.tsx
 * HuntAI - AI Job Hunter Agent
 * Guide Shell with Sidebar and Auth Protection (Aligned with App)
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "../../lib/auth";
import Sidebar from "@/components/shared/Sidebar";
import MobileBottomNav from "@/components/shared/MobileBottomNav";

export default function GuideLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const token = authAPI.getToken();
            if (!token) {
                router.push("/login");
            } else {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-full border-r border-white/5">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                <div className="max-w-7xl mx-auto w-full flex-1 overflow-y-auto px-4 py-8 pb-32">
                    {children}
                </div>

                {/* Mobile Tab Bar */}
                <MobileBottomNav />
            </div>
        </div>
    );
}
