import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { useToast } from '../hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedUrl } from '../lib/cloudinary-utils';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { 
    ShoppingBag, 
    X,
    Minus,
    Plus,
    Maximize2,
    CheckCircle2,
    ArrowLeft,
    ArrowRight,
    Loader2
} from 'lucide-react';

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
                    <img src={getOptimizedUrl(src)} alt="zoom" className="max-w-[90vw] max-h-[85vh] object-contain select-none pointer-events-none" draggable={false} />
                </TransformComponent>
            </TransformWrapper>
        </div>
    </motion.div>
);

const ProductQuickViewModal: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { getProductBySlug, loading } = useProducts();
    const { addToCart } = useCart();
    const { showToast } = useToast();

    const product = getProductBySlug(slug || '');

    const [activeIdx, setActiveIdx] = useState(0);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Also close on ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !lightboxSrc) handleClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [lightboxSrc]);

    const handleClose = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                    <p className="text-zinc-500 text-xs uppercase tracking-widest">Зареждане на продукт</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />
                <div className="relative z-10 bg-[#0A0A0A] p-10 rounded-3xl border border-white/10 text-center flex flex-col items-center max-w-sm">
                    <p className="text-zinc-400 uppercase tracking-widest text-sm mb-6">Продуктът не е намерен</p>
                    <button onClick={handleClose} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs uppercase tracking-widest font-bold transition-colors border border-white/10">
                        Затвори
                    </button>
                </div>
            </div>
        );
    }

    const priceValue = product.price_eur || product.wholesalePriceEur || 0;
    const priceStr = priceValue.toFixed(2);
    const images: string[] = product.cardImages?.length ? product.cardImages : [product.coverImage || product.avatar];
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
        handleClose();
    };

    return (
        <div 
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 md:p-8" 
            role="dialog" 
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={handleClose}
            />
            
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                className="relative w-full max-w-5xl bg-[#080808] sm:rounded-3xl lg:rounded-[32px] sm:border border-white/10 shadow-2xl overflow-hidden max-h-[90svh] sm:max-h-[85vh] flex flex-col lg:flex-row shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
            >
                {/* Internal gradient BG */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#110000] via-transparent to-transparent opacity-80 pointer-events-none" />

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2 sm:p-3 bg-black/40 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white/50 hover:text-white transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500 min-w-[44px] min-h-[44px] flex items-center justify-center group"
                    aria-label="Затвори"
                >
                    <X size={20} className="group-hover:scale-110 transition-transform" />
                </button>

                {/* LEFT - Image Area */}
                <div className="w-full lg:w-1/2 p-4 sm:p-6 md:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col justify-center overflow-y-auto no-scrollbar relative z-10 bg-black/20">
                    <div className="relative aspect-square w-full max-w-[400px] mx-auto group">
                        <div 
                            className="relative w-full h-full bg-[#0F0F0F] rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center cursor-zoom-in"
                            onClick={() => setLightboxSrc(mainSrc)}
                        >
                            {!imageLoaded && (
                                <div className="absolute inset-0 m-auto w-8 h-8 border-2 border-white/10 border-t-red-600 rounded-full animate-spin" />
                            )}
                            <img
                                src={getOptimizedUrl(mainSrc, { width: 800 })}
                                alt={product.nameBg || product.name}
                                onLoad={() => setImageLoaded(true)}
                                className={`w-[85%] h-[85%] object-contain pointer-events-none select-none transition-all duration-700 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                            />
                            
                            {/* Expand Icon */}
                            <div className="absolute bottom-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white/60 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                                <Maximize2 size={18} />
                            </div>
                        </div>

                        {/* Navigation Arrows */}
                        {images.length > 1 && (
                            <>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setActiveIdx(prev => (prev > 0 ? prev - 1 : images.length - 1)); setImageLoaded(false); }}
                                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all min-w-[44px] min-h-[44px]"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setActiveIdx(prev => (prev < images.length - 1 ? prev + 1 : 0)); setImageLoaded(false); }}
                                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all min-w-[44px] min-h-[44px]"
                                >
                                    <ArrowRight size={18} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {images.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto mt-6 pb-2 no-scrollbar justify-start lg:justify-center">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { setActiveIdx(idx); setImageLoaded(false); }}
                                    className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-[#0F0F0F] rounded-xl sm:rounded-2xl border-2 transition-all p-2 ${
                                        activeIdx === idx ? 'border-white/30 bg-white/5' : 'border-white/5 opacity-50 hover:opacity-100'
                                    }`}
                                >
                                    <img src={getOptimizedUrl(img, { width: 160 })} alt="" className="w-full h-full object-contain pointer-events-none select-none" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT - Content Area */}
                <div className="w-full lg:w-1/2 flex flex-col justify-between max-h-[50svh] lg:max-h-none overflow-y-auto no-scrollbar relative z-10">
                    <div className="p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 lg:space-y-8 flex-1">
                        
                        {/* Title area */}
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="w-6 h-[1px] bg-red-600" />
                                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-bold text-red-500">
                                    {product.location || 'Premium Quality'}
                                </span>
                            </div>
                            <h2 
                                id="modal-title"
                                className="font-black uppercase tracking-tight leading-[1.1] text-white/95 drop-shadow-sm line-clamp-3"
                                style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}
                            >
                                {product.nameBg || product.name}
                            </h2>
                        </div>

                        {/* Price & Specs */}
                        <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white[0.05] p-5 relative overflow-hidden flex flex-wrap gap-6 items-center justify-between">
                            <div>
                                <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40 block mb-1">ОБЩА ЦЕНА</span>
                                <div className="flex items-baseline gap-1.5 drop-shadow-sm">
                                    <span className="text-4xl sm:text-5xl font-mono font-black text-white/95">{(priceValue * quantity).toFixed(2)}</span>
                                    <span className="text-xl sm:text-2xl font-mono font-bold text-red-500">€</span>
                                </div>
                            </div>
                            {product.size && (
                                <div className="text-right">
                                    <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40 block mb-1">РАЗМЕР</span>
                                    <span className="text-lg sm:text-xl font-bold text-white/85 uppercase">{product.size}</span>
                                </div>
                            )}
                        </div>
                        
                    </div>

                    {/* Controls Footer */}
                    <div className="p-4 sm:p-6 md:p-8 lg:p-10 border-t border-white/5 bg-black/40 backdrop-blur-xl lg:bg-transparent lg:border-t-0 lg:pt-0 sticky bottom-0 left-0 w-full z-20">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
                            {/* Quantity Stepper */}
                            <div className="flex h-[44px] sm:h-12 bg-white/5 rounded-[16px] sm:rounded-2xl border border-white/10 overflow-hidden w-full sm:w-auto shrink-0 sm:min-w-[120px]">
                                <button 
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="flex-1 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors outline-none focus-visible:bg-white/10 active:bg-white/5"
                                    aria-label="Намали количество"
                                >
                                    <Minus size={18} />
                                </button>
                                <div className="w-12 sm:w-14 flex items-center justify-center font-mono font-black text-white/90 border-x border-white/10 text-lg">
                                    {quantity}
                                </div>
                                <button 
                                    onClick={() => setQuantity(q => q + 1)}
                                    className="flex-1 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors outline-none focus-visible:bg-white/10 active:bg-white/5"
                                    aria-label="Увеличи количество"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                            
                            {/* CTA */}
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 h-[44px] sm:h-12 bg-brand-red text-white bg-red-600 rounded-[16px] sm:rounded-2xl flex items-center justify-center gap-2 font-bold uppercase tracking-[0.2em] text-[11px] sm:text-xs transition-all hover:bg-red-500 hover:-translate-y-[1px] hover:shadow-[0_4px_20px_rgba(220,38,38,0.4)] active:translate-y-[1px] active:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 outline-none w-full"
                            >
                                <ShoppingBag size={18} />
                                <span>Добави в количката</span>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Lightbox Context */}
            <AnimatePresence>
                {lightboxSrc && (
                    <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductQuickViewModal;
