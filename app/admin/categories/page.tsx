'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Category } from '../../../types';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { Plus, Pencil, Trash2, Grid, Loader2 } from 'lucide-react';

export default function AdminCategoriesPage() {
  const { token } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal forms states
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  // Field states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [emoji, setEmoji] = useState('🛏️');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [active, setActive] = useState(true);

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal states
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchCategories();
  }, [token]);

  const fetchCategories = () => {
    setLoading(true);
    fetch('/api/admin/categories', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  // Generate URL slug from category name automatically
  useEffect(() => {
    if (!editCategory && name) {
      const computedSlug = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
      setSlug(computedSlug);
    }
  }, [name, editCategory]);

  const handleOpenAddModal = () => {
    setEditCategory(null);
    setName('');
    setSlug('');
    setEmoji('🛏️');
    setDisplayOrder('0');
    setActive(true);
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setEmoji(cat.emoji || '🛏️');
    setDisplayOrder(cat.display_order.toString());
    setActive(cat.active);
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !slug) {
      setFormError('Name and URL slug are required.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      emoji: emoji.trim() || null,
      display_order: parseInt(displayOrder, 10) || 0,
      active,
    };

    try {
      const url = editCategory ? `/api/admin/categories/${editCategory.id}` : '/api/admin/categories';
      const method = editCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save category details.');
      }

      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCategory || !token) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/categories/${deleteCategory.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete category.');
      }

      setCategories(prev => prev.filter(c => c.id !== deleteCategory.id));
      setDeleteCategory(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete category.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-ink">
      
      {/* Page Heading & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-250 pb-4 select-none">
        <div>
          <h2 className="font-bold text-xl uppercase tracking-wider text-ink">Categories</h2>
          <p className="text-xs text-gray-500 font-medium">Create and group product categories</p>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenAddModal}
          className="self-start sm:self-auto flex items-center gap-1.5 h-10 uppercase tracking-widest text-[10px] font-bold"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Add Category</span>
        </Button>
      </div>

      {/* Categories Table View */}
      {loading ? (
        <div className="text-center py-12 bg-white border border-gray-250 rounded-[4px] shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-antique-gold mx-auto mb-2" />
          <p className="text-xs text-gray-500 font-sans">Loading categories list...</p>
        </div>
      ) : categories.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-[4px] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-gray-400 uppercase tracking-widest text-[9px] font-bold">
                  <th className="p-4 w-16 text-center">Emoji</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">URL Slug</th>
                  <th className="p-4">Display Order</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50/20">
                    {/* Emoji */}
                    <td className="p-4 text-center text-lg">{cat.emoji || '🛏️'}</td>

                    {/* Name */}
                    <td className="p-4 font-semibold text-ink text-sm">{cat.name}</td>

                    {/* Slug */}
                    <td className="p-4 font-mono text-gray-500">{cat.slug}</td>

                    {/* Display Order */}
                    <td className="p-4 font-mono text-gray-500">{cat.display_order}</td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                        cat.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-gray-50 text-gray-500 border-gray-150'
                      }`}>
                        {cat.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(cat)}
                          className="p-2 border border-gray-200 hover:border-deep-maroon hover:text-deep-maroon bg-white text-gray-400 rounded-[4px] cursor-pointer transition-colors"
                          title="Edit category"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setDeleteCategory(cat)}
                          className="p-2 border border-gray-200 hover:border-red-650 hover:bg-red-50 hover:text-red-750 text-gray-400 rounded-[4px] cursor-pointer transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 border border-gray-200 rounded-[4px] bg-white shadow-xs">
          <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Grid className="w-6 h-6" />
          </div>
          <p className="text-sm text-gray-500 font-sans">No categories created yet.</p>
        </div>
      )}

      {/* Edit/Add Category Modal Form */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editCategory ? 'Edit Category' : 'Add New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs md:text-sm text-ink">
          {formError && (
            <div className="bg-rose-50 border border-rose-150 text-rose-800 p-2.5 rounded-[3px] text-xs font-semibold">
              ⚠️ {formError}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink"
              placeholder="e.g. Bedsheets"
            />
          </div>

          {/* URL Slug */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              URL Slug *
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink"
              placeholder="bedsheets"
            />
          </div>

          {/* Emoji icon */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Category Emoji/Icon
            </label>
            <input
              type="text"
              value={emoji}
              maxLength={4}
              onChange={e => setEmoji(e.target.value)}
              className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink text-center text-lg"
              placeholder="🛏️"
            />
          </div>

          {/* Display Order */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Display Sequence Order
            </label>
            <input
              type="number"
              value={displayOrder}
              onChange={e => setDisplayOrder(e.target.value)}
              className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink font-mono"
              placeholder="0"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2 pt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              id="category-active"
              checked={active}
              onChange={e => setActive(e.target.checked)}
              className="w-4 h-4 accent-deep-maroon border-gray-300 rounded-[2px]"
            />
            <label htmlFor="category-active" className="text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer">
              Active (Visible in catalog filters)
            </label>
          </div>

          {/* Action triggers */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
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
                <span>Save Category</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteCategory}
        onClose={() => setDeleteCategory(null)}
        title="Confirm Category Deletion"
      >
        <div className="space-y-4 font-sans text-sm">
          <p className="text-gray-600 leading-relaxed">
            Are you sure you want to delete <span className="font-bold text-ink">"{deleteCategory?.name}"</span>?
            This will permanently remove the category.
          </p>
          <div className="flex justify-end gap-3 border-t border-gray-50 pt-4">
            <Button
              variant="secondary"
              onClick={() => setDeleteCategory(null)}
              disabled={isDeleting}
              className="text-xs uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-stock-red hover:bg-[#7a1818] text-white text-xs uppercase tracking-wider flex items-center gap-1"
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
