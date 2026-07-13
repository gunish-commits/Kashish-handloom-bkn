'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Category, ReturnPolicyType } from '../../types';
import Button from '../ui/Button';
import { X, SlidersHorizontal } from 'lucide-react';

interface ProductFiltersProps {
  categories: Category[];
  isOpen?: boolean;
  onClose?: () => void;
  isMobileDrawer?: boolean;
}

export default function ProductFilters({
  categories,
  isOpen = false,
  onClose,
  isMobileDrawer = false,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search parameters state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedPolicies, setSelectedPolicies] = useState<ReturnPolicyType[]>([]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Sync state with URL params on load
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategories(categoryParam.split(','));
    } else {
      setSelectedCategories([]);
    }

    setMinPrice(searchParams.get('min') || '');
    setMaxPrice(searchParams.get('max') || '');

    const returnParam = searchParams.get('return');
    if (returnParam) {
      setSelectedPolicies(returnParam.split(',') as ReturnPolicyType[]);
    } else {
      setSelectedPolicies([]);
    }

    setInStockOnly(searchParams.get('inStock') === 'true');
  }, [searchParams]);

  const handleCategoryChange = (slug: string) => {
    setSelectedCategories(prev =>
      prev.includes(slug) ? prev.filter(c => c !== slug) : [...prev, slug]
    );
  };

  const handlePolicyChange = (policy: ReturnPolicyType) => {
    setSelectedPolicies(prev =>
      prev.includes(policy) ? prev.filter(p => p !== policy) : [...prev, policy]
    );
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    // Update categories
    if (selectedCategories.length > 0) {
      params.set('category', selectedCategories.join(','));
    } else {
      params.delete('category');
    }

    // Update prices
    if (minPrice) {
      params.set('min', minPrice);
    } else {
      params.delete('min');
    }

    if (maxPrice) {
      params.set('max', maxPrice);
    } else {
      params.delete('max');
    }

    // Update return policy
    if (selectedPolicies.length > 0) {
      params.set('return', selectedPolicies.join(','));
    } else {
      params.delete('return');
    }

    // Update stock status
    if (inStockOnly) {
      params.set('inStock', 'true');
    } else {
      params.delete('inStock');
    }

    // Reset pagination to first page on filter apply
    params.delete('page');

    router.push(`/shop?${params.toString()}`);
    if (onClose) onClose();
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setMinPrice('');
    setSelectedPolicies([]);
    setInStockOnly(false);
    
    // Clear relevant search queries from URL, keeping search query text if any
    const params = new URLSearchParams();
    const searchVal = searchParams.get('search');
    if (searchVal) params.set('search', searchVal);

    router.push(`/shop?${params.toString()}`);
    if (onClose) onClose();
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Category Checkboxes */}
      <div className="space-y-3">
        <h4 className="font-sans font-medium text-xs text-[#1A110A] uppercase tracking-wider">
          Categories
        </h4>
        <div className="space-y-2">
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.slug)}
                onChange={() => handleCategoryChange(cat.slug)}
                className="w-4 h-4 accent-deep-maroon border-gray-300 rounded-[2px]"
              />
              <span className="text-gray-700">
                {cat.emoji} {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Price Range inputs */}
      <div className="space-y-3">
        <h4 className="font-sans font-medium text-xs text-[#1A110A] uppercase tracking-wider">
          Price Range (₹)
        </h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            className="w-full h-10 px-3 border border-gray-200 rounded-[4px] text-sm focus:outline-none focus:border-deep-maroon bg-white"
          />
          <span className="text-gray-400 text-xs">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            className="w-full h-10 px-3 border border-gray-200 rounded-[4px] text-sm focus:outline-none focus:border-deep-maroon bg-white"
          />
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Return Policy Checkboxes */}
      <div className="space-y-3">
        <h4 className="font-sans font-medium text-xs text-[#1A110A] uppercase tracking-wider">
          Return Policy
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedPolicies.includes('no_return')}
              onChange={() => handlePolicyChange('no_return')}
              className="w-4 h-4 accent-deep-maroon border-gray-300 rounded-[2px]"
            />
            <span className="text-gray-700">✕ No Returns</span>
          </label>
          <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedPolicies.includes('7_days')}
              onChange={() => handlePolicyChange('7_days')}
              className="w-4 h-4 accent-deep-maroon border-gray-300 rounded-[2px]"
            />
            <span className="text-gray-700">✓ 7-Day Returns</span>
          </label>
          <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedPolicies.includes('14_days')}
              onChange={() => handlePolicyChange('14_days')}
              className="w-4 h-4 accent-deep-maroon border-gray-300 rounded-[2px]"
            />
            <span className="text-gray-700">✓ 14-Day Returns</span>
          </label>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Stock availability */}
      <div className="flex items-center justify-between py-1.5">
        <span className="text-sm font-medium text-gray-700">Show In-Stock Only</span>
        <button
          type="button"
          onClick={() => setInStockOnly(!inStockOnly)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            inStockOnly ? 'bg-stock-green' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
              inStockOnly ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={clearFilters} className="text-xs uppercase tracking-wider h-11">
          Reset
        </Button>
        <Button variant="primary" onClick={applyFilters} className="text-xs uppercase tracking-wider h-11">
          Apply
        </Button>
      </div>
    </div>
  );

  if (isMobileDrawer) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-ink/75 backdrop-blur-xs" onClick={onClose} />
        
        {/* Bottom Sheet Drawer */}
        <div className="relative w-full max-h-[85vh] bg-white rounded-t-[12px] shadow-[0_-8px_32px_rgba(15,10,5,0.15)] flex flex-col z-10 page-fade-in animate-slide-up">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="font-sans font-medium text-sm text-ink flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-antique-gold" />
              <span>Filters & Sorting</span>
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-ink text-xl leading-none p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 pb-8">{filterContent}</div>
        </div>
      </div>
    );
  }

  // Desktop sidebar view
  return (
    <div className="w-[240px] shrink-0 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-4 hidden md:block">
      <div className="flex items-center gap-1.5 pb-4 mb-4 border-b border-gray-100">
        <SlidersHorizontal className="w-4 h-4 text-antique-gold" />
        <h3 className="font-sans font-medium text-sm text-ink uppercase tracking-wider">
          Filters
        </h3>
      </div>
      {filterContent}
    </div>
  );
}
