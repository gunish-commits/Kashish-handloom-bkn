'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase/client';
import { Product } from '../types';

interface ToastState {
  message: string;
  visible: boolean;
  type: 'add' | 'remove';
}

interface WishlistContextType {
  wishlistIds: string[];
  wishlistItems: Product[];
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  loading: boolean;
  toast: ToastState | null;
  clearToast: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Clear toast after 2 seconds
  useEffect(() => {
    if (toast?.visible) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load wishlist on mount / auth change
  useEffect(() => {
    const loadWishlist = async () => {
      setLoading(true);
      
      // 1. Get from localStorage as initial / anonymous state
      const local = localStorage.getItem('kh_wishlist');
      const localIds: string[] = local ? JSON.parse(local) : [];

      if (user) {
        try {
          // 2. Fetch from Supabase
          const { data, error } = await supabase
            .from('wishlists')
            .select('product_id')
            .eq('user_id', user.id);

          if (error) throw error;

          const dbIds = data.map(item => item.product_id);
          
          // Merge local and db ids
          const mergedIds = Array.from(new Set([...localIds, ...dbIds]));
          setWishlistIds(mergedIds);

          // Sync merged back to DB and local storage
          if (localIds.length > 0) {
            const inserts = localIds.map(pid => ({ user_id: user.id, product_id: pid }));
            await supabase.from('wishlists').upsert(inserts, { onConflict: 'user_id,product_id' });
            localStorage.removeItem('kh_wishlist'); // Clear local once merged
          }
        } catch (err) {
          console.warn('Supabase wishlist failed, falling back to localStorage:', err);
          setWishlistIds(localIds);
        }
      } else {
        setWishlistIds(localIds);
      }
      setLoading(false);
    };

    loadWishlist();
  }, [user]);

  // Load full products when wishlistIds change
  useEffect(() => {
    const fetchProducts = async () => {
      if (wishlistIds.length === 0) {
        setWishlistItems([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('id', wishlistIds)
          .eq('active', true);

        if (error) throw error;
        setWishlistItems(data || []);
      } catch (err) {
        console.error('Failed to fetch wishlist products:', err);
      }
    };

    fetchProducts();
  }, [wishlistIds]);

  const toggleWishlist = async (product: Product) => {
    const isAdded = wishlistIds.includes(product.id);
    let newIds: string[];

    if (isAdded) {
      newIds = wishlistIds.filter(id => id !== product.id);
      setToast({
        message: 'Removed from Wishlist',
        visible: true,
        type: 'remove',
      });
    } else {
      newIds = [...wishlistIds, product.id];
      setToast({
        message: '❤️ Added to Wishlist',
        visible: true,
        type: 'add',
      });
    }

    setWishlistIds(newIds);

    // Save persistence
    if (user) {
      try {
        if (isAdded) {
          await supabase
            .from('wishlists')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', product.id);
        } else {
          await supabase
            .from('wishlists')
            .insert({ user_id: user.id, product_id: product.id });
        }
      } catch (err) {
        console.warn('DB sync failed, keeping local update:', err);
        // Fallback to local storage
        localStorage.setItem('kh_wishlist', JSON.stringify(newIds));
      }
    } else {
      localStorage.setItem('kh_wishlist', JSON.stringify(newIds));
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistIds.includes(productId);
  };

  const clearToast = () => setToast(null);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistItems,
        toggleWishlist,
        isInWishlist,
        loading,
        toast,
        clearToast,
      }}
    >
      {children}
      
      {/* Premium Elegant Toast Overlay */}
      {toast?.visible && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] bg-ink/95 border border-antique-gold text-warm-ivory text-xs sm:text-sm font-sans font-medium uppercase tracking-wider px-6 py-3.5 rounded-[4px] shadow-[0_4px_24px_rgba(26,17,10,0.4)] flex items-center gap-2.5 select-none pointer-events-none transition-all duration-300 animate-toast">
          <span>{toast.message}</span>
        </div>
      )}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
