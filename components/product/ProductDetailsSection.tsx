'use client';

import React, { useState } from 'react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import StockBadge from '../ui/StockBadge';
import ReturnBadge from '../ui/ReturnBadge';
import Button from '../ui/Button';
import { formatPrice } from '../../lib/utils';
import { Minus, Plus, MessageCircle, Heart } from 'lucide-react';
import { buildDirectProductEnquiryMessage, getWhatsAppLink } from '../../lib/whatsapp';

interface ColorVariant {
  color: string;
  photos: string[];
}

function parseVariants(description: string | null): { cleanDescription: string; variants: ColorVariant[] } {
  if (!description) return { cleanDescription: '', variants: [] };
  const match = description.match(/<!--COLOR_VARIANTS:(.*?)-->/);
  if (match) {
    try {
      const variants = JSON.parse(match[1]);
      const cleanDescription = description.replace(/<!--COLOR_VARIANTS:.*?-->/g, '').trim();
      return { cleanDescription, variants };
    } catch (e) {
      console.error('Error parsing variants:', e);
    }
  }
  return { cleanDescription: description, variants: [] };
}

interface ProductDetailsSectionProps {
  product: Product;
}

export default function ProductDetailsSection({ product }: ProductDetailsSectionProps) {
  const { id, name, price, sale_price, stock, low_stock_threshold, return_policy, fabric, size, sku, description } = product;
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'return' | 'details'>('description');

  const { cleanDescription, variants } = parseVariants(description);
  const activeColor = searchParams.get('color');

  const handleColorSelect = (colorName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('color', colorName);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleIncrease = () => {
    if (quantity < stock) setQuantity(prev => prev + 1);
  };

  const handleAddToCart = () => {
    const selectedColor = activeColor || (variants.length > 0 ? variants[0].color : null);
    const finalItemName = selectedColor ? `${name} (${selectedColor})` : name;

    const selectedVariant = variants.find(v => v.color === selectedColor);
    const finalPhoto = (selectedVariant && selectedVariant.photos.length > 0)
      ? selectedVariant.photos[0]
      : (product.photos?.[0] || '/placeholder-product.jpg');

    addToCart({
      product_id: id,
      slug: product.slug,
      category_id: product.category_id || '',
      price: sale_price ?? price,
      name: finalItemName,
      photo: finalPhoto,
      stock,
      return_policy,
      quantity,
    });
  };

  // Build deep link for ordering this single product directly on WhatsApp
  const handleWhatsAppDirectOrder = () => {
    const selectedColor = activeColor || (variants.length > 0 ? variants[0].color : null);
    const finalItemName = selectedColor ? `${name} (${selectedColor})` : name;

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const message = buildDirectProductEnquiryMessage(
      finalItemName,
      sku,
      sale_price ?? price,
      currentUrl
    );
    const link = getWhatsAppLink('+918209455157', message);
    window.open(link, '_blank');
  };

  const isOutOfStock = stock === 0;

  return (
    <div className="space-y-6">
      {/* Product Title and SKU */}
      <div className="space-y-1">
        <h1 className="font-display font-semibold text-2xl md:text-3.5xl text-ink leading-tight">
          {name}
        </h1>
        {sku && (
          <p className="font-mono text-[11px] text-gray-400 uppercase tracking-widest">
            SKU: {sku}
          </p>
        )}
      </div>

      {/* Color Selection row (Switched above Price) */}
      {variants.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium font-sans">
            <span>Color:</span>
            <span className="text-ink font-semibold uppercase">{activeColor || variants[0]?.color}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {variants.map((v, idx) => {
              const isSelected = activeColor === v.color || (!activeColor && idx === 0);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleColorSelect(v.color)}
                  className={`px-3 py-1.5 rounded-[4px] border text-xs font-medium font-sans uppercase tracking-wider transition-all cursor-pointer ${
                    isSelected
                      ? 'border-deep-maroon bg-deep-maroon text-white font-semibold shadow-sm'
                      : 'border-gray-250 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {v.color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price section */}
      <div className="py-3 border-y border-gray-100 flex items-center gap-4">
        {sale_price ? (
          <div className="flex items-baseline gap-3">
            <span className="font-mono font-bold text-2xl md:text-3xl text-deep-maroon">
              {formatPrice(sale_price)}
            </span>
            <span className="font-mono text-sm md:text-base text-gray-400 line-through">
              {formatPrice(price)}
            </span>
            <span className="bg-antique-gold/15 text-antique-gold border border-antique-gold/20 px-2 py-0.5 rounded-[3px] font-sans text-[10px] uppercase font-bold tracking-wider">
              SAVE {Math.round(((price - sale_price) / price) * 100)}%
            </span>
          </div>
        ) : (
          <span className="font-mono font-semibold text-xl md:text-2xl text-ink">
            {formatPrice(price)}
          </span>
        )}
      </div>

      {/* Stock status indicator */}
      <div className="flex items-center gap-3">
        <span className="font-sans text-xs text-gray-500 font-medium">Availability:</span>
        <StockBadge stock={stock} threshold={low_stock_threshold} className="scale-105" />
      </div>

      {/* Return policy warning/banner */}
      <ReturnBadge policy={return_policy} large />

      {/* Spec details preview */}
      {(fabric || size) && (
        <div className="bg-[#EDE4D4]/15 border border-[#dfd4be]/20 rounded-[4px] p-3.5 space-y-2 text-xs md:text-sm text-gray-600 font-sans">
          {fabric && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-0.5">
              <span className="font-medium text-ink">Fabric/Material:</span>
              <span className="text-gray-550 sm:col-span-2">{fabric}</span>
            </div>
          )}
          {size && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-0.5">
              <span className="font-medium text-ink">Size/Dimensions:</span>
              <span className="text-gray-550 sm:col-span-2">{size}</span>
            </div>
          )}
        </div>
      )}

      {/* Quantity picker & checkout CTAs */}
      {!isOutOfStock && (
        <div className="space-y-4 pt-2">
          {/* Selector quantity row */}
          <div className="flex items-center gap-4">
            <span className="font-sans text-xs text-gray-500 font-medium select-none">Quantity:</span>
            <div className="flex items-center border border-gray-200 rounded-[4px] bg-white h-10 select-none">
              <button
                type="button"
                onClick={handleDecrease}
                disabled={quantity <= 1}
                className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-ink disabled:opacity-30 cursor-pointer focus:outline-none"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-sm font-mono font-bold text-ink">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrease}
                disabled={quantity >= stock}
                className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-ink disabled:opacity-30 cursor-pointer focus:outline-none"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action triggers */}
          <div className="product-actions flex flex-col gap-2.5 pt-2">
            <div className="add-to-cart-btn w-full">
              <Button
                variant="primary"
                onClick={handleAddToCart}
                className="w-full h-12 uppercase tracking-widest text-[11px] font-semibold"
              >
                Add to Cart
              </Button>
            </div>
            
            <div className="product-actions-row flex gap-[10px] w-full">
              {/* Wishlist Button (40% width) */}
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`product-detail-wishlist-btn w-[40%] flex-shrink-0 flex-grow-0 ${isInWishlist(id) ? 'wishlisted' : ''}`}
              >
                {isInWishlist(id) ? (
                  <>
                    <Heart className="w-4 h-4 fill-[#C0445A] text-[#C0445A] shrink-0" />
                    <span className="wishlist-btn-label">Wishlisted</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 text-[#C0445A] shrink-0" />
                    <span className="wishlist-btn-label">Wishlist</span>
                  </>
                )}
              </button>

              {/* WhatsApp Order Button (60% width) */}
              <Button
                variant="whatsapp"
                onClick={handleWhatsAppDirectOrder}
                className="whatsapp-order-btn flex-1 h-12 uppercase tracking-widest text-[11px] font-semibold flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 fill-current text-white shrink-0" />
                <span>Order on WhatsApp</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Out of Stock CTA */}
      {isOutOfStock && (
        <div className="space-y-3 pt-2">
          <Button variant="secondary" disabled fullWidth className="h-12 uppercase tracking-widest text-[11px] font-semibold">
            Out of Stock
          </Button>
          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            className={`product-detail-wishlist-btn w-full ${isInWishlist(id) ? 'wishlisted' : ''}`}
          >
            {isInWishlist(id) ? (
              <>
                <Heart className="w-4 h-4 fill-[#C0445A] text-[#C0445A] shrink-0" />
                <span>Wishlisted</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 text-[#C0445A] shrink-0" />
                <span>Wishlist</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 4. Tab Panels description/returns/details */}
      <div className="pt-6 border-t border-gray-100">
        <div className="flex border-b border-gray-150 text-xs uppercase tracking-wider font-sans font-semibold text-gray-400">
          <button
            onClick={() => setActiveTab('description')}
            className={`py-3.5 px-4 border-b-2 -mb-[2px] transition-all cursor-pointer ${
              activeTab === 'description' ? 'border-deep-maroon text-deep-maroon' : 'border-transparent hover:text-ink'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('return')}
            className={`py-3.5 px-4 border-b-2 -mb-[2px] transition-all cursor-pointer ${
              activeTab === 'return' ? 'border-deep-maroon text-deep-maroon' : 'border-transparent hover:text-ink'
            }`}
          >
            Return Policy
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3.5 px-4 border-b-2 -mb-[2px] transition-all cursor-pointer ${
              activeTab === 'details' ? 'border-deep-maroon text-deep-maroon' : 'border-transparent hover:text-ink'
            }`}
          >
            Details
          </button>
        </div>

        {/* Tab panels details */}
        <div className="py-5 font-sans text-xs md:text-sm text-gray-600 leading-relaxed">
          {activeTab === 'description' && (
            <p className="whitespace-pre-line leading-relaxed">{cleanDescription || 'No description provided.'}</p>
          )}

          {activeTab === 'return' && (
            <div className="space-y-3 leading-relaxed">
              <p>
                {return_policy === 'no_return'
                  ? 'All sales are final. Since our textiles are hand-woven in local Bikaner heritage looms, we do not accept returns or exchanges for this item.'
                  : `We stand by the quality of our craftsmanship. Returns are accepted within ${
                      return_policy === '7_days' ? '7' : '14'
                    } days of delivery. The item must be unused, unwashed, and in its original retail folds.`}
              </p>
              <p className="text-xs text-gray-400">
                To initiate a return or resolve complaints, please use the account section or message us directly on WhatsApp with your Order ID.
              </p>
            </div>
          )}

          {activeTab === 'details' && (
            <ul className="space-y-2.5">
              <li>
                <span className="font-semibold text-ink">Material/Fabric:</span> {fabric || 'Traditional Weave'}
              </li>
              <li>
                <span className="font-semibold text-ink">Dimensions:</span> {size || 'Standard Size'}
              </li>
              <li>
                <span className="font-semibold text-ink">Availability Status:</span>{' '}
                {stock > 0 ? 'In Stock' : 'Out of Stock'}
              </li>
              {sku && (
                <li>
                  <span className="font-semibold text-ink">SKU / Item Code:</span> {sku}
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
