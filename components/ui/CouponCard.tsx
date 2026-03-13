import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Share2, Info, Star, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { logPromoCodeUsage } from '../../lib/promo-utils';

import { useToast } from '../Toast/ToastProvider';

export interface CouponData {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  description?: string;
  valid_until?: string;
  is_active: boolean;
  min_order_amount?: number;
}

interface CouponCardProps {
  coupon: CouponData;
  index: number;
  bgClass?: string; // used to match the background for the punch holes
}

export const CouponCard: React.FC<CouponCardProps> = ({ coupon, index, bgClass = "bg-[#280905]" }) => {
  const { appliedPromo, applyPromo, subtotal } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [copied, setCopied] = useState(() => {
    try {
      const savedCopied = localStorage.getItem('cardecal_copied_coupons');
      if (savedCopied) {
        const parsed = JSON.parse(savedCopied);
        return parsed.includes(coupon.code);
      }
      return false;
    } catch {
      return false;
    }
  });

  const isApplied = appliedPromo?.code === coupon.code;
  const isActive = isApplied || copied;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    
    // Save to localStorage so it persists on refresh
    try {
      const savedCopied = localStorage.getItem('cardecal_copied_coupons');
      let codes = savedCopied ? JSON.parse(savedCopied) : [];
      if (!codes.includes(coupon.code)) {
        codes.push(coupon.code);
        localStorage.setItem('cardecal_copied_coupons', JSON.stringify(codes));
      }
    } catch (err) {
      console.error('Failed to save copied coupon:', err);
    }
    
    if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
      showToast(`Купон ${coupon.code} ще бъде активиран след като достигнете мин. ${coupon.min_order_amount} BGN (${(coupon.min_order_amount / 1.95583).toFixed(2)} EUR)`, 'warning');
    } else {
      showToast(`Активиран купон: ${coupon.code}`, 'success');
    }

    // Also apply it to the cart immediately
    applyPromo({
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount
    });
  };

  const discountDisplay = coupon.discount_type === 'percentage' 
    ? `${coupon.discount_value}%` 
    : `${coupon.discount_value} лв.`;

  return (
    <div className="w-full max-w-[95%] sm:max-w-[340px] md:max-w-[600px] flex flex-col bg-white rounded-lg shadow-[0_15px_40px_rgba(0,0,0,0.15)] text-black relative mx-auto transition-transform">
      {/* Top Section */}
      <div className="p-4 md:p-6 flex flex-row items-center justify-between pb-4">
         <div className="flex flex-col gap-1 items-start">
             {/* Logo String */}
             <div className="font-playfair italic font-bold text-2xl md:text-4xl text-[#C3110C] tracking-tight leading-none">
                 cardecal
             </div>
             <div className="flex flex-row gap-2 mt-2">
                 <motion.div 
                    initial={false}
                    animate={{ 
                        scale: isActive ? [1, 1.1, 1] : 1,
                        backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 250, 251, 1)'
                    }}
                    className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded text-[10px] md:text-[11px] font-bold border uppercase tracking-wider transition-colors",
                        isActive ? "text-[#10b981] border-[#10b981]/20" : "text-gray-400 border-gray-100"
                    )}
                 >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={copied ? 'activated' : (isApplied ? 'active' : 'inactive')}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-1"
                        >
                            {isActive ? (
                                <Activity className="w-3 h-3 animate-pulse" />
                            ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                            )}
                            {copied ? "Активиран" : (isApplied ? "Активен" : "Неактивен")}
                        </motion.div>
                    </AnimatePresence>
                 </motion.div>
             </div>
         </div>
         <div className="flex items-baseline gap-1 text-[#E6501B]">
             <span className="text-4xl md:text-6xl font-black tracking-tighter leading-none">{discountDisplay}</span>
             <span className="text-lg md:text-2xl font-bold uppercase">Off</span>
         </div>
      </div>

      {/* Perforated Divider */}
      <div className="relative h-6 flex items-center w-full">
         {/* Left Notch */}
         <div className={cn("absolute left-[-10px] w-5 h-5 rounded-full z-10", bgClass)} />
         {/* Dotted Line */}
         <div className="flex-1 w-full border-t-[2px] border-dashed border-gray-200 mx-3" />
         {/* Right Notch */}
         <div className={cn("absolute right-[-10px] w-5 h-5 rounded-full z-10", bgClass)} />
      </div>

      {/* Bottom Section */}
      <div className="p-4 md:p-6 pt-2">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 md:mb-2 md:gap-4 gap-1">
             <div className="flex items-center gap-1">
                 <div className="w-4 h-4 rounded-full border border-[#10b981] flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#10b981]" />
                 </div>
                 <span className="text-[10px] md:text-xs font-bold text-[#10b981] uppercase tracking-wide">Сертифициран купон</span>
             </div>
             <span className="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-widest self-end md:self-auto">КОД №{coupon.id.slice(0, 5)}</span>
          </div>

          <div className="flex flex-col md:flex-row gap-2 mt-4 items-stretch h-auto md:h-14">
             <div className="flex-1 relative bg-[#F0F2F5] border border-gray-200 rounded flex items-center px-4 overflow-hidden h-14 md:h-full justify-center group">
                 <span className="font-mono text-xl md:text-2xl font-black text-gray-700 tracking-[0.2em]">{coupon.code}</span>
             </div>
             <button 
                onClick={handleCopy}
                className={cn(
                  "w-full md:w-auto px-6 font-bold uppercase tracking-widest text-sm text-white rounded transition-colors h-14 md:h-full flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(239,68,68,0.3)]", 
                  copied ? "bg-[#740A03] hover:bg-[#280905] shadow-[0_4px_10px_rgba(116,10,3,0.3)]" : "bg-[#C3110C] hover:bg-[#740A03]"
                )}
             >
                 {copied ? "КОПИРАНО!" : "ВЗЕМИ КУПОН"}
             </button>
          </div>

          <div className="flex flex-row items-center justify-between mt-4 md:mt-5">
             <div className="flex items-center gap-1.5 md:gap-2">
                <Info className="w-3 h-3 text-gray-400" />
                <span className="text-[9px] md:text-[10px] text-gray-400 uppercase font-medium">
                    {coupon.min_order_amount ? `Мин. поръчка: ${Math.round(coupon.min_order_amount * 0.51)}eur/${coupon.min_order_amount}bgn.` : '122 от 130 купона използвани'}
                </span>
             </div>
             <span className="text-[10px] md:text-[11px] text-gray-500 font-bold uppercase">
                 {coupon.valid_until ? `EXP ${new Date(coupon.valid_until).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Без срок'}
             </span>
          </div>
      </div>
    </div>
  );
};
