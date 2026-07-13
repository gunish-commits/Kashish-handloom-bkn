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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {displayCategories.map(cat => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group flex flex-col items-center text-center space-y-3.5"
            >
              {/* Square Image Box (Emojis as premium icons until real image assets uploaded) */}
              <div className="relative aspect-square w-full rounded-full bg-[#EDE4D4]/30 border border-[#dfd4be]/20 group-hover:scale-104 group-hover:bg-[#EDE4D4]/50 transition-all duration-300 flex items-center justify-center text-3xl md:text-4xl shadow-[0_4px_12px_rgba(15,10,5,0.03)] group-hover:shadow-[0_8px_24px_rgba(15,10,5,0.08)]">
                <span className="select-none transition-transform duration-300 group-hover:scale-110">
                  {cat.emoji || '🌾'}
                </span>
              </div>

              {/* Category Name Label */}
              <span className="font-sans font-medium text-xs md:text-sm tracking-wider uppercase text-[#1A110A] group-hover:text-deep-maroon transition-colors duration-200">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
