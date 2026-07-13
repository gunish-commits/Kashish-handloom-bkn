'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Product } from '../../../types';
import Button from '../../../components/ui/Button';
import { Search, Loader2, Save, ArrowLeft, RefreshCw } from 'lucide-react';

function StockContent() {
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Local inventory modifications tracking
  const [modifiedStock, setModifiedStock] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Detect URL query filtering on load
  useEffect(() => {
    if (searchParams.get('filter') === 'low') {
      setShowLowStockOnly(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;
    fetchProducts();
  }, [token]);

  const fetchProducts = () => {
    setLoading(true);
    fetch('/api/admin/products', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleStockInputChange = (productId: string, val: string) => {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setModifiedStock(prev => ({ ...prev, [productId]: parsed }));
    }
  };

  const handleIncrement = (productId: string, currentStock: number, step: number) => {
    const currentVal = modifiedStock[productId] !== undefined ? modifiedStock[productId] : currentStock;
    const newVal = Math.max(0, currentVal + step);
    setModifiedStock(prev => ({ ...prev, [productId]: newVal }));
  };

  const handleSaveStock = async (product: Product) => {
    if (!token) return;
    const targetVal = modifiedStock[product.id];
    if (targetVal === undefined || targetVal === product.stock) return;

    setSavingId(product.id);
    try {
      const res = await fetch(`/api/admin/stock/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stock: targetVal }),
      });

      if (!res.ok) throw new Error('Failed to update stock.');
      const updated = await res.json();
      
      // Update local catalog list
      setProducts(prev => prev.map(p => (p.id === updated.id ? { ...p, stock: updated.stock } : p)));
      // Clear modifications tracking
      setModifiedStock(prev => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });
    } catch (err) {
      console.error(err);
      alert('Failed to save stock update.');
    } finally {
      setSavingId(null);
    }
  };

  // Filter client-side
  const filteredProducts = products.filter(prod => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.sku && prod.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const isLow = prod.stock <= prod.low_stock_threshold;
    const matchesLowStock = !showLowStockOnly || isLow;

    return matchesSearch && matchesLowStock;
  });

  return (
    <div className="space-y-6 font-sans text-ink">
      
      {/* Page Heading */}
      <div className="border-b border-gray-250 pb-4 select-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-bold text-xl uppercase tracking-wider text-ink">Inline Stock Manager</h2>
          <p className="text-xs text-gray-500 font-medium">Quickly audit inventory levels and save changes inline</p>
        </div>
        
        <button
          onClick={fetchProducts}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:border-antique-gold hover:text-antique-gold bg-white text-gray-500 rounded-[4px] text-xs font-semibold uppercase tracking-wider cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 border border-gray-200 rounded-[4px] shadow-xs select-none w-full">
        {/* Search */}
        <div className="w-full sm:flex-1 relative">
          <input
            type="text"
            placeholder="Search by name or sku..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-[4px] text-xs focus:outline-none focus:border-deep-maroon bg-white text-ink"
          />
          <Search className="w-4 h-4 text-antique-gold absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Checkbox selector */}
        <label className="w-full sm:w-auto flex items-center gap-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showLowStockOnly}
            onChange={e => setShowLowStockOnly(e.target.checked)}
            className="w-4 h-4 accent-deep-maroon border-gray-300 rounded-[2px]"
          />
          <span>Show Low Stock Warnings Only</span>
        </label>
      </div>

      {/* Stock Edit Grid Table */}
      {loading ? (
        <div className="text-center py-12 bg-white border border-gray-250 rounded-[4px] shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-antique-gold mx-auto mb-2" />
          <p className="text-xs text-gray-500 font-sans">Loading inventory metrics...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-[4px] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-gray-400 uppercase tracking-widest text-[9px] font-bold">
                  <th className="p-4">Product Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 w-32">Status Alert</th>
                  <th className="p-4 text-center w-72">Modify Quantity</th>
                  <th className="p-4 text-center w-24">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map(prod => {
                  const categoryName = prod.categories?.name || 'Handloom';
                  const isOutOfStock = prod.stock === 0;
                  const isLow = prod.stock <= prod.low_stock_threshold;
                  
                  // Active modified value or db stock count
                  const activeVal = modifiedStock[prod.id] !== undefined ? modifiedStock[prod.id] : prod.stock;
                  const hasChanged = activeVal !== prod.stock;

                  return (
                    <tr key={prod.id} className="hover:bg-gray-50/20">
                      {/* Name Details */}
                      <td className="p-4">
                        <p className="font-semibold text-ink text-sm truncate max-w-[200px]" title={prod.name}>
                          {prod.name}
                        </p>
                        {prod.sku && <span className="font-mono text-[9px] text-gray-400">SKU: {prod.sku}</span>}
                      </td>

                      {/* Category */}
                      <td className="p-4 text-gray-500 font-semibold">{categoryName}</td>

                      {/* Status Warning Tag */}
                      <td className="p-4">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded-[2px] bg-red-50 text-red-700 border border-red-100 font-bold uppercase tracking-wider text-[9px] animate-[pulse_1.5s_infinite]">
                            Out Of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-[2px] bg-amber-50 text-amber-700 border border-amber-100 font-bold uppercase tracking-wider text-[9px] animate-[pulse_2s_infinite]">
                            Low Stock ({prod.stock})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-[2px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold uppercase tracking-wider text-[9px]">
                            Healthy ({prod.stock})
                          </span>
                        )}
                      </td>

                      {/* Inline Modifier Box */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          
                          {/* Decrement controls */}
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleIncrement(prod.id, prod.stock, -5)}
                              className="px-2 py-1.5 border border-gray-200 text-gray-500 bg-white hover:border-antique-gold hover:text-antique-gold rounded-[3px] text-[10px] font-bold cursor-pointer select-none focus:outline-none"
                            >
                              -5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleIncrement(prod.id, prod.stock, -1)}
                              className="px-2.5 py-1.5 border border-gray-200 text-gray-500 bg-white hover:border-antique-gold hover:text-antique-gold rounded-[3px] text-[10px] font-bold cursor-pointer select-none focus:outline-none"
                            >
                              -1
                            </button>
                          </div>

                          {/* Direct Input number */}
                          <input
                            type="number"
                            value={activeVal}
                            onChange={e => handleStockInputChange(prod.id, e.target.value)}
                            className="w-16 h-8 border border-gray-200 text-center font-mono font-bold text-xs focus:outline-none focus:border-deep-maroon rounded-[3px] bg-white text-ink"
                          />

                          {/* Increment controls */}
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleIncrement(prod.id, prod.stock, 1)}
                              className="px-2.5 py-1.5 border border-gray-200 text-gray-500 bg-white hover:border-antique-gold hover:text-antique-gold rounded-[3px] text-[10px] font-bold cursor-pointer select-none focus:outline-none"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleIncrement(prod.id, prod.stock, 5)}
                              className="px-2 py-1.5 border border-gray-200 text-gray-500 bg-white hover:border-antique-gold hover:text-antique-gold rounded-[3px] text-[10px] font-bold cursor-pointer select-none focus:outline-none"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleIncrement(prod.id, prod.stock, 10)}
                              className="px-1.5 py-1.5 border border-gray-200 text-gray-500 bg-white hover:border-antique-gold hover:text-antique-gold rounded-[3px] text-[10px] font-bold cursor-pointer select-none focus:outline-none"
                            >
                              +10
                            </button>
                          </div>

                        </div>
                      </td>

                      {/* Save Changes button */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          disabled={!hasChanged || savingId === prod.id}
                          onClick={() => handleSaveStock(prod)}
                          className={`p-2 border rounded-[4px] cursor-pointer transition-all focus:outline-none ${
                            hasChanged
                              ? 'bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-350'
                              : 'border-gray-150 bg-gray-50 text-gray-300 pointer-events-none'
                          }`}
                          title="Save inventory updates"
                        >
                          {savingId === prod.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </button>
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
          <p className="text-sm text-gray-500 font-sans">All stock filters checked out healthy.</p>
        </div>
      )}

    </div>
  );
}

export default function AdminStockPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-antique-gold" />
      </div>
    }>
      <StockContent />
    </Suspense>
  );
}
