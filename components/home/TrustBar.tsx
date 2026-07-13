import React from 'react';

export default function TrustBar() {
  const trustItems = [
    {
      icon: '🏭',
      title: 'Since 1976',
      subtitle: 'Legacy of Trust',
    },
    {
      icon: '🚚',
      title: 'Pan-India Delivery',
      subtitle: 'All Pincodes Serviced',
    },
    {
      icon: '📱',
      title: 'WhatsApp Orders',
      subtitle: 'Instant Confirmation',
    },
    {
      icon: '↩️',
      title: 'Easy Returns',
      subtitle: '7 & 14 Day Options',
    },
  ];

  return (
    <section className="bg-white-section border-y border-border-dark/10 py-10 text-[#1A110A] select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Desktop single row flex container / Mobile stacked column layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 divide-y divide-border-dark/10 lg:divide-y-0 lg:divide-x divide-solid">
          {trustItems.map((item, index) => (
            <div
              key={index}
              className={`flex items-center gap-4 justify-center py-4 lg:py-0 lg:px-6 first:pt-0 last:pb-0`}
            >
              {/* Pillar Icon */}
              <span className="text-3xl shrink-0 leading-none select-none">{item.icon}</span>

              {/* Text detail */}
              <div className="font-sans">
                <h4 className="font-bold text-sm uppercase tracking-wider text-ink mb-0.5">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 font-medium">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
