import React from 'react';
import Link from 'next/link';
import { Offer } from '../../types';
import Divider from '../ui/Divider';
import Button from '../ui/Button';

interface OffersSectionProps {
  offers: Offer[];
}

export default function OffersSection({ offers }: OffersSectionProps) {
  // Filter for home page display
  const activeOffers = offers.filter(o => o.show_on_homepage) || [];

  return (
    <section className="py-16 md:py-24 bg-surface-dark text-warm-ivory select-none relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 relative z-10">
        {/* Section Headings */}
        <div className="text-center space-y-1">
          <h2 className="font-display font-light text-3xl md:text-5xl italic text-warm-ivory">
            Current Offers
          </h2>
          <Divider />
        </div>

        {/* Offers Grid: 3 cols desktop, 1 col horizontal scroll mobile */}
        {activeOffers.length > 0 ? (
          <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar md:grid md:grid-cols-3 md:gap-6">
            {activeOffers.map(offer => {
              const filterUrl = offer.category_id
                ? `/shop?category=${offer.category_id}`
                : '/shop';

              const validityText = offer.valid_until
                ? `Valid until: ${new Date(offer.valid_until).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}`
                : 'Limited Time Offer';

              let rewardText = '';
              if (offer.reward_type === 'percent_discount') {
                rewardText = `${offer.reward_value}% OFF`;
              } else if (offer.reward_type === 'fixed_discount') {
                rewardText = `₹${offer.reward_value} OFF`;
              } else if (offer.reward_type === 'fixed_total') {
                rewardText = `Total: ₹${offer.reward_value}`;
              }

              return (
                <div
                  key={offer.id}
                  className="relative w-[280px] shrink-0 md:w-auto md:shrink bg-transparent border border-border-dark border-t-[3px] border-t-antique-gold p-6 rounded-[2px] flex flex-col justify-between h-[280px] hover:border-antique-gold/45 transition-colors duration-300 group overflow-hidden animate-shimmer"
                >
                  {/* Gold Shimmer Sweep Sweep Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-antique-gold/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2.5s_infinite_linear]" />

                  {/* Card Content */}
                  <div className="space-y-3 z-10">
                    <h3 className="font-display font-semibold text-xl md:text-2xl text-warm-ivory group-hover:text-antique-gold transition-colors leading-tight">
                      {offer.title}
                    </h3>
                    <p className="font-sans text-xs text-pale-linen/85 leading-relaxed line-clamp-3">
                      {offer.description}
                    </p>
                  </div>

                  {/* Bottom metrics and action */}
                  <div className="space-y-4 z-10 pt-4 border-t border-border-dark/60">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono font-bold text-2xl text-antique-gold">
                        {rewardText}
                      </span>
                      <span className="font-sans text-[10px] text-pale-linen/60 uppercase tracking-wider">
                        {validityText}
                      </span>
                    </div>

                    <Button
                      variant="outline-gold"
                      href={filterUrl}
                      className="w-full py-2.5 text-[10px] uppercase tracking-widest font-semibold"
                    >
                      Shop Now
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border border-border-dark/50 rounded-[4px] bg-ink/30 max-w-md mx-auto">
            <span className="text-3xl mb-3 block">🏷️</span>
            <p className="font-sans text-sm text-pale-linen/70">
              No active offers right now. Check back soon for exciting deals!
            </p>
          </div>
        )}

        {/* View All Offers link */}
        {activeOffers.length > 0 && (
          <div className="text-center pt-6">
            <Link
              href="/offers"
              className="font-sans font-medium text-xs text-antique-gold hover:text-warm-ivory uppercase tracking-widest transition-colors duration-200"
            >
              View All Offers &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
