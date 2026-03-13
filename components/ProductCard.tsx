import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "../types";
import { getOptimizedUrl } from "../lib/cloudinary-utils";
import OptimizedImage from "./ui/OptimizedImage";

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
      className="bg-[#141414] rounded-[28px] md:rounded-[40px] p-4 md:p-8 flex flex-col justify-between relative shadow-2xl border border-white/[0.03] transition-all duration-500 ease-out h-full overflow-hidden lg:hover:-translate-y-3 lg:hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_20px_rgba(212,175,55,0.15)] lg:hover:border-[#d4af37]/20"
    >
      {/* Product Image Area */}
      <div className="relative w-full aspect-video md:aspect-[4/3] flex-shrink-0 mb-4 md:mb-6">
        <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-700 ease-out">
          {/* Subtle Soft Glow behind the item - Golden hint */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)] blur-3xl pointer-events-none" />

          {/* Skeleton Loader */}
          <AnimatePresence>
            {!imageLoaded && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 m-auto w-10 h-10 border-2 border-white/5 border-t-red-600 rounded-full animate-spin"
              />
            )}
          </AnimatePresence>

          <OptimizedImage
            src={product.avatar}
            alt={name}
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-contain transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            priority={isPriority}
            widths={[300, 500, 800]}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            objectFit="contain"
          />
        </div>

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

  const handlePrefetch = () => {
    // Prefetch JS chunk
    import('./ProductQuickViewModal');
    // Preload main image
    const mainImage = product.cardImages?.[0] || product.coverImage || product.avatar;
    if (mainImage && typeof window !== 'undefined') {
        const img = new Image();
        img.src = getOptimizedUrl(mainImage, { width: 800 });
    }
  };

  const location = useLocation();

  return (
    <div 
        className="group relative h-full"
        onMouseEnter={handlePrefetch}
        onTouchStart={handlePrefetch}
    >
        <Link 
            to={`/catalog/${product.slug}`} 
            state={{ backgroundLocation: location }} 
            preventScrollReset={true}
            className="block h-full cursor-pointer"
        >
          {CardContent}
        </Link>
    </div>
  );
};

export default ProductCard;
