import { CartItem, Offer, AppliedOffer } from '../types';

export function calculateOffers(
  cartItems: CartItem[],
  activeOffers: Offer[]
): AppliedOffer | null {
  if (!cartItems || cartItems.length === 0 || !activeOffers || activeOffers.length === 0) {
    return null;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Filter to only currently valid offers
  const validOffers = activeOffers.filter(offer => {
    if (!offer.active) return false;
    if (offer.valid_from && offer.valid_from > todayStr) return false;
    if (offer.valid_until && offer.valid_until < todayStr) return false;
    return true;
  });

  if (validOffers.length === 0) {
    return null;
  }

  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const qualifyingOffers: AppliedOffer[] = [];

  for (const offer of validOffers) {
    // Find matching cart items for this offer
    const matchingItems = cartItems.filter(item => {
      if (offer.applies_to === 'all') return true;
      if (offer.applies_to === 'category') {
        return item.category_id === offer.category_id;
      }
      if (offer.applies_to === 'specific_products') {
        return offer.product_ids && offer.product_ids.includes(item.product_id);
      }
      return false;
    });

    const matchingSubtotal = matchingItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const matchingQuantity = matchingItems.reduce((sum, item) => sum + item.quantity, 0);

    let discount = 0;

    // Check conditions
    if (offer.offer_type === 'quantity_bundle') {
      const triggerQty = offer.trigger_quantity || 1;
      if (matchingQuantity >= triggerQty) {
        if (offer.reward_type === 'fixed_total') {
          // E.g., "Buy 5 bedsheets for ₹1,999".
          // Explode matching units to individual prices, sort descending to discount the most expensive units
          const units = matchingItems.flatMap(item => Array(item.quantity).fill(item.price));
          units.sort((a, b) => b - a);

          // We apply the bundle price to the first triggerQty matching items
          const sumOfN = units.slice(0, triggerQty).reduce((sum, p) => sum + p, 0);
          const potentialDiscount = sumOfN - offer.reward_value;
          discount = potentialDiscount > 0 ? potentialDiscount : 0;
        } else if (offer.reward_type === 'fixed_discount') {
          discount = offer.reward_value;
        } else if (offer.reward_type === 'percent_discount') {
          discount = matchingSubtotal * (offer.reward_value / 100);
        }
      }
    } else if (offer.offer_type === 'cart_discount') {
      const triggerAmt = Number(offer.trigger_amount) || 0;
      if (cartSubtotal >= triggerAmt) {
        if (offer.reward_type === 'fixed_discount') {
          discount = offer.reward_value;
        } else if (offer.reward_type === 'percent_discount') {
          discount = cartSubtotal * (offer.reward_value / 100);
        } else if (offer.reward_type === 'fixed_total') {
          const potentialDiscount = cartSubtotal - offer.reward_value;
          discount = potentialDiscount > 0 ? potentialDiscount : 0;
        }
      }
    } else if (offer.offer_type === 'category_discount') {
      // Condition: any items in the category/specific products exist
      if (matchingQuantity > 0) {
        if (offer.reward_type === 'percent_discount') {
          discount = matchingSubtotal * (offer.reward_value / 100);
        } else if (offer.reward_type === 'fixed_discount') {
          // Flat discount on the category
          discount = Math.min(offer.reward_value, matchingSubtotal);
        } else if (offer.reward_type === 'fixed_total') {
          const potentialDiscount = matchingSubtotal - offer.reward_value;
          discount = potentialDiscount > 0 ? potentialDiscount : 0;
        }
      }
    }

    // Round the discount to 2 decimal places
    discount = Math.round(discount * 100) / 100;

    if (discount > 0) {
      qualifyingOffers.push({
        offer_id: offer.id,
        title: offer.title,
        discount: Math.min(discount, cartSubtotal) // Discount cannot exceed the cart total
      });
    }
  }

  if (qualifyingOffers.length === 0) {
    return null;
  }

  // Return the offer with the HIGHEST discount value
  return qualifyingOffers.reduce((best, current) => {
    return current.discount > best.discount ? current : best;
  }, qualifyingOffers[0]);
}
