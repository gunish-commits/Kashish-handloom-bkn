'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product, Category } from '../../../types';
import ProductFilters from '../../../components/product/ProductFilters';
import ProductGrid from '../../../components/product/ProductGrid';
import { Search, SlidersHorizontal, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Categories & Products States
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Search States
  const [searchInput, setSearchInput] = useState('');
  const [livePreviewResults, setLivePreviewResults] = useState<Product[]>([]);
  const [showShopSearchDropdown, setShowShopSearchDropdown] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const liveSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pagination page tracker
  const [page, setPage] = useState(1);

  // Sync search input from URL on mount/change
  useEffect(() => {
    setSearchInput(searchParams.get('search') || '');
  }, [searchParams]);

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then(res => (res.ok ? res.json() : []))
      .then(data => setCategories(data))
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  // Fetch products when searchParams or page changes
  useEffect(() => {
    setLoading(true);

    const query = new URLSearchParams(searchParams.toString());
    query.set('limit', '24');
    query.set('page', page.toString());

    if (!query.has('sort')) {
      query.set('sort', 'newest');
    }

    fetch(`/api/products?${query.toString()}`)
      .then(res => (res.ok ? res.json() : { products: [], total: 0, hasMore: false }))
      .then(data => {
        if (page === 1) {
          setProducts(data.products || []);
        } else {
          setProducts(prev => [...prev, ...(data.products || [])]);
        }
        setTotalCount(data.total || 0);
        setHasMore(data.hasMore || false);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching products:', err);
        setLoading(false);
      });
  }, [searchParams, page]);

  // Reset page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [searchParams]);

  // Handle live search input changes with 300ms debounce
  const handleSearchChange = (val: string) => {
    // 1. URL search updates
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (val.trim() !== '') {
        params.set('search', val.trim());
      } else {
        params.delete('search');
      }
      params.delete('page');
      router.push(`/shop?${params.toString()}`);
    }, 300);

    // 2. Fetch live dropdown previews
    if (val.trim().length >= 2) {
      if (liveSearchTimeoutRef.current) clearTimeout(liveSearchTimeoutRef.current);
      liveSearchTimeoutRef.current = setTimeout(() => {
        fetch(`/api/products?search=${encodeURIComponent(val.trim())}&limit=5`)
          .then(res => (res.ok ? res.json() : { products: [] }))
          .then(data => {
            setLivePreviewResults(data.products || []);
            setShowShopSearchDropdown(true);
          })
          .catch(() => setLivePreviewResults([]));
      }, 200);
    } else {
      setLivePreviewResults([]);
      setShowShopSearchDropdown(false);
    }
  };

  const handleSortChange = (sortVal: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sortVal);
    params.delete('page');
    router.push(`/shop?${params.toString()}`);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const activeCategoryParam = searchParams.get('category');
  let categoryLabel = '';
  if (activeCategoryParam && categories.length > 0) {
    const activeSlugs = activeCategoryParam.split(',');
    if (activeSlugs.length === 1) {
      const matched = categories.find(c => c.slug === activeSlugs[0]);
      if (matched) categoryLabel = matched.name;
    } else {
      categoryLabel = 'Multiple';
    }
  }

  const sortValue = searchParams.get('sort') || 'newest';
  const searchQueryParam = searchParams.get('search');

  return (
    <div className="flex-1 bg-[#FAF7F2] pb-16">
      {/* 1. Header with Search Bar */}
      <div className="bg-ink text-warm-ivory py-10 border-b border-border-dark/25">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h1 className="font-display font-light text-3xl md:text-5xl italic">
              Kashish Handloom Catalog
            </h1>
            <p className="font-sans text-xs md:text-sm text-pale-linen/70 uppercase tracking-widest">
              Premium Bedsheets, Blankets, Curtains & Decor
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-xl mx-auto relative select-none">
            <input
              type="text"
              placeholder="Search bedsheets, curtains, blankets..."
              value={searchInput}
              onChange={e => {
                setSearchInput(e.target.value);
                handleSearchChange(e.target.value);
              }}
              className="w-full h-12 pl-12 pr-10 bg-surface-dark border border-border-dark/60 rounded-[4px] text-sm text-warm-ivory placeholder-gray-400 focus:outline-none focus:border-antique-gold focus:ring-0 transition-colors font-sans"
            />
            <Search className="w-5 h-5 text-antique-gold absolute left-4 top-1/2 -translate-y-1/2" />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  handleSearchChange('');
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-warm-ivory text-xl focus:outline-none cursor-pointer"
              >
                &times;
              </button>
            )}

            {/* Live Autocomplete preview dropdown */}
            {searchInput.trim().length >= 2 && livePreviewResults.length > 0 && showShopSearchDropdown && (
              <div className="absolute top-13 left-0 right-0 bg-ink border border-border-dark/65 rounded-[4px] shadow-lg overflow-hidden z-50 text-xs divide-y divide-border-dark/40">
                {livePreviewResults.map(p => (
                  <Link
                    key={p.id}
                    href={`/product/${p.slug}`}
                    onClick={() => setShowShopSearchDropdown(false)}
                    className="flex items-center gap-2.5 p-2.5 hover:bg-surface-dark/85 transition-colors text-left"
                  >
                    <div className="relative w-9 h-9 shrink-0 bg-surface-mid rounded-sm overflow-hidden">
                      {p.photos && p.photos[0] ? (
                        <Image src={p.photos[0]} alt={p.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-medium text-warm-ivory truncate">{p.name}</p>
                      <p className="font-mono text-[10px] text-antique-gold">
                        ₹{p.sale_price || p.price}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Catalog View Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-6">
        {/* 2. Breadcrumbs & Stats Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-gray-100">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-sans tracking-wide">
            <Link href="/" className="hover:text-deep-maroon transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/shop" className="hover:text-deep-maroon transition-colors">
              Shop
            </Link>
            {categoryLabel && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-ink font-medium">{categoryLabel}</span>
              </>
            )}
          </div>

          {/* Stats & Sort selection */}
          <div className="flex items-center justify-between sm:justify-end gap-6">
            <span className="text-xs text-gray-500 font-sans">
              Showing {products.length} of {totalCount} products
            </span>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-xs text-gray-500 font-sans font-medium uppercase tracking-wider">
                Sort:
              </label>
              <select
                id="sort"
                value={sortValue}
                onChange={e => handleSortChange(e.target.value)}
                className="h-8 px-2 border border-gray-250 bg-white text-ink text-xs font-sans rounded-[3px] focus:outline-none focus:border-deep-maroon"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="featured">Featured First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Catalog Workspace (Sidebar filters + Grid) */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Desktop Left Sidebar Filters */}
          <ProductFilters categories={categories} />

          {/* Mobile Filter Trigger Button */}
          <div className="w-full md:hidden sticky top-14 z-20 bg-[#FAF7F2] py-2 border-b border-gray-100 flex justify-center">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-ink text-warm-ivory rounded-[4px] text-xs font-sans font-medium uppercase tracking-wider shadow-sm select-none cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-antique-gold" />
              <span>Filters & Sort</span>
            </button>
          </div>

          {/* Catalog Grid View */}
          <div className="flex-1 w-full">
            {products.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center select-none animate-fadeIn font-sans">
                <div className="w-16 h-16 rounded-full bg-warm-ivory border border-[#dfd6be]/30 flex items-center justify-center text-2xl text-antique-gold mb-4 shadow-[0_4px_12px_rgba(184,137,42,0.06)]">
                  🌾
                </div>
                <h3 className="font-sans font-medium text-sm text-ink uppercase tracking-wider mb-2">
                  {searchQueryParam ? `No products found for "${searchQueryParam}"` : "No products matched"}
                </h3>
                <p className="font-sans text-xs text-gray-500 max-w-xs leading-relaxed mb-4">
                  {searchQueryParam 
                    ? "Try searching for another keyword or check spelling."
                    : "We couldn't find any products in Bikaner inventory matching these filters."}
                </p>
                {searchQueryParam && (
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.delete('search');
                      router.push(`/shop?${params.toString()}`);
                    }}
                    className="h-10 px-6 border border-antique-gold text-antique-gold bg-transparent hover:bg-antique-gold hover:text-ink font-sans font-medium text-xs tracking-widest uppercase transition-all duration-200 rounded-[4px] cursor-pointer focus:outline-none"
                  >
                    Browse All Products
                  </button>
                )}
              </div>
            ) : (
              <ProductGrid
                products={products}
                loading={loading}
                onLoadMore={loadMore}
                hasMore={hasMore}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Slide-sheet */}
      <ProductFilters
        categories={categories}
        isMobileDrawer
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
      />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-[#FAF7F2] flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-antique-gold font-display italic text-2xl">
          Loading Catalog...
        </div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
