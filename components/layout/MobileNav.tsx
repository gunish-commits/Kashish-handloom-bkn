'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { X, LogOut, User } from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Offers', href: '/offers' },
    { name: 'Cart', href: '/cart' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-ink flex flex-col p-6 animate-fadeIn">
      {/* Close Drawer Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="text-warm-ivory hover:text-antique-gold p-2 transition-colors cursor-pointer"
          aria-label="Close menu"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      {/* Menu Stacked Links */}
      <nav className="flex-1 flex flex-col items-center justify-center space-y-8 -mt-10">
        {navLinks.map(link => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={onClose}
              className={`font-display text-3xl tracking-widest transition-colors ${
                isActive ? 'text-antique-gold font-normal' : 'text-warm-ivory hover:text-[#d3a950]'
              }`}
            >
              {link.name}
            </Link>
          );
        })}

        <div className="w-16 h-[1px] bg-border-dark my-4" />

        {/* Customer Account Session Options */}
        {user ? (
          <div className="flex flex-col items-center space-y-4">
            <Link
              href="/account"
              onClick={onClose}
              className={`font-sans text-base tracking-wider flex items-center gap-2 transition-colors ${
                pathname === '/account' ? 'text-antique-gold' : 'text-warm-ivory hover:text-antique-gold'
              }`}
            >
              <User className="w-4 h-4" />
              <span>MY ACCOUNT</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="font-sans text-base tracking-wider text-stock-red hover:text-red-400 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>LOG OUT</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={onClose}
            className="font-sans text-xs tracking-widest text-warm-ivory hover:text-ink hover:bg-warm-ivory border border-warm-ivory/20 px-6 py-2.5 rounded-[4px] uppercase transition-all duration-200"
          >
            SIGN IN / SIGN UP
          </Link>
        )}
      </nav>

      {/* Mobile Branding Footer */}
      <div className="text-center font-sans mt-auto">
        <p className="font-display text-[#8c745b] text-lg italic tracking-widest mb-1">
          Kashish Handloom
        </p>
        <p className="text-[10px] text-gray-500 tracking-wider uppercase">
          Est. 1976 · Bikaner, Rajasthan
        </p>
      </div>
    </div>
  );
}
