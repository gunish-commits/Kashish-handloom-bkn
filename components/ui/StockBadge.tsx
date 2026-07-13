import React from 'react';
import { getStockBadge } from '../../lib/stock';

interface StockBadgeProps {
  stock: number;
  threshold?: number;
  className?: string;
  hideHealthy?: boolean; // Toggle hiding healthy stock (>10) for product card layout
}

export default function StockBadge({
  stock,
  threshold = 5,
  className = '',
  hideHealthy = false,
}: StockBadgeProps) {
  const { label, variant, pulse } = getStockBadge(stock, threshold);

  if (hideHealthy && stock > 10) {
    return null;
  }

  const badgeColors = {
    green: 'bg-stock-green/15 text-[#358f5c] border-[#358f5c]/25',
    orange: 'bg-stock-orange/15 text-[#d0702d] border-[#d0702d]/25',
    red: 'bg-stock-red/15 text-[#b22a2a] border-[#b22a2a]/25',
  };

  const pulseClass = pulse ? 'animate-pulse-stock shadow-[0_0_8px_rgba(196,105,42,0.25)]' : '';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border text-[11px] font-sans font-medium uppercase tracking-[0.06em] leading-none ${badgeColors[variant as keyof typeof badgeColors]} ${pulseClass} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
        </span>
      )}
      {label}
    </span>
  );
}
