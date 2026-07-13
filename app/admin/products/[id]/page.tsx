'use client';

import React, { useEffect, useState, use } from 'react';
import { Category, Product } from '../../../../types';
import { useAuth } from '../../../../context/AuthContext';
import ProductForm from '../../../../components/admin/ProductForm';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { token } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !id) return;

    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/admin/categories', { headers }).then(res => (res.ok ? res.json() : [])),
      fetch('/api/admin/products', { headers }).then(res => (res.ok ? res.json() : [])),
    ])
      .then(([categoriesData, productsData]) => {
        setCategories(categoriesData);
        const matched = (productsData as Product[]).find(p => p.id === id);
        if (matched) {
          setProduct(matched);
        } else {
          setError('Product not found.');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data for edit product page:', err);
        setError('Failed to load product configurations.');
        setLoading(false);
      });
  }, [token, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-deep-maroon font-sans select-none">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-semibold tracking-wider">Loading product data...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-12 bg-white border border-gray-200 rounded-[4px]">
        <p className="text-sm text-gray-500 font-sans">{error || 'An error occurred.'}</p>
        <Link href="/admin/products" className="text-deep-maroon font-semibold hover:underline mt-4 inline-block text-xs uppercase tracking-wider">
          &larr; Back to Products
        </Link>
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
          <h2 className="font-bold text-xl uppercase tracking-wider text-ink">Edit Product</h2>
          <p className="text-xs text-gray-500 font-medium">Modify inventory details for product ID: {id}</p>
        </div>
      </div>

      {/* Reusable Product Form with Prefills */}
      <ProductForm initialData={product} categories={categories} />
    </div>
  );
}
