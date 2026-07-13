'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../../../context/CartContext';
import CartItemComponent from '../../../components/cart/CartItem';
import OfferBanner from '../../../components/cart/OfferBanner';
import Button from '../../../components/ui/Button';
import { formatPrice } from '../../../lib/utils';
import { getDeliveryCharge } from '../../../lib/delivery';
import { ShieldCheck, ShoppingBag, MapPin, Loader2 } from 'lucide-react';

export default function CartPage() {
  const { cartItems, subtotal, offerApplied, discount } = useCart();

  // Pincode and Delivery state
  const [pincode, setPincode] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState<number | null>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState('');

  // Load previous pincode from sessionStorage if available
  useEffect(() => {
    const savedPincode = sessionStorage.getItem('kh_checkout_pincode');
    if (savedPincode) {
      setPincode(savedPincode);
    }
  }, []);

  // Run live delivery checker when pincode changes
  useEffect(() => {
    const cleanPin = pincode.replace(/\D/g, '');
    
    if (cleanPin.length === 6) {
      setPincodeError('');
      setCheckingPincode(true);
      
      getDeliveryCharge(cleanPin, subtotal - discount)
        .then(charge => {
          setDeliveryCharge(charge);
          sessionStorage.setItem('kh_checkout_pincode', cleanPin);
          sessionStorage.setItem('kh_checkout_delivery', charge.toString());
          setCheckingPincode(false);
        })
        .catch(err => {
          console.error(err);
          setPincodeError('Failed to verify delivery rates.');
          setCheckingPincode(false);
        });
    } else {
      setDeliveryCharge(null);
      if (pincode.length > 0 && cleanPin.length !== 6) {
        setPincodeError('Pincode must be exactly 6 digits.');
      } else {
        setPincodeError('');
      }
    }
  }, [pincode, subtotal, discount]);

  // If cart is empty, show empty illustration
  if (cartItems.length === 0) {
    return (
      <div className="flex-1 bg-[#FAF7F2] py-20 px-4 flex flex-col items-center justify-center text-center select-none">
        <div className="w-20 h-20 rounded-full bg-warm-ivory border border-[#dfd6be]/30 flex items-center justify-center text-3xl text-antique-gold mb-6 shadow-[0_6px_20px_rgba(184,137,42,0.06)] animate-pulse">
          🛍️
        </div>
        <h2 className="font-display font-light text-2xl md:text-3.5xl italic text-ink mb-3">
          Your cart is empty
        </h2>
        <p className="font-sans text-xs md:text-sm text-gray-500 max-w-sm mb-8 leading-relaxed">
          Looks like you haven't added any premium handloom bedsheets, comforters, or curtains yet. Explore our traditional Rajasthani collections!
        </p>
        <Button
          variant="primary"
          href="/shop"
          className="uppercase tracking-widest text-xs h-12 font-semibold px-8"
        >
          Continue Shopping
        </Button>
      </div>
    );
  }

  // Calculate values
  const activeDelivery = deliveryCharge !== null ? deliveryCharge : 99; // Default fallback flat rate
  const grandTotal = subtotal - discount + activeDelivery;

  return (
    <div className="flex-1 bg-[#FAF7F2] pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        
        {/* Page title */}
        <div className="space-y-2 border-b border-gray-150 pb-4">
          <h1 className="font-display font-light text-3xl md:text-5xl italic text-ink">
            Shopping Cart
          </h1>
          <p className="font-sans text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-medium">
            Review your handloom choices before checkout
          </p>
        </div>

        {/* Dynamic Offer discounts announcement banner */}
        <OfferBanner offer={offerApplied} />

        {/* Cart Layout (60/40 desktop, stacked mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Cart Items list (Left 60%) */}
          <div className="lg:col-span-7 bg-white p-4 md:p-6 border border-gray-100 rounded-[4px] shadow-[0_2px_8px_rgba(15,10,5,0.03)] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-2">
              <ShoppingBag className="w-5 h-5 text-antique-gold" />
              <h3 className="font-sans font-semibold text-sm text-ink uppercase tracking-wider">
                Cart Items ({cartItems.reduce((sum, i) => sum + i.quantity, 0)})
              </h3>
            </div>
            
            <div className="divide-y divide-gray-100">
              {cartItems.map(item => (
                <CartItemComponent key={item.product_id} item={item} />
              ))}
            </div>
          </div>

          {/* Order Summary panel (Right 40%) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 border border-gray-100 rounded-[4px] shadow-[0_2px_8px_rgba(15,10,5,0.03)] space-y-5">
              <h3 className="font-sans font-semibold text-sm text-ink uppercase tracking-wider pb-3 border-b border-gray-100">
                Order Summary
              </h3>

              {/* Invoice lines */}
              <div className="space-y-3 font-sans text-xs md:text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-ink">{formatPrice(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-[#358f5c] font-medium">
                    <span>Campaign Discount</span>
                    <span className="font-mono">-{formatPrice(discount)}</span>
                  </div>
                )}

                {/* Delivery Charge with live pincode checker */}
                <div className="space-y-2.5 pt-2 border-t border-gray-50">
                  <div className="flex justify-between items-baseline">
                    <span className="flex items-center gap-1">
                      <span>Delivery Charge</span>
                    </span>
                    <span className="font-mono text-ink">
                      {checkingPincode ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-antique-gold inline" />
                      ) : deliveryCharge === 0 ? (
                        <span className="text-[#358f5c] font-medium uppercase text-xs tracking-wider">Free Delivery</span>
                      ) : (
                        formatPrice(activeDelivery)
                      )}
                    </span>
                  </div>

                  {/* Pincode input */}
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit Delivery Pincode"
                      value={pincode}
                      onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-9 pl-9 pr-4 border border-gray-200 rounded-[4px] text-xs font-sans text-ink focus:outline-none focus:border-deep-maroon bg-white"
                    />
                    <MapPin className="w-4 h-4 text-antique-gold absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {pincodeError && (
                    <p className="text-[10px] text-stock-red font-medium leading-none">
                      {pincodeError}
                    </p>
                  )}
                  {deliveryCharge !== null && !pincodeError && (
                    <p className="text-[10px] text-[#358f5c] font-medium leading-none flex items-center gap-1">
                      <span>✓</span>
                      <span>Rates loaded for pincode {pincode}.</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Grand Total: DM Mono 600, 20px, --deep-maroon */}
              <div className="flex justify-between items-baseline pt-4 border-t border-gray-150">
                <span className="font-sans font-bold text-sm text-ink uppercase tracking-wider">
                  Grand Total
                </span>
                <span className="font-mono font-bold text-lg md:text-xl text-deep-maroon">
                  {formatPrice(grandTotal)}
                </span>
              </div>

              {/* Checkout Trigger */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  href="/checkout"
                  className="w-full h-12 uppercase tracking-widest text-[11px] font-semibold"
                >
                  Proceed to Order
                </Button>
              </div>

              {/* Security note */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-sans border-t border-gray-50 pt-3">
                <ShieldCheck className="w-4 h-4 text-[#2E7D52] shrink-0" />
                <span>Secure WhatsApp Order · No payment required now</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
