import React from 'react';
import Link from 'next/link';
import { Category } from '../../types';

interface CategoryGridProps {
  categories: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  // Take top 12 or all categories
  const displayCategories = categories || [];

  return (
    <section className="py-16 md:py-24 bg-white-section text-ink select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
        {/* Section Headings */}
        <div className="text-center space-y-2">
          <p className="font-sans font-medium text-[10px] md:text-xs text-deep-maroon tracking-[0.15em] uppercase">
            Shop by Category
          </p>
          <h2 className="font-display font-light text-2xl md:text-4xl italic text-[#1A110A]">
            Explore our handpicked collections
          </h2>
        </div>

        {/* Categories Grid: 2 cols mobile, 3 cols tablet, 6 cols desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 justify-items-center">
          {displayCategories.map(cat => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group flex flex-col items-center text-center space-y-3 cursor-pointer w-full max-w-[150px]"
            >
              {/* Category Circle (Constrained size to avoid huge elements on mobile) */}
              <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full bg-[#EDE4D4]/30 border border-[#dfd4be]/20 group-hover:scale-105 group-hover:bg-[#EDE4D4]/50 transition-all duration-300 flex items-center justify-center text-2xl md:text-4xl shadow-[0_4px_12px_rgba(15,10,5,0.02)] group-hover:shadow-[0_8px_24px_rgba(15,10,5,0.07)] shrink-0">
                <span className="select-none transition-transform duration-300 group-hover:scale-110">
                  {cat.emoji || '🌾'}
                </span>
              </div>

              {/* Category Name Label (Readable, bold & centered) */}
              <span className="font-sans font-semibold text-xs md:text-sm tracking-wider uppercase text-[#1A110A] group-hover:text-deep-maroon transition-colors duration-200 line-clamp-2 px-1">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Highlighted Shop All Button */}
        <div className="flex justify-center pt-6">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-10 py-4 bg-[#1A110A] text-antique-gold hover:bg-deep-maroon hover:text-warm-ivory border border-antique-gold/30 rounded-[4px] font-sans font-semibold text-xs uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-lg hover:scale-103 cursor-pointer"
          >
            Shop All Products &nbsp;&rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
