'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  FolderKanban,
  Sun,
  Moon,
  Plus,
  RefreshCw,
  CheckCircle2,
  LogOut,
  ChevronDown,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  onSeedSuccess?: () => void;
  onOpenCreateModal?: () => void;
}

export function Navbar({ onSeedSuccess, onOpenCreateModal }: NavbarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, isSignedIn, signIn, signOut } = useAuth();

  const [seeding, setSeeding] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Left: Brand & Jira-style Tabs */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                AI Project Manager
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
                WSO2 Asgardeo
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                pathname === '/' || pathname === '/projects'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Projects</span>
            </Link>
          </nav>
        </div>

        {/* Right: Actions, Theme Switcher, User Menu */}
        <div className="flex items-center space-x-2.5">
          {onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className="hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
          )}

          {seedSuccessMsg ? (
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Demo Seeded</span>
            </div>
          ) : (
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              title="Reset or seed sample project"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${seeding ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Seed Demo</span>
            </button>
          )}

          {/* Dark / Light Mode Switcher */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Asgardeo User Profile / Auth */}
          <div className="relative pl-1 border-l border-slate-200 dark:border-slate-800">
            {isSignedIn && user ? (
              <div>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                    alt={user.name}
                    className="w-7 h-7 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800"
                  />
                  <div className="hidden lg:block text-left text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white block leading-none">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 leading-none flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Asgardeo ID
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1.5 text-xs animate-fade-in"
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-900/60">
                        <ShieldCheck className="w-3 h-3" />
                        <span>WSO2 Verified User</span>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        setProfileDropdownOpen(false);
                        await signOut();
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center space-x-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-all flex items-center space-x-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sign in with Asgardeo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
