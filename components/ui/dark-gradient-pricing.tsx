import { motion, AnimatePresence } from "framer-motion"
import { Check, X, Crown, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"

interface BenefitProps {
  text: string
  checked: boolean
  accentColor: string
}

const Benefit = ({ text, checked, accentColor }: BenefitProps) => {
  return (
    <div className="flex items-center gap-3">
      {checked ? (
        <span 
          className="grid size-4 place-content-center rounded-full text-black shrink-0"
          style={{ background: accentColor }}
        >
          <Check className="size-2.5" strokeWidth={4} />
        </span>
      ) : (
        <span className="grid size-4 place-content-center rounded-full bg-white/5 text-white/20 shrink-0">
          <X className="size-2.5" />
        </span>
      )}
      <span className={cn(
        "text-[11px] font-medium tracking-wide uppercase transition-colors duration-300",
        checked ? "text-white/90" : "text-white/20"
      )}>{text}</span>
    </div>
  )
}

interface PricingCardProps {
  tier: string
  price: string
  originalPrice?: string
  bestFor: string
  CTA: string
  benefits: Array<{ text: string; checked: boolean }>
  className?: string
  gradient: string
  accentColor: string
  ribbonColor: string
  featured?: boolean;
  isCurrent?: boolean;
  discountLabel?: string;
  unitLabel?: string;
  billingLabel?: string;
  onClick?: () => void;
}

export const PricingCard = ({
  tier,
  price,
  originalPrice,
  bestFor,
  CTA,
  benefits,
  className,
  gradient,
  accentColor,
  ribbonColor,
  featured = false,
  isCurrent = false,
  discountLabel,
  unitLabel,
  billingLabel,
  onClick,
}: PricingCardProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true }}
      className={cn("relative h-full", featured && "md:-mt-2 md:mb-[-8px]")}
    >
      {/* Ribbon / Badge */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
        <div 
          className={cn(
            "px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.25em] shadow-2xl",
            "border border-white/10",
            !featured && !discountLabel && "hidden"
          )}
          style={{ 
            background: ribbonColor === '#333' ? 'rgba(255,255,255,0.05)' : ribbonColor,
            color: ribbonColor === '#333' ? '#fff' : '#000',
            backdropFilter: 'blur(8px)'
          }}
        >
          {featured && !discountLabel ? "Best Value" : discountLabel}
        </div>
      </div>

      {/* Main card */}
      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-3xl flex flex-col",
          "border border-white/[0.05]",
          "transition-all duration-500",
          isCurrent && "opacity-60",
          className,
        )}
        style={{ 
          background: isCurrent ? '#0a0a0b' : gradient,
          ...(featured && !isCurrent ? { 
            borderColor: accentColor + '44',
            boxShadow: `0 0 50px ${accentColor}08, 0 20px 40px rgba(0,0,0,0.4)` 
          } : {})
        }}
      >
        {/* Decorative elements removed */}

        {/* Content */}
        <div className="relative z-10 p-7 pt-8">
          <div className="mb-6 h-8">
            <AnimatePresence mode="wait">
              <motion.span 
                key={tier}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="text-white font-bold text-xl tracking-[0.1em] uppercase block"
              >
                {tier}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Price block */}
          <div className="mb-4 min-h-[90px] flex flex-col justify-end">
            <div className="flex items-baseline gap-2">
              <AnimatePresence mode="wait">
                <motion.span
                  key={price}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                  className="text-5xl font-black text-white"
                >
                  {price}
                </motion.span>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {originalPrice && originalPrice.length > 0 && (
                  <motion.span
                    key={originalPrice}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="text-xl text-white/50 line-through font-light"
                  >
                    {originalPrice}
                  </motion.span>
                )}
              </AnimatePresence>

              {unitLabel && (
                <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] ml-1 self-end mb-1 max-w-[120px] leading-tight">
                  {unitLabel}
                </span>
              )}
            </div>

            <div className="h-4 mt-2 overflow-hidden">
              <AnimatePresence mode="wait">
                {billingLabel ? (
                  <motion.div
                    key={billingLabel}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="text-[9px] text-teal-400 font-medium uppercase tracking-[0.2em] opacity-80"
                  >
                    {billingLabel}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="min-h-[3rem]">
            <AnimatePresence mode="wait">
              <motion.p 
                key={bestFor}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-white/60 text-[10px] uppercase tracking-[0.2em] font-bold mb-8 leading-relaxed"
              >
                {bestFor}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Divider */}
        <div className="px-7">
          <div className="border-t border-white/[0.05]" />
        </div>

        {/* Benefits */}
        <div className="relative z-10 px-7 py-6 space-y-3.5 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {benefits.map((benefit) => (
              <motion.div
                key={benefit.text}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Benefit {...benefit} accentColor={accentColor} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* CTA Button */}
        <div className="relative z-10 p-7 pt-0">
          <motion.button
            key={isCurrent ? "active" : CTA}
            onClick={isCurrent ? undefined : onClick}
            whileHover={isCurrent ? {} : { scale: 1.02 }}
            whileTap={isCurrent ? {} : { scale: 0.98 }}
            disabled={isCurrent}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.25em] transition-all duration-500",
              "flex items-center justify-center gap-2",
              isCurrent 
                ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                : featured
                  ? "shadow-2xl"
                  : "bg-white/[0.03] text-white/90 hover:bg-white/10 border border-white/10 hover:border-white/20"
            )}
            style={
              !isCurrent && featured 
                ? { backgroundColor: accentColor, color: '#000' } 
                : undefined
            }
          >
            {isCurrent ? "Active Plan" : CTA}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
