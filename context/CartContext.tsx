import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export const EXCHANGE_RATE = 1.95583;
export const FREE_SHIPPING_THRESHOLD_BGN = 150;
export const FREE_SHIPPING_THRESHOLD_EUR = FREE_SHIPPING_THRESHOLD_BGN / EXCHANGE_RATE;

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
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
  applyPromo: (promo: PromoCode) => void;
  removePromo: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  // Apply promo code on top if available
  if (appliedPromo) {
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
    Object.values(removeTimeouts.current).forEach(clearTimeout);
    removeTimeouts.current = {};
    setItems([]);
    setAppliedPromo(null);
    localStorage.removeItem('cardecal_promo');
  };

  const applyPromo = (promo: PromoCode) => {
    setAppliedPromo(promo);
    localStorage.setItem('cardecal_promo', JSON.stringify(promo));
  };

  const removePromo = () => {
    setAppliedPromo(null);
    localStorage.removeItem('cardecal_promo');
  };

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

  return (
    <CartContext.Provider value={{ items, activeItems, itemsCount, subtotal, discountPercentage, total, addToCart, increase, decrease, updateQuantity, remove, initiateRemove, cancelRemove, clearCart, isFreeShipping, amountToFreeShipping, appliedPromo, applyPromo, removePromo }}>
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
