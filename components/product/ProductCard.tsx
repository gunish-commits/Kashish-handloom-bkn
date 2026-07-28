'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import StockBadge from '../ui/StockBadge';
import ReturnBadge from '../ui/ReturnBadge';
import Button from '../ui/Button';
import { formatPrice } from '../../lib/utils';
import { Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { id, name, slug, price, sale_price, stock, low_stock_threshold, return_policy, photos, categories, description } = product;
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const categoryName = categories?.name || 'Handloom';
  const mainPhoto = photos && photos.length > 0 ? photos[0] : '/placeholder-product.jpg';
  const hoverPhoto = photos && photos.length > 1 ? photos[1] : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      product_id: id,
      slug,
      category_id: product.category_id || '',
      price: sale_price ?? price,
      name,
      photo: mainPhoto,
      stock,
      return_policy,
    });
  };

  const isOutOfStock = stock === 0;

  const getVariants = (desc: string | null) => {
    if (!desc) return [];
    const match = desc.match(/<!--COLOR_VARIANTS:(.*?)-->/);
    if (match) {
      try {
        return JSON.parse(match[1]) as { color: string; photos: string[] }[];
      } catch (e) {
        console.error('Failed to parse card variants:', e);
      }
    }
    return [];
  };

  const variants = getVariants(description);

  function getCssColor(colorName: string): string {
    const name = colorName.toLowerCase().trim();
    const mapping: Record<string, string> = {
      red: '#E53E3E',
      blue: '#3182CE',
      navy: '#1A365D',
      green: '#38A169',
      yellow: '#ECC94B',
      orange: '#DD6B20',
      pink: '#ED64A6',
      purple: '#805AD5',
      gray: '#718096',
      grey: '#718096',
      black: '#1A202C',
      white: '#FFFFFF',
      gold: '#D4AF37',
      brown: '#8B4513',
      beige: '#F5F5DC',
      cream: '#FFFDD0',
      maroon: '#800000',
      teal: '#319795',
      indigo: '#4C51BF',
      violet: '#EE82EE',
      peach: '#FFDAB9',
      mustard: '#E1AD01',
      olive: '#808000',
      lavender: '#E6E6FA',
      silver: '#C0C0C0',
      charcoal: '#36454F',
      rust: '#B7410E',
      sky: '#87CEEB',
      turquoise: '#40E0D0',
      magenta: '#FF00FF',
      coral: '#FF7F50',
    };

    if (mapping[name]) return mapping[name];
    for (const [key, value] of Object.entries(mapping)) {
      if (name.includes(key)) return value;
    }
    return '#C5A880';
  }

  return (
    <div className="group bg-card-white rounded-[4px] border border-gray-100 shadow-[0_2px_8px_rgba(15,10,5,0.08)] hover:shadow-[0_8px_24px_rgba(15,10,5,0.15)] hover:-translate-y-[3px] transition-all duration-250 flex flex-col h-full overflow-hidden">
      {/* Link surrounding Image area */}
      <Link href={`/product/${slug}`} className="relative aspect-[4/3] w-full block overflow-hidden bg-gray-50 shrink-0">
        {/* Main Product Image */}
        <Image
          src={mainPhoto}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition-transform duration-500 group-hover:scale-104 ${
            isOutOfStock ? 'opacity-60' : 'opacity-100'
          }`}
        />

        {/* Hover Crossfade Alternative Image */}
        {!isOutOfStock && hoverPhoto && (
          <Image
            src={hoverPhoto}
            alt={`${name} alternate`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:scale-104"
          />
        )}

        {/* Out of Stock Dark Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-ink/40 flex items-center justify-center transition-opacity z-10">
            <span className="bg-stock-red/90 text-white font-sans text-xs uppercase tracking-widest px-4 py-2 border border-white/20 rounded-[2px] font-semibold shadow-md">
              Out of Stock
            </span>
          </div>
        )}

        {/* Heart Icon Overlay */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`card-wishlist-btn ${isInWishlist(id) ? 'wishlisted' : ''}`}
          aria-label="Toggle Wishlist"
        >
          {isInWishlist(id) ? (
            <Heart className="w-[18px] h-[18px] fill-[#C0445A] text-[#C0445A] transition-all" />
          ) : (
            <Heart className="w-[18px] h-[18px] text-[#C0445A] transition-all" />
          )}
        </button>
      </Link>

      {/* Card Content Body */}
      <div className="p-4 flex flex-col flex-1 min-h-[175px]">
        {/* Category Label */}
        <p className="font-sans font-medium text-[10px] text-deep-maroon tracking-wider uppercase mb-1">
          {categoryName}
        </p>

        {/* Product Title */}
        <Link href={`/product/${slug}`} className="block mb-2">
          <h4 className="font-sans font-medium text-sm md:text-[15px] text-[#1A110A] hover:text-deep-maroon transition-colors line-clamp-2 leading-snug">
            {name}
          </h4>
        </Link>

        {/* Color variants dots preview */}
        {variants.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2 mt-0.5 select-none">
            <span className="text-[9px] text-gray-400 font-sans font-medium uppercase tracking-wider">
              Colours:
            </span>
            <div className="flex gap-1 items-center">
              {variants.slice(0, 4).map((v, idx) => (
                <span
                  key={idx}
                  title={v.color}
                  className="w-3 h-3 rounded-full border border-gray-200 block shadow-2xs shrink-0"
                  style={{ backgroundColor: getCssColor(v.color) }}
                />
              ))}
              {variants.length > 4 && (
                <span className="text-[9px] text-gray-500 font-sans font-semibold ml-0.5">
                  +{variants.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Price Row & Returns details stacked */}
        <div className="mt-auto space-y-2 mb-3">
          {/* Prices line */}
          <div className="flex items-baseline gap-2">
            {sale_price ? (
              <>
                <span className="font-mono font-semibold text-base text-deep-maroon">
                  {formatPrice(sale_price)}
                </span>
                <span className="font-mono text-xs text-gray-400 line-through">
                  {formatPrice(price)}
                </span>
              </>
            ) : (
              <span className="font-mono text-sm text-[#1A110A]">
                {formatPrice(price)}
              </span>
            )}
          </div>

          {/* Return Policy Info */}
          <div className="pt-0.5 border-t border-gray-50 flex items-center">
            <ReturnBadge policy={return_policy} />
          </div>
        </div>

        {/* CTA Add to Cart Button */}
        <Button
          variant={isOutOfStock ? 'secondary' : 'primary'}
          fullWidth
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className="mt-auto h-10 uppercase tracking-widest text-[11px]"
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
}
