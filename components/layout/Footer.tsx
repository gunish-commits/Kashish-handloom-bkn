'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category, StoreSettings } from '../../types';
import Divider from '../ui/Divider';
import { Phone, Mail, MapPin, Instagram, MessageCircle } from 'lucide-react';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import BrandName from '../ui/BrandName';

export default function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);
  const settings = useStoreSettings();

  useEffect(() => {
    fetch('/api/categories')
      .then(res => (res.ok ? res.json() : []))
      .then(data => setCategories(data.slice(0, 6)))
      .catch(() => {});
  }, []);

  const primaryWa = settings?.primary_whatsapp || '+918209455157';
  const cleanWa = primaryWa.replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanWa.length === 10 ? `91${cleanWa}` : cleanWa}`;

  return (
    <footer className="bg-ink text-warm-ivory/70 pt-16 pb-8 border-t border-border-dark/60 mt-auto font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Footer Top Branding */}
        <div className="footer-brand-section select-none">
          <BrandName size="lg" theme="dark" showTagline={true} centered={true} />
          <div className="text-antique-gold/40 text-xs tracking-widest mt-5 mb-8">
            ────── ✦ ──────
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-12">
          {/* Quick Links Column */}
          <div className="space-y-4">
            <h3 className="font-sans font-medium text-[11px] text-antique-gold uppercase tracking-[0.15em]">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-xs tracking-wider">
              <li>
                <Link href="/" className="hover:text-warm-ivory transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-warm-ivory transition-colors">Shop Catalog</Link>
              </li>
              <li>
                <Link href="/offers" className="hover:text-warm-ivory transition-colors">Current Offers</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-warm-ivory transition-colors">Our Story</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-warm-ivory transition-colors">Contact Details</Link>
              </li>
            </ul>
          </div>

          {/* Categories/Collections Column */}
          <div className="space-y-4">
            <h3 className="font-sans font-medium text-[11px] text-antique-gold uppercase tracking-[0.15em]">
              Collections
            </h3>
            <ul className="space-y-2.5 text-xs tracking-wider">
              {categories.length > 0 ? (
                categories.map(cat => (
                  <li key={cat.id}>
                    <Link href={`/shop/${cat.slug}`} className="hover:text-warm-ivory transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link href="/shop/bedsheets" className="hover:text-warm-ivory transition-colors">Bedsheets</Link></li>
                  <li><Link href="/shop/curtains" className="hover:text-warm-ivory transition-colors">Curtains</Link></li>
                  <li><Link href="/shop/blankets" className="hover:text-warm-ivory transition-colors">Blankets</Link></li>
                  <li><Link href="/shop/comforters" className="hover:text-warm-ivory transition-colors">Comforters</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Contact Details Column */}
          <div className="space-y-4">
            <h3 className="font-sans font-medium text-[11px] text-antique-gold uppercase tracking-[0.15em]">
              Contact Info
            </h3>
            <ul className="space-y-3 text-xs tracking-wider">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-antique-gold shrink-0" />
                <a
                  href={`tel:${settings?.primary_whatsapp || '+918209455157'}`}
                  className="hover:text-warm-ivory transition-colors font-mono"
                >
                  {settings?.primary_whatsapp || '+91 8209455157'}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-antique-gold shrink-0" />
                <a
                  href={`tel:${settings?.alt_phone || '+917976924013'}`}
                  className="hover:text-warm-ivory transition-colors font-mono"
                >
                  {settings?.alt_phone || '+91 7976924013'}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-antique-gold shrink-0" />
                <a
                  href={`mailto:${settings?.email || 'kashishhandloombkn@gmail.com'}`}
                  className="hover:text-warm-ivory transition-colors break-all"
                >
                  {settings?.email || 'kashishhandloombkn@gmail.com'}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-antique-gold shrink-0 mt-0.5" />
                <span className="leading-normal">
                  {settings?.address ||
                    'Jinnah Road, Coatagate, Near New Taj Hotel, Bikaner, Rajasthan 334001'}
                </span>
              </li>
            </ul>
          </div>

          {/* Follow Us & Social Media Column */}
          <div className="space-y-4">
            <h3 className="font-sans font-medium text-[11px] text-antique-gold uppercase tracking-[0.15em]">
              Follow Us
            </h3>
            <div className="flex flex-col gap-2.5 text-xs tracking-wider">
              <a
                href={settings?.instagram_url || 'https://www.instagram.com/kashish_handlooom'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-warm-ivory transition-colors"
              >
                <Instagram className="w-3.5 h-3.5 text-antique-gold" />
                <span>@kashish_handlooom</span>
              </a>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#25D366] transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-antique-gold" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
            <div className="pt-2 text-xs">
              <p className="text-[10px] uppercase text-antique-gold tracking-wider font-semibold mb-0.5">
                Business Hours
              </p>
              <p className="text-warm-ivory/60 leading-relaxed whitespace-pre-line text-[11px]">
                {settings?.business_hours ||
                  'Mon–Sat: 10:00 AM – 8:00 PM\nSun: 11:00 AM – 6:00 PM'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="border-t border-border-dark/50 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-4 select-none">
          <p>© 2026 Kashish Handloom. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-warm-ivory transition-colors">Our Story</Link>
            <Link href="/contact" className="hover:text-warm-ivory transition-colors">Location Map</Link>
            <Link
              href="/admin/login"
              className="text-[#444] hover:text-[#444] font-sans text-[12px] font-normal"
            >
              [Admin]
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
