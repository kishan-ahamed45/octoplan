'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Lock, Mail, User, ShieldCheck, Zap, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithDemo } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await signUpWithEmail(email, password, name);
        if (res.error) throw new Error(res.error);
      } else {
        const res = await signInWithEmail(email, password);
        if (res.error) throw new Error(res.error);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (role: 'lead' | 'dev') => {
    signInWithDemo(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isSignUp ? 'Create Workspace Account' : 'Sign in to AI Project Manager'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Workspace authentication & role permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fast 1-Click Demo Profiles */}
        <div className="p-6 pb-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            ⚡ 1-Click Hackathon Profiles
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleDemoSelect('lead')}
              className="p-3 text-left rounded-xl bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/60 transition-all group"
            >
              <span className="block text-xs font-bold text-blue-700 dark:text-blue-300 group-hover:text-blue-800">
                Kishan (Lead)
              </span>
              <span className="block text-[10px] text-blue-600/80 dark:text-blue-400/80">
                Product Architect
              </span>
            </button>

            <button
              onClick={() => handleDemoSelect('dev')}
              className="p-3 text-left rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/60 transition-all group"
            >
              <span className="block text-xs font-bold text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-800">
                Alex (Engineer)
              </span>
              <span className="block text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                Full-Stack Dev
              </span>
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 font-semibold">
                Or with email & password
              </span>
            </div>
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3.5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kishan Ahamed"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>{isSignUp ? 'Create Workspace Account' : 'Sign In'}</span>
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
