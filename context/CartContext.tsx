import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useToast } from '../components/Toast/ToastProvider';
import { supabase } from '../lib/supabase';

export const EXCHANGE_RATE = 1.95583;
export const FREE_SHIPPING_THRESHOLD_BGN = 150;
export const FREE_SHIPPING_THRESHOLD_EUR = FREE_SHIPPING_THRESHOLD_BGN / EXCHANGE_RATE;

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_order_amount?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
}

export interface CartItem {
  id: string; // unique identifier (usually product slug + variant)
  name: string;
  name_bg?: string;
  variant: string; // e.g. "20cm - Черен гланц"
  selectedSize?: string;
  price: number;
  quantity: number;
  image: string;
  slug: string;
  isRemoving?: boolean;
  removeInitiatedAt?: number;
}

interface CartContextType {
  items: CartItem[];
  activeItems: CartItem[];
  itemsCount: number;
  subtotal: number;
  discountPercentage: number;
  total: number;
  addToCart: (item: CartItem) => void;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  remove: (id: string) => void;
  initiateRemove: (id: string) => void;
  cancelRemove: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isFreeShipping: boolean;
  amountToFreeShipping: number;
  appliedPromo: PromoCode | null;
  isPromoValid: boolean;
  promoError: string | null;
  promoDiscountAmount: number;
  applyPromo: (promo: PromoCode) => void;
  removePromo: (silent?: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cardecal_cart');
      if (saved) {
         const parsed = JSON.parse(saved);
         // Reset any isRemoving state that might have been saved
         return parsed.map((item: CartItem) => {
            let size = item.selectedSize || '';
            if (/various|различни|small/i.test(size)) size = '7 см';
            if (size.toLowerCase() === '7cm') size = '7 см';
            return { ...item, selectedSize: size, isRemoving: false };
         });
      }
      return [];
    } catch {
      return [];
    }
  });

  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(() => {
    try {
      const saved = localStorage.getItem('cardecal_promo');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const removeTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const isClearingRef = useRef(false);

  useEffect(() => {
    try {
      // Only save active items to localStorage
      const itemsToSave = items.filter(i => !i.isRemoving);
      localStorage.setItem('cardecal_cart', JSON.stringify(itemsToSave));
    } catch (error) {
      console.error('Failed to save cart to local storage:', error);
    }
  }, [items]);

  const activeItems = items.filter(item => !item.isRemoving);
  const itemsCount = activeItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = activeItems.reduce((total, item) => total + item.price * item.quantity, 0);

  // Discount Logic
  const DISCOUNT_TIERS = [
    { amount: 153.39, discount: 5 },
    { amount: 255.65, discount: 8 },
    { amount: 511.29, discount: 10 },
    { amount: 1022.58, discount: 15 },
  ];
  let discountPercentage = 0;
  for (let i = 0; i < DISCOUNT_TIERS.length; i++) {
    if (subtotal >= DISCOUNT_TIERS[i].amount) {
      discountPercentage = DISCOUNT_TIERS[i].discount;
    }
  }

  let finalDiscountValue = 0;
  let discountedTotal = subtotal;

  // Apply automatic percentage discount first
  if (discountPercentage > 0) {
    const autoDiscountValue = subtotal * (discountPercentage / 100);
    finalDiscountValue += autoDiscountValue;
    discountedTotal -= autoDiscountValue;
  }

  // Apply promo code on top if available and valid
  const now = new Date();
  const isPromoValid = !!appliedPromo && 
    (!appliedPromo.min_order_amount || subtotal >= appliedPromo.min_order_amount) &&
    (!appliedPromo.valid_from || new Date(appliedPromo.valid_from) <= now) &&
    (!appliedPromo.valid_until || new Date(appliedPromo.valid_until) > now);

  const promoError = (appliedPromo && appliedPromo.min_order_amount && subtotal < appliedPromo.min_order_amount) 
    ? `Добавете още ${(appliedPromo.min_order_amount - subtotal).toFixed(2)} € за да използвате този код` 
    : (appliedPromo && appliedPromo.valid_from && new Date(appliedPromo.valid_from) > now)
    ? `Кодът ще бъде активен след ${new Date(appliedPromo.valid_from).toLocaleString('bg-BG')}`
    : (appliedPromo && appliedPromo.valid_until && new Date(appliedPromo.valid_until) < now)
    ? `Кодът е изтекъл`
    : null;

  let promoDiscountAmount = 0;
  if (isPromoValid && appliedPromo) {
    const totalBeforePromo = discountedTotal;
    if (appliedPromo.discount_type === 'percentage') {
       const pbDis = discountedTotal * (appliedPromo.discount_value / 100);
       finalDiscountValue += pbDis;
       discountedTotal -= pbDis;
    } else {
       finalDiscountValue += appliedPromo.discount_value;
       discountedTotal -= appliedPromo.discount_value;
    }
    // Prevent negative total
    if (discountedTotal < 0) discountedTotal = 0;
    promoDiscountAmount = totalBeforePromo - discountedTotal;
  }

  const total = discountedTotal;
  
  const isFreeShipping = total >= FREE_SHIPPING_THRESHOLD_EUR;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD_EUR - total);

  const addToCart = (newItem: CartItem) => {
    setItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === newItem.id);
      if (existing) {
        // If it was being removed, cancel the removal
        if (existing.isRemoving) {
            cancelRemove(existing.id);
            return prevItems.map((item) =>
              item.id === newItem.id
                ? { ...item, quantity: item.quantity + newItem.quantity, isRemoving: false, removeInitiatedAt: undefined }
                : item
            );
        }
        return prevItems.map((item) =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...prevItems, newItem];
    });
  };

  const increase = (id: string) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrease = (id: string) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, Math.floor(quantity)) } : item
      )
    );
  };

  const remove = (id: string) => {
    if (removeTimeouts.current[id]) {
        clearTimeout(removeTimeouts.current[id]);
        delete removeTimeouts.current[id];
    }
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const initiateRemove = (id: string) => {
    setItems((prevItems) => 
        prevItems.map(item => item.id === id ? { ...item, isRemoving: true, removeInitiatedAt: Date.now() } : item)
    );
    
    // Set timeout to actually remove the item after 5 seconds
    const timeout = setTimeout(() => {
        remove(id);
    }, 5000);

    removeTimeouts.current[id] = timeout;
  };

  const cancelRemove = (id: string) => {
    if (removeTimeouts.current[id]) {
        clearTimeout(removeTimeouts.current[id]);
        delete removeTimeouts.current[id];
    }
    
    setItems((prevItems) => 
        prevItems.map(item => item.id === id ? { ...item, isRemoving: false, removeInitiatedAt: undefined } : item)
    );
  };

  const clearCart = () => {
    isClearingRef.current = true;
    Object.values(removeTimeouts.current).forEach(clearTimeout);
    removeTimeouts.current = {};
    setItems([]);
    setAppliedPromo(null);
    localStorage.removeItem('cardecal_promo');
    
    // Reset the flag after a short delay to allow background updates to finish
    setTimeout(() => {
      isClearingRef.current = false;
    }, 2000);
  };

  const applyPromo = React.useCallback((promo: PromoCode) => {
    setAppliedPromo(promo);
    localStorage.setItem('cardecal_promo', JSON.stringify(promo));
  }, []);

  const removePromo = React.useCallback((silent: boolean = false) => {
    const code = appliedPromo?.code;
    setAppliedPromo(null);
    localStorage.removeItem('cardecal_promo');
    
    if (!silent && code) {
      // Small delay to prevent issues with state updates
      setTimeout(() => {
        showToast(`купон : ${code} изтече`, 'error');
      }, 100);
    }
  }, [appliedPromo, showToast]);

  // Cleanup timeouts on unmount and listen for global clear cart event
  useEffect(() => {
    const handleClearCartEvent = () => {
       clearCart();
       localStorage.removeItem('cardecal_cart');
    };
    window.addEventListener('clear_local_cart', handleClearCartEvent);

    return () => {
        Object.values(removeTimeouts.current).forEach(clearTimeout);
        window.removeEventListener('clear_local_cart', handleClearCartEvent);
    };
  }, []);

  // Real-time promo validation & Immediate check on mount/change
  useEffect(() => {
    if (!appliedPromo?.id) return;

    // 1. Immediate validation check
    const verifyPromo = async () => {
      try {
        const { data, error } = await supabase
          .from('promo_codes')
          .select('is_active, valid_from, valid_until, max_uses, current_uses')
          .eq('id', appliedPromo.id)
          .single();

        if (error || !data) {
          removePromo(true); // Silent removal if it doesn't exist anymore
          return;
        }

        const now = new Date();
        const isNotYetActive = data.valid_from && new Date(data.valid_from) > now;
        const isExpired = data.valid_until && new Date(data.valid_until) < now;
        const isLimitReached = data.max_uses && data.current_uses >= data.max_uses;

        if (!data.is_active || isNotYetActive || isExpired || isLimitReached) {
          removePromo(false); 
        }
      } catch (err) {
        console.error('Promo verification failed:', err);
      }
    };

    verifyPromo();

    // 2. Periodic check (every 30 seconds) in case time passes
    const interval = setInterval(verifyPromo, 30000);

    // 2. Real-time monitor for status changes (Now works thanks to RLS policy update)
    const channel = supabase
      .channel(`promo-monitor-${appliedPromo.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'promo_codes', 
          filter: `id=eq.${appliedPromo.id}` 
        },
        (payload) => {
          if (isClearingRef.current) return;
          console.log('Promo real-time update:', payload);
          if (payload.eventType === 'DELETE') {
            removePromo();
            showToast(`купон : ${appliedPromo.code} изтече`, 'error');
          } else if (payload.eventType === 'UPDATE') {
            const up = payload.new as any;
            const now = new Date();
            const isNotYetActive = up.valid_from && new Date(up.valid_from) > now;
            const isExpired = up.valid_until && new Date(up.valid_until) < now;
            const isLimitReached = up.max_uses && up.current_uses >= up.max_uses;
            
            if (up.is_active === false || isNotYetActive || isExpired || isLimitReached) {
              removePromo(false); 
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [appliedPromo?.id, appliedPromo?.code, showToast, removePromo]);

  // No longer auto-removing promo code - user wants it to stick around even if invalid

  return (
    <CartContext.Provider value={{ items, activeItems, itemsCount, subtotal, discountPercentage, total, addToCart, increase, decrease, updateQuantity, remove, initiateRemove, cancelRemove, clearCart, isFreeShipping, amountToFreeShipping, appliedPromo, isPromoValid, promoError, promoDiscountAmount, applyPromo, removePromo }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
