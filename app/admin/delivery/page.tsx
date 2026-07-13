'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/ui/Button';
import { Truck, Save, Loader2, Info } from 'lucide-react';

export default function AdminDeliveryPage() {
  const { token } = useAuth();

  // Settings Field States (Aligned to flat_rate, free_above, pincode_overrides)
  const [flatRate, setFlatRate] = useState('99');
  const [freeAbove, setFreeAbove] = useState('1500');
  const [localPincodesInput, setLocalPincodesInput] = useState('');
  const [localCharge, setLocalCharge] = useState('0');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Fetch public delivery settings
    fetch('/api/delivery')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data) {
          setFlatRate(data.flat_rate?.toString() || '99');
          setFreeAbove(data.free_above?.toString() || '1500');
          
          if (Array.isArray(data.pincode_overrides)) {
            // Extrapolate pincodes and first charge as default Bikaner overrides
            const pins = data.pincode_overrides.map((o: any) => o.pincode).join(', ');
            setLocalPincodesInput(pins);
            const charge = data.pincode_overrides[0]?.charge ?? 0;
            setLocalCharge(charge.toString());
          } else {
            setLocalPincodesInput('');
            setLocalCharge('0');
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch delivery configurations.');
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!flatRate || !freeAbove || !localCharge) {
      setError('Please fill in all required pricing parameters.');
      return;
    }

    setError('');
    setSuccess('');
    setIsSaving(true);

    // Parse comma-separated pincodes into clean array of strings
    const pincodesArray = localPincodesInput
      .split(',')
      .map(pin => pin.trim())
      .filter(pin => pin.length === 6 && /^\d+$/.test(pin));

    // Construct the database JSONB array overrides
    const overrides = pincodesArray.map(pin => ({
      pincode: pin,
      charge: parseFloat(localCharge) || 0,
    }));

    const payload = {
      flat_rate: parseFloat(flatRate),
      free_above: parseFloat(freeAbove),
      pincode_overrides: overrides,
    };

    try {
      const res = await fetch('/api/admin/delivery', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save delivery parameters.');
      }

      setSuccess('Shipping settings successfully updated!');
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
          <p className="text-sm font-semibold tracking-wider">Loading delivery rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-ink">
      
      {/* Page Heading */}
      <div className="border-b border-gray-250 pb-4 select-none">
        <h2 className="font-bold text-xl uppercase tracking-wider text-ink">Delivery Configurations</h2>
        <p className="text-xs text-gray-500 font-medium">Set national shipping rates, free delivery triggers, and local Bikaner pincode overrides</p>
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

      {/* Configuration Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-5 md:p-8 rounded-[4px] shadow-xs space-y-6 max-w-2xl select-none">
        
        {/* National shipping card */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-ink pb-2 border-b border-gray-100 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-antique-gold" />
            <span>National Delivery Settings</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Default Flat Charge */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Default Flat Rate Delivery Charge *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-450 font-mono">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={flatRate}
                  onChange={e => setFlatRate(e.target.value)}
                  className="w-full h-10 pl-7 pr-4 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink font-mono"
                  placeholder="99"
                />
              </div>
            </div>

            {/* Free Shipping Threshold */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Free Shipping Cart Threshold *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-450 font-mono">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={freeAbove}
                  onChange={e => setFreeAbove(e.target.value)}
                  className="w-full h-10 pl-7 pr-4 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink font-mono"
                  placeholder="2000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Local bikaner overrides card */}
        <div className="space-y-4 pt-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-ink pb-2 border-b border-gray-100 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-deep-maroon" />
            <span>Local Bikaner Override Settings</span>
          </h3>

          {/* Alert Info box */}
          <div className="bg-[#FAF7F2] p-3.5 border border-[#dfd6be]/30 rounded-[4px] text-xs text-gray-500 flex items-start gap-2.5 leading-relaxed">
            <Info className="w-4 h-4 text-antique-gold shrink-0 mt-0.5" />
            <span>
              Orders shipped to local Bikaner pincodes can be set to different delivery charges (e.g. set to ₹0.00 for free local Bikaner shipping).
            </span>
          </div>

          {/* Local pincodes array input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Local Pincodes (Comma-separated 6-digit numbers)
            </label>
            <textarea
              rows={2}
              value={localPincodesInput}
              onChange={e => setLocalPincodesInput(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink font-mono text-xs resize-none"
              placeholder="334001, 334002, 334003, 334004"
            />
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
              Must enter valid 6-digit Indian postal codes. Invalid entries are ignored.
            </p>
          </div>

          {/* Local charge */}
          <div className="space-y-1.5 max-w-xs">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Local Delivery Charge *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-450 font-mono">₹</span>
              <input
                type="number"
                step="0.01"
                required
                value={localCharge}
                onChange={e => setLocalCharge(e.target.value)}
                className="w-full h-10 pl-7 pr-4 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink font-mono"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
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
                <span>Saving settings...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configurations</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
