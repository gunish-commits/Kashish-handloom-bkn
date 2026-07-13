'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../../context/CartContext';
import BrandName from '../../../components/ui/BrandName';
import Button from '../../../components/ui/Button';
import Divider from '../../../components/ui/Divider';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function OrderConfirmedPage() {
  const { clearCart } = useCart();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Wipe shopping cart from memory
    clearCart();
    
    // 2. Fetch stashed Order ID
    const stashedId = sessionStorage.getItem('kh_confirmed_order_id');
    if (stashedId) {
      setOrderId(stashedId);
      // Clean up session storage
      sessionStorage.removeItem('kh_confirmed_order_id');
      sessionStorage.removeItem('kh_checkout_pincode');
      sessionStorage.removeItem('kh_checkout_delivery');
    }
  }, [clearCart]);

  return (
    <div className="flex-1 bg-ink text-warm-ivory flex flex-col justify-center items-center py-16 px-4 select-none text-center">
      {/* Centered Brand Text */}
      <div className="flex flex-col items-center justify-center mb-8 select-none">
        <BrandName size="lg" theme="dark" showTagline={false} centered={true} />
      </div>
      {/* CSS Animations style block for checkmark circle drawing */}
      <style>{`
        .checkmark__circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-width: 2;
          stroke-miterlimit: 10;
          stroke: #B8892A;
          fill: none;
          animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .checkmark {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: block;
          stroke-width: 2.5;
          stroke: #FAF7F2;
          stroke-miterlimit: 10;
          margin: 0 auto 24px auto;
          box-shadow: inset 0px 0px 0px #B8892A;
          animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s forwards;
        }
        .checkmark__check {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }
        @keyframes stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes scale {
          0%, 100% {
            transform: none;
          }
          50% {
            transform: scale3d(1.1, 1.1, 1);
          }
        }
        @keyframes fill {
          100% {
            box-shadow: inset 0px 0px 0px 40px #B8892A;
          }
        }
      `}</style>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Animated Checkmark Icon */}
        <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
          <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
          <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
        </svg>

        {/* Headings */}
        <div className="space-y-3">
          <h1 className="font-display font-light text-3xl md:text-5xl text-warm-ivory leading-tight">
            Order Sent to WhatsApp!
          </h1>
          <p className="font-sans text-xs md:text-sm text-pale-linen/70 max-w-md mx-auto leading-relaxed">
            Thank you for shopping with us. We have opened a WhatsApp chat with your order details.
          </p>
        </div>

        {/* Order ID Panel */}
        {orderId && (
          <div className="bg-surface-dark border border-border-dark/60 rounded-[4px] py-3.5 px-6 inline-block">
            <span className="font-sans text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Order ID</span>
            <span className="font-mono text-antique-gold font-bold text-base md:text-lg tracking-wider">
              {orderId}
            </span>
          </div>
        )}

        <p className="font-sans text-xs text-pale-linen/60 max-w-sm mx-auto leading-relaxed">
          Our team will review your cart items and send an instant order confirmation on WhatsApp within a few hours.
        </p>

        {/* Ornament divider */}
        <Divider className="my-6" />

        {/* Bikaner store contact coordinates */}
        <div className="bg-[#1E140C] border border-[#2F1D11] rounded-[4px] p-5 space-y-3.5 max-w-md mx-auto text-left text-xs md:text-sm text-pale-linen/80">
          <p className="font-semibold text-warm-ivory border-b border-border-dark/50 pb-2 uppercase text-xs tracking-wider">
            Need Help with your order?
          </p>
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-antique-gold shrink-0" />
            <span className="font-mono">+91 8209455157 / +91 7976924013</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-antique-gold shrink-0" />
            <span className="break-all">kashishhandloombkn@gmail.com</span>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-antique-gold shrink-0 mt-0.5" />
            <span>Jinnah Road, Coatagate, Near New Taj Hotel, Bikaner, Rajasthan 334001</span>
          </div>
        </div>

        {/* Primary CTA button */}
        <div className="pt-6">
          <Button
            variant="outline-dark"
            href="/shop"
            className="h-11 uppercase tracking-widest text-[11px] font-semibold px-8"
          >
            Continue Shopping
          </Button>
        </div>

        {/* Branded warm closing line */}
        <p className="font-sans italic text-sm text-pale-linen text-center mt-8 max-w-sm mx-auto">
          "Thank you for choosing Kashish Handloom. We're packing your order with love."
        </p>
      </div>
    </div>
  );
}
