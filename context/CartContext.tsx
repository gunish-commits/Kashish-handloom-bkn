'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, AppliedOffer, Offer } from '../types';
import { calculateOffers } from '../lib/offers';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  offerApplied: AppliedOffer | null;
  discount: number;
  cartCount: number;
  triggerCartBounce: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [offerApplied, setOfferApplied] = useState<AppliedOffer | null>(null);
  const [triggerCartBounce, setTriggerCartBounce] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [addedItem, setAddedItem] = useState<{ name: string; photo: string; quantity: number } | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('kh_cart');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (e) {
      console.error('Error loading cart from localStorage:', e);
    }
    setIsLoaded(true);

    // Fetch active offers
    fetch('/api/offers/active')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch active offers');
      })
      .then(data => {
        setActiveOffers(data);
      })
      .catch(err => {
        console.error('Error fetching active offers for cart context:', err);
      });
  }, []);

  // Auto-dismiss added to cart popup alert after 3 seconds
  useEffect(() => {
    if (!addedItem) return;
    const timer = setTimeout(() => {
      setAddedItem(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [addedItem]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('kh_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error saving cart to localStorage:', e);
    }
  }, [cartItems, isLoaded]);

  // Recalculate applied offer whenever cartItems or activeOffers change
  useEffect(() => {
    if (cartItems.length === 0 || activeOffers.length === 0) {
      setOfferApplied(null);
      return;
    }
    const bestOffer = calculateOffers(cartItems, activeOffers);
    setOfferApplied(bestOffer);
  }, [cartItems, activeOffers]);

  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const qtyToAdd = item.quantity || 1;
    
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(i => i.product_id === item.product_id);

      if (existingItemIndex > -1) {
        // Item exists, update quantity, clamping it to the available stock
        const existingItem = prevItems[existingItemIndex];
        const newQuantity = Math.min(existingItem.quantity + qtyToAdd, item.stock);
        
        const newItems = [...prevItems];
        newItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
        };
        return newItems;
      } else {
        // Item is new, clamp quantity to available stock
        const finalQty = Math.min(qtyToAdd, item.stock);
        if (finalQty <= 0) return prevItems; // Cannot add out of stock items
        
        return [...prevItems, { ...item, quantity: finalQty } as CartItem];
      }
    });

    // Trigger toast notification
    setAddedItem({
      name: item.name,
      photo: item.photo,
      quantity: qtyToAdd,
    });

    // Trigger cart icon bounce animation
    setTriggerCartBounce(true);
    setTimeout(() => setTriggerCartBounce(false), 350);
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.product_id === productId) {
          // Clamp quantity between 1 and available stock
          const clampedQty = Math.max(1, Math.min(quantity, item.stock));
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setOfferApplied(null);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = offerApplied ? offerApplied.discount : 0;
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        offerApplied,
        discount,
        cartCount,
        triggerCartBounce,
      }}
    >
      {children}

      {/* Beautiful Added to Cart Toast Popup */}
      {addedItem && (
        <div className="fixed bottom-6 right-4 left-4 md:left-auto md:top-6 md:right-6 md:bottom-auto z-[99999] bg-[#120D0A]/95 text-warm-ivory border border-antique-gold/30 rounded-[4px] shadow-2xl p-4 flex items-start gap-4 select-none backdrop-blur-md animate-slideIn">
          {/* Product Image */}
          <div className="relative h-12 w-12 rounded-[2px] overflow-hidden shrink-0 border border-border-dark/60 bg-surface-dark flex items-center justify-center">
            {addedItem.photo ? (
              <img
                src={addedItem.photo}
                alt={addedItem.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[10px] text-gray-500 font-sans">No img</span>
            )}
          </div>

          {/* Text and Details */}
          <div className="flex-1 min-w-0 pr-4">
            <span className="font-sans font-bold text-[9px] uppercase tracking-widest text-antique-gold flex items-center gap-1.5 leading-none mb-1">
              <span className="text-emerald-500">✓</span> Added to Cart
            </span>
            <p className="font-display italic text-sm text-warm-ivory truncate font-medium">
              {addedItem.name}
            </p>
            <span className="font-sans text-[11px] text-pale-linen/50">
              Quantity: {addedItem.quantity}
            </span>
            <a
              href="/cart"
              className="font-sans font-semibold text-[10px] uppercase tracking-widest text-antique-gold hover:text-warm-ivory border-b border-antique-gold hover:border-warm-ivory transition-colors mt-2 block w-max leading-none"
            >
              View Cart &rarr;
            </a>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => setAddedItem(null)}
            className="text-gray-400 hover:text-warm-ivory text-sm font-sans font-bold leading-none p-1 cursor-pointer focus:outline-none shrink-0"
          >
            ✕
          </button>

          {/* Custom style block for the slideIn animation */}
          <style>{`
            @keyframes slideInUp {
              0% { transform: translateY(40px); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
            @keyframes slideInDown {
              0% { transform: translateY(-40px); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
            .animate-slideIn {
              animation: slideInUp 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            @media (min-width: 768px) {
              .animate-slideIn {
                animation: slideInDown 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
            }
          `}</style>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
