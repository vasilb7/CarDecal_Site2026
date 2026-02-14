import { motion } from "framer-motion"
import { Check, X, TreePine, Gift, Snowflake, Star } from "lucide-react"
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
          className="grid size-5 place-content-center rounded-full text-white shrink-0"
          style={{ background: accentColor }}
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : (
        <span className="grid size-5 place-content-center rounded-full bg-white/10 text-white/30 shrink-0">
          <X className="size-3" />
        </span>
      )}
      <span className={cn(
        "text-sm font-medium",
        checked ? "text-white" : "text-white/40"
      )}>{text}</span>
    </div>
  )
}

interface ChristmasPricingCardProps {
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
  icon: React.ReactNode
  featured?: boolean;
  isCurrent?: boolean;
  discountLabel?: string;
  onClick?: () => void;
}

export const ChristmasPricingCard = ({
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
  icon,
  featured = false,
  isCurrent = false,
  discountLabel,
  onClick,
}: ChristmasPricingCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true }}
      className={cn("relative", featured && "md:-mt-4 md:mb-[-16px]")}
    >
      {/* Christmas ribbon / bow */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
        <div 
          className="px-5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg flex items-center gap-1.5"
          style={{ background: ribbonColor }}
        >
          <Gift className="w-3 h-3" />
          {featured ? 'BEST VALUE' : 'XMAS DEAL'}
        </div>
      </div>

      {/* Main card */}
      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-2xl flex flex-col",
          "border border-white/10",
          "shadow-2xl",
          featured && !isCurrent && "ring-2 ring-emerald-400/50",
          isCurrent && "grayscale opacity-80",
          className,
        )}
        style={{ background: isCurrent ? '#1e1e20' : gradient }}
      >
        {/* Decorative snowflakes overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 right-4 opacity-10">
            <Snowflake className="w-16 h-16 text-white" />
          </div>
          <div className="absolute bottom-20 left-3 opacity-[0.06]">
            <TreePine className="w-10 h-10 text-white" />
          </div>
          <div className="absolute top-1/2 right-8 opacity-[0.04]">
            <Star className="w-8 h-8 fill-white text-white" />
          </div>
        </div>

        {/* Vertical ribbon stripe */}
        <div 
          className="absolute top-0 right-10 w-8 h-full opacity-[0.08]"
          style={{ background: 'linear-gradient(180deg, white 0%, transparent 100%)' }}
        />

        {/* Content */}
        <div className="relative z-10 p-7 pt-8">
          {/* Tier header */}
          <div className="flex items-center gap-2 mb-5">
            <span 
              className="p-2 rounded-xl bg-white/10 backdrop-blur-sm"
            >
              {icon}
            </span>
            <span className="text-white font-bold text-lg tracking-wide">
              {tier}
            </span>
          </div>

          {/* Price block */}
          <div className="mb-4">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-white drop-shadow-lg">
                {price}
              </span>
              {originalPrice && originalPrice.length > 0 && (
                <span className="text-xl text-white/40 line-through font-light">
                  {originalPrice}
                </span>
              )}
            </div>
            {originalPrice && originalPrice.length > 0 && (
              <div className="mt-2">
                <span 
                  className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ background: accentColor }}
                >
                  🎄 {discountLabel || 'SALE'}
                </span>
              </div>
            )}
          </div>

          {/* Best for */}
          <p className="text-white/60 text-sm font-medium mb-6 min-h-[2.5rem]">
            {bestFor}
          </p>
        </div>

        {/* Divider with star */}
        <div className="relative px-7">
          <div className="border-t border-white/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm rounded-full p-1">
            <Star className="w-3 h-3 text-yellow-400/80 fill-yellow-400/80" />
          </div>
        </div>

        {/* Benefits */}
        <div className="relative z-10 px-7 py-6 space-y-3.5 flex-1">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.3 }}
              viewport={{ once: true }}
            >
              <Benefit {...benefit} accentColor={accentColor} />
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="relative z-10 p-7 pt-0">
          <motion.button
            onClick={isCurrent ? undefined : onClick}
            whileHover={isCurrent ? {} : { scale: 1.03 }}
            whileTap={isCurrent ? {} : { scale: 0.97 }}
            disabled={isCurrent}
            className={cn(
              "w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-[0.15em] transition-all duration-300",
              "flex items-center justify-center gap-2",
              isCurrent 
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border-zinc-700"
                : featured
                  ? "bg-white text-emerald-700 hover:bg-yellow-400 hover:text-emerald-900 shadow-lg shadow-white/20"
                  : "bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm border border-white/10"
            )}
          >
            {isCurrent ? <Check className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
            {CTA}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
