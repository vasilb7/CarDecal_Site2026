import React from 'react';
import { motion } from 'framer-motion';

const DISCOUNT_TIERS = [
  { amount: 153.39, discount: 5 },
  { amount: 255.65, discount: 8 },
  { amount: 511.29, discount: 10 },
  { amount: 1022.58, discount: 15 },
];

const getTierColor = (discount: number) => {
  if (discount >= 15) return '#ffeb3b'; // Yellow (Maximum)
  if (discount >= 10) return '#ffc107'; // Amber (Tier 3)
  if (discount >= 8) return '#8bc34a';  // Lime (Tier 2)
  if (discount >= 5) return '#4caf50';  // Green (Tier 1)
  return '#ffffff'; // Default / Initial
};

export const DiscountProgress: React.FC<{ subtotal: number }> = ({ subtotal }) => {
  let currentTierIndex = -1;
  for (let i = 0; i < DISCOUNT_TIERS.length; i++) {
    if (subtotal >= DISCOUNT_TIERS[i].amount) {
      currentTierIndex = i;
    }
  }

  const currentDiscount = currentTierIndex >= 0 ? DISCOUNT_TIERS[currentTierIndex].discount : 0;
  const nextTier = currentTierIndex < DISCOUNT_TIERS.length - 1 ? DISCOUNT_TIERS[currentTierIndex + 1] : null;
  const maxAmount = DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1].amount;
  const progressPercentage = Math.min((subtotal / maxAmount) * 100, 100);
  
  const barColor = getTierColor(currentDiscount);

  return (
    <div className="w-full mb-6 py-2 border-b border-white/5">
      <div className="flex justify-between items-center mb-3 px-1">
        <div className="flex flex-col">
          {nextTier ? (
            <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none">
              Още <span className="text-white">{(nextTier.amount - subtotal).toFixed(2)} €</span> за <span className="text-red-500">{nextTier.discount}%</span>
            </div>
          ) : (
             <div className="text-[10px] text-green-400 uppercase font-black tracking-widest leading-none">
               МАКСИМАЛНА ОТСТЪПКА ПОСТИГНАТА!
             </div>
          )}
        </div>
        
        <div className="text-right flex flex-col items-end">
          <div className="text-base font-black text-white italic leading-none tracking-tighter">
            {currentDiscount}%
          </div>
          <div className="text-[8px] uppercase font-bold text-zinc-600 tracking-[0.2em] mt-0.5">ОТСТЪПКА</div>
        </div>
      </div>

      <div className="relative h-1 w-full bg-white/5 rounded-full border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute top-0 left-0 h-full"
          style={{ backgroundColor: barColor, boxShadow: `0 0 10px ${barColor}30` }}
        />
        
        {/* Tier Markers */}
        {DISCOUNT_TIERS.map((tier, idx) => {
          const pos = (tier.amount / maxAmount) * 100;
          if (pos >= 100) return null;
          return (
            <div 
              key={idx}
              className="absolute top-0 w-px h-full bg-black/40 z-10"
              style={{ left: `${pos}%` }}
            />
          );
        })}
      </div>

      <div className="relative w-full h-4 mt-1.5 overflow-visible">
        {DISCOUNT_TIERS.map((tier, idx) => {
          const isReached = subtotal >= tier.amount;
          const pos = (tier.amount / maxAmount) * 100;
          return (
            <div 
              key={idx} 
              className="absolute -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${Math.min(pos, 98)}%` }}
            >
               <span className={`text-[8px] font-black tracking-widest transition-colors duration-500 whitespace-nowrap ${isReached ? 'text-white' : 'text-zinc-800'}`}>
                 {tier.discount}%
               </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
