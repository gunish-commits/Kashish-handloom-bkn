'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Order, OrderStatus } from '../../../types';
import { formatPrice } from '../../../lib/utils';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Eye,
  MessageSquare,
  Receipt,
  Loader2,
  Calendar,
  Truck,
  Copy,
  Printer,
  ChevronDown,
  ExternalLink,
  Download,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase/client';

const ORDER_STATUSES: { key: OrderStatus; label: string; emoji: string; color: string; hex: string }[] = [
  { key: 'pending', label: 'Pending', emoji: '⏳', color: 'bg-amber-50 text-[#D97706] border-amber-200', hex: '#D97706' },
  { key: 'new', label: 'New', emoji: '🆕', color: 'bg-blue-50 text-[#2563EB] border-blue-200', hex: '#2563EB' },
  { key: 'confirmed', label: 'Confirmed', emoji: '✅', color: 'bg-indigo-50 text-[#7C3AED] border-indigo-200', hex: '#7C3AED' },
  { key: 'processing', label: 'Processing', emoji: '⚙️', color: 'bg-amber-50 text-[#D97706] border-amber-200', hex: '#D97706' },
  { key: 'packed', label: 'Packed', emoji: '📦', color: 'bg-teal-50 text-[#0D9488] border-teal-200', hex: '#0D9488' },
  { key: 'shipped', label: 'Shipped', emoji: '🚚', color: 'bg-orange-50 text-[#EA580C] border-orange-200', hex: '#EA580C' },
  { key: 'out_for_delivery', label: 'Out for Delivery', emoji: '🛵', color: 'bg-purple-50 text-[#9333EA] border-purple-200', hex: '#9333EA' },
  { key: 'delivered', label: 'Delivered', emoji: '✓', color: 'bg-emerald-50 text-[#16A34A] border-emerald-200', hex: '#16A34A' },
  { key: 'cancelled', label: 'Cancelled', emoji: '✕', color: 'bg-rose-50 text-[#DC2626] border-rose-200', hex: '#DC2626' },
];

function OrdersPageContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dropdown & Modal States
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pending actions modals
  const [confirmModalOrder, setConfirmModalOrder] = useState<Order | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load orders & auto-cancel expired pending ones
  useEffect(() => {
    if (!token) return;
    const runAutoCancelAndFetch = async () => {
      try {
        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('status', 'pending')
          .lt('expires_at', new Date().toISOString());
      } catch (err) {
        console.error('Error auto-cancelling expired orders:', err);
      }
      fetchOrders();
    };

    runAutoCancelAndFetch();
  }, [token]);

  // Read status query param on mount
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && ['pending', 'new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'all'].includes(statusParam)) {
      setActiveTab(statusParam);
    } else {
      setActiveTab('pending');
    }
  }, [searchParams]);

  // Dismiss dropdown on outside clicks
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/admin/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

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
      
      // Update selected modal view if active
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => (prev ? { ...prev, status: updated.status } : null));
      }

      // Display Toast Alert
      const label = ORDER_STATUSES.find(s => s.key === newStatus)?.label || newStatus;
      
      if (updated.warnings && updated.warnings.length > 0) {
        alert(`Order Confirmed, but note stock warning:\n\n${updated.warnings.join('\n')}`);
      }
      
      setToastMessage(`✓ Order ${orderId} status updated to ${label}`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update status: ${err.message || err}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Export visibility-filtered visible list to CSV
  const handleExportCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Items Count', 'Subtotal', 'Delivery Charge', 'Discount', 'Grand Total', 'Status', 'Address'];
    const rows = filteredOrders.map(o => [
      o.id,
      new Date(o.created_at).toLocaleString('en-IN'),
      o.customer_name,
      o.customer_phone,
      o.items.length,
      o.subtotal,
      o.delivery_charge,
      o.offer_applied?.discount || 0,
      o.grand_total,
      o.status,
      `"${o.address_line1} ${o.address_line2 || ''}, ${o.city}, ${o.state} - ${o.pincode}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Direct clipboard copier for customer shipping address
  const handleCopyAddress = (order: Order) => {
    const fullAddress = `${order.customer_name}\nPh: ${order.customer_phone}\n${order.address_line1}${
      order.address_line2 ? `, ${order.address_line2}` : ''
    }\n${order.city}, ${order.state} - ${order.pincode}`;
    
    navigator.clipboard.writeText(fullAddress).then(() => {
      setCopiedId(order.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Build WhatsApp template messaging link
  const getWhatsAppMessageLink = (order: Order) => {
    const cleanPhone = order.customer_phone.replace(/\D/g, '');
    const prefixPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const label = ORDER_STATUSES.find(s => s.key === order.status)?.label || order.status;
    let extraNotes = '';
    if (order.status === 'shipped') {
      extraNotes = '\n\nYour order is on its way! You will receive it soon.';
    } else if (order.status === 'delivered') {
      extraNotes = '\n\nWe hope you love your purchase! Thank you for shopping with Kashish Handloom.';
    }

    const text = `Hello ${order.customer_name}, 

Your Kashish Handloom order *${order.id}* has been updated.

Status: *${label}*${extraNotes}

For any queries, reply to this message.

— Kashish Handloom Team
+91 8209455157`;

    return `https://wa.me/${prefixPhone}?text=${encodeURIComponent(text)}`;
  };

  // Helper count totals
  const getStatusCount = (status: string) => {
    if (status === 'all') return orders.length;
    return orders.filter(o => o.status === status).length;
  };

  // Filter visible items
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm);

    const matchesStatus = activeTab === 'all' || order.status === activeTab;

    let matchesDate = true;
    if (fromDate) {
      matchesDate = matchesDate && new Date(order.created_at) >= new Date(fromDate + 'T00:00:00');
    }
    if (toDate) {
      matchesDate = matchesDate && new Date(order.created_at) <= new Date(toDate + 'T23:59:59');
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6 font-sans text-ink">
      
      {/* Printable Style Overrides */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-receipt-template, #print-receipt-template * {
            visibility: visible;
          }
          #print-receipt-template {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Page Heading */}
      <div className="border-b border-gray-250 pb-4 select-none">
        <h2 className="font-bold text-xl uppercase tracking-wider text-ink">Orders Manager</h2>
        <p className="text-xs text-gray-500 font-medium">Track customer orders, manage status flows, export logs, and message shoppers.</p>
      </div>

      {/* Status Tabs Filter Bar */}
      <div className="flex flex-wrap gap-2 pb-2 select-none border-b border-gray-200">
        {/* Pending Orders Tab */}
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-xs font-semibold rounded-[4px] border transition-colors cursor-pointer focus:outline-none relative flex items-center gap-1.5 ${
            activeTab === 'pending'
              ? 'bg-deep-maroon text-white border-deep-maroon'
              : 'bg-white text-gray-500 border-gray-200 hover:text-ink'
          }`}
        >
          <span>⏳ Pending ({getStatusCount('pending')})</span>
          {getStatusCount('pending') > 0 && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
          )}
        </button>

        {/* All Orders Tab */}
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-xs font-semibold rounded-[4px] border transition-colors cursor-pointer focus:outline-none ${
            activeTab === 'all'
              ? 'bg-deep-maroon text-white border-deep-maroon'
              : 'bg-white text-gray-500 border-gray-200 hover:text-ink'
          }`}
        >
          All Orders ({getStatusCount('all')})
        </button>

        {/* Other status tabs */}
        {ORDER_STATUSES.filter(st => st.key !== 'pending').map(st => {
          const count = getStatusCount(st.key);
          const isActive = activeTab === st.key;
          return (
            <button
              key={st.key}
              onClick={() => setActiveTab(st.key)}
              className={`px-4 py-2 text-xs font-semibold rounded-[4px] border transition-colors cursor-pointer focus:outline-none ${
                isActive
                  ? 'bg-deep-maroon text-white border-deep-maroon'
                  : 'bg-white text-gray-500 border-gray-200 hover:text-ink'
              }`}
            >
              {st.emoji} {st.label} ({count})
            </button>
          );
        })}
      </div>

      {activeTab === 'pending' && (
        <div className="text-xs text-[#D97706] bg-amber-50/50 border border-amber-200/50 p-2.5 rounded-[4px] select-none font-medium">
          💡 <strong>Notice:</strong> Pending orders auto-cancel after 24 hours if not confirmed.
        </div>
      )}

      {/* Search, Date Filters, and CSV Export Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 border border-gray-200 rounded-[4px] shadow-xs select-none">
        {/* Search */}
        <div className="md:col-span-5 relative">
          <input
            type="text"
            placeholder="Search by customer name, phone, order ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-[4px] text-xs focus:outline-none focus:border-deep-maroon bg-white text-ink font-sans"
          />
          <Search className="w-4 h-4 text-antique-gold absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* From Date */}
        <div className="md:col-span-2.5 flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-gray-400">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="w-full h-10 px-2 border border-gray-200 rounded-[4px] text-xs focus:outline-none focus:border-deep-maroon bg-white text-ink font-sans"
          />
        </div>

        {/* To Date */}
        <div className="md:col-span-2.5 flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-gray-400">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="w-full h-10 px-2 border border-gray-200 rounded-[4px] text-xs focus:outline-none focus:border-deep-maroon bg-white text-ink font-sans"
          />
        </div>

        {/* CSV Export */}
        <div className="md:col-span-2 flex justify-end">
          <button
            onClick={handleExportCSV}
            className="w-full h-10 bg-white border border-gray-200 hover:border-antique-gold text-ink hover:text-antique-gold text-xs font-semibold uppercase tracking-wider rounded-[4px] flex items-center justify-center gap-2 cursor-pointer focus:outline-none transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-[4px] shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-antique-gold mx-auto mb-2" />
          <p className="text-xs text-gray-500 font-sans">Loading orders history...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-[4px] shadow-xs overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-gray-450 uppercase tracking-widest text-[9px] font-bold select-none">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order, idx) => {
                  const isPending = order.status === 'pending';
                  const isNew = order.status === 'new';
                  const statusInfo = ORDER_STATUSES.find(s => s.key === order.status) || ORDER_STATUSES[0];
                  
                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors hover:bg-gray-50/70 ${
                        isPending
                          ? 'bg-[#FFFBEB] border-l-4 border-[#D97706]'
                          : isNew
                          ? 'bg-[#EFF6FF] border-l-4 border-[#2563EB]'
                          : idx % 2 === 1
                          ? 'bg-white'
                          : 'bg-gray-50/30'
                      }`}
                    >
                      {/* Order ID */}
                      <td className="p-4 font-mono text-xs font-semibold text-antique-gold uppercase tracking-wider">
                        {order.id}
                      </td>

                      {/* Customer */}
                      <td className="p-4 font-sans font-medium text-ink">
                        {order.customer_name}
                      </td>

                      {/* Phone (tel link on mobile, copy desktop) */}
                      <td className="p-4 font-mono font-medium text-gray-500 select-all">
                        <span className="hidden sm:inline relative group">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(order.customer_phone);
                              setCopiedId(order.id + '-ph');
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="hover:text-antique-gold transition-colors font-semibold flex items-center gap-1 cursor-pointer focus:outline-none"
                          >
                            <span>+91 {order.customer_phone.slice(-10)}</span>
                          </button>
                          {copiedId === order.id + '-ph' && (
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-ink text-white px-2 py-0.5 rounded text-[10px] select-none shadow">
                              Copied!
                            </span>
                          )}
                        </span>
                        <a
                          href={`tel:${order.customer_phone}`}
                          className="sm:hidden text-deep-maroon font-semibold flex items-center gap-1 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          <span>+91 {order.customer_phone.slice(-10)}</span>
                        </a>
                      </td>

                      {/* Items */}
                      <td className="p-4 font-sans font-medium text-gray-500">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </td>

                      {/* Total */}
                      <td className="p-4 font-mono font-bold text-deep-maroon text-sm">
                        {formatPrice(order.grand_total)}
                      </td>

                      {/* Status Badges */}
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-[3px] border text-[9px] font-bold uppercase tracking-wider whitespace-nowrap select-none ${
                          statusInfo.color
                        }`}>
                          {statusInfo.emoji} {statusInfo.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-4 font-sans text-gray-400 select-none">
                        {new Date(order.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Action buttons */}
                      <td className="p-4 flex items-center justify-center gap-2 select-none relative">
                        {isPending ? (
                          <>
                            {/* Confirm Button */}
                            <button
                              onClick={() => setConfirmModalOrder(order)}
                              className="px-2.5 py-1.5 bg-deep-maroon text-white font-sans font-bold uppercase tracking-wider text-[10px] rounded-[3px] hover:bg-deep-maroon/90 cursor-pointer focus:outline-none flex items-center gap-1"
                            >
                              <span>✅</span> Confirm
                            </button>

                            {/* Cancel Button */}
                            <button
                              onClick={() => setCancelModalOrder(order)}
                              className="px-2.5 py-1.5 border border-red-500 text-red-500 hover:bg-red-50 font-sans font-bold uppercase tracking-wider text-[10px] rounded-[3px] cursor-pointer focus:outline-none flex items-center gap-1"
                            >
                              <span>✕</span> Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {/* View Details */}
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 bg-gray-150 hover:bg-antique-gold hover:text-white text-gray-500 transition-all rounded-[3px] cursor-pointer focus:outline-none"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Status Update Trigger dropdown */}
                            <div className="relative">
                              <button
                                onClick={() => setActiveDropdownId(activeDropdownId === order.id ? null : order.id)}
                                className="p-1.5 bg-gray-150 hover:bg-deep-maroon hover:text-white text-gray-500 transition-all rounded-[3px] cursor-pointer focus:outline-none flex items-center gap-0.5"
                                title="Update Status"
                              >
                                <Filter className="w-3.5 h-3.5" />
                                <ChevronDown className="w-2.5 h-2.5" />
                              </button>

                              {/* Inline Dropdown Options */}
                              {activeDropdownId === order.id && (
                                <div
                                  ref={dropdownRef}
                                  className="absolute right-0 top-8 bg-white border border-gray-250 rounded-[4px] shadow-lg overflow-hidden z-50 w-36 py-1 divide-y divide-gray-50"
                                >
                                  {ORDER_STATUSES.map(st => (
                                    <button
                                      key={st.key}
                                      onClick={() => handleUpdateStatus(order.id, st.key)}
                                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-[11px] font-sans flex items-center justify-between text-ink cursor-pointer focus:outline-none"
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
                          </>
                        )}

                        {/* WhatsApp Message */}
                        <a
                          href={getWhatsAppMessageLink(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-all rounded-[3px] flex items-center justify-center cursor-pointer"
                          title="Contact on WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border border-gray-200 rounded-[4px] bg-white select-none">
          <span className="text-2xl mb-2 block">🌾</span>
          <h4 className="text-sm font-semibold text-ink uppercase tracking-wider mb-1">No Orders Found</h4>
          <p className="text-xs text-gray-500 font-sans">We couldn't find any orders in Bikaner inventory matching this filter.</p>
        </div>
      )}

      {/* Visual Order Detail Modal (Opens on 👁️ View) */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} size="xl" hideHeader={true}>
        {selectedOrder && (
          <div className="space-y-6 text-ink relative font-sans">
            
            {/* Header */}
            <div className="border-b border-gray-150 pb-4 flex justify-between items-start">
              <div>
                <h3 className="font-mono text-base font-bold text-antique-gold uppercase tracking-wider">
                  ORDER: {selectedOrder.id}
                </h3>
                <span className="text-xs text-gray-400 font-sans flex items-center gap-1 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(selectedOrder.created_at).toLocaleString('en-IN')}</span>
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-ink text-sm font-sans uppercase font-bold p-1 print:hidden cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Status Steps Progress Bar */}
            <div className="bg-gray-50/50 p-4 border border-gray-100 rounded-[4px] select-none">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3.5">
                Order Status Progress
              </h4>
              
              {selectedOrder.status === 'cancelled' ? (
                <div className="flex items-center gap-2 text-stock-red text-xs font-semibold uppercase tracking-wider bg-rose-50 border border-rose-100 p-2.5 rounded-[3px] max-w-max">
                  <span>✕ Cancelled</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans text-xs">
                  {/* Step indicators */}
                  {ORDER_STATUSES.filter(s => s.key !== 'cancelled').map((st, sIdx, sArr) => {
                    const currentIdx = sArr.findIndex(s => s.key === selectedOrder.status);
                    const stepIdx = sIdx;
                    const isCompleted = stepIdx < currentIdx;
                    const isActive = stepIdx === currentIdx;
                    
                    return (
                      <React.Fragment key={st.key}>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${
                            isCompleted
                              ? 'bg-deep-maroon text-white'
                              : isActive
                              ? 'bg-antique-gold text-white animate-pulse'
                              : 'bg-gray-200 text-gray-500'
                          }`}>
                            {isCompleted ? '✓' : stepIdx + 1}
                          </div>
                          <span className={`font-semibold ${
                            isCompleted ? 'text-deep-maroon' : isActive ? 'text-antique-gold font-bold' : 'text-gray-400'
                          }`}>
                            {st.label}
                          </span>
                        </div>
                        {sIdx < sArr.length - 1 && (
                          <div className={`hidden sm:block flex-1 h-[2px] mx-2 ${
                            stepIdx < currentIdx ? 'bg-deep-maroon' : 'bg-gray-200'
                          }`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Items Ordered
              </h4>
              <div className="border border-gray-100 rounded-[4px] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-widest text-[9px] select-none">
                      <th className="p-3">Item Name</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans">
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50/10">
                        <td className="p-3 font-medium text-ink pr-4">
                          <p>{item.name}</p>
                          <span className="text-[10px] text-gray-405">
                            {item.return_policy === 'no_return' ? 'Non-returnable' : 'Easy Return Allowed'}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-medium">{item.quantity}</td>
                        <td className="p-3 text-right font-mono">{formatPrice(item.price)}</td>
                        <td className="p-3 text-right font-mono font-semibold">
                          {formatPrice(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoice summaries */}
            <div className="border-t border-gray-100 pt-4 flex flex-col items-end text-xs font-sans text-gray-600 space-y-2">
              <div className="w-full sm:max-w-xs flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono text-ink">{formatPrice(selectedOrder.subtotal)}</span>
              </div>
              
              {selectedOrder.offer_applied && (
                <div className="w-full sm:max-w-xs flex justify-between text-[#358f5c] font-medium">
                  <span>Discount ({selectedOrder.offer_applied.title}):</span>
                  <span className="font-mono">-{formatPrice(selectedOrder.offer_applied.discount)}</span>
                </div>
              )}

              <div className="w-full sm:max-w-xs flex justify-between">
                <span>Delivery:</span>
                <span className="font-mono text-ink">
                  {selectedOrder.delivery_charge === 0 ? 'FREE' : formatPrice(selectedOrder.delivery_charge)}
                </span>
              </div>

              <div className="w-full sm:max-w-xs flex justify-between font-bold text-sm text-ink pt-2 border-t border-gray-150">
                <span>Total Bill:</span>
                <span className="font-mono text-deep-maroon">{formatPrice(selectedOrder.grand_total)}</span>
              </div>
            </div>

            {/* Customer Details & Copy Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-4 border border-gray-100 rounded-[4px]">
              {/* Shipping Contacts */}
              <div className="space-y-1">
                <h5 className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1">
                  Customer Details
                </h5>
                <p className="font-semibold text-ink">{selectedOrder.customer_name}</p>
                <div className="flex items-center gap-3 pt-0.5 print:hidden">
                  <a
                    href={`tel:${selectedOrder.customer_phone}`}
                    className="text-xs text-deep-maroon font-bold uppercase tracking-wider flex items-center gap-1 hover:underline"
                  >
                    <span>📞 Call</span>
                  </a>
                  <a
                    href={getWhatsAppMessageLink(selectedOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#25D366] font-bold uppercase tracking-wider flex items-center gap-1 hover:underline"
                  >
                    <span>💬 WhatsApp</span>
                  </a>
                </div>
                <p className="text-gray-500 font-mono text-xs pt-1">Phone: +91 {selectedOrder.customer_phone}</p>
                {selectedOrder.customer_alt_phone && (
                  <p className="text-gray-500 font-mono text-xs">Alt: +91 {selectedOrder.customer_alt_phone}</p>
                )}
              </div>

              {/* Delivery Address Details */}
              <div className="space-y-1 relative">
                <div className="flex justify-between items-center select-none">
                  <h5 className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                    Delivery Address
                  </h5>
                  <button
                    onClick={() => handleCopyAddress(selectedOrder)}
                    className="text-[10px] text-antique-gold hover:underline font-semibold flex items-center gap-1 cursor-pointer focus:outline-none print:hidden"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedId === selectedOrder.id ? 'Copied!' : 'Copy Address'}</span>
                  </button>
                </div>
                <p className="text-gray-600 text-xs leading-relaxed pt-1">
                  {selectedOrder.address_line1}
                  {selectedOrder.address_line2 ? `, ${selectedOrder.address_line2}` : ''}
                  <br />
                  {selectedOrder.city}, {selectedOrder.state} — {selectedOrder.pincode}
                </p>
              </div>
            </div>

            {/* Quick Status Update Selector */}
            <div className="border-t border-gray-100 pt-4 space-y-2 select-none print:hidden">
              <h5 className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                Quick Update Status
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {ORDER_STATUSES.map(st => {
                  const isActive = selectedOrder.status === st.key;
                  return (
                    <button
                      key={st.key}
                      onClick={() => handleUpdateStatus(selectedOrder.id, st.key)}
                      disabled={updatingStatus}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-[3px] border transition-all cursor-pointer focus:outline-none ${
                        isActive
                          ? 'bg-deep-maroon text-white border-deep-maroon scale-105'
                          : 'bg-white text-gray-500 border-gray-250 hover:bg-gray-50'
                      }`}
                    >
                      {st.emoji} {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions footer */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100 print:hidden select-none">
              <div className="flex items-center gap-3">
                <a
                  href={getWhatsAppMessageLink(selectedOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold uppercase tracking-wider rounded-[4px] flex items-center gap-2 transition-colors focus:outline-none"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message customer on WhatsApp</span>
                </a>
                
                <button
                  onClick={() => window.print()}
                  className="h-10 px-4 bg-white border border-gray-200 hover:border-antique-gold text-ink hover:text-antique-gold text-xs font-bold uppercase tracking-wider rounded-[4px] flex items-center gap-2 cursor-pointer focus:outline-none transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              </div>

              <Button
                variant="secondary"
                onClick={() => setSelectedOrder(null)}
                className="h-10 px-5 text-xs uppercase tracking-wider focus:outline-none"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Printable Receipt template */}
      {selectedOrder && (
        <div id="print-receipt-template" className="hidden print:block text-black font-sans p-8 space-y-6 max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-wide uppercase font-serif text-black">Kashish Handloom</h1>
              <p className="text-xs text-gray-600 italic">Premium Bedsheets, Blankets, Curtains & Home Decor</p>
              <p className="text-[10px] text-gray-500 mt-1">
                Jinnah Road, Coatagate, Bikaner, Rajasthan (334001)<br />
                Contact: +91 8209455157 | support@kashishhandloom.com
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-base font-bold text-gray-800">RETAIL INVOICE</h2>
              <p className="text-xs font-mono mt-1">Order ID: <strong className="uppercase">{selectedOrder.id}</strong></p>
              <p className="text-[10px] text-gray-500 mt-0.5">Date: {new Date(selectedOrder.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          {/* Customer & Delivery Info */}
          <div className="grid grid-cols-2 gap-8 text-xs border-b border-gray-200 pb-4">
            <div>
              <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[10px] mb-1">Customer Details</h3>
              <p className="font-semibold text-black">{selectedOrder.customer_name}</p>
              <p className="text-gray-500">Phone: +91 {selectedOrder.customer_phone}</p>
              {selectedOrder.customer_alt_phone && (
                <p className="text-gray-500">Alt Phone: +91 {selectedOrder.customer_alt_phone}</p>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[10px] mb-1">Delivery Address</h3>
              <p className="text-gray-600 leading-relaxed">
                {selectedOrder.address_line1}
                {selectedOrder.address_line2 ? `, ${selectedOrder.address_line2}` : ''}<br />
                {selectedOrder.city}, {selectedOrder.state} — {selectedOrder.pincode}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-1">
            <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[10px] mb-1">Items Summary</h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-300 font-bold uppercase tracking-wider text-[9px] text-gray-600 bg-gray-50">
                  <th className="py-2 px-1">Item Description</th>
                  <th className="py-2 px-1 text-center">Qty</th>
                  <th className="py-2 px-1 text-right">Rate</th>
                  <th className="py-2 px-1 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-black">
                {selectedOrder.items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 px-1">
                      <p className="font-medium text-black">{item.name}</p>
                    </td>
                    <td className="py-2 px-1 text-center font-mono">{item.quantity}</td>
                    <td className="py-2 px-1 text-right font-mono">{formatPrice(item.price)}</td>
                    <td className="py-2 px-1 text-right font-mono font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bill Totals */}
          <div className="border-t-2 border-gray-300 pt-4 flex flex-col items-end text-xs space-y-1.5">
            <div className="w-64 flex justify-between">
              <span className="text-gray-500">Subtotal:</span>
              <span className="font-mono">{formatPrice(selectedOrder.subtotal)}</span>
            </div>
            {selectedOrder.offer_applied && (
              <div className="w-64 flex justify-between text-green-700 font-medium">
                <span>Discount ({selectedOrder.offer_applied.title}):</span>
                <span className="font-mono">-{formatPrice(selectedOrder.offer_applied.discount)}</span>
              </div>
            )}
            <div className="w-64 flex justify-between">
              <span className="text-gray-500">Delivery Charges:</span>
              <span className="font-mono text-black">
                {selectedOrder.delivery_charge === 0 ? 'FREE' : formatPrice(selectedOrder.delivery_charge)}
              </span>
            </div>
            <div className="w-64 flex justify-between font-bold text-sm pt-1.5 border-t border-gray-300 text-black">
              <span>Grand Total:</span>
              <span className="font-mono text-base">{formatPrice(selectedOrder.grand_total)}</span>
            </div>
          </div>

          {/* Thank You Note */}
          <div className="text-center pt-8 border-t border-dashed border-gray-300 mt-8 space-y-1">
            <p className="text-sm font-semibold text-black">Thank you for your business!</p>
            <p className="text-[10px] text-gray-500">For any enquiries, contact us on +91 8209455157</p>
            <p className="text-[9px] text-gray-400 italic">This is a computer-generated document, no signature required.</p>
          </div>
        </div>
      )}

      {/* Floating toast messages */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-55 bg-emerald-600 text-white px-5 py-3.5 rounded-[4px] shadow-lg font-sans text-xs font-semibold animate-fadeIn flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Pending Confirm Modal */}
      <Modal isOpen={!!confirmModalOrder} onClose={() => setConfirmModalOrder(null)} size="md">
        {confirmModalOrder && (
          <div className="space-y-4 text-ink font-sans p-2">
            <h3 className="font-bold text-base uppercase text-ink flex items-center gap-2">
              ⚠️ Confirm Pending Order
            </h3>
            <p className="text-xs text-gray-650">
              Are you sure you want to confirm order <strong className="text-antique-gold font-mono">{confirmModalOrder.id}</strong>?
            </p>
            <div className="bg-gray-50 border border-gray-150 rounded-[4px] p-4 text-xs space-y-2 text-gray-700">
              <p className="font-semibold text-ink">This action will:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Change status from <span className="font-semibold">Pending</span> → <span className="font-semibold text-emerald-700">Confirmed</span></li>
                <li>Reduce stock for all ordered items</li>
                <li>Move this order to your active orders view</li>
              </ul>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModalOrder(null)}
                className="px-4 py-2 border border-gray-200 rounded-[4px] text-xs font-semibold text-gray-500 hover:text-ink cursor-pointer focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleUpdateStatus(confirmModalOrder.id, 'confirmed');
                  setConfirmModalOrder(null);
                }}
                className="px-4 py-2 bg-deep-maroon hover:bg-deep-maroon/90 text-white rounded-[4px] text-xs font-semibold cursor-pointer focus:outline-none"
              >
                Yes, Confirm Order
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Pending Cancel Modal */}
      <Modal isOpen={!!cancelModalOrder} onClose={() => setCancelModalOrder(null)} size="md">
        {cancelModalOrder && (
          <div className="space-y-4 text-ink font-sans p-2">
            <h3 className="font-bold text-base uppercase text-stock-red flex items-center gap-2">
              ⚠️ Cancel Pending Order
            </h3>
            <p className="text-xs text-gray-650">
              Are you sure you want to cancel order <strong className="text-antique-gold font-mono">{cancelModalOrder.id}</strong>?
            </p>
            <div className="bg-gray-50 border border-gray-150 rounded-[4px] p-4 text-xs space-y-1 text-gray-700">
              <p className="font-semibold text-ink">This action will:</p>
              <p>✓ Cancel the order without modifying any product inventory stock.</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 border border-gray-200 rounded-[4px] text-xs font-semibold text-gray-500 hover:text-ink cursor-pointer focus:outline-none"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleUpdateStatus(cancelModalOrder.id, 'cancelled');
                  setCancelModalOrder(null);
                }}
                className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-[4px] text-xs font-semibold cursor-pointer focus:outline-none"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-12 bg-white border border-gray-250 rounded-[4px] shadow-xs">
        <Loader2 className="w-6 h-6 animate-spin text-antique-gold mx-auto mb-2" />
        <p className="text-xs text-gray-500 font-sans">Loading orders dashboard...</p>
      </div>
    }>
      <OrdersPageContent />
    </Suspense>
  );
}
