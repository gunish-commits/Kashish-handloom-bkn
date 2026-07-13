'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function WhatsAppFloatingButton() {
  const pathname = usePathname();
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    // Trigger bounce once after a delay
    const bounceTimer = setTimeout(() => {
      setBounce(true);
      const stopTimer = setTimeout(() => setBounce(false), 1000);
      return () => clearTimeout(stopTimer);
    }, 1800);

    return () => clearTimeout(bounceTimer);
  }, []);

  // Hide the floating button on checkout page to avoid clutter
  if (pathname === '/checkout') return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 group select-none">
      {/* Tooltip on Hover */}
      <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-ink text-warm-ivory text-[10px] tracking-widest font-sans font-medium uppercase px-3 py-1.5 rounded-[3px] opacity-0 scale-95 origin-right group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-md border border-border-dark">
        Order on WhatsApp
      </span>

      {/* WhatsApp Link Anchor */}
      <a
        href="https://wa.me/918209455157"
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-[0_4px_16px_rgba(37,211,102,0.45)] transition-all duration-300 hover:scale-110 active:scale-[0.95] ${
          bounce ? 'animate-bounce shadow-[0_0_24px_rgba(37,211,102,0.65)]' : ''
        }`}
        aria-label="Order on WhatsApp"
      >
        <svg
          className="w-7 h-7 fill-current"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.66.986 3.292 1.503 5.361 1.506 5.426 0 9.848-4.337 9.851-9.664.002-2.58-1.01-5.006-2.85-6.849-1.84-1.84-4.286-2.854-6.86-2.855-5.43 0-9.855 4.341-9.858 9.67-.001 2.11.558 4.163 1.623 5.923l-.992 3.626 3.725-.967zm12.355-6.822c-.273-.137-1.616-.797-1.867-.889-.252-.09-.435-.137-.617.137-.182.273-.706.889-.866 1.072-.16.182-.32.205-.593.069-.273-.137-1.15-.424-2.19-1.353-.809-.721-1.355-1.614-1.514-1.888-.16-.273-.018-.42.119-.557.124-.124.273-.32.41-.48.137-.16.182-.273.273-.455.09-.182.046-.341-.023-.48-.069-.137-.617-1.483-.846-2.03-.223-.538-.468-.465-.617-.465-.124-.005-.27-.005-.417-.005-.146 0-.385.055-.586.273-.201.219-.77.752-.77 1.83 0 1.08.784 2.12.893 2.268.109.148 1.543 2.358 3.738 3.305.522.224.93.359 1.248.46.525.166.993.143 1.367.088.417-.061 1.616-.66 1.844-1.298.228-.638.228-1.186.16-1.298-.069-.113-.252-.182-.525-.32z" />
        </svg>
      </a>
    </div>
  );
}
