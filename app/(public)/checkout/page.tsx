'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/ui/Button';
import { formatPrice, generateOrderId, INDIAN_STATES } from '../../../lib/utils';
import { getDeliveryCharge } from '../../../lib/delivery';
import { buildWhatsAppMessage, getWhatsAppLink } from '../../../lib/whatsapp';
import { ShieldCheck, MessageCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase/client';

interface FormFields {
  fullName: string;
  phone: string;
  altPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

function CheckoutContent() {
  const router = useRouter();
  const { cartItems, subtotal, offerApplied, discount, clearCart } = useCart();
  const { user, token } = useAuth();

  // Form Fields
  const [formData, setFormData] = useState<FormFields>({
    fullName: '',
    phone: '',
    altPhone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Rajasthan', // Default Indian state
    pincode: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateProfileAddress, setUpdateProfileAddress] = useState(false);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);

  // Delivery Charges State
  const [deliveryCharge, setDeliveryCharge] = useState(99);
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  // Redirect if cart is empty on checkout load
  useEffect(() => {
    if (cartItems.length === 0 && !isOrderCompleted) {
      router.push('/cart');
    }
  }, [cartItems, router, isOrderCompleted]);

  // Load pre-fill data: pincode from sessionStorage, or customer profile if user is authenticated
  useEffect(() => {
    // 1. Check if we already computed pincode/delivery in the cart step
    const savedPincode = sessionStorage.getItem('kh_checkout_pincode') || '';
    const savedDelivery = sessionStorage.getItem('kh_checkout_delivery');
    
    if (savedPincode) {
      setFormData(prev => ({ ...prev, pincode: savedPincode }));
    }
    if (savedDelivery) {
      setDeliveryCharge(parseFloat(savedDelivery));
    }

    // 2. If user is authenticated, query customer profile to auto-fill shipping fields
    if (user) {
      supabase
        .from('customer_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching profile for pre-fill:', error);
            return;
          }
          if (data) {
            setFormData(prev => ({
              ...prev,
              fullName: data.full_name || prev.fullName || '',
              phone: data.phone || prev.phone || '',
              altPhone: data.alt_phone || prev.altPhone || '',
              addressLine1: data.address_line1 || prev.addressLine1 || '',
              addressLine2: data.address_line2 || prev.addressLine2 || '',
              city: data.city || prev.city || '',
              state: data.state || prev.state || 'Rajasthan',
              pincode: data.pincode || savedPincode || prev.pincode || '',
            }));
          } else {
            // Fallback to auth metadata if profile row isn't fully created
            setFormData(prev => ({
              ...prev,
              fullName: user.user_metadata?.full_name || prev.fullName || '',
              phone: user.user_metadata?.phone || prev.phone || '',
            }));
          }
        });
    }
  }, [user]);

  // Live delivery rate checker based on pincode input
  useEffect(() => {
    const cleanPin = formData.pincode.replace(/\D/g, '');
    if (cleanPin.length === 6) {
      setLoadingDelivery(true);
      getDeliveryCharge(cleanPin, subtotal - discount)
        .then(charge => {
          setDeliveryCharge(charge);
          sessionStorage.setItem('kh_checkout_pincode', cleanPin);
          sessionStorage.setItem('kh_checkout_delivery', charge.toString());
          setLoadingDelivery(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingDelivery(false);
        });
    }
  }, [formData.pincode, subtotal, discount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const tempErrors: FormErrors = {};
    let isValid = true;

    if (!formData.fullName.trim()) {
      tempErrors.fullName = 'Full Name is required.';
      isValid = false;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      tempErrors.phone = 'Mobile Number must be exactly 10 digits.';
      isValid = false;
    }

    if (!formData.addressLine1.trim()) {
      tempErrors.addressLine1 = 'Address is required.';
      isValid = false;
    }

    if (!formData.city.trim()) {
      tempErrors.city = 'City/Village is required.';
      isValid = false;
    }

    if (!formData.state) {
      tempErrors.state = 'State is required.';
      isValid = false;
    }

    const cleanPin = formData.pincode.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      tempErrors.pincode = 'Pincode must be exactly 6 digits.';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const orderId = generateOrderId();
      const orderPayload = {
        id: orderId,
        customer_name: formData.fullName.trim(),
        customer_phone: formData.phone.replace(/\D/g, ''),
        customer_alt_phone: formData.altPhone ? formData.altPhone.replace(/\D/g, '') : null,
        address_line1: formData.addressLine1.trim(),
        address_line2: formData.addressLine2.trim() || null,
        city: formData.city.trim(),
        state: formData.state,
        pincode: formData.pincode.replace(/\D/g, ''),
        items: cartItems.map(item => ({
          product_id: item.product_id,
          category_id: item.category_id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          photo: item.photo,
          return_policy: item.return_policy,
        })),
        offer_applied: offerApplied
          ? {
              offer_id: offerApplied.offer_id,
              title: offerApplied.title,
              discount: offerApplied.discount,
            }
          : null,
        subtotal: subtotal,
        delivery_charge: deliveryCharge,
        grand_total: subtotal - discount + deliveryCharge,
      };

      // 1. Call public API endpoint to persist order and decrement stock
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to place order.');
      }

      // If checked and customer is logged in, sync/save address details to customer_profiles table
      if (user && updateProfileAddress) {
        const cleanPhone = formData.phone.replace(/\D/g, '');
        const cleanAlt = formData.altPhone ? formData.altPhone.replace(/\D/g, '') : null;
        await supabase
          .from('customer_profiles')
          .upsert({
            id: user.id,
            full_name: formData.fullName.trim(),
            phone: cleanPhone,
            alt_phone: cleanAlt,
            address_line1: formData.addressLine1.trim(),
            address_line2: formData.addressLine2.trim() || null,
            city: formData.city.trim(),
            state: formData.state,
            pincode: formData.pincode.replace(/\D/g, ''),
            updated_at: new Date().toISOString(),
          });
      }

      // 2. Build WhatsApp deep link message template
      const formattedMessage = buildWhatsAppMessage({
        orderId: orderId,
        customerName: orderPayload.customer_name,
        customerPhone: orderPayload.customer_phone,
        customerAltPhone: orderPayload.customer_alt_phone,
        addressLine1: orderPayload.address_line1,
        addressLine2: orderPayload.address_line2,
        city: orderPayload.city,
        state: orderPayload.state,
        pincode: orderPayload.pincode,
        items: cartItems,
        offerApplied: offerApplied,
        subtotal: subtotal,
        deliveryCharge: deliveryCharge,
        grandTotal: orderPayload.grand_total,
        baseUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
      });

      // 3. Mark order as completed to prevent empty-cart redirect
      setIsOrderCompleted(true);

      // 4. Store message in localStorage and set redirect flag
      localStorage.setItem(`order_msg_${orderId}`, encodeURIComponent(formattedMessage));
      localStorage.setItem(`redirected_${orderId}`, 'true');
      
      // 5. Clear cart
      clearCart();

      // 6. Direct WhatsApp Link (uses api.whatsapp.com for best mobile compatibility)
      const waLink = `https://api.whatsapp.com/send?phone=918209455157&text=${encodeURIComponent(formattedMessage)}`;

      // 7. Update browser history state to /order-pending so going back loads it!
      window.history.pushState(null, '', `/order-pending?id=${orderId}`);

      // 8. Redirect current tab directly to WhatsApp (never blocked by popup filters)
      window.location.href = waLink;
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An error occurred during order submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const grandTotal = subtotal - discount + deliveryCharge;

  return (
    <div className="flex-1 bg-[#FAF7F2] pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
        
        {/* Navigation back triggers */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-deep-maroon font-sans font-medium uppercase tracking-wider select-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cart</span>
        </Link>

        {/* Page Headings */}
        <div className="space-y-1 pb-4 border-b border-gray-150">
          <h1 className="font-display font-light text-3xl md:text-5xl italic text-ink">
            Checkout Details
          </h1>
          <p className="font-sans text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-medium">
            Confirm shipping address & place order via WhatsApp
          </p>
        </div>

        {/* Forms layout container (Form left 60%, summary right 40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Customer Shipping Form (Left 60%) */}
          <div className="lg:col-span-7 bg-white p-5 md:p-6 border border-gray-100 rounded-[4px] shadow-[0_2px_8px_rgba(15,10,5,0.03)]">
            <h3 className="font-sans font-semibold text-sm text-ink uppercase tracking-wider pb-3 border-b border-gray-100 mb-6">
              Customer Shipping Address
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 font-sans text-sm">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`w-full h-11 px-3 border rounded-[4px] focus:outline-none focus:border-deep-maroon ${
                    errors.fullName ? 'border-stock-red' : 'border-gray-200'
                  }`}
                  placeholder="e.g. Kishan Lal Ahuja"
                />
                {errors.fullName && <p className="text-[10px] text-stock-red font-medium leading-none">{errors.fullName}</p>}
              </div>

              {/* Phone fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Primary phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Mobile Number (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    maxLength={10}
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full h-11 px-3 border rounded-[4px] focus:outline-none focus:border-deep-maroon ${
                      errors.phone ? 'border-stock-red' : 'border-gray-200'
                    }`}
                    placeholder="10-digit number"
                  />
                  {errors.phone && <p className="text-[10px] text-stock-red font-medium leading-none">{errors.phone}</p>}
                </div>

                {/* Alternate phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Alternate Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    name="altPhone"
                    maxLength={10}
                    value={formData.altPhone}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon"
                    placeholder="Secondary contact"
                  />
                </div>
              </div>

              {/* Address 1 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Address Line 1 (House No, Building, Street) *
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  className={`w-full h-11 px-3 border rounded-[4px] focus:outline-none focus:border-deep-maroon ${
                    errors.addressLine1 ? 'border-stock-red' : 'border-gray-200'
                  }`}
                  placeholder="Street address details"
                />
                {errors.addressLine1 && <p className="text-[10px] text-stock-red font-medium leading-none">{errors.addressLine1}</p>}
              </div>

              {/* Address 2 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Address Line 2 (Landmark, Area)
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  className="w-full h-11 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon"
                  placeholder="Apartment, suite, landmark, etc."
                />
              </div>

              {/* City / State / Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* City */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    City / Village *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full h-11 px-3 border rounded-[4px] focus:outline-none focus:border-deep-maroon ${
                      errors.city ? 'border-stock-red' : 'border-gray-200'
                    }`}
                    placeholder="Bikaner"
                  />
                  {errors.city && <p className="text-[10px] text-stock-red font-medium leading-none">{errors.city}</p>}
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    State / UT *
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white cursor-pointer"
                  >
                    {INDIAN_STATES.map(st => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pincode */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className={`w-full h-11 px-3 border rounded-[4px] focus:outline-none focus:border-deep-maroon ${
                      errors.pincode ? 'border-stock-red' : 'border-gray-200'
                    }`}
                    placeholder="6 digits"
                  />
                  {errors.pincode && <p className="text-[10px] text-stock-red font-medium leading-none">{errors.pincode}</p>}
                </div>
              </div>

              {/* Profile Address Update Checkbox (Only if user is logged in) */}
              {user && (
                <div className="flex items-center gap-2 pt-2 select-none">
                  <input
                    type="checkbox"
                    id="updateProfileAddress"
                    checked={updateProfileAddress}
                    onChange={e => setUpdateProfileAddress(e.target.checked)}
                    className="w-4 h-4 text-deep-maroon focus:ring-deep-maroon border-gray-300 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="updateProfileAddress"
                    className="text-xs text-gray-600 font-sans cursor-pointer hover:text-ink font-medium"
                  >
                    Update address in my profile with these details
                  </label>
                </div>
              )}

              {/* Submit trigger button placeholder */}
              <button type="submit" id="checkout-form-submit" className="hidden" />
            </form>
          </div>

          {/* Order Summary Checkout Card (Right 40%) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 border border-gray-100 rounded-[4px] shadow-[0_2px_8px_rgba(15,10,5,0.03)] space-y-4">
              <h3 className="font-sans font-semibold text-sm text-ink uppercase tracking-wider pb-3 border-b border-gray-100">
                Order Review
              </h3>

              {/* Items checklist */}
              <div className="divide-y divide-gray-50 max-h-[220px] overflow-y-auto pr-1">
                {cartItems.map(item => (
                  <div key={item.product_id} className="py-2.5 flex items-center justify-between text-xs font-sans">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold text-ink truncate">{item.name}</p>
                      <p className="text-gray-400">Qty: {item.quantity} · {item.return_policy === 'no_return' ? 'No Returns' : 'Easy Return'}</p>
                    </div>
                    <span className="font-mono font-medium text-ink shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <hr className="border-gray-100" />

              {/* Applied discounts info */}
              {offerApplied && (
                <div className="bg-antique-gold/10 border border-antique-gold/15 p-3 rounded-[3px] text-antique-gold text-xs font-sans font-medium flex items-center gap-2">
                  <span>🏷️</span>
                  <span>"{offerApplied.title}" Applied (-{formatPrice(offerApplied.discount)})</span>
                </div>
              )}

              {/* Price Calculations */}
              <div className="space-y-2.5 font-sans text-xs md:text-sm text-gray-600 pt-1.5">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-ink">{formatPrice(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-[#358f5c] font-medium">
                    <span>Discount</span>
                    <span className="font-mono">-{formatPrice(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Delivery Charges</span>
                  <span className="font-mono text-ink">
                    {loadingDelivery ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-antique-gold inline" />
                    ) : deliveryCharge === 0 ? (
                      <span className="text-[#358f5c] font-semibold text-xs tracking-wider uppercase">Free</span>
                    ) : (
                      formatPrice(deliveryCharge)
                    )}
                  </span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-baseline pt-4 border-t border-gray-150">
                <span className="font-sans font-bold text-xs uppercase tracking-wider text-ink">
                  Total Payable
                </span>
                <span className="font-mono font-bold text-lg md:text-xl text-deep-maroon">
                  {formatPrice(grandTotal)}
                </span>
              </div>

              {/* Confirm order CTA */}
              <div className="pt-2">
                <Button
                  variant="whatsapp"
                  onClick={() => document.getElementById('checkout-form-submit')?.click()}
                  disabled={isSubmitting}
                  className="w-full h-12 uppercase tracking-widest text-[11px] font-semibold flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                      <span>Confirming Order...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 fill-current text-white shrink-0" />
                      <span>Confirm Order on WhatsApp</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Security Banner */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-sans border-t border-gray-50 pt-3">
                <ShieldCheck className="w-4 h-4 text-[#2E7D52] shrink-0" />
                <span>Secure Checkout · Cash on Delivery / UPI via WhatsApp</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-[#FAF7F2] flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-antique-gold font-display italic text-2xl">
          Loading Checkout...
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
