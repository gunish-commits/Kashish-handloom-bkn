'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Complaint, ComplaintStatus } from '../../../types';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { formatPrice } from '../../../lib/utils';
import {
  Search,
  Filter,
  Eye,
  MessageSquare,
  AlertCircle,
  Loader2,
  Calendar,
} from 'lucide-react';

export default function AdminComplaintsPage() {
  const { token } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Selected Complaint Modal
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchComplaints();
  }, [token]);

  const fetchComplaints = () => {
    setLoading(true);
    fetch('/api/admin/complaints', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        setComplaints(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleUpdateStatus = async (complaintId: string, newStatus: ComplaintStatus) => {
    if (!token) return;
    setUpdatingStatus(true);

    try {
      const res = await fetch(`/api/admin/complaints/${complaintId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update complaint status.');
      const updated = await res.json();

      setComplaints(prev => prev.map(c => (c.id === updated.id ? { ...c, status: updated.status } : c)));
      if (selectedComplaint && selectedComplaint.id === complaintId) {
        setSelectedComplaint(prev => (prev ? { ...prev, status: updated.status } : null));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filter complaints client-side
  const filteredComplaints = complaints.filter(ticket => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.order_id && ticket.order_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === '' || ticket.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<ComplaintStatus, string> = {
    new: 'bg-blue-50 text-blue-700 border-blue-100',
    investigating: 'bg-amber-50 text-amber-700 border-amber-100',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    closed: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <div className="space-y-6 font-sans text-ink">
      
      {/* Page Heading */}
      <div className="border-b border-gray-250 pb-4 select-none">
        <h2 className="font-bold text-xl uppercase tracking-wider text-ink">Complaints Directory</h2>
        <p className="text-xs text-gray-500 font-medium">Track customer issues, check order logs, and manage resolution states</p>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-gray-200 rounded-[4px] shadow-xs select-none">
        {/* Search */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by subject, description, or Order ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-[4px] text-xs focus:outline-none focus:border-deep-maroon bg-white text-ink"
          />
          <Search className="w-4 h-4 text-antique-gold absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status selection */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter className="w-4 h-4 text-antique-gold shrink-0" />
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full h-10 px-3 border border-gray-200 rounded-[4px] text-xs focus:outline-none focus:border-deep-maroon bg-white text-ink cursor-pointer"
          >
            <option value="">All Tickets</option>
            <option value="new">New</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Complaints List Table */}
      {loading ? (
        <div className="text-center py-12 bg-white border border-gray-250 rounded-[4px] shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-antique-gold mx-auto mb-2" />
          <p className="text-xs text-gray-500 font-sans">Loading complaint logs...</p>
        </div>
      ) : filteredComplaints.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-[4px] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-gray-400 uppercase tracking-widest text-[9px] font-bold">
                  <th className="p-4 w-20">Ticket ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Order Ref</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {filteredComplaints.map(ticket => {
                  const lodgeDate = new Date(ticket.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50/20">
                      {/* Short ID */}
                      <td className="p-4 font-mono font-medium text-gray-450 uppercase">
                        #{ticket.id.slice(0, 8)}
                      </td>

                      {/* Date */}
                      <td className="p-4 font-mono text-gray-400">{lodgeDate}</td>

                      {/* Order Reference */}
                      <td className="p-4 font-mono font-bold text-antique-gold uppercase tracking-wider">
                        {ticket.order_id || 'GENERAL'}
                      </td>

                      {/* Subject */}
                      <td className="p-4 font-semibold text-ink text-sm pr-4 truncate max-w-[200px]" title={ticket.subject}>
                        {ticket.subject}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider ${
                          statusColors[ticket.status]
                        }`}>
                          {ticket.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => setSelectedComplaint(ticket)}
                            className="p-2 border border-gray-200 hover:border-deep-maroon hover:text-deep-maroon bg-white text-gray-400 rounded-[4px] cursor-pointer transition-colors"
                            title="View ticket details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp chat */}
                          {ticket.orders?.customer_phone && (
                            <a
                              href={`https://wa.me/${ticket.orders.customer_phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 border border-gray-200 hover:border-[#25D366] hover:bg-[#25D366]/5 hover:text-[#25D366] bg-white text-gray-400 rounded-[4px] cursor-pointer transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
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
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm text-gray-500 font-sans">No complaint records match your queries.</p>
        </div>
      )}

      {/* Ticket Details sheet modal */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title="Complaint Details"
      >
        {selectedComplaint && (
          <div className="space-y-6 font-sans text-xs md:text-sm text-ink max-h-[75vh] overflow-y-auto pr-1">
            
            {/* Metadata Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-3">
              <div className="space-y-1">
                <span className="font-mono text-xs font-semibold text-gray-450 uppercase block">
                  Ticket ID: {selectedComplaint.id}
                </span>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(selectedComplaint.created_at).toLocaleString('en-IN')}</span>
                </span>
              </div>

              {/* Status Update selection */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status:</span>
                <select
                  disabled={updatingStatus}
                  value={selectedComplaint.status}
                  onChange={e => handleUpdateStatus(selectedComplaint.id, e.target.value as ComplaintStatus)}
                  className="h-9 px-3 border border-gray-200 rounded-[4px] text-xs font-semibold focus:outline-none focus:border-deep-maroon bg-white text-ink cursor-pointer"
                >
                  <option value="new">New</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Ticket Subject & Description details */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm md:text-base text-ink border-b border-gray-50 pb-2">
                Subject: {selectedComplaint.subject}
              </h4>
              <div className="bg-[#FAF7F2] p-4 border border-[#dfd6be]/20 rounded-[4px] text-gray-700 whitespace-pre-line leading-relaxed italic">
                "{selectedComplaint.description}"
              </div>
            </div>

            {/* Linked order parameters */}
            <div className="bg-gray-50/50 p-4 border border-gray-100 rounded-[4px] space-y-3">
              <h5 className="font-bold text-gray-450 uppercase tracking-wider text-[10px] pb-1 border-b border-gray-100">
                Linked Order & Customer Details
              </h5>
              
              {selectedComplaint.orders ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-gray-600">
                  <div className="space-y-1">
                    <p className="font-semibold text-ink">{selectedComplaint.orders.customer_name}</p>
                    <p>Phone: {selectedComplaint.orders.customer_phone}</p>
                    <p>
                      {selectedComplaint.orders.city}, {selectedComplaint.orders.state} — {selectedComplaint.orders.pincode}
                    </p>
                  </div>
                  <div className="space-y-1 sm:text-right">
                    <p className="font-mono font-bold text-antique-gold uppercase tracking-wider">
                      Order: {selectedComplaint.orders.id}
                    </p>
                    <p className="font-mono font-semibold">Total Paid: {formatPrice(selectedComplaint.orders.grand_total)}</p>
                    <p className="capitalize">Status: {selectedComplaint.orders.status}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 font-sans italic">No order reference linked. This is a general enquiry ticket.</p>
              )}
            </div>

            {/* Actions footer */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              {selectedComplaint.orders?.customer_phone && (
                <a
                  href={`https://wa.me/${selectedComplaint.orders.customer_phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#25D366] hover:underline font-bold uppercase tracking-wider"
                >
                  <MessageSquare className="w-4 h-4 fill-current shrink-0" />
                  <span>Contact Complainant on WhatsApp</span>
                </a>
              )}

              <Button
                variant="secondary"
                onClick={() => setSelectedComplaint(null)}
                className="text-xs uppercase tracking-wider"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
