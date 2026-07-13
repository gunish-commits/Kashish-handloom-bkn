'use client';

import React, { useEffect, useState } from 'react';
import { Offer } from '../../types';

export default function AnnouncementTicker() {
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    fetch('/api/offers/active')
      .then(res => (res.ok ? res.json() : []))
      .then(data => setOffers(data))
      .catch(() => {});
  }, []);

  const defaultItems = [
    'Pan-India Delivery available',
    '7-Day Easy Returns on select products',
    'Direct Order & Enquiry on WhatsApp: +91 8209455157',
  ];

  // Pull active offer titles
  const offerItems = offers.map(o => o.title);
  const combinedItems = [...offerItems, ...defaultItems];

  // Repeat items to ensure smooth infinite loop without blanks
  const tickerLoop = [...combinedItems, ...combinedItems, ...combinedItems];

  return (
    <div className="h-9 bg-deep-maroon text-warm-ivory font-sans text-xs flex items-center overflow-hidden z-50 select-none">
      <div className="animate-marquee whitespace-nowrap flex items-center">
        {tickerLoop.map((item, index) => (
          <span key={index} className="inline-flex items-center">
            <span className="mx-6 text-antique-gold opacity-80 text-[10px]">✦</span>
            <span>{item}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
