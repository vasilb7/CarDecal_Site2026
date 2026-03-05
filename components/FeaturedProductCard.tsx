import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "../types";
import { getOptimizedUrl } from "../lib/cloudinary-utils";
import OptimizedImage from "./ui/OptimizedImage";

interface FeaturedProductCardProps {
  product: Product;
  isPriority?: boolean;
}

const FeaturedProductCard: React.FC<FeaturedProductCardProps> = ({ product, isPriority = false }) => {
  const { i18n } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Price calculation
  let displayPrice = "";
  if (product.price_eur !== undefined && product.price_eur !== null) {
    displayPrice = `€${Number(product.price_eur).toFixed(2)}`;
  } else if (product.wholesalePriceEur !== undefined && product.wholesalePriceEur !== null) {
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

  const name = i18n.language.startsWith("bg") && product.nameBg ? product.nameBg : product.name;
  const shortDesc = product.dimensions || product.size || "Premium Sticker";

  const CardContent = (
    <motion.div
      whileHover={{ 
        y: -12,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 25px rgba(220, 38, 38, 0.2)",
        borderColor: "rgba(220, 38, 38, 0.3)"
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-gradient-to-b from-[#141414] to-[#0A0A0A] rounded-[24px] md:rounded-[32px] p-5 md:p-6 flex flex-col h-full justify-between relative shadow-2xl border border-white/5 transition-colors overflow-hidden group/card"
    >
      {/* Product Image Area */}
      <div className="relative w-full aspect-video flex-shrink-0 flex items-center justify-center mb-4 min-h-0">
        <div className="relative w-full h-full flex items-center justify-center transition-transform duration-700 ease-out group-hover/card:scale-105">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.15)_0%,transparent_60%)] blur-2xl pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
          
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

          {/* Using 90% size instead of 100% so images have breathing room and are never cut off by the border radius */}
          <OptimizedImage
            src={product.avatar}
            alt={name}
            onLoad={() => setImageLoaded(true)}
            className={`w-[90%] h-[90%] object-contain transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            priority={isPriority}
            widths={[300, 500, 800]}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            objectFit="contain"
          />
        </div>

        {product.cardImages && product.cardImages.length > 0 && (
          <div className="absolute -bottom-2 md:-bottom-4 left-0 right-0 flex gap-2 overflow-x-auto no-scrollbar py-2 px-2 z-10 group-hover/card:translate-y-[-4px] transition-transform duration-500">
            {product.cardImages.slice(0, 5).map((img, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.2, y: -4, borderColor: "rgba(220, 38, 38, 0.4)", backgroundColor: "rgba(220, 38, 38, 0.1)" }}
                className="h-8 md:h-10 min-w-[32px] md:min-w-[40px] px-1.5 md:px-2 rounded-lg md:rounded-xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl shrink-0 shadow-lg flex items-center justify-center cursor-pointer"
              >
                <OptimizedImage
                  src={img}
                  className="max-h-full max-w-full"
                  alt={`Variation ${i}`}
                  priority={false}
                  widths={[100, 200]}
                  sizes="80px"
                  objectFit="contain"
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Content */}
      <div className="w-full mt-auto pt-4 border-t border-white/10 flex flex-col gap-2 shrink-0">
        <h3 className="text-xs md:text-sm lg:text-base font-black text-white leading-snug line-clamp-2 uppercase tracking-tight group-hover/card:text-red-500 transition-colors w-full" title={name}>
          {name}
        </h3>
        <div className="w-full flex items-end justify-between">
          <p className="text-[9px] md:text-[10px] text-[#888] font-bold uppercase tracking-[0.2em] truncate pr-2">
            {shortDesc}
          </p>
          <div className="text-sm md:text-base font-black text-[#D4AF37] shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            {displayPrice}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const location = useLocation();

  return (
    <div className="group relative h-full">
        <Link to={`/catalog/${product.slug}`} state={{ backgroundLocation: location }} className="block h-full cursor-pointer">
          {CardContent}
        </Link>
    </div>
  );
};

export default FeaturedProductCard;
