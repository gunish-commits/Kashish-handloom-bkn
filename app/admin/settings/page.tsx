'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/ui/Button';
import { Settings, Save, Loader2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const { token } = useAuth();

  // Store Setting Fields State
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryWhatsapp, setPrimaryWhatsapp] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [businessHours, setBusinessHours] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Fetch public store settings (Record with ID = 1)
    fetch('/api/store-settings')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data) {
          setLogoUrl(data.logo_url || '');
          setPrimaryWhatsapp(data.primary_whatsapp || '');
          setAltPhone(data.alt_phone || '');
          setEmail(data.email || '');
          setAddress(data.address || '');
          setInstagramUrl(data.instagram_url || '');
          setBusinessHours(data.business_hours || '');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load store configurations.');
        setLoading(false);
      });
  }, []);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!primaryWhatsapp || !email || !address) {
      setError('WhatsApp contact, store email, and shipping address are mandatory.');
      return;
    }

    setError('');
    setSuccess('');
    setIsSaving(true);

    const payload = {
      logo_url: logoUrl || null,
      primary_whatsapp: primaryWhatsapp.trim(),
      alt_phone: altPhone.trim() || null,
      email: email.trim(),
      address: address.trim(),
      instagram_url: instagramUrl.trim() || null,
      business_hours: businessHours.trim() || null,
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update store settings.');
      }

      setSuccess('Store parameters successfully updated!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-deep-maroon font-sans select-none">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-semibold tracking-wider">Loading settings details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-ink">
      
      {/* Page Heading */}
      <div className="border-b border-gray-250 pb-4 select-none">
        <h2 className="font-bold text-xl uppercase tracking-wider text-ink">Store Settings</h2>
        <p className="text-xs text-gray-500 font-medium">Modify branding assets, contact details, business hours, and addresses</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-150 text-rose-800 p-4 rounded-[4px] text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 p-4 rounded-[4px] text-xs font-semibold">
          ✓ {success}
        </div>
      )}

      {/* Main Configurations Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-5 md:p-8 rounded-[4px] shadow-xs space-y-6 max-w-2xl select-none">
        
        {/* Contact coordinates */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="font-bold text-xs uppercase tracking-wider text-ink pb-2 border-b border-gray-100">
            Contact Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* WhatsApp Contact */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Primary Mobile / WhatsApp Number *
              </label>
              <input
                type="text"
                required
                value={primaryWhatsapp}
                onChange={e => setPrimaryWhatsapp(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink font-mono"
                placeholder="e.g. +91 8209455157"
              />
            </div>

            {/* Alternate Phone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Alternate Phone Number
              </label>
              <input
                type="text"
                value={altPhone}
                onChange={e => setAltPhone(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink font-mono"
                placeholder="e.g. +91 7976924013"
              />
            </div>

            {/* Store Email */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Store Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink"
                placeholder="kashishhandloombkn@gmail.com"
              />
            </div>

            {/* Instagram profile URL */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Instagram Link URL
              </label>
              <input
                type="url"
                value={instagramUrl}
                onChange={e => setInstagramUrl(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink"
                placeholder="https://www.instagram.com/kashish_handlooom"
              />
            </div>
          </div>
        </div>

        {/* Location Address & Hours */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="font-bold text-xs uppercase tracking-wider text-ink pb-2 border-b border-gray-100">
            Address & Store Timings
          </h3>

          {/* Store Address */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Store Retail Address *
            </label>
            <textarea
              rows={3}
              required
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink resize-none text-xs sm:text-sm"
              placeholder={`Jinnah Road, Coatagate,\nNear New Taj Hotel,\nBikaner, Rajasthan 334001`}
            />
          </div>

          {/* Business Hours description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Business Hours Timings Description
            </label>
            <textarea
              rows={2}
              value={businessHours}
              onChange={e => setBusinessHours(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink resize-none text-xs sm:text-sm"
              placeholder={`Mon–Sat: 10:00 AM – 8:00 PM\nSun: 11:00 AM – 6:00 PM`}
            />
          </div>
        </div>

        {/* Save button footer */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            className="h-11 px-8 uppercase tracking-widest text-[11px] font-bold flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Saving configurations...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
