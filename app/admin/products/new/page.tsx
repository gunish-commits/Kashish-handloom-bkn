'use client';

import React, { useEffect, useState } from 'react';
import { Category } from '../../../../types';
import { useAuth } from '../../../../context/AuthContext';
import ProductForm from '../../../../components/admin/ProductForm';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewProductPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    fetch('/api/admin/categories', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching admin categories for product new page:', err);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-deep-maroon font-sans select-none">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-semibold tracking-wider">Loading form configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-ink">
      {/* Headings with Back CTA */}
      <div className="space-y-3">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-deep-maroon font-sans font-medium uppercase tracking-wider select-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>

        <div className="border-b border-gray-250 pb-4 select-none">
          <h2 className="font-bold text-xl uppercase tracking-wider text-ink">Add New Product</h2>
          <p className="text-xs text-gray-500 font-medium">Create a new product listing in the catalog</p>
        </div>
      </div>

      {/* Main Form */}
      <ProductForm categories={categories} />
    </div>
  );
}
