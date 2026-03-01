import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useToast } from '../hooks/useToast';
import { AnimatePresence, motion } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { 
    ShoppingBag, 
    Minus, 
    Plus, 
    Maximize2, 
    CheckCircle2,
    X,
    ChevronRight,
    ArrowLeft,
    ArrowRight
} from 'lucide-react';
import type { Product } from '../types';
import { getOptimizedUrl } from '../lib/cloudinary-utils';

interface ProductQuickViewProps {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
}

const Lightbox: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[400] bg-black/96 flex flex-col items-center justify-center backdrop-blur-xl"
        onClick={onClose}
    >
        <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 active:scale-90 flex items-center justify-center backdrop-blur-md border border-white/10"
        >
            <X className="w-6 h-6" />
        </button>
        <div className="w-full h-full flex items-center justify-center p-6" onClick={e => e.stopPropagation()}>
            <TransformWrapper initialScale={1} minScale={0.5} maxScale={8} centerOnInit>
                <TransformComponent wrapperClass="!w-full !h-full" contentClass="!flex !items-center !justify-center !w-full !h-full">
                    <img src={getOptimizedUrl(src, { width: 1600 })} alt="zoom" className="max-w-[90vw] max-h-[85vh] object-contain select-none pointer-events-none" draggable={false} />
                </TransformComponent>
            </TransformWrapper>
        </div>
        <p className="absolute bottom-5 text-zinc-600 text-[11px] uppercase tracking-[0.25em]">
            Щипни / скролни за зуум &nbsp;·&nbsp; Кликни навън за затваряне
        </p>
    </motion.div>
);

const ProductQuickView: React.FC<ProductQuickViewProps> = ({ product, isOpen, onClose }) => {
    const { t } = useTranslation();
    const [activeIdx, setActiveIdx] = useState(0);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();
    const { showToast } = useToast();

    // Reset state when product changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveIdx(0);
            setQuantity(1);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, product.slug]);

    if (!isOpen) return null;

    /* price */
    let priceValue = 0;
    if (product.price_eur) priceValue = product.price_eur;
    else if (product.wholesalePriceEur) priceValue = product.wholesalePriceEur;
    const price = priceValue.toFixed(2);

    /* images */
    const images: string[] = product.cardImages && product.cardImages.length > 0
        ? product.cardImages
        : [product.coverImage || product.avatar];

    const mainSrc = images[activeIdx] || '';

    const handleAddToCart = () => {
        const itemName = product.nameBg || product.name;
        addToCart({
            id: `${product.slug}-${activeIdx}`,
            name: itemName,
            variant: `Вариант ${activeIdx + 1}`,
            price: priceValue,
            quantity,
            image: mainSrc,
            slug: product.slug
        });
        showToast(`Добавени ${quantity}бр. от ${itemName}`, "success");
        onClose(); // Close modal after adding
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        onClick={onClose}
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-5xl bg-[#0A0A0A] rounded-[40px] border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col lg:flex-row"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 z-50 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
                        >
                            <X size={24} />
                        </button>

                        {/* LEFT — Gallery Zone */}
                        <div className="w-full lg:w-1/2 p-6 md:p-8 lg:p-12 overflow-y-auto no-scrollbar">
                            <div className="relative group aspect-square">
                                <motion.div
                                    key={mainSrc}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="relative w-full h-full bg-[#0F0F0F] rounded-3xl border border-white/5 overflow-hidden flex items-center justify-center cursor-zoom-in"
                                    onClick={() => setLightboxSrc(mainSrc)}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-tr from-red-600/5 via-transparent to-red-600/5" />
                                    <img
                                        src={getOptimizedUrl(mainSrc, { width: 800 })}
                                        alt={product.name}
                                        className="w-[85%] h-[85%] object-contain pointer-events-none select-none"
                                        draggable={false}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    {product.isBestSeller && (
                                        <div className="absolute top-6 left-6 flex items-center gap-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-[0_4px_20px_rgba(220,38,38,0.4)]">
                                            <CheckCircle2 size={12} />
                                            Best Seller
                                        </div>
                                    )}
                                    <div className="absolute bottom-6 right-6 p-4 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white/60">
                                        <Maximize2 size={20} />
                                    </div>
                                </motion.div>

                                {images.length > 1 && (
                                    <>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveIdx(prev => (prev > 0 ? prev - 1 : images.length - 1)); }}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-red-600 transition-all"
                                        >
                                            <ArrowLeft size={18} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveIdx(prev => (prev < images.length - 1 ? prev + 1 : 0)); }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-red-600 transition-all"
                                        >
                                            <ArrowRight size={18} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="flex gap-4 overflow-x-auto mt-6 pb-2 no-scrollbar">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveIdx(idx)}
                                            className={`relative flex-shrink-0 w-20 h-20 bg-[#0F0F0F] rounded-2xl border-2 transition-all p-2 ${
                                                activeIdx === idx ? 'border-red-600' : 'border-white/5 opacity-50 hover:opacity-100'
                                            }`}
                                        >
                                            <img src={getOptimizedUrl(img, { width: 160 })} alt="" className="w-full h-full object-contain pointer-events-none select-none" draggable={false} loading="lazy" decoding="async" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT — Info Zone */}
                        <div className="w-full lg:w-1/2 p-6 md:p-8 lg:p-12 bg-[#0A0A0A] flex flex-col justify-center overflow-y-auto no-scrollbar">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-8 h-px bg-red-600" />
                                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-500">{product.location || 'Premium Quality'}</span>
                            </div>

                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-[0.9] mb-6 text-white">
                                {product.nameBg || product.name}
                            </h2>

                            <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6 mb-8 relative overflow-hidden group/price">
                                <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-600/10 blur-[60px]" />
                                <div className="relative flex items-center justify-between">
                                    <div>
                                        <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-zinc-600 block mb-1">ЦЕНА</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-mono font-black text-white">{price}</span>
                                            <span className="text-lg font-mono font-medium text-red-600">€</span>
                                        </div>
                                    </div>
                                    {product.size && (
                                        <div className="text-right">
                                            <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-zinc-600 block mb-1">РАЗМЕР</span>
                                            <span className="text-lg font-bold text-white uppercase">{product.size}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex gap-4">
                                    <div className="flex h-14 bg-[#0F0F0F] rounded-2xl border border-white/5 overflow-hidden">
                                        <button 
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            className="w-14 h-full flex items-center justify-center text-zinc-500 hover:bg-white/5 hover:text-white"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val)) {
                                                    setQuantity(val);
                                                } else {
                                                    setQuantity(0);
                                                }
                                            }}
                                            onBlur={() => {
                                                if (quantity < 1) setQuantity(1);
                                            }}
                                            className="w-12 h-full bg-transparent text-center text-lg font-mono font-black border-x border-white/5 text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button 
                                            onClick={() => setQuantity(q => q + 1)}
                                            className="w-14 h-full flex items-center justify-center text-zinc-500 hover:bg-white/5 hover:text-white"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    
                                    <button
                                        onClick={handleAddToCart}
                                        className="flex-1 h-14 bg-white text-black rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.15em] text-xs hover:bg-red-600 hover:text-white transition-all active:scale-95"
                                    >
                                        <ShoppingBag size={18} />
                                        Добави
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <AnimatePresence>
                        {lightboxSrc && (
                            <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
                        )}
                    </AnimatePresence>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProductQuickView;
