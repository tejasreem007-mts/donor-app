"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMock } from "../context/MockContext";
import { GitMerge, HeartHandshake, UserPlus, Database } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { isMockMode, toggleMockMode, dbStatus } = useMock();

  const navLinks = [
    { name: "Recipients & Matching", href: "/", icon: GitMerge },
    { name: "Donors", href: "/donors", icon: HeartHandshake },
    { name: "Register Recipient", href: "/add", icon: UserPlus },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Title */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              +
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm tracking-tight leading-none">
                LifeLink
              </div>
              <div className="text-[11px] text-teal-700 font-medium">
                Blood &amp; Organ Donor Matching
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-teal-50 text-teal-800 border border-teal-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-teal-700" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* DB Status & Demo Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMockMode}
              title="Click to toggle Demo Mock Mode for offline presentation"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isMockMode
                  ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                  : dbStatus === "connected"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isMockMode ? "Mock Mode" : dbStatus === "connected" ? "Oracle Connected" : "Oracle Offline"}
              </span>
              <span className="sm:hidden">
                {isMockMode ? "Mock" : dbStatus === "connected" ? "Live" : "Offline"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
