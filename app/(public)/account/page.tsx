'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Order, Complaint, OrderStatus, ComplaintStatus } from '../../../types';
import Button from '../../../components/ui/Button';
import { formatPrice, INDIAN_STATES } from '../../../lib/utils';
import { supabase } from '../../../lib/supabase/client';
import {
  User as UserIcon,
  ShoppingBag,
  AlertCircle,
  LogOut,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Save,
  MapPin,
} from 'lucide-react';

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, loading, logout } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'complaints'>('profile');

  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam === 'orders' || tabParam === 'complaints' || tabParam === 'profile') {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Complaints State
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  // Lodge Complaint Form State
  const [lodgeOrderId, setLodgeOrderId] = useState('');
  const [lodgeSubject, setLodgeSubject] = useState('');
  const [lodgeDescription, setLodgeDescription] = useState('');
  const [lodgeError, setLodgeError] = useState('');
  const [lodgeSuccess, setLodgeSuccess] = useState('');
  const [isLodging, setIsLodging] = useState(false);

  // Profile Form States
  const [profileLoading, setProfileLoading] = useState(true);
  const [fullNameInput, setFullNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [altPhoneInput, setAltPhoneInput] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Rajasthan');
  const [pincode, setPincode] = useState('');
  
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/account');
    }
  }, [user, loading, router]);

  // Load profile from customer_profiles
  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);

    supabase
      .from('customer_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          // Fallback to auth metadata if table migration hasn't been run
          if (user.user_metadata?.full_name) {
            setFullNameInput(user.user_metadata.full_name);
          }
          if (user.user_metadata?.phone) {
            setPhoneInput(user.user_metadata.phone);
          }
          setProfileLoading(false);
          return;
        }
        if (data) {
          setFullNameInput(data.full_name || '');
          setPhoneInput(data.phone || '');
          setAltPhoneInput(data.alt_phone || '');
          setAddressLine1(data.address_line1 || '');
          setAddressLine2(data.address_line2 || '');
          setCity(data.city || '');
          setState(data.state || 'Rajasthan');
          setPincode(data.pincode || '');
        } else {
          // Fallback to auth metadata if profile row isn't fully created
          if (user.user_metadata?.full_name) {
            setFullNameInput(user.user_metadata.full_name);
          }
          if (user.user_metadata?.phone) {
            setPhoneInput(user.user_metadata.phone);
          }
        }
        setProfileLoading(false);
      });
  }, [user?.id]);

  // Load orders and complaints when user session is active
  useEffect(() => {
    if (!user || !token) return;

    // Fetch Orders
    setLoadingOrders(true);
    fetch('/api/orders/my-orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        setOrders(data);
        setLoadingOrders(false);
      })
      .catch(err => {
        console.error('Error fetching orders:', err);
        setLoadingOrders(false);
      });

    // Fetch Complaints
    setLoadingComplaints(true);
    fetch('/api/complaints', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        setComplaints(data);
        setLoadingComplaints(false);
      })
      .catch(err => {
        console.error('Error fetching complaints:', err);
        setLoadingComplaints(false);
      });
  }, [user?.id, token]);

  // Save profile edits
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!fullNameInput.trim()) {
      setProfileError('Full Name is required.');
      return;
    }

    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setProfileError('Please enter a valid 10-digit primary phone number.');
      return;
    }

    if (pincode && (pincode.length !== 6 || !/^\d+$/.test(pincode))) {
      setProfileError('Pincode must be exactly 6 digits.');
      return;
    }

    setIsSavingProfile(true);

    try {
      const payload = {
        id: user!.id,
        full_name: fullNameInput.trim(),
        phone: cleanPhone,
        alt_phone: altPhoneInput.trim() || null,
        address_line1: addressLine1.trim() || null,
        address_line2: addressLine2.trim() || null,
        city: city.trim() || null,
        state: state,
        pincode: pincode.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('customer_profiles')
        .upsert(payload);

      if (upsertError) throw upsertError;

      // Update Auth session metadata
      await supabase.auth.updateUser({
        data: {
          full_name: fullNameInput.trim(),
          phone: cleanPhone,
        },
      });

      setProfileSuccess('Profile details and delivery address successfully updated!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setProfileError(err.message || 'Failed to save changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLodgeComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lodgeSubject.trim() || !lodgeDescription.trim()) {
      setLodgeError('Subject and description are required.');
      return;
    }

    setLodgeError('');
    setLodgeSuccess('');
    setIsLodging(true);

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: lodgeOrderId || null,
          subject: lodgeSubject.trim(),
          description: lodgeDescription.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit complaint.');
      }

      const newComplaint = await res.json();
      setComplaints(prev => [newComplaint, ...prev]);
      
      setLodgeSuccess('Your complaint has been successfully registered! Our team will review it.');
      setLodgeSubject('');
      setLodgeDescription('');
      setLodgeOrderId('');
    } catch (err: any) {
      console.error(err);
      setLodgeError(err.message || 'An error occurred.');
    } finally {
      setIsLodging(false);
    }
  };

  const handleLogoutClick = async () => {
    await logout();
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="flex-1 bg-[#FAF7F2] flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-antique-gold">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="font-display italic text-lg">Loading account details...</span>
        </div>
      </div>
    );
  }

  const orderStatusColors: Record<OrderStatus | 'dispatched', string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    new: 'bg-blue-50 text-blue-700 border-blue-100',
    confirmed: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    processing: 'bg-amber-50 text-amber-700 border-amber-100',
    packed: 'bg-teal-50 text-teal-700 border-teal-100',
    shipped: 'bg-orange-50 text-orange-700 border-orange-100',
    dispatched: 'bg-purple-50 text-purple-700 border-purple-100',
    out_for_delivery: 'bg-purple-50 text-purple-700 border-purple-100',
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  const complaintStatusColors: Record<ComplaintStatus, string> = {
    new: 'bg-blue-50 text-blue-700 border-blue-100',
    investigating: 'bg-amber-50 text-amber-700 border-amber-100',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    closed: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const customerDisplayName = fullNameInput || user.user_metadata?.full_name || 'Valued Customer';

  return (
    <div className="flex-1 bg-[#FAF7F2] pb-20 pt-8 font-sans">
      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-6">
        
        {/* Page Headings */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-150">
          <div>
            <h1 className="font-display font-semibold text-3xl text-ink leading-tight">
              Hello, {customerDisplayName}!
            </h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mt-1">
              Manage your profile, saved shipping addresses, and support tickets
            </p>
          </div>
          <button
            onClick={handleLogoutClick}
            className="self-start md:self-auto flex items-center gap-1.5 text-xs text-stock-red hover:text-red-400 font-semibold uppercase tracking-wider select-none cursor-pointer focus:outline-none"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-150 text-xs uppercase tracking-wider font-semibold text-gray-400 bg-white p-1 rounded-[4px] border border-gray-100 shadow-xs select-none">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 rounded-[3px] transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-ink text-warm-ivory'
                : 'hover:text-ink'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile & Address</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 rounded-[3px] transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-ink text-warm-ivory'
                : 'hover:text-ink'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Orders ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 rounded-[3px] transition-all cursor-pointer ${
              activeTab === 'complaints'
                ? 'bg-ink text-warm-ivory'
                : 'hover:text-ink'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Complaints ({complaints.length})</span>
          </button>
        </div>

        {/* Tab contents */}
        <div className="space-y-6">
          
          {/* 1. Profile Details & Saved Address Forms */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {profileLoading ? (
                <div className="bg-white p-8 border border-gray-100 rounded-[4px] text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-antique-gold mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-sans">Loading details...</p>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="bg-white p-5 md:p-8 border border-gray-100 rounded-[4px] shadow-[0_2px_8px_rgba(15,10,5,0.03)] space-y-6">
                  
                  {profileError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-[3px] text-xs font-semibold">
                      ⚠️ {profileError}
                    </div>
                  )}

                  {profileSuccess && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-[3px] text-xs font-semibold">
                      ✓ {profileSuccess}
                    </div>
                  )}

                  {/* Customer Information Section */}
                  <div className="space-y-4">
                    <h3 className="font-sans font-semibold text-xs text-antique-gold uppercase tracking-widest pb-1.5 border-b border-gray-100 flex items-center gap-1.5 select-none">
                      <UserIcon className="w-3.5 h-3.5 text-deep-maroon" />
                      <span>Profile Information</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={fullNameInput}
                          onChange={e => setFullNameInput(e.target.value)}
                          className="w-full h-10 px-3 border border-gray-200 rounded-[3px] focus:outline-none focus:border-deep-maroon text-xs"
                          placeholder="e.g. Priya Sharma"
                        />
                      </div>

                      {/* Primary Phone */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Primary Phone Number (10 digits) *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phoneInput}
                          onChange={e => setPhoneInput(e.target.value)}
                          className="w-full h-10 px-3 border border-gray-200 rounded-[3px] focus:outline-none focus:border-deep-maroon text-xs font-mono"
                          placeholder="8209455157"
                          maxLength={10}
                        />
                      </div>

                      {/* Alternate Phone */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Alternate Contact Phone (Optional)
                        </label>
                        <input
                          type="tel"
                          value={altPhoneInput}
                          onChange={e => setAltPhoneInput(e.target.value)}
                          className="w-full h-10 px-3 border border-gray-200 rounded-[3px] focus:outline-none focus:border-deep-maroon text-xs font-mono"
                          placeholder="7976924013"
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address Section */}
                  <div className="space-y-4 pt-2">
                    <h3 className="font-sans font-semibold text-xs text-antique-gold uppercase tracking-widest pb-1.5 border-b border-gray-100 flex items-center gap-1.5 select-none">
                      <MapPin className="w-3.5 h-3.5 text-deep-maroon" />
                      <span>Default Delivery Address</span>
                    </h3>

                    <div className="space-y-4">
                      {/* Address Line 1 */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Address Line 1 (House No, Building, Street)
                        </label>
                        <input
                          type="text"
                          value={addressLine1}
                          onChange={e => setAddressLine1(e.target.value)}
                          className="w-full h-10 px-3 border border-gray-200 rounded-[3px] focus:outline-none focus:border-deep-maroon text-xs"
                          placeholder="e.g. 45, Near Taj Hotel, Coatagate"
                        />
                      </div>

                      {/* Address Line 2 */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Address Line 2 (Apartment, Suite, Locality - Optional)
                        </label>
                        <input
                          type="text"
                          value={addressLine2}
                          onChange={e => setAddressLine2(e.target.value)}
                          className="w-full h-10 px-3 border border-gray-200 rounded-[3px] focus:outline-none focus:border-deep-maroon text-xs"
                          placeholder="e.g. Jinnah Road"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* City */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            City
                          </label>
                          <input
                            type="text"
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            className="w-full h-10 px-3 border border-gray-200 rounded-[3px] focus:outline-none focus:border-deep-maroon text-xs"
                            placeholder="e.g. Bikaner"
                          />
                        </div>

                        {/* State */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            State
                          </label>
                          <select
                            value={state}
                            onChange={e => setState(e.target.value)}
                            className="w-full h-10 px-2 border border-gray-200 rounded-[3px] focus:outline-none focus:border-deep-maroon text-xs bg-white text-ink"
                          >
                            {INDIAN_STATES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        {/* Pincode */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Pincode (6 digits)
                          </label>
                          <input
                            type="text"
                            value={pincode}
                            onChange={e => setPincode(e.target.value)}
                            className="w-full h-10 px-3 border border-gray-200 rounded-[3px] focus:outline-none focus:border-deep-maroon text-xs font-mono"
                            placeholder="334001"
                            maxLength={6}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Trigger */}
                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSavingProfile}
                      className="h-11 px-8 uppercase tracking-widest text-[11px] font-bold flex items-center gap-1.5"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Saving Profile...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Address & Profile</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* Bottom Logout Button */}
              <div className="flex justify-center select-none pt-4">
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="flex items-center gap-2 px-6 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-[4px] text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer focus:outline-none"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Account</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Order History (collapsible list) */}
          {activeTab === 'orders' && (
            <div className="space-y-4 max-w-3xl mx-auto" id="orders">
              {loadingOrders ? (
                <div className="bg-white p-8 border border-gray-100 rounded-[4px] text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-antique-gold mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-sans">Loading orders...</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map(order => {
                    const isExpanded = expandedOrder === order.id;
                    const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <div
                        key={order.id}
                        className="bg-white border border-gray-100 rounded-[4px] shadow-[0_2px_8px_rgba(15,10,5,0.03)] overflow-hidden"
                      >
                        {/* Order Header Summary */}
                        <div
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="space-y-1">
                            <span className="font-mono text-xs font-semibold text-antique-gold uppercase tracking-wider block">
                              {order.id}
                            </span>
                            <span className="font-sans text-[11px] text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{orderDate}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="font-mono text-sm font-semibold text-ink block">
                                {formatPrice(order.grand_total)}
                              </span>
                              <span className="text-[10px] text-gray-400 block font-sans">
                                {order.items.length} items
                              </span>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-[3px] border text-[10px] uppercase font-bold tracking-wider ${
                                orderStatusColors[order.status]
                              }`}
                            >
                              {order.status}
                            </span>

                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Order Item Details Expanded */}
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-5 bg-gray-50/30">
                            {/* Visual Tracking Progress Timeline */}
                            <div className="bg-white border border-gray-100 rounded-[4px] p-4 space-y-3">
                              <h5 className="font-sans font-semibold text-[10px] text-gray-405 uppercase tracking-widest">
                                Shipment Tracking Timeline
                              </h5>
                              {order.status === 'cancelled' ? (
                                <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-[3px] max-w-max select-none">
                                  ✕ This order has been cancelled.
                                </div>
                              ) : (
                                <>
                                  {/* Desktop Progress Bar (Horizontal) */}
                                  <div className="hidden md:flex items-center justify-between w-full pt-4 pb-6 px-1 select-none">
                                    {[
                                      { key: 'pending', label: 'Pending', icon: '⏳' },
                                      { key: 'confirmed', label: 'Confirmed', icon: '✅' },
                                      { key: 'processing', label: 'Processing', icon: '⚙️' },
                                      { key: 'packed', label: 'Packed', icon: '📦' },
                                      { key: 'shipped', label: 'Shipped', icon: '🚚' },
                                      { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🛵' },
                                      { key: 'delivered', label: 'Delivered', icon: '🎁' }
                                    ].map((step, idx, arr) => {
                                      const stepIndex = idx;
                                      const currentStatusIndex = arr.findIndex(s => s.key === order.status);
                                      const isCompleted = stepIndex < currentStatusIndex;
                                      const isActive = stepIndex === currentStatusIndex;

                                      return (
                                        <div key={step.key} className="flex-1 flex items-center relative">
                                          {idx > 0 && (
                                            <div className={`absolute left-0 right-1/2 top-4 -translate-y-1/2 h-[2px] -translate-x-1/2 w-full z-0 ${
                                              isCompleted || isActive ? 'bg-deep-maroon' : 'bg-gray-200'
                                            }`} />
                                          )}
                                          <div className="flex flex-col items-center mx-auto z-10 relative">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                                              isCompleted 
                                                ? 'bg-deep-maroon text-white border-deep-maroon shadow-xs' 
                                                : isActive 
                                                ? 'bg-antique-gold text-white border-antique-gold animate-pulse shadow-sm' 
                                                : 'bg-white text-gray-400 border-gray-200'
                                            }`}>
                                              {isCompleted ? '✓' : step.icon}
                                            </div>
                                            <span className={`text-[10px] font-sans font-semibold mt-2 absolute top-8 whitespace-nowrap ${
                                              isActive ? 'text-antique-gold font-bold scale-105' : isCompleted ? 'text-deep-maroon' : 'text-gray-400'
                                            }`}>
                                              {step.label}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Mobile Progress Bar (Vertical) */}
                                  <div className="flex md:hidden flex-col gap-4 py-2 pl-3 select-none">
                                    {[
                                      { key: 'pending', label: 'Pending', icon: '⏳' },
                                      { key: 'confirmed', label: 'Confirmed', icon: '✅' },
                                      { key: 'processing', label: 'Processing', icon: '⚙️' },
                                      { key: 'packed', label: 'Packed', icon: '📦' },
                                      { key: 'shipped', label: 'Shipped', icon: '🚚' },
                                      { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🛵' },
                                      { key: 'delivered', label: 'Delivered', icon: '🎁' }
                                    ].map((step, idx, arr) => {
                                      const stepIndex = idx;
                                      const currentStatusIndex = arr.findIndex(s => s.key === order.status);
                                      const isCompleted = stepIndex < currentStatusIndex;
                                      const isActive = stepIndex === currentStatusIndex;
                                      const showLine = idx < arr.length - 1;

                                      return (
                                        <div key={step.key} className="flex items-start gap-4 relative">
                                          {showLine && (
                                            <div className={`absolute left-4 top-8 bottom-0 w-[2px] -translate-x-1/2 ${
                                              isCompleted ? 'bg-deep-maroon' : 'bg-gray-200'
                                            }`} />
                                          )}
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 border ${
                                            isCompleted 
                                              ? 'bg-deep-maroon text-white border-deep-maroon shadow-xs' 
                                              : isActive 
                                              ? 'bg-antique-gold text-white border-antique-gold animate-pulse shadow-sm' 
                                              : 'bg-white text-gray-400 border-gray-200'
                                          }`}>
                                            {isCompleted ? '✓' : step.icon}
                                          </div>
                                          <div className="flex flex-col pt-1">
                                            <span className={`text-xs font-sans font-bold tracking-wide uppercase ${
                                              isActive ? 'text-antique-gold' : isCompleted ? 'text-deep-maroon' : 'text-gray-400'
                                            }`}>
                                              {step.label}
                                            </span>
                                            {isActive && (
                                              <span className="text-[9px] text-gray-400 tracking-wide mt-0.5">
                                                Your shipment is currently in this stage.
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Items list */}
                            <div className="space-y-2">
                              <h5 className="font-sans font-semibold text-[10px] text-gray-400 uppercase tracking-widest mb-2">
                                Items Ordered
                              </h5>
                              <div className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-[4px] px-3">
                                {order.items.map((item, index) => (
                                  <div
                                    key={index}
                                    className="py-2.5 flex items-center gap-3 text-xs font-sans"
                                  >
                                    {/* Thumbnail Photo */}
                                    <div className="relative w-11 h-11 bg-white border border-gray-150 rounded overflow-hidden shrink-0">
                                      {item.photo ? (
                                        <img 
                                          src={item.photo} 
                                          alt={item.name} 
                                          className="w-full h-full object-cover" 
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-serif">
                                          KH
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-ink truncate">{item.name}</p>
                                      <p className="text-gray-405 font-medium text-[10px]">
                                        Qty: {item.quantity} × {formatPrice(item.price)}
                                      </p>
                                    </div>
                                    <span className="font-mono font-semibold text-ink shrink-0">
                                      {formatPrice(item.price * item.quantity)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <hr className="border-gray-150" />

                            {/* Details layout */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-gray-600 bg-white border border-gray-100 rounded-[4px] p-4">
                              <div className="space-y-1">
                                <h5 className="font-semibold text-ink uppercase tracking-wider text-[10px] mb-1">
                                  Shipping Coordinates & contact
                                </h5>
                                <p className="text-gray-550 font-medium">{order.customer_name}</p>
                                <p className="text-gray-550 font-mono text-[11px]">Primary Contact: +91 {order.customer_phone}</p>
                                {order.customer_alt_phone && (
                                  <p className="text-gray-550 font-mono text-[11px]">Alt Contact: +91 {order.customer_alt_phone}</p>
                                )}
                                <p className="text-gray-555 pt-1">
                                  {order.address_line1}
                                  {order.address_line2 ? `, ${order.address_line2}` : ''}
                                </p>
                                <p className="text-gray-550">
                                  {order.city}, {order.state} — {order.pincode}
                                </p>
                              </div>

                              <div className="space-y-1 text-right flex flex-col justify-between">
                                <div>
                                  <h5 className="font-semibold text-ink uppercase tracking-wider text-[10px] text-left sm:text-right mb-1">
                                    Payment summary
                                  </h5>
                                  <div className="space-y-0.5">
                                    <div className="flex justify-between sm:justify-end sm:gap-6">
                                      <span>Subtotal</span>
                                      <span className="font-mono text-ink">{formatPrice(order.subtotal)}</span>
                                    </div>
                                    {order.offer_applied && (
                                      <div className="flex justify-between sm:justify-end sm:gap-6 text-[#358f5c] font-medium">
                                        <span>Discount ({order.offer_applied.title})</span>
                                        <span className="font-mono">-{formatPrice(order.offer_applied.discount)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between sm:justify-end sm:gap-6">
                                      <span>Delivery Fee</span>
                                      <span className="font-mono text-ink">
                                        {order.delivery_charge === 0 ? 'FREE' : formatPrice(order.delivery_charge)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between sm:justify-end sm:gap-6 font-semibold text-ink pt-1 border-t border-gray-150">
                                      <span>Grand Total</span>
                                      <span className="font-mono text-deep-maroon">{formatPrice(order.grand_total)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-left sm:text-right pt-4 sm:pt-0">
                                  <span className="text-[10px] text-gray-400 font-medium block">
                                    Estimated Delivery: 3-5 business days from confirmation.
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border border-gray-200 rounded-[4px] bg-white">
                  <span className="text-2xl mb-2 block">🛒</span>
                  <p className="text-sm text-gray-500 font-sans">You haven't placed any orders yet.</p>
                </div>
              )}
            </div>
          )}

          {/* 3. Complaints ticketing panel */}
          {activeTab === 'complaints' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Complaints Log List */}
              <div className="lg:col-span-7 bg-white p-5 border border-gray-100 rounded-[4px] shadow-[0_2px_8px_rgba(15,10,5,0.03)] space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <FileText className="w-5 h-5 text-antique-gold" />
                  <h3 className="font-sans font-semibold text-sm text-ink uppercase tracking-wider">
                    Lodge History
                  </h3>
                </div>

                {loadingComplaints ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-antique-gold mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-sans">Loading tickets...</p>
                  </div>
                ) : complaints.length > 0 ? (
                  <div className="divide-y divide-gray-100 space-y-4">
                    {complaints.map(ticket => {
                      const ticketDate = new Date(ticket.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });
                      return (
                        <div key={ticket.id} className="pt-4 first:pt-0 space-y-2 text-xs md:text-sm font-sans">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="font-bold text-ink leading-tight">{ticket.subject}</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5">Lodge: {ticketDate}</p>
                              {ticket.order_id && (
                                <p className="text-[10px] font-mono text-antique-gold font-medium mt-0.5">
                                  Order ID: {ticket.order_id}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-2 py-0.5 border rounded-[3px] text-[9px] uppercase font-bold tracking-wider ${
                                complaintStatusColors[ticket.status]
                              }`}
                            >
                              {ticket.status}
                            </span>
                          </div>
                          <p className="text-gray-600 leading-relaxed text-xs">
                            {ticket.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-xs font-sans">
                    <p>No complaints lodged yet. If you have any issue, use the form on the right.</p>
                  </div>
                )}
              </div>

              {/* Lodge Ticket Form (Right 40%) */}
              <form
                onSubmit={handleLodgeComplaint}
                className="lg:col-span-5 bg-white p-5 border border-gray-100 rounded-[4px] shadow-[0_2px_8px_rgba(15,10,5,0.03)] space-y-4"
              >
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 select-none">
                  <AlertCircle className="w-5 h-5 text-deep-maroon" />
                  <h3 className="font-sans font-semibold text-sm text-ink uppercase tracking-wider">
                    Lodge New Complaint
                  </h3>
                </div>

                {lodgeError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-800 p-2.5 rounded-[3px] text-xs font-semibold">
                    ⚠️ {lodgeError}
                  </div>
                )}

                {lodgeSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-2.5 rounded-[3px] text-xs font-semibold">
                    ✓ {lodgeSuccess}
                  </div>
                )}

                {/* Subject */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Complaint Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={lodgeSubject}
                    onChange={e => setLodgeSubject(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-[3px] focus:outline-none focus:border-deep-maroon text-xs"
                    placeholder="e.g. Missing comforter in delivery package"
                  />
                </div>

                {/* Associated Order ID */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Associated Order ID (Optional)
                  </label>
                  <select
                    value={lodgeOrderId}
                    onChange={e => setLodgeOrderId(e.target.value)}
                    className="w-full h-10 px-2 border border-gray-200 rounded-[3px] focus:outline-none focus:border-deep-maroon text-xs bg-white text-ink"
                  >
                    <option value="">-- Select Order --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.id} (₹{Math.round(o.grand_total)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Detailed Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={lodgeDescription}
                    onChange={e => setLodgeDescription(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-[3px] focus:outline-none focus:border-deep-maroon text-xs resize-none"
                    placeholder="Describe your issue in detail. Our support team will get in touch with you shortly."
                  />
                </div>

                {/* Lodge Trigger */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isLodging}
                    className="w-full h-11 uppercase tracking-widest text-[10px] font-bold flex items-center justify-center gap-1.5"
                  >
                    {isLodging ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Submitting Ticket...</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span>Lodge Ticket</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-[#FAF7F2] flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-antique-gold">
          <Loader2 className="w-8 h-8 animate-spin animate-ping" />
          <span className="font-display italic text-lg">Loading account details...</span>
        </div>
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  );
}
