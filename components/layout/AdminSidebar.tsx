'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import BrandName from '../ui/BrandName';
import {
  LayoutDashboard,
  ShoppingBag,
  Grid,
  Tag,
  Receipt,
  AlertCircle,
  TrendingUp,
  Truck,
  Settings,
  LogOut,
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: ShoppingBag },
    { name: 'Categories', href: '/admin/categories', icon: Grid },
    { name: 'Offers', href: '/admin/offers', icon: Tag },
    { name: 'Orders', href: '/admin/orders', icon: Receipt },
    { name: 'Complaints', href: '/admin/complaints', icon: AlertCircle },
    { name: 'Stock', href: '/admin/stock', icon: TrendingUp },
    { name: 'Delivery', href: '/admin/delivery', icon: Truck },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };
  return (
    <aside className="w-16 md:w-60 bg-surface-dark border-r border-border-dark flex flex-col shrink-0 transition-all duration-300 z-30">
      {/* Admin Branding Header */}
      <div className="bg-[#1A110A] py-5 px-4 select-none flex flex-col items-center justify-center gap-1.5 border-b border-border-dark/30 hidden md:flex">
        <BrandName size="sm" theme="dark" showTagline={false} centered={true} />
        <span className="font-sans font-normal text-[9px] text-antique-gold tracking-[0.12em] text-center uppercase whitespace-nowrap mt-1">
          Admin Portal
        </span>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 md:px-6 py-3 font-sans text-xs md:text-sm font-medium tracking-wider transition-all border-l-[3px] select-none ${
                isActive
                  ? 'bg-surface-mid text-antique-gold border-deep-maroon'
                  : 'text-warm-ivory/60 hover:text-warm-ivory hover:bg-surface-mid/40 border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-border-dark">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-2.5 md:px-4 py-3 font-sans text-xs md:text-sm font-medium tracking-wider text-[#ea5b5b] hover:text-[#ff7474] hover:bg-red-950/10 rounded-[4px] cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </aside>
  );
}
