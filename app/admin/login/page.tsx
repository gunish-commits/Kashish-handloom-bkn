'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '../../../lib/supabase/client';
import { useAuth } from '../../../context/AuthContext';
import BrandName from '../../../components/ui/BrandName';
import Button from '../../../components/ui/Button';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect to dashboard if already logged in as admin
  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.push('/admin/dashboard');
    }
  }, [user, isAdmin, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Email and password are required.');
      return;
    }

    setAuthError('');
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // check if admin role is valid
      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
        await supabase.auth.signOut();
        throw new Error('Unauthorized portal access.');
      }

      window.location.href = '/admin/dashboard';
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-antique-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4 font-sans select-none">
      {/* Centered Dark Card */}
      <div className="w-full max-w-[400px] bg-surface-dark border border-border-dark p-8 md:p-12 rounded-[8px] space-y-6">
        
        {/* BrandName and Title at Top */}
        <div className="text-center select-none">
          <BrandName size="lg" theme="dark" showTagline={false} centered={true} />
          <p className="font-sans font-medium text-sm text-pale-linen tracking-[0.08em] text-center mt-2.5 uppercase">
            Admin Portal
          </p>
          <div className="w-full h-[1px] bg-border-dark/60 mt-4 mb-2" />
        </div>

        {/* Error message */}
        {authError && (
          <div className="bg-rose-950/45 border border-rose-900/60 text-rose-200 p-3.5 rounded-[4px] text-xs font-medium text-center">
            {authError}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs font-sans">
          
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-pale-linen uppercase tracking-wider">
              Admin Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 border border-border-dark rounded-[4px] focus:outline-none focus:border-antique-gold bg-surface-mid text-warm-ivory font-sans"
                placeholder="admin@kashishhandloom.com"
              />
              <Mail className="w-4 h-4 text-antique-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-pale-linen uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-10 border border-border-dark rounded-[4px] focus:outline-none focus:border-antique-gold bg-surface-mid text-warm-ivory font-sans"
                placeholder="••••••••"
              />
              <Lock className="w-4 h-4 text-antique-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-warm-ivory focus:outline-none cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full h-12 uppercase tracking-widest text-[11px] font-bold flex items-center justify-center gap-2 bg-deep-maroon text-warm-ivory hover:bg-deep-maroon/90 border border-deep-maroon"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
