'use client';

import React, { createContext, useContext } from 'react';
import { useAsgardeo } from '@asgardeo/nextjs';

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
  isSignedIn: boolean;
  signIn: () => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isSignedIn: false,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const asgardeo = useAsgardeo();

  const rawUser = asgardeo.user as any;

  const user: UserProfile | null = asgardeo.isSignedIn && rawUser ? {
    id: rawUser.sub || rawUser.id || 'asgardeo-user',
    email: rawUser.email || rawUser.userName || rawUser.username || 'user@asgardeo.io',
    name: rawUser.displayName || rawUser.name || rawUser.given_name || rawUser.userName || rawUser.username || 'Asgardeo User',
    role: 'Enterprise Member',
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${rawUser.email || rawUser.userName || 'user'}`,
  } : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: Boolean(asgardeo.isLoading),
        isSignedIn: Boolean(asgardeo.isSignedIn),
        signIn: asgardeo.signIn ? () => asgardeo.signIn!() : async () => {},
        signOut: asgardeo.signOut ? () => asgardeo.signOut!() : async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
