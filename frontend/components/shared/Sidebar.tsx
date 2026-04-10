/**
 * frontend/components/shared/Sidebar.tsx
 * HuntAI - AI Job Hunter Agent
 * Desktop Sidebar with Nav and Usage Stats
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Zap, Clock, Settings, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";

const Sidebar: React.FC = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();
    }, []);

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: <Zap className="w-5 h-5" /> },
        { name: "History", href: "/history", icon: <Clock className="w-5 h-5" /> },
        { name: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" /> },
        { name: "Guide", href: "/guide", icon: <HelpCircle className="w-5 h-5" /> }
    ];

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <aside className="w-[240px] flex flex-col h-full bg-black/40 p-6 pt-10">
            
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2 group mb-12">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center transform group-hover:rotate-6 transition-transform">
                    <Zap className="text-white w-6 h-6 fill-current" />
                </div>
                <span className="text-xl font-bold font-mono tracking-tighter">
                    Hunt<span className="text-indigo-400">AI</span>
                </span>
            </Link>

            {/* Navigation Navigation */}
            <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                                isActive ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                            }`}
                        >
                            <span className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                                {item.icon}
                            </span>
                            <span className="text-sm font-bold tracking-tight">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="mt-auto flex flex-col gap-6">
                
                {/* Usage Stats Dashboard in Sidebar */}
                <div className="p-4 glass rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Runs Today</span>
                        <span className="text-xs font-mono font-bold text-white">2/3</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[66%] shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    </div>
                </div>

                {/* Profile Widget */}
                <div className="flex items-center justify-between p-2 py-0 border-t border-white/5 pt-6 group">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-indigo-400">
                            {user?.email?.[0].toUpperCase() || "A"}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-bold truncate text-white">
                                {user?.user_metadata?.full_name || "Ammar Raza"}
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                Premium Agent
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={handleSignOut}
                        className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-muted-foreground transition-all"
                        aria-label="Sign out"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

        </aside>
    );
};

export default Sidebar;
