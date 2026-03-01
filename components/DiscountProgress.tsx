import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Sparkles } from 'lucide-react';

const DISCOUNT_TIERS = [
  { amount: 153.39, discount: 5, bgn: 300 }, // 300 BGN
  { amount: 255.65, discount: 8, bgn: 500 }, // 500 BGN
  { amount: 511.29, discount: 10, bgn: 1000 }, // 1000 BGN
  { amount: 1022.58, discount: 15, bgn: 2000 }, // 2000 BGN
];

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
  
  return (
    <div className="w-full relative rounded-2xl mb-6 overflow-hidden shadow-[0_8px_30px_rgba(255,0,0,0.15)] group">
        {/* Card Background / Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1c0000] via-[#3d0000] to-[#0a0000] z-0" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay z-0" />
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-[#ff0000] rounded-full blur-[60px] opacity-20 z-0 transition-opacity duration-700 group-hover:opacity-40" />

        <div className="relative z-10 p-5 flex flex-col h-full justify-between gap-4">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 opacity-90">
                        <Sparkles className="w-4 h-4 text-[#ff0000] drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]" />
                        <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white">CarDecal VIP</span>
                    </div>
                    {currentDiscount > 0 && (
                        <div className="mt-1 text-2xl font-black text-white italic drop-shadow-md">
                            {currentDiscount}% <span className="text-[10px] uppercase tracking-widest text-[#B0BEC5] not-italic mr-1">ОТСТЪПКА</span>
                        </div>
                    )}
                </div>
                <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-300/[0.8] to-yellow-600/[0.8] flex items-center justify-center opacity-80 shadow-inner">
                    <div className="w-6 h-4 border border-black/20 rounded-sm grid grid-cols-3 gap-px opacity-70">
                       <div className="border-r border-b border-black/20" />
                       <div className="border-r border-b border-black/20" />
                       <div className="border-b border-black/20" />
                       <div className="border-r border-black/20" />
                       <div className="border-r border-black/20" />
                       <div />
                    </div>
                </div>
            </div>

            {/* Middle text (Status) */}
            <div className="flex flex-col mt-2">
                {nextTier ? (
                    <div className="text-[11px] md:text-xs text-[#B0BEC5] uppercase font-medium tracking-widest">
                        Още <span className="text-white font-black text-sm drop-shadow-sm">{(nextTier.amount - subtotal).toFixed(2)} €</span> за <span className="text-[#ff0000] font-black text-sm tracking-widest drop-shadow-sm mx-0.5">{nextTier.discount}%</span> ОТСТЪПКА
                    </div>
                ) : (
                    <div className="text-[11px] md:text-xs text-[#4caf50] uppercase font-black tracking-widest drop-shadow-sm">
                        ДОСТИГНАХТЕ МАКСИМАЛНАТА ОТСТЪПКА!
                    </div>
                )}
            </div>

            {/* Footer / Progress */}
            <div className="mt-2 w-full">
                {/* Steps indicator */}
                <div className="w-full relative h-[6px] bg-black/60 rounded-full border border-white/5 overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#cc0000] to-[#ff3333] shadow-[0_0_15px_rgba(255,0,0,0.8)]"
                    />
                </div>
                
                <div className="w-full relative h-4 mt-2">
                    {DISCOUNT_TIERS.map((tier, index) => {
                        const isReached = subtotal >= tier.amount;
                        const leftPos = (tier.amount / maxAmount) * 100;
                        return (
                            <div key={index} 
                                 className="absolute flex flex-col items-center -translate-x-1/2"
                                 style={{ left: `${Math.min(leftPos, 100)}%`, top: 0 }}
                            >
                                <div className={`w-0.5 h-1.5 -mt-3.5 mb-1 ${isReached ? 'bg-white' : 'bg-white/20'}`} />
                                <span className={`text-[9px] font-black mt-0.5 tracking-[0.15em] transition-colors ${isReached ? 'text-white' : 'text-white/30'}`}>
                                    {tier.discount}%
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
            
        </div>
    </div>
  );
};
