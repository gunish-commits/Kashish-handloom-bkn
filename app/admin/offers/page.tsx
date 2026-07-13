'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Offer, Category } from '../../../types';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { Plus, Pencil, Trash2, Tag, Loader2 } from 'lucide-react';

export default function AdminOffersPage() {
  const { token } = useAuth();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editOffer, setEditOffer] = useState<Offer | null>(null);

  // Form fields state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [offerType, setOfferType] = useState<'quantity_bundle' | 'cart_discount' | 'category_discount'>('cart_discount');
  const [appliesTo, setAppliesTo] = useState<'category' | 'specific_products' | 'all'>('all');
  const [categoryId, setCategoryId] = useState('');
  const [triggerQuantity, setTriggerQuantity] = useState('');
  const [triggerAmount, setTriggerAmount] = useState('');
  const [rewardType, setRewardType] = useState<'fixed_total' | 'fixed_discount' | 'percent_discount'>('fixed_discount');
  const [rewardValue, setRewardValue] = useState('');
  const [active, setActive] = useState(true);
  const [showOnHomepage, setShowOnHomepage] = useState(true);
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal states
  const [deleteOffer, setDeleteOffer] = useState<Offer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchOffers();
    // Load categories for dropdowns
    fetch('/api/admin/categories', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : []))
      .then(data => setCategories(data))
      .catch(err => console.error(err));
  }, [token]);

  const fetchOffers = () => {
    setLoading(true);
    fetch('/api/admin/offers', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        setOffers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleOpenAddModal = () => {
    setEditOffer(null);
    setTitle('');
    setDescription('');
    setOfferType('cart_discount');
    setAppliesTo('all');
    setCategoryId('');
    setTriggerQuantity('');
    setTriggerAmount('');
    setRewardType('fixed_discount');
    setRewardValue('');
    setActive(true);
    setShowOnHomepage(true);
    
    const today = new Date().toISOString().split('T')[0];
    setValidFrom(today);
    setValidUntil('');
    
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (offer: Offer) => {
    setEditOffer(offer);
    setTitle(offer.title);
    setDescription(offer.description || '');
    setOfferType(offer.offer_type);
    setAppliesTo(offer.applies_to);
    setCategoryId(offer.category_id || '');
    setTriggerQuantity(offer.trigger_quantity?.toString() || '');
    setTriggerAmount(offer.trigger_amount?.toString() || '');
    setRewardType(offer.reward_type);
    setRewardValue(offer.reward_value.toString());
    setActive(offer.active);
    setShowOnHomepage(offer.show_on_homepage);
    setValidFrom(offer.valid_from || '');
    setValidUntil(offer.valid_until || '');
    
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !rewardValue) {
      setFormError('Offer title and reward value are required.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      offer_type: offerType,
      applies_to: appliesTo,
      category_id: appliesTo === 'category' ? categoryId : null,
      product_ids: [], // Admin can bind products manually if applies_to = specific_products, currently empty defaults
      trigger_quantity: offerType === 'quantity_bundle' ? parseInt(triggerQuantity, 10) : null,
      trigger_amount: offerType === 'cart_discount' ? parseFloat(triggerAmount) : null,
      reward_type: rewardType,
      reward_value: parseFloat(rewardValue),
      active,
      show_on_homepage: showOnHomepage,
      valid_from: validFrom || null,
      valid_until: validUntil || null,
    };

    try {
      const url = editOffer ? `/api/admin/offers/${editOffer.id}` : '/api/admin/offers';
      const method = editOffer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save offer details.');
      }

      setModalOpen(false);
      fetchOffers();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteOffer || !token) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/offers/${deleteOffer.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete offer.');
      setOffers(prev => prev.filter(o => o.id !== deleteOffer.id));
      setDeleteOffer(null);
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete offer.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getOfferValidityStatus = (offer: Offer) => {
    if (!offer.active) return { label: 'Inactive', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    const today = new Date().toISOString().split('T')[0];
    if (offer.valid_until && offer.valid_until < today) {
      return { label: 'Expired', color: 'bg-rose-50 text-rose-700 border-rose-100' };
    }
    return { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
  };

  return (
    <div className="space-y-6 font-sans text-ink">
      
      {/* Page Heading & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-250 pb-4 select-none">
        <div>
          <h2 className="font-bold text-xl uppercase tracking-wider text-ink">Offers & Campaigns</h2>
          <p className="text-xs text-gray-500 font-medium">Create promotional rules, quantity bundles, and cart discounts</p>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenAddModal}
          className="self-start sm:self-auto flex items-center gap-1.5 h-10 uppercase tracking-widest text-[10px] font-bold"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Create Offer</span>
        </Button>
      </div>

      {/* Offers List Table */}
      {loading ? (
        <div className="text-center py-12 bg-white border border-gray-250 rounded-[4px] shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-antique-gold mx-auto mb-2" />
          <p className="text-xs text-gray-500 font-sans">Loading campaign rules...</p>
        </div>
      ) : offers.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-[4px] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-gray-400 uppercase tracking-widest text-[9px] font-bold">
                  <th className="p-4">Campaign Title</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Conditions</th>
                  <th className="p-4">Reward</th>
                  <th className="p-4">Valid Until</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {offers.map(offer => {
                  const status = getOfferValidityStatus(offer);
                  const validity = offer.valid_until
                    ? new Date(offer.valid_until).toLocaleDateString('en-IN')
                    : 'Never Expires';

                  // Conditions descriptor text
                  let conditionText = 'None';
                  if (offer.offer_type === 'quantity_bundle') {
                    conditionText = `Buy ${offer.trigger_quantity || 1} items`;
                  } else if (offer.offer_type === 'cart_discount') {
                    conditionText = `Spend ₹${offer.trigger_amount || 0}`;
                  } else if (offer.offer_type === 'category_discount') {
                    conditionText = `Category: ${offer.categories?.name || 'General'}`;
                  }

                  // Reward descriptor text
                  let rewardText = '';
                  if (offer.reward_type === 'percent_discount') {
                    rewardText = `${offer.reward_value}% Off`;
                  } else if (offer.reward_type === 'fixed_discount') {
                    rewardText = `₹${offer.reward_value} Off`;
                  } else if (offer.reward_type === 'fixed_total') {
                    rewardText = `Total ₹${offer.reward_value}`;
                  }

                  return (
                    <tr key={offer.id} className="hover:bg-gray-50/20">
                      <td className="p-4 font-semibold text-ink text-sm pr-4 max-w-[180px] truncate" title={offer.title}>
                        {offer.title}
                      </td>
                      <td className="p-4 text-gray-500 capitalize">{offer.offer_type.replace('_', ' ')}</td>
                      <td className="p-4 text-gray-500 font-medium">{conditionText}</td>
                      <td className="p-4 font-mono font-semibold text-deep-maroon">{rewardText}</td>
                      <td className="p-4 font-mono text-gray-400">{validity}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(offer)}
                            className="p-2 border border-gray-200 hover:border-deep-maroon hover:text-deep-maroon bg-white text-gray-400 rounded-[4px] cursor-pointer transition-colors"
                            title="Edit campaign"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteOffer(offer)}
                            className="p-2 border border-gray-200 hover:border-red-650 hover:bg-red-50 hover:text-red-750 text-gray-400 rounded-[4px] cursor-pointer transition-colors"
                            title="Delete campaign"
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
            <Tag className="w-6 h-6" />
          </div>
          <p className="text-sm text-gray-500 font-sans">No offers or promo campaigns created yet.</p>
        </div>
      )}

      {/* Edit/Create Offer Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editOffer ? 'Edit Campaign Offer' : 'Create New Campaign Offer'}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans text-xs md:text-sm text-ink max-h-[75vh] overflow-y-auto pr-1">
          {/* Form Area (Left 65%) */}
          <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-4">
            {formError && (
              <div className="bg-rose-50 border border-rose-150 text-rose-800 p-2.5 rounded-[3px] text-xs font-semibold">
                ⚠️ {formError}
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Offer Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink"
                placeholder="e.g. Bedsheet Bonanza"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Description (Visible to customers)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink resize-none"
                placeholder="Buy 5 cotton bedsheets and get them all for ₹1,999 total!"
              />
            </div>

            {/* Offer Type / Applies To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Offer Type *
                </label>
                <select
                  value={offerType}
                  onChange={e => setOfferType(e.target.value as any)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink cursor-pointer"
                >
                  <option value="quantity_bundle">Quantity Bundle (Buy N items)</option>
                  <option value="cart_discount">Cart Discount (Spend ₹X)</option>
                  <option value="category_discount">Category Discount (% off category)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Applies To *
                </label>
                <select
                  value={appliesTo}
                  onChange={e => setAppliesTo(e.target.value as any)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink cursor-pointer"
                >
                  <option value="all">Whole Cart (All items)</option>
                  <option value="category">Specific Category</option>
                </select>
              </div>
            </div>

            {/* Conditional Category selection */}
            {appliesTo === 'category' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Target Category *
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Triggers: Qty or Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {offerType === 'quantity_bundle' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Trigger Quantity (Min Items) *
                  </label>
                  <input
                    type="number"
                    required
                    value={triggerQuantity}
                    onChange={e => setTriggerQuantity(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink font-mono"
                    placeholder="5"
                  />
                </div>
              )}

              {offerType === 'cart_discount' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Trigger Amount (Min Spend ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={triggerAmount}
                    onChange={e => setTriggerAmount(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink font-mono"
                    placeholder="2000"
                  />
                </div>
              )}
            </div>

            {/* Reward Type / Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Reward Type *
                </label>
                <select
                  value={rewardType}
                  onChange={e => setRewardType(e.target.value as any)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink cursor-pointer"
                >
                  <option value="fixed_discount">Fixed Amount Off (e.g. ₹200 off)</option>
                  <option value="percent_discount">Percentage Off (e.g. 15% off)</option>
                  <option value="fixed_total">Fixed Total Price (e.g. 5 for ₹1999)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Reward Value *
                </label>
                <input
                  type="number"
                  required
                  value={rewardValue}
                  onChange={e => setRewardValue(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink font-mono"
                  placeholder="200"
                />
              </div>
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Valid From
                </label>
                <input
                  type="date"
                  value={validFrom}
                  onChange={e => setValidFrom(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Valid Until (Optional)
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink font-mono"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-4 py-2 border-t border-gray-150">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                  className="w-4 h-4 accent-deep-maroon border-gray-300 rounded-[2px]"
                />
                <span>Active Campaign</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnHomepage}
                  onChange={e => setShowOnHomepage(e.target.checked)}
                  className="w-4 h-4 accent-deep-maroon border-gray-300 rounded-[2px]"
                />
                <span>Show on Homepage</span>
              </label>
            </div>

            {/* Save Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                variant="secondary"
                onClick={() => setModalOpen(false)}
                disabled={isSubmitting}
                className="text-xs uppercase tracking-wider h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="text-xs uppercase tracking-wider h-10 flex items-center gap-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Offer</span>
                )}
              </Button>
            </div>
          </form>

          {/* Live Preview Panel (Right 35%) */}
          <div className="lg:col-span-4 bg-ink p-5 border border-border-dark rounded-[4px] h-[360px] flex flex-col justify-center items-center text-center">
            <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold mb-4 block">
              Live Homepage Preview
            </span>
            
            {/* Display Offer Card */}
            <div className="w-full relative bg-transparent border border-border-dark border-t-[3px] border-t-antique-gold p-5 rounded-[2px] h-[250px] flex flex-col justify-between text-left animate-shimmer">
              <div>
                <h3 className="font-display font-semibold text-lg text-warm-ivory leading-snug line-clamp-2">
                  {title || 'Campaign Title'}
                </h3>
                <p className="font-sans text-[11px] text-pale-linen/70 leading-relaxed line-clamp-3 mt-2">
                  {description || 'Detailed promotional card description will show here for Bikaner store customers.'}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-border-dark/65 mt-auto">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="font-mono font-bold text-xl text-antique-gold shrink-0">
                    {rewardType === 'percent_discount' && rewardValue ? `${rewardValue}% OFF` : ''}
                    {rewardType === 'fixed_discount' && rewardValue ? `₹${rewardValue} OFF` : ''}
                    {rewardType === 'fixed_total' && rewardValue ? `Total ₹${rewardValue}` : ''}
                    {!rewardValue && '₹0.00'}
                  </span>
                  <span className="font-sans text-[8px] text-pale-linen/40 uppercase tracking-wider">
                    {validUntil ? `Exp: ${validUntil}` : 'Limited Offer'}
                  </span>
                </div>
                <div className="w-full py-1.5 border border-antique-gold/30 text-center text-antique-gold rounded-[3px] text-[9px] uppercase tracking-widest font-semibold font-sans">
                  Shop Now
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteOffer}
        onClose={() => setDeleteOffer(null)}
        title="Confirm Offer Deletion"
      >
        <div className="space-y-4 font-sans text-sm">
          <p className="text-gray-600 leading-relaxed">
            Are you sure you want to delete <span className="font-bold text-ink">"{deleteOffer?.title}"</span>?
            This will permanently remove the discount rule.
          </p>
          <div className="flex justify-end gap-3 border-t border-gray-50 pt-4">
            <Button
              variant="secondary"
              onClick={() => setDeleteOffer(null)}
              disabled={isDeleting}
              className="text-xs uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-stock-red hover:bg-[#7e1717] text-white text-xs uppercase tracking-wider flex items-center gap-1"
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
