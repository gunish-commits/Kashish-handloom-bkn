'use client';

import React from 'react';
import { useWishlist } from '../../../context/WishlistContext';
import ProductCard from '../../../components/product/ProductCard';
import Button from '../../../components/ui/Button';
import { Loader2 } from 'lucide-react';

export default function WishlistPage() {
  const { wishlistItems, loading } = useWishlist();

  if (loading) {
    return (
      <div className="flex-1 bg-[#FAF7F2] py-20 flex flex-col items-center justify-center select-none">
        <Loader2 className="w-8 h-8 animate-spin text-antique-gold" />
        <p className="font-sans text-xs text-gray-500 uppercase tracking-widest mt-4">
          Loading your wishlist...
        </p>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="flex-1 bg-[#FAF7F2] py-20 px-4 flex flex-col items-center justify-center text-center select-none">
        <div className="w-20 h-20 rounded-full bg-white border border-gray-150 flex items-center justify-center text-2xl text-gray-400 mb-6 shadow-sm">
          ♡
        </div>
        <h2 className="font-display font-light text-2xl md:text-3.5xl italic text-ink mb-3">
          Your wishlist is empty
        </h2>
        <p className="font-sans text-xs md:text-sm text-gray-500 max-w-sm mb-8 leading-relaxed">
          Explore our premium handloom comforters, traditional Rajasthani bedsheets, and curtains, and save your favorites here.
        </p>
        <Button
          variant="primary"
          href="/shop"
          className="uppercase tracking-widest text-xs h-12 font-semibold px-8"
        >
          Explore Collection
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#FAF7F2] pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        
        {/* Page header */}
        <div className="space-y-2 border-b border-gray-150 pb-4">
          <h1 className="font-display font-light text-3xl md:text-5xl italic text-ink flex items-center gap-2">
            <span>❤️ My Wishlist</span>
          </h1>
          <p className="font-sans text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-medium">
            Your curated collection of premium Bikaner fabrics
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {wishlistItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

      </div>
    </div>
  );
}
