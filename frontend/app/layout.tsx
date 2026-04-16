/**
 * frontend/app/layout.tsx
 * HuntAI - AI Job Hunter Agent
 * Root Layout with Font, Meta, and Shadcn Theming
 */

import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "HuntAI — AI Job Hunter Agent",
  description: "Your resume. Every job board. Zero effort. Scrape, score, and land your next role with HuntAI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} dark`}>
      <head>
        {/* Favicon Placeholder */}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground overflow-x-hidden">
        {/* Animated Grid Background */}
        <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none -z-10" />
        
        {/* Background Radial Glow */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/20 blur-[120px] rounded-full" />
        </div>

        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <main className="relative z-10 min-h-screen flex flex-col">
            {children}
            </main>
        </GoogleOAuthProvider>
        
        {/* Global Toast Provider */}
        <Toaster position="top-right" richColors theme="dark" />
      </body>
    </html>
  );
}
