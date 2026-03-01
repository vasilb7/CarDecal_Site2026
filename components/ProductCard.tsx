import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "../types";
import { getOptimizedUrl } from "../lib/cloudinary-utils";

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  isPriority?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView, isPriority = false }) => {
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
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-[#1A1A1A] rounded-[32px] md:rounded-[40px] p-6 md:p-8 flex flex-col items-center justify-between relative aspect-square overflow-hidden shadow-2xl border border-transparent hover:border-[#333] transition-colors h-full"
    >
      {/* Product Image Area */}
      <div className="relative w-full flex-1 flex items-center justify-center min-h-0 mb-4 md:mb-6">
        <div className="relative w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
          {/* Subtle Soft Glow behind the item */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] blur-2xl pointer-events-none" />

          {/* Skeleton Loader */}
          <AnimatePresence>
            {!imageLoaded && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 m-auto w-24 h-24 border-t-2 border-red-600 rounded-full animate-spin flex items-center justify-center after:content-[''] after:absolute after:inset-2 after:border-r-2 after:border-white/30 after:rounded-full"
              />
            )}
          </AnimatePresence>

          <img
            src={getOptimizedUrl(product.avatar, { width: 500, crop: 'fit' })}
            alt={name}
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] pointer-events-none select-none transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            draggable={false}
            loading={isPriority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={isPriority ? "high" : "auto"}
          />
        </div>

        {/* Variations Mini-Preview */}
        {product.cardImages && product.cardImages.length > 0 && (
          <div className="absolute -bottom-3 left-0 right-0 flex gap-2 overflow-x-auto no-scrollbar py-2 px-1 z-10 group-hover:translate-y-[-4px] transition-transform duration-500">
            {product.cardImages.slice(0, 6).map((img, i) => (
              <motion.div
                key={i}
                whileHover={{
                  scale: 1.15,
                  y: -4,
                  borderColor: "rgba(255,255,255,0.4)",
                }}
                className="h-8 min-w-[32px] max-w-[64px] px-1.5 rounded-lg overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.3)] flex items-center justify-center transition-all cursor-pointer"
              >
                <img
                  src={getOptimizedUrl(img, { width: 100 })}
                  className="max-h-full max-w-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] pointer-events-none select-none"
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
      <div className="w-full flex items-end justify-between mt-auto pt-4 border-t border-white/5">
        <div className="space-y-0.5 md:space-y-1 overflow-hidden">
          <h3 className="text-xs md:text-base font-bold text-white leading-tight truncate">
            {name}
          </h3>
          <p className="text-[10px] md:text-xs text-[#737373] font-medium uppercase tracking-wider truncate">
            {shortDesc}
          </p>
        </div>
        <div className="text-xs md:text-base font-bold text-white/80 mb-0.5 ml-2 min-w-max">
          {displayPrice}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="group relative h-full">
      {onQuickView ? (
        <div
          onClick={() => onQuickView(product)}
          className="block h-full cursor-pointer"
        >
          {CardContent}
        </div>
      ) : (
        <Link to={`/catalog/${product.slug}`} className="block h-full">
          {CardContent}
        </Link>
      )}
    </div>
  );
};

export default ProductCard;
