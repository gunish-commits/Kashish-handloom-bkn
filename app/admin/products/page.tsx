'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../../context/AuthContext';
import { Product, Category } from '../../../types';
import { formatPrice } from '../../../lib/utils';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import {
  Plus,
  Search,
  Filter,
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  Package,
  Loader2,
} from 'lucide-react';

export default function AdminProductsPage() {
  const { token } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Delete Modal states
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!token) return;
    
    // Fetch products and categories
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('/api/admin/products', { headers }).then(res => (res.ok ? res.json() : [])),
      fetch('/api/admin/categories', { headers }).then(res => (res.ok ? res.json() : [])),
    ])
      .then(([productsData, categoriesData]) => {
        setProducts(productsData);
        setCategories(categoriesData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching admin products:', err);
        setLoading(false);
      });
  }, [token]);

  // Toggle Active State
  const handleToggleActive = async (product: Product) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !product.active }),
      });

      if (!res.ok) throw new Error('Failed to update product active state');
      const updated = await res.json();
      setProducts(prev => prev.map(p => (p.id === updated.id ? { ...p, active: updated.active } : p)));
    } catch (err) {
      console.error(err);
      alert('Failed to update active state.');
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deleteProduct || !token) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/products/${deleteProduct.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete product');
      setProducts(prev => prev.filter(p => p.id !== deleteProduct.id));
      setDeleteProduct(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete product. It may be linked to past order records.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter products client-side
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === '' || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 font-sans text-ink">
      
      {/* Headings and CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-250 pb-4 select-none">
        <div>
          <h2 className="font-bold text-xl uppercase tracking-wider text-ink">Products Directory</h2>
          <p className="text-xs text-gray-500 font-medium">Create, edit, toggle visibility, and manage handloom products</p>
        </div>
        <Button
          variant="primary"
          href="/admin/products/new"
          className="self-start sm:self-auto flex items-center gap-1.5 h-10 uppercase tracking-widest text-[10px] font-bold"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Add New Product</span>
        </Button>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-gray-200 rounded-[4px] shadow-xs select-none">
        {/* Search */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by name or sku..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-[4px] text-xs focus:outline-none focus:border-deep-maroon bg-white text-ink"
          />
          <Search className="w-4 h-4 text-antique-gold absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter className="w-4 h-4 text-antique-gold shrink-0" />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full h-10 px-3 border border-gray-200 rounded-[4px] text-xs focus:outline-none focus:border-deep-maroon bg-white text-ink cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product List Table */}
      {loading ? (
        <div className="text-center py-12 bg-white border border-gray-250 rounded-[4px] shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-antique-gold mx-auto mb-2" />
          <p className="text-xs text-gray-500">Loading products catalog...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-[4px] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-gray-400 uppercase tracking-widest text-[9px] font-bold">
                  <th className="p-4 w-16">Photo</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Return Policy</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map(prod => {
                  const categoryName = prod.categories?.name || 'Handloom';
                  const mainPhoto = prod.photos && prod.photos.length > 0 ? prod.photos[0] : '/placeholder-product.jpg';

                  return (
                    <tr key={prod.id} className="hover:bg-gray-50/20">
                      {/* Photo Thumbnail */}
                      <td className="p-4">
                        <div className="relative w-10 h-10 border border-gray-100 rounded-[2px] overflow-hidden bg-gray-50 shrink-0">
                          <Image
                            src={mainPhoto}
                            alt={prod.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      </td>

                      {/* Product Name */}
                      <td className="p-4 font-medium text-ink pr-4">
                        <p className="text-sm font-semibold truncate max-w-[200px]" title={prod.name}>
                          {prod.name}
                        </p>
                        {prod.sku && <span className="font-mono text-[9px] text-gray-400">SKU: {prod.sku}</span>}
                      </td>

                      {/* Category */}
                      <td className="p-4 text-gray-500 font-semibold">{categoryName}</td>

                      {/* Pricing */}
                      <td className="p-4 font-mono font-semibold">
                        {prod.sale_price ? (
                          <div className="flex flex-col">
                            <span className="text-deep-maroon font-bold">{formatPrice(prod.sale_price)}</span>
                            <span className="text-[10px] text-gray-400 line-through leading-none">{formatPrice(prod.price)}</span>
                          </div>
                        ) : (
                          <span>{formatPrice(prod.price)}</span>
                        )}
                      </td>

                      {/* Stock Level */}
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-[2px] font-mono font-bold ${
                          prod.stock === 0
                            ? 'bg-red-50 text-red-700'
                            : prod.stock <= prod.low_stock_threshold
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {prod.stock}
                        </span>
                      </td>

                      {/* Return Policy */}
                      <td className="p-4 capitalize">
                        {prod.return_policy === 'no_return' ? (
                          <span className="text-gray-400 font-semibold">No Returns</span>
                        ) : (
                          <span className="text-emerald-700 font-semibold">
                            {prod.return_policy === '7_days' ? '7-Day Return' : '14-Day Return'}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                          prod.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-gray-50 text-gray-500 border-gray-150'
                        }`}>
                          {prod.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Action triggers */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit */}
                          <Link
                            href={`/admin/products/${prod.id}`}
                            className="p-2 border border-gray-200 hover:border-deep-maroon hover:text-deep-maroon bg-white text-gray-400 rounded-[4px] cursor-pointer transition-colors"
                            title="Edit product"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>

                          {/* Toggle Active */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(prod)}
                            className={`p-2 border rounded-[4px] cursor-pointer transition-colors ${
                              prod.active
                                ? 'border-gray-200 hover:border-gray-400 text-gray-400'
                                : 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400'
                            }`}
                            title={prod.active ? 'Hide Product' : 'Show Product'}
                          >
                            {prod.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteProduct(prod)}
                            className="p-2 border border-gray-200 hover:border-red-650 hover:bg-red-50 hover:text-red-750 text-gray-400 rounded-[4px] cursor-pointer transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 border border-gray-200 rounded-[4px] bg-white shadow-xs">
          <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6" />
          </div>
          <p className="text-sm text-gray-500 font-sans">No products match your query parameters.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        title="Confirm Deletion"
      >
        <div className="space-y-4 font-sans text-sm">
          <p className="text-gray-600 leading-relaxed">
            Are you absolutely sure you want to delete <span className="font-bold text-ink">"{deleteProduct?.name}"</span>?
            This action cannot be undone and will remove the product permanently from Bikaner catalog.
          </p>
          <div className="flex justify-end gap-3.5 border-t border-gray-50 pt-4">
            <Button
              variant="secondary"
              onClick={() => setDeleteProduct(null)}
              disabled={isDeleting}
              className="text-xs uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-stock-red hover:bg-[#721515] text-white text-xs uppercase tracking-wider flex items-center gap-1"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete</span>
              )}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
