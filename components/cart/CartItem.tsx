'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CartItem as CartItemType } from '../../types';
import { useCart } from '../../context/CartContext';
import ReturnBadge from '../ui/ReturnBadge';
import { formatPrice } from '../../lib/utils';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { product_id, name, price, quantity, photo, stock, return_policy } = item;
  const { updateQuantity, removeFromCart } = useCart();

  const handleDecrease = () => {
    if (quantity > 1) {
      updateQuantity(product_id, quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < stock) {
      updateQuantity(product_id, quantity + 1);
    }
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-b-0">
      {/* Product Thumbnail (60x60px) */}
      <div className="relative w-[60px] h-[60px] shrink-0 border border-gray-100 rounded-[2px] overflow-hidden bg-gray-50">
        <Image
          src={photo}
          alt={name}
          fill
          sizes="60px"
          className="object-cover"
        />
      </div>

      {/* Product Details info */}
      <div className="flex-1 min-w-0 space-y-1">
        <h4 className="font-sans font-medium text-sm text-ink truncate leading-tight">
          {name}
        </h4>
        <div className="flex flex-wrap items-center gap-2">
          {/* Policy badge */}
          <ReturnBadge policy={return_policy} className="scale-90 origin-left" />
        </div>
      </div>

      {/* Quantity controls & Price info */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* Quantity control button selector */}
        <div className="flex items-center border border-gray-200 rounded-[4px] bg-white h-8 overflow-hidden select-none">
          <button
            type="button"
            onClick={handleDecrease}
            disabled={quantity <= 1}
            className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-ink disabled:opacity-30 cursor-pointer focus:outline-none"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center text-xs font-mono font-medium text-ink">
            {quantity}
          </span>
          <button
            type="button"
            onClick={handleIncrease}
            disabled={quantity >= stock}
            className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-ink disabled:opacity-30 cursor-pointer focus:outline-none"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Per-item total: DM Mono 400 */}
        <div className="text-right min-w-[70px]">
          <span className="font-mono text-sm text-ink font-medium">
            {formatPrice(price * quantity)}
          </span>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={() => removeFromCart(product_id)}
          className="text-gray-400 hover:text-stock-red p-1 cursor-pointer transition-colors focus:outline-none"
          aria-label="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
