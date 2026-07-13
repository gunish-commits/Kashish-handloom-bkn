'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      
      const email = session?.user?.email;
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'kashishhandloombkn@gmail.com';
      const isUserAdmin = email === adminEmail || email === 'kashishhandloombkn@gmail.com' || session?.user?.user_metadata?.role === 'admin';
      setIsAdmin(!!isUserAdmin);
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      
      const email = session?.user?.email;
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'kashishhandloombkn@gmail.com';
      const isUserAdmin = email === adminEmail || email === 'kashishhandloombkn@gmail.com' || session?.user?.user_metadata?.role === 'admin';
      setIsAdmin(!!isUserAdmin);
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setToken(null);
    setIsAdmin(false);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token,
        loading,
        isAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
