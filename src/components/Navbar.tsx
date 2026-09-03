'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Sparkles, FolderKanban, RefreshCw, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  onSeedSuccess?: () => void;
}

export function Navbar({ onSeedSuccess }: NavbarProps) {
  const pathname = usePathname();
  const [seeding, setSeeding] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState(false);

  const handleSeedDemo = async () => {
    try {
      setSeeding(true);
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSeedSuccessMsg(true);
        setTimeout(() => setSeedSuccessMsg(false), 3000);
        if (onSeedSuccess) {
          onSeedSuccess();
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Failed to seed demo:', err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                AI Project Manager
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Agentic MVP
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                pathname === '/' || pathname === '/projects'
                  ? 'bg-slate-800/90 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-indigo-400" />
              <span>Projects</span>
            </Link>
          </nav>
        </div>

        {/* Action buttons & badges */}
        <div className="flex items-center space-x-3">
          {seedSuccessMsg ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-medium animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Demo Seeded!</span>
            </div>
          ) : (
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              title="Reset or seed sample demo project & tasks"
              className="inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${seeding ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Seed Demo Project</span>
            </button>
          )}

          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <Sparkles className="w-3 h-3 mr-1 text-purple-400 animate-pulse" />
              Gemini 2.5
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
