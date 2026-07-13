'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import { Loader2, ShieldCheck, LogOut } from 'lucide-react';

export default function AdminClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAdmin, logout } = useAuth();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!loading && !isLoginPage) {
      if (!user || !isAdmin) {
        router.push('/admin/login');
      }
    }
  }, [user, loading, isAdmin, isLoginPage, router]);

  if (isLoginPage) {
    return <div className="min-h-screen bg-ink flex flex-col">{children}</div>;
  }

  // Show loading spinner while session initializes
  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F4F4F5] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-antique-gold font-sans select-none">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm font-semibold tracking-wider uppercase">Verifying Admin Session...</span>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex overflow-hidden">
      {/* Collapsible Admin Sidebar */}
      <AdminSidebar />

      {/* Main Admin Workspace Panel */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-deep-maroon" />
            <span className="font-sans font-bold text-sm tracking-wider uppercase text-ink">
              Kashish Handloom Admin Portal
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-stock-red hover:text-red-600 font-sans font-semibold uppercase tracking-wider cursor-pointer transition-colors focus:outline-none"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </header>

        {/* Content View Area */}
        <main className="flex-1 p-6 overflow-y-auto page-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
