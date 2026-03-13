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
  condition_type?: 'none' | 'new_users' | 'loyal_customers';
  condition_value?: number;
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
  const isLoyal = coupon.condition_type === 'loyal_customers';

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
    : `${(coupon.discount_value * 0.51).toFixed(0)}€`;
    
  return (
    <div className={cn(
        "w-full max-w-[95%] sm:max-w-[340px] md:max-w-[600px] flex flex-col rounded-lg shadow-[0_15px_40px_rgba(0,0,0,0.15)] relative mx-auto transition-all duration-500",
        isLoyal 
            ? "bg-[#111] text-white border border-[#C5A059]/30 shadow-[0_20px_50px_rgba(197,160,89,0.1)]" 
            : "bg-white text-black"
    )}>
      {/* Top Section */}
      <div className="p-4 md:p-6 flex flex-row items-center justify-between pb-4">
         <div className="flex flex-col gap-1 items-start">
             {/* Logo String */}
             <div className={cn(
                 "font-playfair italic font-bold text-2xl md:text-4xl tracking-tight leading-none",
                 isLoyal ? "text-[#C5A059]" : "text-[#C3110C]"
             )}>
                 cardecal
             </div>
             <div className="flex flex-row gap-2 mt-2">
                 <motion.div 
                    initial={false}
                    animate={{ 
                        scale: isActive ? [1, 1.1, 1] : 1,
                        backgroundColor: isActive 
                            ? (isLoyal ? 'rgba(197, 160, 89, 0.2)' : 'rgba(16, 185, 129, 0.1)') 
                            : (isLoyal ? 'rgba(255, 255, 255, 0.05)' : 'rgba(249, 250, 251, 1)')
                    }}
                    className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded text-[10px] md:text-[11px] font-bold border uppercase tracking-wider transition-colors",
                        isActive 
                            ? (isLoyal ? "text-[#C5A059] border-[#C5A059]/40" : "text-[#10b981] border-[#10b981]/20") 
                            : (isLoyal ? "text-zinc-500 border-white/5" : "text-gray-400 border-gray-100")
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
                                <Activity className={cn("w-3 h-3 animate-pulse", isLoyal ? "text-[#C5A059]" : "text-[#10b981]")} />
                            ) : (
                                <div className={cn("w-1.5 h-1.5 rounded-full", isLoyal ? "bg-zinc-700" : "bg-gray-300")} />
                            )}
                            {copied ? "Активиран" : (isApplied ? "Активен" : "Неактивен")}
                        </motion.div>
                    </AnimatePresence>
                 </motion.div>
                 {isLoyal && (
                     <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] md:text-[11px] font-black border border-[#C5A059]/20 bg-[#C5A059]/10 text-[#C5A059] uppercase tracking-widest">
                         <Star size={10} className="fill-[#C5A059]" />
                         Royal Loyalty
                     </div>
                 )}
             </div>
         </div>
         <div className={cn(
             "flex items-baseline gap-1",
             isLoyal ? "text-[#C5A059]" : "text-[#E6501B]"
         )}>
             <span className="text-4xl md:text-6xl font-black tracking-tighter leading-none">{discountDisplay}</span>
             <span className="text-lg md:text-2xl font-bold uppercase">Off</span>
         </div>
      </div>

      {/* Perforated Divider */}
      <div className="relative h-6 flex items-center w-full">
         <div className={cn("absolute left-[-10px] w-5 h-5 rounded-full z-10", bgClass)} />
         <div className={cn(
             "flex-1 w-full border-t-[2px] border-dashed mx-3",
             isLoyal ? "border-white/10" : "border-gray-200"
         )} />
         <div className={cn("absolute right-[-10px] w-5 h-5 rounded-full z-10", bgClass)} />
      </div>

      {/* Bottom Section */}
      <div className="p-4 md:p-6 pt-2">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 md:mb-2 md:gap-4 gap-1">
             <div className="flex items-center gap-1">
                 <div className={cn(
                     "w-4 h-4 rounded-full border flex items-center justify-center",
                     isLoyal ? "border-[#C5A059] bg-[#C5A059]/5" : "border-[#10b981] bg-[#10b981]/5"
                 )}>
                    <Check className={cn("w-3 h-3", isLoyal ? "text-[#C5A059]" : "text-[#10b981]")} />
                 </div>
                 <span className={cn(
                     "text-[10px] md:text-xs font-bold uppercase tracking-wide",
                     isLoyal ? "text-[#C5A059]" : "text-[#10b981]"
                 )}>
                     {isLoyal ? "Елитен Лоялен Клиент" : "Сертифициран купон"}
                 </span>
             </div>
             <span className="text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-widest self-end md:self-auto">КОД №{coupon.id.slice(0, 5)}</span>
          </div>

          <div className="flex flex-col md:flex-row gap-2 mt-4 items-stretch h-auto md:h-14">
             <div className={cn(
                 "flex-1 relative border rounded flex items-center px-4 overflow-hidden h-14 md:h-full justify-center group transition-colors",
                 isLoyal ? "bg-white/5 border-white/10" : "bg-[#F0F2F5] border-gray-200"
             )}>
                 <span className={cn(
                     "font-mono text-xl md:text-2xl font-black tracking-[0.2em]",
                     isLoyal ? "text-[#C5A059]" : "text-gray-700"
                 )}>{coupon.code}</span>
                 {isLoyal && (
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C5A059]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                 )}
             </div>
             <button 
                onClick={handleCopy}
                className={cn(
                  "w-full md:w-auto px-6 font-bold uppercase tracking-widest text-sm text-white rounded transition-all h-14 md:h-full flex items-center justify-center shrink-0", 
                  isLoyal 
                    ? (copied ? "bg-[#C5A059] text-black" : "bg-gradient-to-br from-[#C5A059] to-[#8C6B2D] hover:brightness-110 shadow-[0_4px_20px_rgba(197,160,89,0.3)]")
                    : (copied ? "bg-[#740A03] hover:bg-[#280905] shadow-[0_4px_10px_rgba(116,10,3,0.3)]" : "bg-[#C3110C] hover:bg-[#740A03] shadow-[0_4px_10px_rgba(239,68,68,0.3)]")
                )}
             >
                 {copied ? (isLoyal ? "КОПИРАН!" : "КОПИРАНО!") : "ВЗЕМИ КУПОН"}
             </button>
          </div>

          <div className="flex flex-row items-center justify-between mt-4 md:mt-5">
             {coupon.min_order_amount && (
               <div className="flex items-center gap-1.5 md:gap-2">
                  <Info className="w-3 h-3 text-zinc-500" />
                  <span className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-medium">
                      Мин. поръчка: {Math.round(coupon.min_order_amount * 0.51)}eur/{coupon.min_order_amount}bgn.
                  </span>
               </div>
             )}
             <span className="text-[10px] md:text-[11px] text-zinc-500 font-bold uppercase">
                 {coupon.valid_until ? `до : ${new Date(coupon.valid_until).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Без срок'}
             </span>
          </div>
      </div>
    </div>
  );
};
