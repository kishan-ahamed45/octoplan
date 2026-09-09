'use client';

import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export function AsgardeoDirectRedirect() {
  const { signIn, isSignedIn, loading } = useAuth();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if we are currently handling the callback from Asgardeo
    const isCallback =
      window.location.search.includes('code=') ||
      window.location.search.includes('session_state=') ||
      window.location.search.includes('state=');

    // If already signed in or in callback exchange, do not redirect
    if (isSignedIn || isCallback || loading || hasTriggeredRef.current) {
      return;
    }

    hasTriggeredRef.current = true;
    signIn();
  }, [signIn, isSignedIn, loading]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center">
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          Loading Asgardeo Login...
        </p>
      </div>
    </div>
  );
}
