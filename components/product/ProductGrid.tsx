import React from 'react';
import { Product } from '../../types';
import ProductCard from './ProductCard';
import SkeletonCard from '../ui/SkeletonCard';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function ProductGrid({
  products,
  loading,
  onLoadMore,
  hasMore = false,
}: ProductGridProps) {
  // Initial loading screen skeleton placeholders
  if (loading && products.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Empty state illustration
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center select-none animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-warm-ivory border border-[#dfd6be]/30 flex items-center justify-center text-2xl text-antique-gold mb-4 shadow-[0_4px_12px_rgba(184,137,42,0.06)]">
          🌾
        </div>
        <h3 className="font-sans font-medium text-sm text-ink uppercase tracking-wider mb-2">
          No products matched
        </h3>
        <p className="font-sans text-xs text-gray-500 max-w-xs leading-relaxed">
          We couldn't find any products in Bikaner inventory matching these filters. Try adjusting your categories or price range.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Product Cards Grid: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Load More Pagination */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="h-11 px-8 bg-[#EDE4D4] hover:bg-[#dfd4be] text-ink font-sans font-medium text-xs tracking-widest uppercase transition-colors duration-200 rounded-[4px] disabled:opacity-50 select-none cursor-pointer focus:outline-none"
          >
            {loading ? 'Loading...' : 'Load More Products'}
          </button>
        </div>
      )}
    </div>
  );
}
