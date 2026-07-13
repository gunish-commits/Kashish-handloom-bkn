import { DeliverySettings } from '../types';

export async function getDeliveryCharge(
  pincode: string,
  cartTotal: number,
  passedSettings?: DeliverySettings
): Promise<number> {
  let settings = passedSettings;

  if (!settings) {
    try {
      // Relative URL works on the browser client
      const res = await fetch('/api/delivery');
      if (res.ok) {
        settings = await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch delivery settings in getDeliveryCharge:', e);
    }
  }

  if (!settings) {
    // Static fallback matching schema defaults if DB fetch fails
    return cartTotal >= 2000 ? 0 : 99;
  }

  if (!settings.enabled) return 0;
  
  // Free delivery above threshold
  if (Number(settings.free_above) > 0 && cartTotal >= Number(settings.free_above)) {
    return 0;
  }

  // Check pincode overrides
  if (settings.pincode_overrides && Array.isArray(settings.pincode_overrides)) {
    const override = settings.pincode_overrides.find(
      o => o.pincode === pincode || o.pincode.trim() === pincode.trim()
    );
    if (override) return Number(override.charge);
  }

  return Number(settings.flat_rate);
}
