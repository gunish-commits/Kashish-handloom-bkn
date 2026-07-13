'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase/client';
import { useAuth } from '../../../context/AuthContext';
import { useStoreSettings } from '../../../context/StoreSettingsContext';
import Button from '../../../components/ui/Button';
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2 } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const settings = useStoreSettings();

  // Tab State: 'login' | 'signup'
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Input States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup Specific States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status/Alert States
  const [authError, setAuthError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/account';

  // Sync active tab from query parameter on mount/change
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'signup') {
      setActiveTab('signup');
    } else {
      setActiveTab('login');
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push(redirectUrl);
    }
  }, [user, loading, router, redirectUrl]);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }

    setAuthError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      router.push(redirectUrl);
    } catch (err: any) {
      console.error('Login Error:', err);
      setAuthError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Signup submission
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSuccessMsg('');

    if (!fullName || !email || !password || !confirmPassword || !phone) {
      setAuthError('Please fill in all registration fields.');
      return;
    }

    if (password.length < 8) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setAuthError('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: cleanPhone,
          },
          emailRedirectTo: `${window.location.origin}/login?tab=login&verified=true`,
        },
      });

      if (error) throw error;

      if (data?.user) {
        setSuccessMsg('Account created successfully! Please check your email inbox to verify your account.');
        // Clear registration states
        setFullName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setConfirmPassword('');
        setActiveTab('login');
      }
    } catch (err: any) {
      console.error('Registration Error:', err);
      setAuthError(err.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Supabase Password Reset Email
  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError('Please enter your email address in the field above to receive a reset link.');
      return;
    }

    setAuthError('');
    setSuccessMsg('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account?reset=true`,
      });
      if (error) throw error;
      setSuccessMsg('Password reset email sent! Please check your inbox.');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to send password reset link.');
    }
  };

  // Evaluate Password Strength
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: '', color: 'bg-gray-200', width: 'w-0' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 0:
      case 1:
        return { label: 'Weak', color: 'bg-rose-500', width: 'w-1/4' };
      case 2:
        return { label: 'Medium', color: 'bg-amber-505', width: 'w-2/4' };
      case 3:
        return { label: 'Strong', color: 'bg-emerald-500', width: 'w-3/4' };
      case 4:
      default:
        return { label: 'Excellent', color: 'bg-emerald-600', width: 'w-full' };
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="flex-1 bg-[#FAF7F2] py-16 px-4 flex justify-center items-center font-sans">
      {/* Container Card */}
      <div className="w-full max-w-[420px] bg-white border border-gray-150 p-6 md:p-8 rounded-[4px] shadow-[0_4px_16px_rgba(15,10,5,0.03)] space-y-6">
        
        {/* Brand Logo on Light Background wrapped in dark container */}
        <div className="flex justify-center select-none">
          <div className="logo-on-light-bg bg-ink rounded-[12px] px-3.5 py-2.5 inline-block select-none">
            <img
              src={settings?.logo_url || '/logo.jpg'}
              alt="Kashish Handloom"
              className="h-[60px] w-auto object-contain block mx-auto"
            />
          </div>
        </div>

        {/* Swappable Titles */}
        <div className="text-center space-y-1">
          <h2 className="font-display font-semibold text-3xl text-deep-maroon">
            {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">
            {activeTab === 'login' 
              ? 'Access orders and saved addresses' 
              : 'Sign up to shop and save details'}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-150 text-xs uppercase tracking-wider font-semibold">
          <button
            onClick={() => {
              setActiveTab('login');
              setAuthError('');
              setSuccessMsg('');
            }}
            className={`flex-1 text-center pb-2.5 transition-colors cursor-pointer focus:outline-none ${
              activeTab === 'login' 
                ? 'border-b-2 border-deep-maroon text-deep-maroon' 
                : 'text-gray-400 hover:text-ink'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setActiveTab('signup');
              setAuthError('');
              setSuccessMsg('');
            }}
            className={`flex-1 text-center pb-2.5 transition-colors cursor-pointer focus:outline-none ${
              activeTab === 'signup' 
                ? 'border-b-2 border-deep-maroon text-deep-maroon' 
                : 'text-gray-400 hover:text-ink'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Alert Displays */}
        {authError && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-[3px] text-xs font-semibold">
            ⚠️ {authError}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-[3px] text-xs font-semibold">
            ✓ {successMsg}
          </div>
        )}

        {/* Login Tab Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-sans">
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink text-xs font-sans"
                  placeholder="customer@gmail.com"
                />
                <Mail className="w-4 h-4 text-antique-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center select-none">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] text-antique-gold hover:underline font-semibold focus:outline-none cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink text-xs font-sans"
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-antique-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-deep-maroon focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-full h-12 uppercase tracking-widest text-[11px] font-bold flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <span>Sign In</span>
                )}
              </Button>
            </div>

            {/* Guest Checkout Option */}
            <div className="text-center pt-2 select-none border-t border-gray-100">
              <Link
                href={redirectUrl.startsWith('/checkout') ? redirectUrl : '/checkout'}
                className="text-xs text-gray-500 hover:text-deep-maroon font-semibold hover:underline"
              >
                Or continue as guest
              </Link>
            </div>
          </form>
        )}

        {/* Create Account Tab Form */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4 text-xs font-sans">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink text-xs font-sans"
                  placeholder="e.g. Priya Sharma"
                />
                <User className="w-4 h-4 text-antique-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink text-xs font-sans"
                  placeholder="priya@gmail.com"
                />
                <Mail className="w-4 h-4 text-antique-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Phone Number (10 digits)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink text-xs font-sans font-mono"
                  placeholder="8209455157"
                  maxLength={10}
                />
                <Phone className="w-4 h-4 text-antique-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Password (min 8 characters)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink text-xs font-sans"
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-antique-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-deep-maroon focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1 pt-1 select-none">
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    Strength: <span className="text-ink">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink text-xs font-sans"
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-antique-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-deep-maroon focus:outline-none cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-full h-12 uppercase tracking-widest text-[11px] font-bold flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <span>Create Account</span>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center font-sans">
        <div className="animate-pulse text-antique-gold font-display italic text-2xl">
          Loading Sign In...
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
