'use client';

import React, { useState } from 'react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import StockBadge from '../ui/StockBadge';
import ReturnBadge from '../ui/ReturnBadge';
import Button from '../ui/Button';
import { formatPrice } from '../../lib/utils';
import { Minus, Plus, MessageCircle } from 'lucide-react';
import { buildDirectProductEnquiryMessage, getWhatsAppLink } from '../../lib/whatsapp';

interface ProductDetailsSectionProps {
  product: Product;
}

export default function ProductDetailsSection({ product }: ProductDetailsSectionProps) {
  const { id, name, price, sale_price, stock, low_stock_threshold, return_policy, fabric, size, sku, description } = product;
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'return' | 'details'>('description');

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleIncrease = () => {
    if (quantity < stock) setQuantity(prev => prev + 1);
  };

  const handleAddToCart = () => {
    addToCart({
      product_id: id,
      slug: product.slug,
      category_id: product.category_id || '',
      price: sale_price ?? price,
      name,
      photo: product.photos?.[0] || '/placeholder-product.jpg',
      stock,
      return_policy,
      quantity,
    });
  };

  // Build deep link for ordering this single product directly on WhatsApp
  const handleWhatsAppDirectOrder = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const message = buildDirectProductEnquiryMessage(
      name,
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
            <div className="flex justify-between">
              <span className="font-medium text-ink">Fabric/Material:</span>
              <span className="text-gray-500">{fabric}</span>
            </div>
          )}
          {size && (
            <div className="flex justify-between">
              <span className="font-medium text-ink">Size/Dimensions:</span>
              <span className="text-gray-500">{size}</span>
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
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="primary"
              onClick={handleAddToCart}
              className="w-full h-12 uppercase tracking-widest text-[11px] font-semibold"
            >
              Add to Cart
            </Button>
            <Button
              variant="whatsapp"
              onClick={handleWhatsAppDirectOrder}
              className="w-full h-12 uppercase tracking-widest text-[11px] font-semibold flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 fill-current text-white shrink-0" />
              <span>Order on WhatsApp</span>
            </Button>
          </div>
        </div>
      )}

      {/* Out of Stock CTA */}
      {isOutOfStock && (
        <Button variant="secondary" disabled fullWidth className="h-12 uppercase tracking-widest text-[11px] font-semibold">
          Out of Stock
        </Button>
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
            <p className="whitespace-pre-line leading-relaxed">{description || 'No description provided.'}</p>
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
                {stock > 0 ? `In Stock (${stock} pieces)` : 'Out of Stock'}
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
