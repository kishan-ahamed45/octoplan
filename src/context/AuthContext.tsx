'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile } from '@/types';

export type { UserProfile };

interface AuthActionResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isSignedIn: boolean;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  register: (name: string, email: string, password: string) => Promise<AuthActionResult>;
  loginDemo: () => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isSignedIn: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  loginDemo: async () => ({ success: false }),
  signOut: async () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      setUser(data.success ? data.data?.user || null : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setUser(data.success ? data.data?.user || null : null);
        }
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthRequest = async (
    endpoint: string,
    payload?: Record<string, unknown>
  ): Promise<AuthActionResult> => {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: payload ? { 'Content-Type': 'application/json' } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const data = await res.json();
      if (!data.success) {
        return { success: false, error: data.error || 'Authentication failed' };
      }
      setUser(data.data?.user || null);
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error',
      };
    }
  };

  const login = (email: string, password: string) =>
    handleAuthRequest('/api/auth/login', { email, password });

  const register = (name: string, email: string, password: string) =>
    handleAuthRequest('/api/auth/register', { name, email, password });

  const loginDemo = () => handleAuthRequest('/api/auth/demo');

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSignedIn: Boolean(user),
        login,
        register,
        loginDemo,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
