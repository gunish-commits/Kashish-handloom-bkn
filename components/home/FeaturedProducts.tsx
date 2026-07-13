import React from 'react';
import { Product } from '../../types';
import ProductCard from '../product/ProductCard';
import Button from '../ui/Button';

interface FeaturedProductsProps {
  products: Product[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const displayProducts = products.slice(0, 8) || [];

  if (displayProducts.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-ink text-warm-ivory select-none border-t border-border-dark/35">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
        {/* Section Heading */}
        <div className="text-center space-y-2">
          <p className="font-sans font-medium text-[10px] md:text-xs text-antique-gold tracking-[0.15em] uppercase">
            Curated For You
          </p>
          <h2 className="font-display font-light text-2xl md:text-4xl italic text-warm-ivory">
            Featured Collection
          </h2>
        </div>

        {/* Products Grid: 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {displayProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All CTA Button */}
        <div className="flex justify-center pt-6">
          <Button
            variant="primary"
            href="/shop"
            className="h-11 px-8 uppercase tracking-widest text-[11px] font-semibold"
          >
            Shop All Products &rarr;
          </Button>
        </div>
      </div>
    </section>
  );
}
