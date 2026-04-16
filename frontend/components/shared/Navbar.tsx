/**
 * frontend/components/shared/Navbar.tsx
 * HuntAI - AI Job Hunter Agent
 * Premium Backdrop-blur Navbar
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "How it works", href: "#how-it-works" },
        { name: "Features", href: "#features" },
        { name: "Limits", href: "#limits" },
        { name: "GitHub", href: "https://github.com/ammarraza1199/HUNTAI" }
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
                scrolled ? "bg-background/80 backdrop-blur-md border-white/10 h-16" : "bg-transparent border-transparent h-20"
            }`}
        >
            <div className="container h-full mx-auto px-4 flex items-center justify-between">
                
                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:rotate-6 transition-transform">
                        <Zap className="text-white w-6 h-6 fill-current" />
                    </div>
                    <span className="text-xl font-bold font-mono tracking-tighter">
                        HuntAI<span className="ml-1 px-1.5 py-0.5 bg-indigo-600/20 text-indigo-400 text-[10px] rounded uppercase tracking-widest border border-indigo-500/20">Pro</span>
                    </span>
                </Link>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
                        >
                            {link.name}
                        </Link>
                    ))}
                    
                    {/* Auth CTA */}
                    <Link
                        href="/login"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all active:scale-95"
                    >
                        Start for free →
                    </Link>
                </div>

                {/* Mobile Menu Trigger */}
                <button
                    className="md:hidden p-2 text-white"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle mobile menu"
                >
                    {mobileOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Dropdown */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-16 left-0 right-0 glass backdrop-blur-lg border-b border-white/10 p-4 md:hidden"
                    >
                        <div className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="text-lg font-medium text-muted-foreground hover:text-white transition-colors"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <Link
                                href="/login"
                                onClick={() => setMobileOpen(false)}
                                className="w-full py-3 bg-indigo-600 text-white text-center font-bold rounded-lg"
                            >
                                Get Started →
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
