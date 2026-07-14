'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase/client';
import { Product } from '../types';
import { useRouter } from 'next/navigation';

interface ToastState {
  line1: string;
  line2?: string | null;
  showSignInLink?: boolean;
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
  const router = useRouter();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Guest modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  // Clear toast after 2.5 seconds
  useEffect(() => {
    if (toast?.visible) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 2500);
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

  // Auto-add pending wishlist item after login
  useEffect(() => {
    const handlePostLoginWishlist = async () => {
      if (!user) return;
      const pendingId = sessionStorage.getItem('kh_pending_wishlist');
      if (pendingId) {
        try {
          await supabase.from('wishlists').upsert(
            { user_id: user.id, product_id: pendingId },
            { onConflict: 'user_id,product_id' }
          );
          sessionStorage.removeItem('kh_pending_wishlist');
          
          // Update local state
          setWishlistIds(prev => Array.from(new Set([...prev, pendingId])));
          setToast({
            line1: '❤️ Saved permanently to account!',
            line2: null,
            visible: true,
            type: 'add',
          });
        } catch (err) {
          console.error('Failed to sync pending wishlist item after login:', err);
        }
      }
    };

    handlePostLoginWishlist();
  }, [user]);

  const performWishlistToggle = async (product: Product, isAdded: boolean) => {
    let newIds: string[];

    if (isAdded) {
      newIds = wishlistIds.filter(id => id !== product.id);
      setToast({
        line1: '🤍 Removed from Wishlist',
        line2: null,
        visible: true,
        type: 'remove',
      });
    } else {
      newIds = [...wishlistIds, product.id];
      setToast({
        line1: '❤️ Added to Wishlist!',
        line2: null,
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
        localStorage.setItem('kh_wishlist', JSON.stringify(newIds));
      }
    } else {
      localStorage.setItem('kh_wishlist', JSON.stringify(newIds));
    }
  };

  const toggleWishlist = async (product: Product) => {
    const isAdded = wishlistIds.includes(product.id);

    if (user) {
      // Logged in — wishlist directly
      await performWishlistToggle(product, isAdded);
      return;
    }

    // Guest user logic
    if (isAdded) {
      // Already wishlisted as guest — allow removing directly without modal prompt
      await performWishlistToggle(product, true);
      return;
    }

    // Not wishlisted yet as guest — show the sign-in modal
    setPendingProduct(product);
    setShowAuthModal(true);
  };

  const handleModalSignIn = () => {
    setShowAuthModal(false);
    if (pendingProduct) {
      sessionStorage.setItem('kh_pending_wishlist', pendingProduct.id);
    }
    router.push('/login?redirect=/wishlist');
  };

  const handleModalGuest = () => {
    setShowAuthModal(false);
    if (pendingProduct) {
      const newIds = [...wishlistIds, pendingProduct.id];
      setWishlistIds(newIds);
      localStorage.setItem('kh_wishlist', JSON.stringify(newIds));

      setToast({
        line1: '❤️ Added to Wishlist',
        line2: '💡 Sign in to save permanently',
        showSignInLink: true,
        visible: true,
        type: 'add',
      });
      setPendingProduct(null);
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
      
      {/* Premium Elegant Toast Overlay (supports sign-in links and subtitle lines) */}
      {toast?.visible && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] bg-ink/95 border border-antique-gold text-warm-ivory text-xs sm:text-sm font-sans font-medium px-6 py-3.5 rounded-[4px] shadow-[0_4px_24px_rgba(26,17,10,0.4)] flex flex-col items-center gap-1.5 select-none animate-toast max-w-[90vw] text-center pointer-events-auto">
          <div className="flex items-center gap-2">
            <span>{toast.line1}</span>
            {toast.showSignInLink && (
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-antique-gold hover:text-white underline font-bold uppercase tracking-wider text-[10px] ml-1.5 cursor-pointer focus:outline-none"
              >
                [Sign In]
              </button>
            )}
          </div>
          {toast.line2 && (
            <span className="text-[10px] text-pale-linen/85 tracking-wide">
              {toast.line2}
            </span>
          )}
        </div>
      )}

      {/* Guest Sign-In Prompt Modal */}
      {showAuthModal && (
        <div className="wishlist-auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="wishlist-auth-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="close-btn" onClick={() => setShowAuthModal(false)}>
              ×
            </button>
            <span className="heart-icon">❤️</span>
            <h3>Save to Wishlist</h3>
            <div className="divider"></div>
            <p>
              Create a free account to save your wishlist permanently across all your devices.
            </p>
            <button type="button" className="btn-primary" onClick={handleModalSignIn}>
              Sign In / Create Account
            </button>
            <button type="button" className="btn-guest" onClick={handleModalGuest}>
              Continue as Guest
              <span>(saved on this device only)</span>
            </button>
          </div>
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
