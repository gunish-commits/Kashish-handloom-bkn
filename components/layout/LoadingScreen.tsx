'use client';

import React, { useState, useEffect } from 'react';
import BrandName from '../ui/BrandName';

export default function LoadingScreen() {
  const [showLoader, setShowLoader] = useState(false);
  const [fadeActive, setFadeActive] = useState(false);

  useEffect(() => {
    // Only show if not already shown in this browser session
    const hasShown = sessionStorage.getItem('kh_intro_shown');
    if (!hasShown) {
      setShowLoader(true);
      sessionStorage.setItem('kh_intro_shown', 'true');
      
      // After 1.5 seconds, trigger the fade-out
      const fadeTimer = setTimeout(() => {
        setFadeActive(true);
      }, 1500);

      // After 1.9 seconds (1.5s display + 0.4s fade duration), remove from DOM
      const removeTimer = setTimeout(() => {
        setShowLoader(false);
      }, 1900);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, []);

  if (!showLoader) return null;

  return (
    <div
      className={`fixed inset-0 bg-ink z-[99999] flex flex-col items-center justify-center font-sans select-none transition-opacity duration-400 ease-in-out ${
        fadeActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center text-center px-4">
        {/* 1. Logo image (fades in over 400ms) */}
        <div className="relative h-[90px] w-64 flex items-center justify-center animate-logo-fade">
          <img
            src="/logo.jpg"
            alt="Kashish Handloom"
            className="w-auto h-[90px] object-contain"
          />
        </div>

        {/* 2. Brand Name (fades in, margin-top: 14px) */}
        <div className="mt-[14px] animate-subtext-fade">
          <BrandName size="lg" theme="dark" showTagline={true} centered={true} />
        </div>

        {/* 3. Elegant Loading Bar */}
        <div className="w-[120px] h-[2px] bg-border-dark rounded-full overflow-hidden mt-[28px]">
          <div className="h-full bg-antique-gold w-0 animate-loading-fill" />
        </div>
      </div>

      {/* Styled animation keyframes */}
      <style>{`
        @keyframes logoFade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes textSlide {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtextFade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes loadingFill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-logo-fade {
          animation: logoFade 400ms ease-out forwards;
        }
        .animate-text-slide {
          opacity: 0;
          animation: textSlide 400ms ease-out 200ms forwards;
        }
        .animate-subtext-fade {
          opacity: 0;
          animation: subtextFade 300ms ease-out 400ms forwards;
        }
        .animate-loading-fill {
          animation: loadingFill 1.2s linear forwards;
        }
      `}</style>
    </div>
  );
}
