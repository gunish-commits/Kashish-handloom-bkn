import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="bg-card-white border border-gray-150 rounded-[4px] shadow-[0_2px_8px_rgba(15,10,5,0.04)] overflow-hidden animate-pulse">
      {/* Image Ratio 4:3 */}
      <div className="aspect-[4/3] w-full bg-gray-200" />

      {/* Card Body */}
      <div className="p-4 space-y-3">
        {/* Category Badge */}
        <div className="h-3 w-1/4 bg-gray-200 rounded" />

        {/* Title Lines */}
        <div className="space-y-2">
          <div className="h-4 w-11/12 bg-gray-200 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
        </div>

        {/* Price Tag */}
        <div className="h-4.5 w-1/3 bg-gray-200 rounded" />

        {/* Return Info */}
        <div className="h-3.5 w-5/12 bg-gray-200 rounded" />

        {/* Add to Cart Button */}
        <div className="h-10 w-full bg-gray-200 rounded-[4px] mt-2" />
      </div>
    </div>
  );
}
