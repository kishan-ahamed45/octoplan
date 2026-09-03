'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithDemo: (role?: 'lead' | 'dev') => void;
  signInWithEmail: (email: string, pass: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const DEFAULT_DEMO_USER: UserProfile = {
  id: 'user-demo-1',
  email: 'kishan@dev.io',
  name: 'Kishan (Lead Architect)',
  role: 'Product Lead',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kishan',
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithDemo: () => {},
  signInWithEmail: async () => ({}),
  signUpWithEmail: async () => ({}),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_DEMO_USER);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check saved session or Supabase session
    const savedUser = localStorage.getItem('app-auth-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    }

    if (isSupabaseConfigured && supabase) {
      supabase.auth.getUser().then(({ data: { user: sbUser } }) => {
        if (sbUser) {
          const profile: UserProfile = {
            id: sbUser.id,
            email: sbUser.email || 'user@example.com',
            name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Team Member',
            role: 'Software Engineer',
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sbUser.email}`,
          };
          setUser(profile);
          localStorage.setItem('app-auth-user', JSON.stringify(profile));
        }
      });

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || 'user@example.com',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Team Member',
            role: 'Software Engineer',
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`,
          };
          setUser(profile);
          localStorage.setItem('app-auth-user', JSON.stringify(profile));
        } else if (!localStorage.getItem('app-auth-user')) {
          setUser(DEFAULT_DEMO_USER);
        }
      });

      return () => {
        listener?.subscription.unsubscribe();
      };
    }
  }, []);

  const signInWithDemo = (role: 'lead' | 'dev' = 'lead') => {
    const profile: UserProfile =
      role === 'lead'
        ? {
            id: 'user-demo-lead',
            email: 'architect@enterprise.io',
            name: 'Kishan Ahamed',
            role: 'Senior System Architect',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kishan',
          }
        : {
            id: 'user-demo-dev',
            email: 'developer@enterprise.io',
            name: 'Alex Rivera',
            role: 'Full-Stack Engineer',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
          };
    setUser(profile);
    localStorage.setItem('app-auth-user', JSON.stringify(profile));
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { error: error.message };
      if (data.user) {
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          role: 'Engineer',
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        };
        setUser(profile);
        localStorage.setItem('app-auth-user', JSON.stringify(profile));
      }
      return {};
    }

    // Mock login if supabase auth is not configured
    const profile: UserProfile = {
      id: `user-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: 'Engineer',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    };
    setUser(profile);
    localStorage.setItem('app-auth-user', JSON.stringify(profile));
    return {};
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { full_name: name } },
      });
      if (error) return { error: error.message };
      if (data.user) {
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          name,
          role: 'Engineer',
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        };
        setUser(profile);
        localStorage.setItem('app-auth-user', JSON.stringify(profile));
      }
      return {};
    }

    // Mock signup
    const profile: UserProfile = {
      id: `user-${Date.now()}`,
      email,
      name,
      role: 'Engineer',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    };
    setUser(profile);
    localStorage.setItem('app-auth-user', JSON.stringify(profile));
    return {};
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('app-auth-user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithDemo,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
