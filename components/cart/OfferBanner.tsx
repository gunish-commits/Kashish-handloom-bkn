import React from 'react';
import { AppliedOffer } from '../../types';
import { formatPrice } from '../../lib/utils';

interface OfferBannerProps {
  offer: AppliedOffer | null;
}

export default function OfferBanner({ offer }: OfferBannerProps) {
  if (!offer) return null;

  return (
    <div className="bg-antique-gold/10 border border-antique-gold/25 rounded-[4px] p-3.5 flex items-start sm:items-center gap-3 text-antique-gold font-sans text-xs sm:text-sm font-medium tracking-wide select-none animate-fadeIn">
      <span className="text-lg leading-none shrink-0">🏷️</span>
      <div className="leading-snug">
        <span className="font-bold uppercase tracking-wider">"{offer.title}" APPLIED</span>
        <span className="opacity-90 ml-1.5">— You saved {formatPrice(offer.discount)} on this order!</span>
      </div>
    </div>
  );
}
