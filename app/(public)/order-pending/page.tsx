'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Button from '../../../components/ui/Button';
import BrandName from '../../../components/ui/BrandName';

function OrderPendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id') || '';
  const [hasMessage, setHasMessage] = useState(false);

  useEffect(() => {
    if (!orderId) {
      router.push('/shop');
      return;
    }
    // Check if we have the message saved in session storage
    const msg = sessionStorage.getItem(`order_msg_${orderId}`);
    if (msg) {
      setHasMessage(true);

      // Auto-redirect to WhatsApp on first load (with 800ms delay to bypass popup/webview blocks)
      const hasAutoRedirected = sessionStorage.getItem(`redirected_${orderId}`);
      if (!hasAutoRedirected) {
        sessionStorage.setItem(`redirected_${orderId}`, 'true');
        const timer = setTimeout(() => {
          window.location.href = `https://api.whatsapp.com/send?phone=918209455157&text=${msg}`;
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [orderId, router]);

  const handleResendWhatsApp = () => {
    const storedMsg = sessionStorage.getItem(`order_msg_${orderId}`);
    if (storedMsg) {
      window.open(`https://api.whatsapp.com/send?phone=918209455157&text=${storedMsg}`, '_blank');
    } else {
      // Fallback: If session storage was lost, open a standard enquiry to Jinnah road store
      window.open(
        `https://api.whatsapp.com/send?phone=918209455157&text=${encodeURIComponent(
          `Hello, I would like to confirm my order ID: *${orderId}* with Kashish Handloom.`
        )}`,
        '_blank'
      );
    }
  };

  return (
    <div className="flex-1 bg-ink text-warm-ivory flex flex-col justify-center items-center py-16 px-4 select-none text-center">
      <div className="max-w-xl mx-auto space-y-8">
        
        {/* Centered Brand Text */}
        <div className="flex flex-col items-center justify-center select-none">
          <BrandName size="lg" theme="dark" showTagline={false} centered={true} />
        </div>

        {/* Status Title & ID */}
        <div className="space-y-3">
          <h1 className="font-display font-light text-3xl md:text-[36px] text-warm-ivory leading-tight flex items-center justify-center gap-2">
            <span className="text-antique-gold animate-pulse">⏳</span> Order Sent to WhatsApp!
          </h1>
          <p className="font-sans text-xs md:text-sm text-pale-linen/80 max-w-md mx-auto leading-relaxed">
            Your order <strong className="text-antique-gold font-mono tracking-wider">{orderId}</strong> has been submitted.
          </p>
        </div>

        {/* Elegant Text Ornament Divider */}
        <div className="text-antique-gold/30 text-xs tracking-widest py-1">
          ────── ✦ ──────
        </div>

        {/* "What Happens Next" Steps */}
        <div className="text-left bg-surface-dark border border-border-dark/30 rounded-[4px] p-6 space-y-6 max-w-md mx-auto">
          <h3 className="font-display font-semibold text-sm text-antique-gold uppercase tracking-wider border-b border-border-dark/30 pb-2">
            What happens next?
          </h3>
          
          <div className="space-y-5 font-sans text-sm text-pale-linen/90 leading-relaxed">
            <div className="flex gap-4">
              <span className="text-base shrink-0 select-none">📱</span>
              <div>
                <p className="font-semibold text-warm-ivory text-[15px]">Step 1 — Send the WhatsApp message</p>
                <p className="text-xs text-pale-linen/70 mt-0.5">
                  The WhatsApp app has opened with your order details. Please **SEND** the message to complete your order.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-base shrink-0 select-none">✅</span>
              <div>
                <p className="font-semibold text-warm-ivory text-[15px]">Step 2 — We confirm your order</p>
                <p className="text-xs text-pale-linen/70 mt-0.5">
                  Once we receive your message, we'll verify stock availability and confirm your order within a few hours.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-base shrink-0 select-none">📦</span>
              <div>
                <p className="font-semibold text-warm-ivory text-[15px]">Step 3 — We pack & ship</p>
                <p className="text-xs text-pale-linen/70 mt-0.5">
                  After confirmation, we will pack your order with love and dispatch it straight to your address.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Elegant Text Ornament Divider */}
        <div className="text-antique-gold/30 text-xs tracking-widest py-1">
          ────── ✦ ──────
        </div>

        {/* Warning Callout Box */}
        <div className="bg-[#251b10] border border-[#3e2b18] rounded-[4px] p-4 text-left max-w-md mx-auto">
          <p className="font-sans text-xs md:text-sm text-[#FFB020] leading-relaxed flex items-start gap-2.5">
            <span className="shrink-0 text-base">⚠️</span>
            <span>
              <strong>Important:</strong> Your order is **NOT** confirmed yet. Please make sure you SEND the WhatsApp message. Orders not sent within 24 hours will be cancelled automatically.
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <button
            type="button"
            onClick={handleResendWhatsApp}
            className="w-full sm:w-auto h-11 bg-[#25D366] hover:bg-[#20ba59] text-white font-sans font-bold uppercase tracking-wider text-[11px] px-8 rounded-[4px] flex items-center justify-center gap-2 shadow-lg shadow-[#25d366]/10 hover:shadow-[#25d366]/25 transition-all cursor-pointer border-none focus:outline-none animate-pulse-whatsapp"
          >
            <span>📱</span> Send Order to WhatsApp
          </button>

          <Button
            variant="outline-dark"
            href="/shop"
            className="w-full sm:w-auto h-11 uppercase tracking-widest text-[11px] font-semibold px-8 border border-border-dark/60 text-pale-linen hover:bg-surface-dark transition-colors"
          >
            Continue Shopping →
          </Button>
        </div>

      </div>
    </div>
  );
}

export default function OrderPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ink flex flex-col items-center justify-center">
          <div className="animate-pulse text-antique-gold uppercase font-sans tracking-widest text-xs">
            Loading Order Status...
          </div>
        </div>
      }
    >
      <OrderPendingContent />
    </Suspense>
  );
}
