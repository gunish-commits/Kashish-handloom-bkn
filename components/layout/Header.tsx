'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useWishlist } from '../../context/WishlistContext';
import BrandName from '../ui/BrandName';
import { Search, ShoppingCart, Menu, Phone, User, ShieldAlert, Heart } from 'lucide-react';
import MobileNav from './MobileNav';
import { StoreSettings, Product } from '../../types';
import { supabase } from '../../lib/supabase/client';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, triggerCartBounce, clearCart } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const { wishlistIds } = useWishlist();
  const storeSettings = useStoreSettings();
  
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search & Profile States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState<string>('');

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Monitor scroll for sticky compression
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync profile first name if customer is logged in
  useEffect(() => {
    if (user && !isAdmin) {
      supabase
        .from('customer_profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            if (user.user_metadata?.full_name) {
              setProfileName(user.user_metadata.full_name.trim().split(' ')[0]);
            } else {
              setProfileName('Account');
            }
            return;
          }
          if (data?.full_name) {
            setProfileName(data.full_name.trim().split(' ')[0]);
          } else if (user.user_metadata?.full_name) {
            setProfileName(user.user_metadata.full_name.trim().split(' ')[0]);
          } else {
            setProfileName('Account');
          }
        });
    } else {
      setProfileName('');
    }
  }, [user?.id, isAdmin]);

  // Click outside to dismiss account menu
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Live autocomplete search handler
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim().length >= 2) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        fetch(`/api/products?search=${encodeURIComponent(val.trim())}&limit=5`)
          .then(res => (res.ok ? res.json() : { products: [] }))
          .then(data => {
            setSearchResults(data.products || []);
            setShowSearchDropdown(true);
          })
          .catch(() => setSearchResults([]));
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim() !== '') {
      setShowSearchDropdown(false);
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    await logout();
    clearCart();
    router.push('/login');
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Offers', href: '/offers' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const whatsappNum = storeSettings?.primary_whatsapp || '+918209455157';
  const cleanPhone = whatsappNum.replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}`;

  return (
    <>
      <header
        className={`sticky top-0 z-45 w-full bg-ink text-warm-ivory transition-all duration-300 ${
          scrolled ? 'h-14 shadow-lg border-b border-border-dark/35' : 'h-18'
        }`}
      >
        <div className="max-w-7xl mx-auto h-full header-inner">
          {/* 1. Brand Component */}
          <Link href="/" className="header-brand select-none">
            <BrandName size="md" theme="dark" showTagline={false} centered={false} />
          </Link>

          {/* 2. Navigation Links */}
          <nav className="header-nav">
            {navLinks.map(link => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`font-sans font-medium text-xs uppercase tracking-wider relative py-1 transition-colors select-none ${
                    isActive ? 'text-antique-gold' : 'text-warm-ivory/75 hover:text-warm-ivory'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-antique-gold" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 3. Actions & Icons */}
          <div className="header-icons">
            {/* Desktop Actions Wrapper */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Live Search Input */}
              <div className="relative w-44 lg:w-60">
                <input
                  type="text"
                  placeholder="Search bedsheets, curtains..."
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit();
                    }
                  }}
                  className="w-full h-8 pl-8 pr-7 bg-surface-dark border border-border-dark/50 rounded-[4px] text-xs text-warm-ivory placeholder-gray-400 focus:outline-none focus:border-antique-gold focus:ring-0 transition-colors"
                />
                <Search className="w-3.5 h-3.5 text-antique-gold absolute left-2.5 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-warm-ivory text-xs select-none focus:outline-none cursor-pointer"
                  >
                    &times;
                  </button>
                )}

                {/* Autocomplete Suggestions Dropdown */}
                {showSearchDropdown && searchResults.length > 0 && (
                  <div className="absolute top-9 left-0 right-0 bg-ink border border-border-dark/65 rounded-[4px] shadow-lg overflow-hidden z-50 text-xs divide-y divide-border-dark/40">
                    {searchResults.map(p => (
                      <Link
                        key={p.id}
                        href={`/product/${p.slug}`}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center gap-2 p-2 hover:bg-surface-dark/85 transition-colors"
                      >
                        <div className="relative w-8 h-8 shrink-0 bg-surface-mid rounded-sm overflow-hidden">
                          {p.photos && p.photos[0] ? (
                            <Image src={p.photos[0]} alt={p.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-sans font-medium text-warm-ivory truncate">{p.name}</p>
                          <p className="font-mono text-[10px] text-antique-gold">
                            ₹{p.sale_price || p.price}
                          </p>
                        </div>
                      </Link>
                    ))}
                    <Link
                      href={`/shop?search=${encodeURIComponent(searchQuery)}`}
                      onClick={() => {
                        setShowSearchDropdown(false);
                        setSearchQuery('');
                      }}
                      className="block text-center py-2 text-[10px] text-antique-gold hover:text-warm-ivory font-semibold uppercase tracking-wider hover:bg-surface-dark/45"
                    >
                      View All Results
                    </Link>
                  </div>
                )}
              </div>

              {/* Customer Account Icon */}
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="text-warm-ivory hover:text-antique-gold p-1 transition-colors flex items-center gap-1.5 focus:outline-none cursor-pointer"
                  aria-label="User Account Options"
                >
                  <User className="w-[18px] h-[18px]" />
                  {user && !isAdmin && profileName && (
                    <span className="hidden lg:inline font-sans text-xs text-antique-gold font-normal">
                      Hi, {profileName}
                    </span>
                  )}
                </button>

                {/* Account Dropdown Options Menu */}
                {accountMenuOpen && (
                  <div className="absolute right-0 top-8 bg-ink border border-border-dark/65 rounded-[4px] shadow-lg w-40 overflow-hidden z-50 text-xs font-sans">
                    {user ? (
                      <div className="divide-y divide-border-dark/40">
                        {isAdmin ? (
                          <Link
                            href="/admin/dashboard"
                            onClick={() => setAccountMenuOpen(false)}
                            className="block px-4 py-2.5 text-warm-ivory hover:bg-surface-dark/85 hover:text-antique-gold transition-colors font-medium"
                          >
                            Admin Board
                          </Link>
                        ) : (
                          <>
                            <Link
                              href="/account"
                              onClick={() => setAccountMenuOpen(false)}
                              className="block px-4 py-2.5 text-warm-ivory hover:bg-surface-dark/85 hover:text-antique-gold transition-colors"
                            >
                              My Account
                            </Link>
                            <Link
                              href="/account#orders"
                              onClick={() => setAccountMenuOpen(false)}
                              className="block px-4 py-2.5 text-warm-ivory hover:bg-surface-dark/85 hover:text-antique-gold transition-colors"
                            >
                              My Orders
                            </Link>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-rose-400 hover:bg-surface-dark/85 transition-colors cursor-pointer focus:outline-none"
                        >
                          Logout
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-border-dark/40">
                        <Link
                          href="/login"
                          onClick={() => setAccountMenuOpen(false)}
                          className="block px-4 py-2.5 text-warm-ivory hover:bg-surface-dark/85 hover:text-antique-gold transition-colors font-semibold"
                        >
                          Login
                        </Link>
                        <Link
                          href="/signup"
                          onClick={() => setAccountMenuOpen(false)}
                          className="block px-4 py-2.5 text-warm-ivory hover:bg-surface-dark/85 hover:text-antique-gold transition-colors"
                        >
                          Create Account
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wishlist Icon */}
              <Link
                href="/wishlist"
                className="relative text-warm-ivory hover:text-antique-gold p-1 transition-all duration-200 mr-1"
                aria-label="Open wishlist"
              >
                <Heart className="w-[18px] h-[18px]" />
                {wishlistIds.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#FF3B30] text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistIds.length}
                  </span>
                )}
              </Link>

              {/* Cart Icon with Bounce */}
              <Link
                href="/cart"
                className={`relative text-warm-ivory hover:text-antique-gold p-1 transition-all duration-200 ${
                  triggerCartBounce ? 'scale-125 text-antique-gold' : 'scale-100'
                }`}
                aria-label="Open shopping cart"
              >
                <ShoppingCart className="w-[18px] h-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-antique-gold text-ink font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Phone/WhatsApp Icon */}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-warm-ivory hover:text-[#25D366] p-1 transition-colors"
                aria-label="Contact store on WhatsApp"
              >
                <Phone className="w-[18px] h-[18px]" />
              </a>
            </div>

            {/* Mobile-only Hamburger Button (Far Right, nothing else in between) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-warm-ivory hover:text-antique-gold p-1.5 transition-colors cursor-pointer"
              aria-label="Open menu drawer"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
