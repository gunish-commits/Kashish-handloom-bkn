'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

interface ProductGalleryProps {
  photos: string[];
  productName: string;
}

export default function ProductGallery({ photos, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Fallback if no photos provided
  const images = photos && photos.length > 0 ? photos : ['/placeholder-product.jpg'];

  // Handle keyboard events in lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') {
        setActiveIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
      }
      if (e.key === 'ArrowLeft') {
        setActiveIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, images.length]);

  // Touch swipe states for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setActiveIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    } else if (isRightSwipe) {
      setActiveIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const nextImage = () => {
    setActiveIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setActiveIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="space-y-4 select-none">
      {/* Large Display Image */}
      <div
        className="relative aspect-[4/3] w-full bg-gray-50 border border-gray-100 rounded-[4px] overflow-hidden group cursor-zoom-in"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => setLightboxOpen(true)}
      >
        <Image
          src={images[activeIndex]}
          alt={`${productName} - Display Image ${activeIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 55vw"
          className="object-cover"
        />

        {/* Hover zoom icon */}
        <div className="absolute bottom-4 right-4 bg-ink/70 text-warm-ivory p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md">
          <Maximize2 className="w-4 h-4" />
        </div>

        {/* Mobile Swipe Indicators (Left/Right Arrows on Desktop) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-warm-ivory/80 text-ink hover:bg-warm-ivory hover:scale-105 shadow-sm transition-all focus:outline-none hidden md:flex cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-warm-ivory/80 text-ink hover:bg-warm-ivory hover:scale-105 shadow-sm transition-all focus:outline-none hidden md:flex cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails row (Up to 6 thumbnails) */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto py-1 no-scrollbar justify-center">
          {images.slice(0, 6).map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative w-16 h-16 rounded-[2px] overflow-hidden border-2 transition-all ${
                activeIndex === idx ? 'border-antique-gold' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <Image
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Fullscreen Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[10000] flex flex-col justify-center items-center bg-black/95 backdrop-blur-xs page-fade-in">
          {/* Top Bar inside Lightbox */}
          <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 bg-gradient-to-b from-black/50 to-transparent">
            <span className="font-sans text-xs uppercase tracking-widest text-warm-ivory/70">
              {activeIndex + 1} / {images.length} · {productName}
            </span>
            <button
              onClick={() => setLightboxOpen(false)}
              className="text-warm-ivory hover:text-antique-gold p-2 cursor-pointer transition-colors focus:outline-none"
              aria-label="Close Lightbox"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Image View */}
          <div
            className="relative w-full max-w-5xl aspect-video px-4 md:px-12 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <div
              className="relative w-full h-[70vh]"
              onClick={e => e.stopPropagation()} // Prevent close on clicking image
            >
              <Image
                src={images[activeIndex]}
                alt={`${productName} lightbox view`}
                fill
                sizes="(max-width: 1280px) 100vw, 1200px"
                className="object-contain"
              />
            </div>
          </div>

          {/* Lightbox Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-6 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer focus:outline-none"
                aria-label="Previous lightbox image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-6 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer focus:outline-none"
                aria-label="Next lightbox image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
