'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Product, Order, Offer, Complaint, OrderStatus } from '../../../types';
import { formatPrice } from '../../../lib/utils';
import Link from 'next/link';
import {
  Package,
  ShoppingBag,
  TrendingDown,
  Tag,
  AlertTriangle,
  Receipt,
  AlertCircle,
  ArrowUpRight,
  Loader2,
  ChevronDown,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const ORDER_STATUSES: { key: OrderStatus; label: string; emoji: string; color: string }[] = [
  { key: 'pending', label: 'Pending', emoji: '⏳', color: 'bg-amber-50 text-[#D97706] border-amber-200' },
  { key: 'new', label: 'New', emoji: '🆕', color: 'bg-blue-50 text-[#2563EB] border-blue-200' },
  { key: 'confirmed', label: 'Confirmed', emoji: '✅', color: 'bg-indigo-50 text-[#7C3AED] border-indigo-200' },
  { key: 'processing', label: 'Processing', emoji: '⚙️', color: 'bg-amber-50 text-[#D97706] border-amber-200' },
  { key: 'shipped', label: 'Shipped', emoji: '🚚', color: 'bg-orange-50 text-[#EA580C] border-orange-200' },
  { key: 'delivered', label: 'Delivered', emoji: '✓', color: 'bg-emerald-50 text-[#16A34A] border-emerald-200' },
  { key: 'cancelled', label: 'Cancelled', emoji: '✕', color: 'bg-rose-50 text-[#DC2626] border-rose-200' },
];

export default function AdminDashboardPage() {
  const { token } = useAuth();

  // Core records lists
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Status updates states
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/admin/products', { headers }).then(res => (res.ok ? res.json() : [])),
      fetch('/api/admin/orders', { headers }).then(res => (res.ok ? res.json() : [])),
      fetch('/api/admin/offers', { headers }).then(res => (res.ok ? res.json() : [])),
      fetch('/api/admin/complaints', { headers }).then(res => (res.ok ? res.json() : [])),
    ])
      .then(([productsData, ordersData, offersData, complaintsData]) => {
        setProducts(productsData);
        setOrders(ordersData);
        setOffers(offersData);
        setComplaints(complaintsData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching dashboard datasets:', err);
        setLoading(false);
      });
  }, [token]);

  // Click outside to close inline dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!token) return;
    setUpdatingStatus(true);
    setActiveDropdownId(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Server rejected the request.');
      }
      const updated = await res.json();

      // Sync local orders
      setOrders(prev => prev.map(o => (o.id === updated.id ? { ...o, status: updated.status } : o)));

      // Display Toast Message
      const label = ORDER_STATUSES.find(s => s.key === newStatus)?.label || newStatus;
      setToastMessage(`✓ Order ${orderId} status updated to ${label}`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update status: ${err.message || err}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-deep-maroon font-sans select-none">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-semibold tracking-wider">Loading Dashboard Metrics...</p>
        </div>
      </div>
    );
  }

  // Calculate Metrics
  const activeOffers = offers.filter(o => o.active).length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const newOrdersCount = orders.filter(o => o.status === 'new').length;
  const totalProductsCount = products.length;

  const todayStr = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === todayStr);
  const todayOrdersCount = todayOrders.length;
  const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.grand_total), 0);

  const lowStockItems = products.filter(p => p.stock <= p.low_stock_threshold);
  const lowStockCount = lowStockItems.length;

  const openComplaintsCount = complaints.filter(c => c.status === 'new' || c.status === 'investigating').length;

  // Recent 10 Orders
  const recentOrders = orders.slice(0, 10);

  return (
    <div className="space-y-6 font-sans text-ink">
      
      {/* Page Title */}
      <div className="space-y-1 select-none">
        <h2 className="font-bold text-xl md:text-2xl uppercase tracking-wider text-ink">Dashboard</h2>
        <p className="text-xs text-gray-500 font-medium">Store overview, performance metrics, and inventory alerts</p>
      </div>

      {/* Stats Cards (4 items grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        
        {/* Card 1: Pending Orders (Pulsing alert dot if count > 0) */}
        <Link
          href="/admin/orders?status=pending"
          className="bg-white p-5 border border-gray-200 rounded-[4px] shadow-xs flex items-center gap-4 hover:border-amber-400 transition-colors relative"
        >
          <div className="w-10 h-10 bg-amber-50 text-[#D97706] rounded-full flex items-center justify-center shrink-0 relative">
            <Clock className="w-5 h-5" />
            {pendingOrdersCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#DC2626] rounded-full animate-ping" />
            )}
            {pendingOrdersCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#DC2626] rounded-full" />
            )}
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-0.5">Pending Orders</span>
            <span className="font-mono text-xl font-bold text-ink">{pendingOrdersCount}</span>
          </div>
        </Link>

        {/* Card 2: New Orders (Pulsing alert dot if count > 0) */}
        <Link
          href="/admin/orders?status=new"
          className="bg-white p-5 border border-gray-200 rounded-[4px] shadow-xs flex items-center gap-4 hover:border-blue-400 transition-colors relative"
        >
          <div className="w-10 h-10 bg-blue-50 text-[#2563EB] rounded-full flex items-center justify-center shrink-0 relative">
            <ShoppingBag className="w-5 h-5" />
            {newOrdersCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#DC2626] rounded-full animate-ping" />
            )}
            {newOrdersCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#DC2626] rounded-full" />
            )}
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-0.5">New Orders</span>
            <span className="font-mono text-xl font-bold text-ink">{newOrdersCount}</span>
          </div>
        </Link>

        {/* Card 3: Total Products */}
        <Link
          href="/admin/products"
          className="bg-white p-5 border border-gray-200 rounded-[4px] shadow-xs flex items-center gap-4 hover:border-purple-400 transition-colors"
        >
          <div className="w-10 h-10 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-0.5">Total Products</span>
            <span className="font-mono text-xl font-bold text-ink">{totalProductsCount}</span>
          </div>
        </Link>

        {/* Card 4: Low Stock Warnings */}
        <Link
          href="/admin/stock?filter=low"
          className="bg-white p-5 border border-gray-200 rounded-[4px] shadow-xs flex items-center gap-4 hover:border-amber-400 transition-colors"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            lowStockCount > 0 ? 'bg-amber-50 text-amber-700 animate-pulse' : 'bg-gray-50 text-gray-500'
          }`}>
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-0.5">Low Stock Items</span>
            <span className="font-mono text-xl font-bold text-ink">{lowStockCount}</span>
          </div>
        </Link>
      </div>

      {/* Customer complaints alert ribbon */}
      {openComplaintsCount > 0 && (
        <div className="bg-rose-50 border border-rose-150 p-4 rounded-[4px] flex items-center justify-between text-rose-800 text-xs md:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
            <span className="font-medium">
              You have <span className="font-bold">{openComplaintsCount} open customer complaints</span> that require investigations!
            </span>
          </div>
          <Link
            href="/admin/complaints"
            className="flex items-center gap-1 font-bold text-rose-900 hover:underline uppercase text-xs tracking-wider"
          >
            <span>Resolve</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Layout Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Low Stock Warning Table (Left 50%) */}
        <div className="lg:col-span-6 bg-white border border-gray-200 rounded-[4px] shadow-xs p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Low Stock Warnings</span>
              </h3>
              <Link href="/admin/stock" className="text-[11px] text-deep-maroon font-semibold hover:underline">
                Manage Stock
              </Link>
            </div>

            {lowStockItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-widest text-[9px] font-bold">
                      <th className="py-2">Product Name</th>
                      <th className="py-2">Stock</th>
                      <th className="py-2 text-right font-sans">Limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {lowStockItems.slice(0, 6).map(prod => (
                      <tr key={prod.id} className="hover:bg-gray-50/20">
                        <td className="py-2.5 font-medium text-ink pr-2">{prod.name}</td>
                        <td className="py-2.5 font-mono">
                          <span className={`px-2 py-0.5 rounded-[2px] font-bold ${
                            prod.stock === 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {prod.stock}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-right text-gray-400">
                          {prod.low_stock_threshold}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-gray-500 select-none">
                <p>✓ All stock levels are currently healthy.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders table (Right 50% with Status Badge & Inline Dropdown Updates) */}
        <div className="lg:col-span-6 bg-white border border-gray-200 rounded-[4px] shadow-xs p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-2">
                <Receipt className="w-4 h-4 text-deep-maroon" />
                <span>Recent Orders</span>
              </h3>
              <Link href="/admin/orders" className="text-[11px] text-deep-maroon font-semibold hover:underline">
                View All Orders
              </Link>
            </div>

            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-widest text-[9px] font-bold select-none">
                      <th className="py-2">Order ID</th>
                      <th className="py-2">Customer</th>
                      <th className="py-2">Total</th>
                      <th className="py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map(order => {
                      const statusInfo = ORDER_STATUSES.find(s => s.key === order.status) || ORDER_STATUSES[0];
                      return (
                        <tr key={order.id} className="hover:bg-gray-50/20">
                          <td className="py-2.5 font-mono font-medium text-antique-gold uppercase tracking-wider">{order.id}</td>
                          <td className="py-2.5 text-gray-600 truncate max-w-[100px]">{order.customer_name}</td>
                          <td className="py-2.5 font-mono font-semibold">{formatPrice(order.grand_total)}</td>
                          <td className="py-2.5 text-right relative">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider rounded-[3px] select-none ${
                                statusInfo.color
                              }`}>
                                {statusInfo.emoji} {statusInfo.label}
                              </span>

                              {/* Dropdown status update */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setActiveDropdownId(activeDropdownId === order.id ? null : order.id)}
                                  className="p-0.5 hover:bg-gray-150 rounded transition-all focus:outline-none flex items-center text-gray-500 hover:text-ink cursor-pointer"
                                  title="Update Status"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>

                                {activeDropdownId === order.id && (
                                  <div
                                    ref={dropdownRef}
                                    className="absolute right-0 top-6 bg-white border border-gray-250 rounded-[4px] shadow-lg overflow-hidden z-50 w-36 py-1 divide-y divide-gray-50 text-left"
                                  >
                                    {ORDER_STATUSES.map(st => (
                                      <button
                                        key={st.key}
                                        onClick={() => handleUpdateStatus(order.id, st.key)}
                                        disabled={updatingStatus}
                                        className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-[10px] font-sans flex items-center justify-between text-ink cursor-pointer focus:outline-none"
                                      >
                                        <span className="flex items-center gap-1.5">
                                          <span>{st.emoji}</span>
                                          <span>{st.label}</span>
                                        </span>
                                        {order.status === st.key && (
                                          <span className="text-antique-gold font-bold">✓</span>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-gray-500 select-none">
                <p>No orders recorded in Bikaner dashboard yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating toast messages */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-55 bg-emerald-600 text-white px-5 py-3.5 rounded-[4px] shadow-lg font-sans text-xs font-semibold animate-fadeIn flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
