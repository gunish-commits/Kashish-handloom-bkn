'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product, Category, ReturnPolicyType } from '../../types';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { convertHEICtoJPEG, compressImage } from '../../lib/imageCompressionHelper';
import {
  Upload,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
} from 'lucide-react';

interface ProductFormProps {
  initialData?: Product;
  categories: Category[];
}

export default function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter();
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!initialData;

  // Form Field States
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [salePrice, setSalePrice] = useState(initialData?.sale_price?.toString() || '');
  const [stock, setStock] = useState(initialData?.stock?.toString() || '0');
  const [lowStockThreshold, setLowStockThreshold] = useState(initialData?.low_stock_threshold?.toString() || '5');
  const [returnPolicy, setReturnPolicy] = useState<ReturnPolicyType>(initialData?.return_policy || 'no_return');
  const [fabric, setFabric] = useState(initialData?.fabric || '');
  const [size, setSize] = useState(initialData?.size || '');
  const [sku, setSku] = useState(initialData?.sku || '');
  const [featured, setFeatured] = useState(!!initialData?.featured);
  const [active, setActive] = useState(initialData?.active !== undefined ? !!initialData.active : true);

  // Photos array
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoSizes, setPhotoSizes] = useState<Record<string, string>>({});
  const [isDragActive, setIsDragActive] = useState(false);

  // Queue state for active/pending file compressions & uploads
  interface UploadQueueItem {
    id: string;
    fileName: string;
    progress: number;
    status: 'pending' | 'converting' | 'compressing' | 'uploading' | 'complete' | 'failed' | 'already-optimized';
    sizeText?: string;
    file: File;
    error?: string;
  }
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);

  // Automatically fetch content-lengths for existing photos to show their size below thumbnails
  useEffect(() => {
    if (photos.length > 0) {
      photos.forEach(async (url) => {
        if (!photoSizes[url]) {
          try {
            const res = await fetch(url, { method: 'HEAD' });
            const size = res.headers.get('content-length');
            if (size) {
              const kb = Math.round(parseInt(size) / 1024);
              setPhotoSizes(prev => ({ ...prev, [url]: `✓ ${kb}KB` }));
            } else {
              setPhotoSizes(prev => ({ ...prev, [url]: '✓ Optimized' }));
            }
          } catch (e) {
            setPhotoSizes(prev => ({ ...prev, [url]: '✓ Optimized' }));
          }
        }
      });
    }
  }, [photos]);

  // General state
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate URL slug from product name automatically (if not in edit mode or slug is empty)
  useEffect(() => {
    if (!isEditMode && name) {
      const computedSlug = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
      setSlug(computedSlug);
    }
  }, [name, isEditMode]);

  // SKU Generator helper
  const generateSKU = (catId: string, categoriesList: any[]) => {
    const cat = categoriesList.find(c => c.id === catId);
    let prefix = 'KH'; // Fallback
    if (cat) {
      const catName = cat.name.toLowerCase();
      if (catName.includes('bedsheet')) {
        prefix = 'BH'; // Bikaner Handloom / BedSheet
      } else if (catName.includes('curtain')) {
        prefix = 'CR';
      } else if (catName.includes('blanket')) {
        prefix = 'BL';
      } else if (catName.includes('pillow')) {
        prefix = 'PC';
      } else if (catName.includes('comforter')) {
        prefix = 'CF';
      } else {
        prefix = catName.replace(/[^a-z]/g, '').slice(0, 2).toUpperCase() || 'KH';
      }
    }
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${randomNum}`;
  };

  const triggerSkuGen = (catId: string) => {
    const newSku = generateSKU(catId || categoryId, categories);
    setSku(newSku);
  };

  const handleCategoryChange = (val: string) => {
    setCategoryId(val);
    // If SKU is empty or starts with fallback prefix 'KH-', auto-generate a category-specific SKU
    if (!sku || sku.trim() === '' || sku.startsWith('KH-')) {
      const newSku = generateSKU(val, categories);
      setSku(newSku);
    }
  };

  // Image Upload sequential processing queue
  const processFiles = async (fileList: FileList) => {
    if (!token) return;

    if (photos.length + fileList.length > 6) {
      alert('Maximum 6 photos are allowed per product.');
      return;
    }

    setUploadingPhotos(true);
    setFormError('');

    const selectedFiles = Array.from(fileList);
    // Filter out files that are not images
    const imageFiles = selectedFiles.filter(file => {
      const isImg = file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic');
      if (!isImg) {
        alert(`File "${file.name}" is not an image (JPG, PNG, WEBP, HEIC allowed).`);
      }
      return isImg;
    });

    if (imageFiles.length === 0) {
      setUploadingPhotos(false);
      return;
    }

    // Initialize queue items
    const newQueueItems: UploadQueueItem[] = imageFiles.map((f, idx) => ({
      id: `${f.name}-${Date.now()}-${idx}`,
      fileName: f.name,
      progress: 0,
      status: 'pending',
      file: f,
    }));

    setUploadQueue(prev => [...prev, ...newQueueItems]);

    // Process sequentially one by one
    for (const queueItem of newQueueItems) {
      const isHeic = queueItem.fileName.toLowerCase().endsWith('.heic') || queueItem.file.type === 'image/heic';
      
      setUploadQueue(prev => prev.map(item => item.id === queueItem.id ? { ...item, status: isHeic ? 'converting' : 'compressing' } : item));

      try {
        let processedFile = queueItem.file;
        if (isHeic) {
          processedFile = await convertHEICtoJPEG(queueItem.file);
          setUploadQueue(prev => prev.map(item => item.id === queueItem.id ? { ...item, status: 'compressing' } : item));
        }

        const isAlreadySmall = processedFile.size < 100 * 1024; // < 100KB
        let finalFile = processedFile;

        if (isAlreadySmall) {
          setUploadQueue(prev => prev.map(item => item.id === queueItem.id ? { ...item, status: 'already-optimized', progress: 100, sizeText: '✓ Already optimized' } : item));
        } else {
          try {
            finalFile = await compressImage(processedFile, {
              maxSizeMB: 0.4,
              maxWidthOrHeight: 1200,
              fileType: 'image/webp',
              initialQuality: 0.82,
              onProgress: (p) => {
                setUploadQueue(prev => prev.map(item => item.id === queueItem.id ? { ...item, progress: p } : item));
              }
            });

            const compressedKb = Math.round(finalFile.size / 1024);
            setUploadQueue(prev => prev.map(item => item.id === queueItem.id ? { ...item, status: 'uploading', sizeText: `✓ ${compressedKb}KB` } : item));
          } catch (compErr) {
            console.error('Compression failed, uploading original:', compErr);
            setUploadQueue(prev => prev.map(item => item.id === queueItem.id ? { ...item, status: 'uploading', sizeText: 'Failed, uploading original' } : item));
          }
        }

        setUploadQueue(prev => prev.map(item => item.id === queueItem.id ? { ...item, status: 'uploading' } : item));

        const formData = new FormData();
        formData.append('file', finalFile);

        const res = await fetch('/api/admin/upload/product-photo', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          throw new Error('Upload failed. Please check your connection and try again.');
        }

        const data = await res.json();
        setPhotos(prev => [...prev, data.url]);
        
        const sizeText = queueItem.sizeText || (isAlreadySmall ? '✓ Already optimized' : `✓ ${Math.round(finalFile.size / 1024)}KB`);
        setPhotoSizes(prev => ({ ...prev, [data.url]: sizeText }));

        setUploadQueue(prev => prev.map(item => item.id === queueItem.id ? { ...item, status: 'complete', progress: 100 } : item));
      } catch (err: any) {
        console.error(err);
        setUploadQueue(prev => prev.map(item => item.id === queueItem.id ? { ...item, status: 'failed', error: err.message || 'Upload failed' } : item));
        setFormError(err.message || 'Upload failed.');
      }
    }

    setUploadingPhotos(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFiles(files);
  };

  const handleRetryUpload = async (queueItemId: string) => {
    const queueItem = uploadQueue.find(item => item.id === queueItemId);
    if (!queueItem || !token) return;

    setUploadQueue(prev => prev.map(item => item.id === queueItemId ? { ...item, status: 'compressing', progress: 0, error: undefined } : item));

    try {
      const isHeic = queueItem.fileName.toLowerCase().endsWith('.heic') || queueItem.file.type === 'image/heic';
      let processedFile = queueItem.file;
      if (isHeic) {
        processedFile = await convertHEICtoJPEG(queueItem.file);
      }

      const isAlreadySmall = processedFile.size < 100 * 1024;
      let finalFile = processedFile;

      if (isAlreadySmall) {
        setUploadQueue(prev => prev.map(item => item.id === queueItemId ? { ...item, status: 'already-optimized', progress: 100, sizeText: '✓ Already optimized' } : item));
      } else {
        try {
          finalFile = await compressImage(processedFile, {
            maxSizeMB: 0.4,
            maxWidthOrHeight: 1200,
            fileType: 'image/webp',
            initialQuality: 0.82,
            onProgress: (p) => {
              setUploadQueue(prev => prev.map(item => item.id === queueItemId ? { ...item, progress: p } : item));
            }
          });
          const compressedKb = Math.round(finalFile.size / 1024);
          setUploadQueue(prev => prev.map(item => item.id === queueItemId ? { ...item, status: 'uploading', sizeText: `✓ ${compressedKb}KB` } : item));
        } catch (compErr) {
          console.error(compErr);
        }
      }

      setUploadQueue(prev => prev.map(item => item.id === queueItemId ? { ...item, status: 'uploading' } : item));

      const formData = new FormData();
      formData.append('file', finalFile);

      const res = await fetch('/api/admin/upload/product-photo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed. Please check your connection and try again.');
      }

      const data = await res.json();
      setPhotos(prev => [...prev, data.url]);
      const sizeText = queueItem.sizeText || (isAlreadySmall ? '✓ Already optimized' : `✓ ${Math.round(finalFile.size / 1024)}KB`);
      setPhotoSizes(prev => ({ ...prev, [data.url]: sizeText }));

      setUploadQueue(prev => prev.map(item => item.id === queueItemId ? { ...item, status: 'complete', progress: 100 } : item));
    } catch (err: any) {
      console.error(err);
      setUploadQueue(prev => prev.map(item => item.id === queueItemId ? { ...item, status: 'failed', error: err.message || 'Upload failed' } : item));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== index));
  };

  const makeMainPhoto = (index: number) => {
    if (index === 0) return;
    setPhotos(prev => {
      const copy = [...prev];
      const selected = copy.splice(index, 1)[0];
      return [selected, ...copy];
    });
  };

  const movePhoto = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    setPhotos(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !slug || !price || stock === undefined || !categoryId) {
      setFormError('Please fill in all mandatory fields (*).');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      category_id: categoryId,
      description: description.trim(),
      price: parseFloat(price),
      sale_price: salePrice ? parseFloat(salePrice) : null,
      stock: parseInt(stock, 10),
      low_stock_threshold: parseInt(lowStockThreshold, 10),
      return_policy: returnPolicy,
      photos,
      fabric: fabric.trim() || null,
      size: size.trim() || null,
      sku: sku.trim() || null,
      featured,
      active,
    };

    try {
      const url = isEditMode ? `/api/admin/products/${initialData.id}` : '/api/admin/products';
      const method = isEditMode ? 'PUT' : 'POST';

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
        throw new Error(errData.error || 'Failed to save product details.');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[4px] shadow-xs p-5 md:p-8 select-none">
      
      {formError && (
        <div className="bg-rose-50 border border-rose-150 text-rose-800 p-4 rounded-[4px] text-xs font-semibold mb-6">
          ⚠️ {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 font-sans text-sm text-[#1A110A]">
        
        {/* Core fields card section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left panel inputs */}
          <div className="space-y-4">
            
            {/* Product name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink"
                placeholder="e.g. Pure Cotton Double Bed Sheet"
              />
            </div>

            {/* Product slug */}
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
                placeholder="pure-cotton-double-bed-sheet"
              />
            </div>

            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Category *
              </label>
              <select
                required
                value={categoryId}
                onChange={e => handleCategoryChange(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink cursor-pointer"
              >
                <option value="">Select a Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Description
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink resize-none"
                placeholder="Provide detailed description of weaving pattern, density, and colors..."
              />
            </div>

            {/* Specifications: Fabric / Size / SKU */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fabric
                </label>
                <input
                  type="text"
                  value={fabric}
                  onChange={e => setFabric(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink"
                  placeholder="e.g. 100% Cotton"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Dimensions
                </label>
                <input
                  type="text"
                  value={size}
                  onChange={e => setSize(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink"
                  placeholder="90 x 108 inches"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    SKU Code
                  </label>
                  <button
                    type="button"
                    onClick={() => triggerSkuGen(categoryId)}
                    className="text-[10px] text-deep-maroon hover:text-antique-gold font-bold uppercase tracking-wider focus:outline-none cursor-pointer"
                  >
                    🔄 Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-250 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink font-sans"
                  placeholder="e.g. BH-1002"
                />
              </div>
            </div>
          </div>

          {/* Right panel inputs */}
          <div className="space-y-4">
            
            {/* Pricing fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Price (MRP) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full h-10 pl-7 pr-4 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink font-mono"
                    placeholder="1200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Sale Price (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={salePrice}
                    onChange={e => setSalePrice(e.target.value)}
                    className="w-full h-10 pl-7 pr-4 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink font-mono"
                    placeholder="999"
                  />
                </div>
              </div>
            </div>

            {/* Inventory stock controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Stock Count *
                </label>
                <input
                  type="number"
                  required
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink font-mono"
                  placeholder="25"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  value={lowStockThreshold}
                  onChange={e => setLowStockThreshold(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink font-mono"
                  placeholder="5"
                />
              </div>
            </div>

            {/* Return Policy dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Return Policy *
              </label>
              <select
                value={returnPolicy}
                onChange={e => setReturnPolicy(e.target.value as ReturnPolicyType)}
                className="w-full h-10 px-3 border border-gray-200 rounded-[4px] focus:outline-none focus:border-deep-maroon bg-white text-ink cursor-pointer"
              >
                <option value="no_return">No Return — All sales final</option>
                <option value="7_days">7-Day Easy Return</option>
                <option value="14_days">14-Day Easy Return</option>
              </select>
            </div>

            {/* Checkbox triggers */}
            <div className="flex flex-col gap-3 py-2 border-t border-gray-100 mt-2">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={e => setFeatured(e.target.checked)}
                  className="w-4 h-4 accent-deep-maroon border-gray-300 rounded-[2px]"
                />
                <span>Featured on Homepage</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                  className="w-4 h-4 accent-deep-maroon border-gray-300 rounded-[2px]"
                />
                <span>Active (Visible to public)</span>
              </label>
            </div>

          </div>

        </div>

        {/* Multi-image drag and drop photo uploader */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Product Photos (Max 6, First is Main Display)
          </label>

          {/* Drag & Drop Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-[4px] p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 select-none ${
              isDragActive 
                ? 'border-antique-gold bg-[#FAF7F2]' 
                : 'border-gray-250 hover:border-antique-gold hover:bg-[#FAF7F2]/40'
            }`}
          >
            <Upload className="w-8 h-8 text-antique-gold" />
            <span className="text-xs text-gray-500 font-medium">
              📷 Tap to select photos or drag & drop here
            </span>
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
              JPG, PNG, WEBP, HEIC accepted
            </span>
            <span className="text-[10px] text-gray-405">
              Up to 6 photos · Any size (auto-compressed)
            </span>
            <input
              type="file"
              multiple
              accept="image/*,.heic"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Combined Previews Grid (Completed + Active Uploading Queue) */}
          {(photos.length > 0 || uploadQueue.some(item => item.status !== 'complete')) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-2">
              
              {/* 1. Completed Photos */}
              {photos.map((url, index) => {
                const isMain = index === 0;
                const sizeText = photoSizes[url] || '';
                return (
                  <div
                    key={url}
                    className={`relative aspect-square border rounded-[4px] overflow-hidden bg-gray-50 flex flex-col group ${
                      isMain ? 'border-antique-gold ring-1 ring-antique-gold' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`Product preview ${index + 1}`}
                      fill
                      sizes="150px"
                      className="object-cover"
                    />

                    {/* Size indicator label */}
                    {sizeText && (
                      <div className="absolute bottom-1 left-1 bg-ink/75 text-[9px] text-antique-gold px-1.5 py-0.5 rounded-[2px] font-sans font-medium pointer-events-none select-none z-10">
                        {sizeText}
                      </div>
                    )}

                    {/* Image overlay Actions */}
                    <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 z-20">
                      <div className="flex justify-between items-center">
                        {/* Main indicator star */}
                        {isMain ? (
                          <span className="bg-antique-gold text-ink p-1 rounded-full text-xs" title="Main display image">
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => makeMainPhoto(index)}
                            className="bg-ink/80 text-antique-gold hover:bg-ink p-1 rounded-full text-[9px] uppercase tracking-wider font-semibold cursor-pointer"
                          >
                            Set Main
                          </button>
                        )}

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="bg-red-650 hover:bg-red-750 text-white p-1 rounded-full cursor-pointer focus:outline-none"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Direction controls */}
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => movePhoto(index, 'left')}
                          className="p-1 rounded-full bg-ink/60 hover:bg-ink text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === photos.length - 1}
                          onClick={() => movePhoto(index, 'right')}
                          className="p-1 rounded-full bg-ink/60 hover:bg-ink text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 2. Uploading Queue Previews */}
              {uploadQueue.filter(item => item.status !== 'complete').map((item) => {
                const isFailed = item.status === 'failed';
                const isCompressing = item.status === 'compressing';
                const isConverting = item.status === 'converting';
                const isUploading = item.status === 'uploading';
                const isAlreadyOpt = item.status === 'already-optimized';

                // Display a temporary local object URL preview for visual reference
                const tempUrl = item.file ? URL.createObjectURL(item.file) : '';

                return (
                  <div
                    key={item.id}
                    className="relative aspect-square border border-dashed border-gray-300 rounded-[4px] overflow-hidden bg-gray-50 flex flex-col items-center justify-center p-2 text-center"
                  >
                    {tempUrl && (
                      <div className="absolute inset-0 opacity-20 blur-[2px] bg-gray-250 select-none pointer-events-none">
                        <img
                          src={tempUrl}
                          alt="preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="relative z-10 space-y-1.5 w-full">
                      {isFailed ? (
                        <>
                          <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider block">Failed</span>
                          <p className="text-[9px] text-gray-500 leading-tight max-w-[120px] mx-auto truncate" title={item.error}>
                            {item.error || 'Upload error'}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleRetryUpload(item.id)}
                            className="bg-deep-maroon text-white text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-[2px] cursor-pointer hover:bg-[#4e0c19] mt-1"
                          >
                            Retry
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Progress text */}
                          <span className="text-[10px] text-antique-gold font-bold uppercase tracking-wider block leading-tight">
                            {isConverting && 'Converting HEIC...'}
                            {isCompressing && `Compressing... ${Math.round(item.progress)}%`}
                            {isAlreadyOpt && 'Optimizing...'}
                            {isUploading && 'Uploading...'}
                          </span>

                          {/* Progress Bar */}
                          <div className="w-4/5 h-1.5 bg-gray-200 rounded-full overflow-hidden mx-auto">
                            <div
                              className="h-full bg-antique-gold transition-all duration-150"
                              style={{
                                width: `${
                                  isConverting
                                    ? 20
                                    : isCompressing
                                    ? item.progress
                                    : isAlreadyOpt
                                    ? 90
                                    : 95
                                }%`,
                              }}
                            />
                          </div>
                          
                          <span className="text-[8px] text-gray-400 block truncate max-w-[100px] mx-auto">
                            {item.fileName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          )}
        </div>

        {/* Action Triggers footer */}
        <div className="flex justify-end gap-3.5 pt-4 border-t border-gray-100">
          <Button
            variant="secondary"
            onClick={() => router.push('/admin/products')}
            disabled={isSubmitting}
            className="h-11 uppercase tracking-widest text-[11px] font-bold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || uploadingPhotos}
            className="h-11 px-8 uppercase tracking-widest text-[11px] font-bold flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Saving details...</span>
              </>
            ) : (
              <span>Save Product</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
