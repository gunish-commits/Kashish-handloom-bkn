import React from 'react';
import { ReturnPolicyType } from '../../types';

interface ReturnBadgeProps {
  policy: ReturnPolicyType;
  className?: string;
  large?: boolean;
}

export default function ReturnBadge({ policy, className = '', large = false }: ReturnBadgeProps) {
  if (large) {
    if (policy === 'no_return') {
      return (
        <div
          className={`flex items-start gap-2.5 p-3.5 rounded-[4px] bg-stock-red/5 border border-stock-red/15 text-stock-red ${className}`}
        >
          <span className="text-base leading-none select-none">⚠</span>
          <div className="text-sm font-sans">
            <span className="font-semibold block mb-0.5">Non-Returnable Product</span>
            <span className="text-stock-red/80 text-xs">This product is non-returnable. All sales final.</span>
          </div>
        </div>
      );
    }
    const days = policy === '7_days' ? '7' : '14';
    return (
      <div
        className={`flex items-start gap-2.5 p-3.5 rounded-[4px] bg-stock-green/5 border border-stock-green/15 text-[#358f5c] ${className}`}
      >
        <span className="text-base leading-none select-none">✓</span>
        <div className="text-sm font-sans">
          <span className="font-semibold block mb-0.5">{days}-Day Easy Return</span>
          <span className="text-[#358f5c]/80 text-xs">
            Return within {days} days of delivery if you are not fully satisfied.
          </span>
        </div>
      </div>
    );
  }

  // Small inline variant for product cards
  if (policy === 'no_return') {
    return (
      <span className={`inline-flex items-center text-xs text-gray-400 gap-1 font-sans ${className}`}>
        <span className="text-[10px]">✕</span>
        <span>No Returns</span>
      </span>
    );
  }

  const label = policy === '7_days' ? '7-Day Return' : '14-Day Return';
  return (
    <span className={`inline-flex items-center text-xs text-[#358f5c] gap-1 font-medium font-sans ${className}`}>
      <span className="text-[10px]">✓</span>
      <span>{label}</span>
    </span>
  );
}
