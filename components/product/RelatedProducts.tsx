'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '../../types';
import ProductCard from './ProductCard';
import SkeletonCard from '../ui/SkeletonCard';

interface RelatedProductsProps {
  categoryId: string;
  excludeProductId: string;
}

export default function RelatedProducts({ categoryId, excludeProductId }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) return;
    
    setLoading(true);
    fetch(`/api/products?category_id=${categoryId}&limit=6`)
      .then(res => (res.ok ? res.json() : { products: [] }))
      .then(data => {
        // Filter out the current product being viewed
        const filtered = (data.products || []).filter(
          (p: Product) => p.id !== excludeProductId
        );
        setProducts(filtered.slice(0, 4)); // Show top 4 related products
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching related products:', err);
        setLoading(false);
      });
  }, [categoryId, excludeProductId]);

  if (loading) {
    return (
      <div className="space-y-6 pt-12 border-t border-gray-100">
        <h3 className="font-display font-light text-2xl md:text-3xl italic text-ink text-center">
          You May Also Like
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="space-y-6 pt-12 border-t border-gray-100 select-none">
      <h3 className="font-display font-light text-2xl md:text-3xl italic text-ink text-center">
        You May Also Like
      </h3>
      
      {/* Horizontal scrolling row on mobile, stable grid on desktop */}
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar md:grid md:grid-cols-4 md:gap-6">
        {products.map(product => (
          <div key={product.id} className="w-[240px] shrink-0 md:w-auto md:shrink">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
