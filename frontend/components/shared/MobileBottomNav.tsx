/**
 * frontend/components/shared/MobileBottomNav.tsx
 * HuntAI - AI Job Hunter Agent
 * Mobile Tab Bar (Bottom Nav)
 */

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Clock, Settings, User } from "lucide-react";
import { motion } from "framer-motion";

const MobileBottomNav: React.FC = () => {
    const pathname = usePathname();

    const tabs = [
        { name: "Home", href: "/dashboard", icon: <Zap className="w-6 h-6" /> },
        { name: "History", href: "/history", icon: <Clock className="w-6 h-6" /> },
        { name: "Settings", href: "/settings", icon: <Settings className="w-6 h-6" /> },
        { name: "Profile", href: "/profile", icon: <User className="w-6 h-6" /> }
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass backdrop-blur-3xl border-t border-white/5 h-20 px-8 flex items-center justify-between shadow-2xl">
            
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-600/30 to-transparent" />

            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                    <Link
                        key={tab.name}
                        href={tab.href}
                        className="relative flex flex-col items-center justify-center gap-1 group active:scale-95 transition-transform"
                    >
                        <div className={`transition-all duration-300 ${isActive ? "text-indigo-400 scale-110" : "text-muted-foreground"}`}>
                            {tab.icon}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest transition-all ${isActive ? "text-indigo-200" : "text-muted-foreground"}`}>
                            {tab.name}
                        </span>
                        
                        {/* Active Indicator Dot */}
                        {isActive && (
                            <motion.div
                                layoutId="mobile-nav-dot"
                                className="absolute -top-3 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                            />
                        )}
                    </Link>
                )
            })}
        </nav>
    );
};

export default MobileBottomNav;
