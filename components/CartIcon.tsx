import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';

export const CartIcon: React.FC = () => {
  const { itemsCount } = useCart();
  const { setIsCartOpen } = useUI();

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors focus:outline-none"
      aria-label="Количка"
    >
      <ShoppingCart className="w-5 h-5 text-white" />
      {itemsCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff0000] text-[10px] text-white flex items-center justify-center font-bold">
          {itemsCount > 99 ? '99+' : itemsCount}
        </span>
      )}
    </button>
  );
};
