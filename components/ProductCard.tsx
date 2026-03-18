import React, { useState, memo } from "react";
import { Link, useLocation } from "react-router-dom";
import type { Product } from "../types";
import OptimizedImage from "./ui/OptimizedImage";

interface ProductCardProps {
  product: Product;
  isPriority?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = memo(({ product, isPriority = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const location = useLocation();

  // Цена - само wholesale_price_eur
  const priceVal = product.wholesale_price_eur ?? product.wholesalePriceEur;
  const displayPrice = priceVal != null && Number(priceVal) > 0
    ? `€${Number(priceVal).toFixed(2)}`
    : '';

  // Размер - само от size полето
  const sizeLabel = product.size || '';

  return (
    <div
      className="group relative h-full"
      onMouseEnter={() => import('./ProductQuickViewModal')}
      onTouchStart={() => import('./ProductQuickViewModal')}
    >
      <Link
        to={`/catalog/${product.slug}`}
        state={{ backgroundLocation: location }}
        preventScrollReset={true}
        className="block h-full cursor-pointer"
      >
        <div className="bg-[#141414] rounded-[28px] md:rounded-[40px] p-4 md:p-8 flex flex-col justify-between relative shadow-2xl border border-white/[0.03] transition-all duration-500 ease-out h-full overflow-hidden lg:hover:-translate-y-3 lg:hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_20px_rgba(220,38,38,0.2)] lg:hover:border-red-600/20">

          {/* Best Seller Badge */}
          {product.isBestSeller && (
            <div className="absolute top-3 left-3 z-10 px-2 py-1 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-red-600/40">
              Best Seller
            </div>
          )}

          {/* Product Image */}
          <div className="relative w-full aspect-square md:aspect-[4/3] flex-shrink-0 mb-4 md:mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.05)_0%,transparent_70%)] blur-3xl pointer-events-none" />
              {!imageLoaded && (
                <div className="absolute inset-0 m-auto w-10 h-10 border-2 border-white/5 border-t-red-600 rounded-full animate-spin" />
              )}
              <OptimizedImage
                src={product.avatar}
                alt={product.name}
                onLoad={() => setImageLoaded(true)}
                className={`w-full h-full object-contain transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                priority={isPriority}
                widths={[300, 500]}
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                objectFit="contain"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="w-full flex items-end justify-between mt-auto pt-4 border-t border-white/5">
            <div className="space-y-1 overflow-hidden flex-1 min-w-0">
              <h3 className="text-sm md:text-base font-black text-white leading-tight truncate uppercase tracking-tight">
                {product.name}
              </h3>
              {sizeLabel && (
                <p className="text-[10px] text-[#666] font-bold uppercase tracking-[0.2em] truncate">
                  {sizeLabel}
                </p>
              )}
            </div>
            {displayPrice && (
              <div className="text-sm md:text-lg font-black text-[#D4AF37] ml-3 shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                {displayPrice}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;
