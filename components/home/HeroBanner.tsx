'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Button from '../ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const slides = [
    {
      eyebrow: 'EST. 1976 · BIKANER, RAJASTHAN',
      title: 'Sleep in Luxury Every Night',
      sub: 'Premium handloom bedsheets crafted for comfort. Delivered across India.',
      btnText: 'Shop Bedsheets',
      btnLink: '/shop?category=bedsheets',
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1920&q=85',
    },
    {
      eyebrow: 'ELEGANT DRAPES · NATURAL LIGHT',
      title: 'Dress Your Windows Beautifully',
      sub: 'Handloom curtains that transform any room. 100+ styles available.',
      btnText: 'Shop Curtains',
      btnLink: '/shop?category=curtains',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&q=85',
    },
    {
      eyebrow: 'COZY WEAVES · WINTER ESSENTIALS',
      title: 'Warmth Woven with Love',
      sub: 'Soft blankets and comforters for every season. Pure handloom quality.',
      btnText: 'Shop Blankets',
      btnLink: '/shop?category=blankets',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1920&q=85',
    },
  ];

  const nextSlide = () => {
    setCurrentSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  // Reset autoplay timer whenever currentSlide changes
  useEffect(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(nextSlide, 5000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [currentSlide]);

  // Mobile Swipe Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
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
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <section 
      className="relative h-[75vh] md:h-screen w-full bg-ink overflow-hidden text-warm-ivory select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides Container */}
      {slides.map((slide, index) => {
        const isActive = currentSlide === index;
        return (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-800 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Image */}
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />

            {/* Premium Gradient Overlay */}
            <div 
              className="absolute inset-0 z-10"
              style={{
                background: 'linear-gradient(to right, rgba(15,10,5,0.82) 45%, rgba(15,10,5,0.25) 100%)'
              }}
            />

            {/* Text Content Panel */}
            <div className="absolute inset-0 z-20 max-w-7xl mx-auto px-4 md:px-8 flex items-center">
              <div className="w-full md:max-w-[55%] text-left">
                {/* Animation wrapper */}
                <div 
                  className={`space-y-4 md:space-y-6 transform transition-all duration-1000 ease-out ${
                    isActive 
                      ? 'translate-x-0 opacity-100' 
                      : '-translate-x-[30px] opacity-0'
                  }`}
                >
                  {/* Eyebrows Stack */}
                  <div className="space-y-2">
                    {/* Brand name line (NEW) */}
                    <p className="font-display font-light text-[15px] md:text-[18px] text-antique-gold tracking-[0.2em] uppercase">
                      Kashish Handloom
                    </p>
                    {/* Existing Eyebrow Label */}
                    <p className="font-sans font-medium text-[10px] md:text-xs text-antique-gold tracking-[0.2em] uppercase opacity-75">
                      {slide.eyebrow}
                    </p>
                  </div>

                  {/* Display Headline */}
                  <h1 className="font-display font-light text-3xl md:text-5xl lg:text-6xl text-warm-ivory leading-tight">
                    {slide.title}
                  </h1>

                  {/* Sub-Headline description */}
                  <p className="font-sans text-xs md:text-sm text-pale-linen/90 leading-relaxed max-w-md">
                    {slide.sub}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2.5">
                    <Button
                      variant="primary"
                      href={slide.btnLink}
                      className="w-full sm:w-auto h-11 px-8 uppercase tracking-widest text-[11px] font-bold flex items-center justify-center"
                    >
                      {slide.btnText}
                    </Button>
                    <Button
                      variant="outline-dark"
                      href="/shop"
                      className="w-full sm:w-auto h-11 px-8 uppercase tracking-widest text-[11px] font-bold border border-warm-ivory/30 hover:border-antique-gold hover:text-antique-gold transition-colors flex items-center justify-center bg-black/10"
                    >
                      Shop All
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Desktop Arrows */}
      <button
        onClick={prevSlide}
        className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-12 h-12 rounded-full border border-warm-ivory/20 bg-ink/40 text-warm-ivory hover:bg-antique-gold hover:border-antique-gold hover:text-ink transition-all duration-300 cursor-pointer focus:outline-none"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={nextSlide}
        className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-12 h-12 rounded-full border border-warm-ivory/20 bg-ink/40 text-warm-ivory hover:bg-antique-gold hover:border-antique-gold hover:text-ink transition-all duration-300 cursor-pointer focus:outline-none"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Manual dot navigation controls (3 dots, centered bottom) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-3.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer focus:outline-none ${
              currentSlide === index 
                ? 'bg-antique-gold border border-antique-gold scale-110' 
                : 'bg-transparent border border-antique-gold hover:bg-antique-gold/30'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
