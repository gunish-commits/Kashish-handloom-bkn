import React from 'react';

interface DividerProps {
  className?: string;
  light?: boolean;
}

export default function Divider({ className = '', light = false }: DividerProps) {
  return (
    <div
      className={`flex items-center justify-center select-none my-6 text-sm md:text-base tracking-[0.1em] ${
        light ? 'text-deep-maroon' : 'text-antique-gold'
      } ${className}`}
    >
      <span className="opacity-40">──────</span>
      <span className="mx-4 text-lg md:text-xl font-light">✦</span>
      <span className="opacity-40">──────</span>
    </div>
  );
}
