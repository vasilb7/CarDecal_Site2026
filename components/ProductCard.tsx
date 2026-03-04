import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "../types";
import { getOptimizedUrl } from "../lib/cloudinary-utils";

interface ProductCardProps {
  product: Product;
  isPriority?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isPriority = false }) => {
  const { i18n } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculate EUR price
  let displayPrice = "";
  if (product.price_eur !== undefined && product.price_eur !== null) {
    displayPrice = `€${Number(product.price_eur).toFixed(2)}`;
  } else if (
    product.wholesalePriceEur !== undefined &&
    product.wholesalePriceEur !== null
  ) {
    displayPrice = `€${Number(product.wholesalePriceEur).toFixed(2)}`;
  } else if (product.price) {
    displayPrice = product.price;
  } else if (product.wholesalePrice) {
    const bgnMatch = product.wholesalePrice.match(/[\d.]+/);
    if (bgnMatch) {
      const bgnVal = parseFloat(bgnMatch[0]);
      const eurVal = (bgnVal / 1.95583).toFixed(2);
      displayPrice = `€${eurVal}`;
    }
  }

  const name =
    i18n.language.startsWith("bg") && product.nameBg
      ? product.nameBg
      : product.name;

  // Prioritize full dimensions (like in admin), then "cm" or "x" format size, then product.size
  const shortDesc = product.dimensions || 
                    product.categories.find(cat => cat.toLowerCase().includes('cm') || /^\d+x\d+$/.test(cat.toLowerCase())) || 
                    (product.size ? `${product.size} size` : "Premium Sticker");

  const CardContent = (
    <motion.div
      whileHover={{ 
        y: -12,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(212, 175, 55, 0.15)",
        borderColor: "rgba(212, 175, 55, 0.2)"
      }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="bg-[#141414] rounded-[32px] md:rounded-[48px] p-6 md:p-10 flex flex-col justify-between relative shadow-2xl border border-white/[0.03] transition-colors h-full"
    >
      {/* Product Image Area */}
      <div className="relative w-full h-[180px] sm:h-[220px] md:h-[280px] flex-shrink-0 flex items-center justify-center mb-6 md:mb-8 p-4">
        <div className="relative w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-700 ease-out">
          {/* Subtle Soft Glow behind the item - Golden hint */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)] blur-3xl pointer-events-none" />

          {/* Skeleton Loader */}
          <AnimatePresence>
            {!imageLoaded && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 m-auto w-10 h-10 border-2 border-white/5 border-t-red-600 rounded-full animate-spin"
              />
            )}
          </AnimatePresence>

          <img
            src={getOptimizedUrl(product.avatar, { width: 801, crop: 'fit' })}
            alt={name}
            onLoad={() => setImageLoaded(true)}
            className={`max-w-full max-h-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)] pointer-events-none select-none transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            draggable={false}
            loading={isPriority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={isPriority ? "high" : "auto"}
          />
        </div>

        {/* Variations Mini-Preview */}
        {product.cardImages && product.cardImages.length > 0 && (
          <div className="absolute -bottom-4 left-0 right-0 flex gap-2 overflow-x-auto no-scrollbar py-2 px-4 z-10 group-hover:translate-y-[-6px] transition-transform duration-500">
            {product.cardImages.slice(0, 6).map((img, i) => (
              <motion.div
                key={i}
                whileHover={{
                  scale: 1.2,
                  y: -6,
                  borderColor: "rgba(212, 175, 55, 0.4)",
                  backgroundColor: "rgba(212, 175, 55, 0.1)"
                }}
                className="h-9 min-w-[36px] max-w-[72px] px-2 rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-2xl shrink-0 shadow-[0_8px_16px_rgba(0,0,0,0.4)] flex items-center justify-center transition-all cursor-pointer"
              >
                <img
                  src={getOptimizedUrl(img, { width: 120, crop: 'limit' })}
                  className="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] pointer-events-none select-none"
                  alt={`Variation ${i}`}
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Content */}
      <div className="w-full flex items-end justify-between mt-auto pt-6 border-t border-white/5">
        <div className="space-y-1 md:space-y-1.5 overflow-hidden">
          <h3 className="text-sm md:text-lg font-black text-white leading-tight truncate uppercase tracking-tight">
            {name}
          </h3>
          <p className="text-[10px] md:text-xs text-[#888] font-bold uppercase tracking-[0.2em] truncate">
            {shortDesc}
          </p>
        </div>
        <div className="text-sm md:text-lg font-black text-[#D4AF37] mb-1 ml-4 min-w-max drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
          {displayPrice}
        </div>
      </div>
    </motion.div>

  );

  const location = useLocation();

  return (
    <div 
        className="group relative h-full"
        onMouseEnter={() => {
            // Prefetch the modal chunk on hover
            import('./ProductQuickViewModal');
        }}
    >
        <Link 
            to={`/catalog/${product.slug}`} 
            state={{ backgroundLocation: location }} 
            className="block h-full cursor-pointer"
        >
          {CardContent}
        </Link>
    </div>
  );
};

export default ProductCard;
