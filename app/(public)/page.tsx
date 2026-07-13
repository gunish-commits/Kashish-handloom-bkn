import React from 'react';
import Link from 'next/link';
import { createServerClient } from '../../lib/supabase/server';
import HeroBanner from '../../components/home/HeroBanner';
import CategoryGrid from '../../components/home/CategoryGrid';
import OffersSection from '../../components/home/OffersSection';
import FeaturedProducts from '../../components/home/FeaturedProducts';
import TrustBar from '../../components/home/TrustBar';

// Next.js ISR (Incremental Static Regeneration)
export const revalidate = 60;

export default async function HomePage() {
  const supabase = createServerClient();
  const todayStr = new Date().toISOString().split('T')[0];

  // Parallel server-side fetches
  const [categoriesResponse, productsResponse, offersResponse] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('active', true)
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('offers')
      .select('*')
      .eq('active', true)
      .or(`valid_until.is.null,valid_until.gte.${todayStr}`),
  ]);

  const categories = categoriesResponse.data || [];
  const products = productsResponse.data || [];
  const offers = offersResponse.data || [];

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Banner Carousel (Dark) */}
      <HeroBanner />

      {/* Category Grid (Light) */}
      <CategoryGrid categories={categories} />

      {/* Current Offers (Dark) */}
      <OffersSection offers={offers} />

      {/* Featured Collection (Dark) */}
      <FeaturedProducts products={products} />

      {/* Trust Bar Pillars (Light) */}
      <TrustBar />

      {/* About Heritage Snippet (Dark) */}
      <section className="py-16 md:py-24 bg-ink text-warm-ivory text-center select-none border-t border-border-dark/30 homepage-last-section">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <span className="font-display font-light text-7xl md:text-8xl text-antique-gold leading-none select-none block -mb-4">
            “
          </span>
          <p className="font-display font-light text-xl md:text-3xl italic text-pale-linen leading-normal max-w-xl mx-auto">
            Four decades of craftsmanship, one unwavering promise — quality you can feel.
          </p>
          <div className="w-12 h-[1px] bg-border-dark mx-auto my-4" />
          <p className="font-sans text-xs md:text-sm text-pale-linen/60 max-w-md mx-auto leading-relaxed">
            Established in 1976 by Shri Kishan Lal Ahuja in Bikaner, Rajasthan. Now serving
            customers across all of India.
          </p>
          <div className="pt-2">
            <Link
              href="/about"
              className="font-sans font-medium text-xs text-antique-gold hover:text-warm-ivory uppercase tracking-widest transition-colors duration-200"
            >
              Read Our Story &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
