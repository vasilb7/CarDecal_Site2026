import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { useToast } from '../hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedUrl } from '../lib/cloudinary-utils';
import OptimizedImage from './ui/OptimizedImage';
import ShareProductModal from './ShareProductModal';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { 
    ShoppingBag, 
    X,
    Minus,
    Plus,
    Maximize2,
    ArrowLeft,
    ArrowRight,
    Loader2,
    ZoomIn,
    ZoomOut,
    Share2
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

const fadeSlide = {
    hidden: { x: '100%', opacity: 0.5 },
    visible: { 
        x: 0, 
        opacity: 1, 
        transition: { type: 'spring', damping: 28, stiffness: 250, mass: 0.8 } 
    },
    exit: { 
        x: '100%', 
        opacity: 0, 
        transition: { ease: 'easeInOut', duration: 0.4 } 
    }
};

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
    const [isVisible, setIsVisible] = useState(true);
    const [zoomActive, setZoomActive] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    useEffect(() => {
        setZoomActive(false);
    }, [activeIdx, isVisible]);


    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !lightboxSrc) handleClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [lightboxSrc]);

    const handleClose = () => {
        setIsVisible(false);
    };

    if (loading) {
        return (
            <AnimatePresence onExitComplete={() => navigate(-1)}>
                {isVisible && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />
                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                            <p className="text-zinc-500 text-xs uppercase tracking-widest">Зареждане на продукт</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    if (!product) {
        return (
            <AnimatePresence onExitComplete={() => navigate(-1)}>
                {isVisible && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />
                        <div className="relative z-10 bg-[#0A0A0A] p-10 rounded-3xl border border-white/10 text-center flex flex-col items-center max-w-sm">
                            <p className="text-zinc-400 uppercase tracking-widest text-sm mb-6">Продуктът не е намерен</p>
                            <button onClick={handleClose} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs uppercase tracking-widest font-bold transition-colors border border-white/10">
                                Затвори
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    const priceValue = product.price_eur || product.wholesalePriceEur || 0;
    const images: string[] = product.cardImages?.length ? product.cardImages : [product.coverImage || product.avatar];
    const mainSrc = images[activeIdx] || '';

    const handleAddToCart = () => {
        const finalQuantity = Math.max(1, quantity);
        addToCart({
            id: `${product.slug}-${activeIdx}`,
            name: product.name,
            name_bg: product.nameBg || product.name,
            variant: `Вариант ${activeIdx + 1}`,
            selectedSize: product.size,
            price: priceValue,
            quantity: finalQuantity,
            image: mainSrc,
            slug: product.slug
        });
        showToast(`Добавени ${finalQuantity}бр. от ${product.nameBg || product.name}`, "success");
        handleClose();
    };

    return (
        <AnimatePresence onExitComplete={() => { if (!isVisible) navigate(-1); }}>
            {isVisible && (
                <div 
                    className="fixed inset-0 z-[200] flex justify-end" 
                    role="dialog" 
                    aria-modal="true"
                >
            {/* Dark Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-black/90"
                onClick={handleClose}
            />
            
            {/* Desktop Slide-Over / Mobile Full-Screen */}
            <motion.div
                variants={fadeSlide}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative w-full h-[100svh] lg:w-[90vw] xl:w-[1200px] max-w-full bg-[#050505] shadow-[-20px_0_100px_rgba(0,0,0,0.9)] lg:border-l border-white/5 flex flex-col lg:flex-row overflow-hidden"
            >
                {/* Close Button Top Left */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 left-4 z-50 p-3 bg-black/60 hover:bg-white/10 border border-white/10 rounded-full text-white/50 hover:text-white transition-all min-w-[48px] min-h-[48px] flex items-center justify-center group"
                >
                    <X size={24} className="group-hover:scale-110 transition-transform" />
                </button>

                {/* Container that handles split layout and internal scrolling */}
                <div className="w-full h-full flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative no-scrollbar">

                    {/* LEFT COLUMN: Large Image Viewer */}
                    <div className="w-full lg:w-[55%] xl:w-[60%] shrink-0 flex flex-col justify-center relative bg-[#020202] lg:h-full lg:border-r border-white/5 pb-8 lg:pb-0 z-10">
                        {/* Background subtle glow */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.03)_0%,transparent_70%)] pointer-events-none" />

                        <div className="relative w-full aspect-square md:aspect-auto md:flex-1 flex items-center justify-center p-8 lg:p-16 group mx-auto max-w-[800px]">
                            
                            {/* Removed blurred placeholders as per user request for instant loading */}

                            {/* The actual high-res image with Pan & Zoom */}
                            <TransformWrapper 
                                initialScale={1} 
                                minScale={1} 
                                maxScale={3} 
                                centerOnInit
                                doubleClick={{ disabled: true }} // Prevent accidental zoom on double tap
                                panning={{ disabled: !zoomActive }}
                                pinch={{ disabled: !zoomActive }}
                                wheel={{ disabled: !zoomActive }}
                            >
                                {({ resetTransform }) => {
                                    return (
                                    <>
                                        <TransformComponent wrapperClass="!w-full !max-h-[70vh]" contentClass="!flex !items-center !justify-center !w-full !h-full">
                                            <OptimizedImage
                                                src={mainSrc}
                                                alt={product.nameBg || product.name}
                                                className={`w-full max-h-[70vh] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative z-10 transition-all ${zoomActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                                                priority={true}
                                                widths={[400, 800, 1200]}
                                                sizes="(max-width: 1024px) 100vw, 60vw"
                                                objectFit="contain"
                                            />
                                        </TransformComponent>
                                        
                                        {/* Action Buttons Container */}
                                        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex items-center gap-3 z-20">
                                            {/* Share Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsShareOpen(true);
                                                }}
                                                className="p-3 md:p-4 rounded-full border text-white/80 hover:text-white transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] active:scale-90 flex items-center justify-center bg-black/80 border-white/10 hover:bg-black/90 hover:border-white/20"
                                                title="Сподели"
                                            >
                                                <Share2 size={22} className="md:w-6 md:h-6" />
                                            </button>

                                            {/* Magnifier Zoom Button */}
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (zoomActive) {
                                                        resetTransform(300);
                                                        setZoomActive(false);
                                                    } else {
                                                        setZoomActive(true);
                                                    }
                                                }}
                                                className={`p-3 md:p-4 rounded-full border text-white/80 hover:text-white transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] active:scale-90 flex items-center justify-center ${zoomActive ? 'bg-red-500/80 border-red-500/50' : 'bg-black/80 border-white/10 hover:bg-black/90 hover:border-white/20'}`}
                                                title={zoomActive ? "Излез от приближаване (Lock Zoom)" : "Отключи приближаване (Unlock Zoom)"}
                                            >
                                                {zoomActive ? <ZoomOut size={22} className="md:w-6 md:h-6" /> : <ZoomIn size={22} className="md:w-6 md:h-6" />}
                                            </button>
                                        </div>
                                    </>
                                )}}
                            </TransformWrapper>

                            {/* Navigation Arrows */}
                            {images.length > 1 && (
                                <>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setActiveIdx(prev => (prev > 0 ? prev - 1 : images.length - 1)); }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/90 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 hover:scale-110 transition-all z-20"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setActiveIdx(prev => (prev < images.length - 1 ? prev + 1 : 0)); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/90 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 hover:scale-110 transition-all z-20"
                                    >
                                        <ArrowRight size={20} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto no-scrollbar justify-start lg:justify-center px-6 md:px-10 pb-6 shrink-0 relative z-20">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => { setActiveIdx(idx); }}
                                        className={`relative flex-shrink-0 w-20 h-20 md:w-24 md:h-24 bg-[#0a0a0a] rounded-2xl border transition-all p-3 ${
                                            activeIdx === idx ? 'border-white/40 bg-white/5 ring-4 ring-white/5' : 'border-white/5 opacity-40 hover:opacity-100 hover:border-white/20'
                                        }`}
                                    >
                                        <OptimizedImage 
                                            src={img} 
                                            alt="" 
                                            className="w-full h-full pointer-events-none select-none drop-shadow-lg"
                                            priority={false}
                                            widths={[100, 200]}
                                            sizes="100px"
                                            objectFit="contain"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Details & Actions */}
                    <div className="w-full lg:w-[45%] xl:w-[40%] shrink-0 flex flex-col lg:h-full relative bg-[#080808] z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
                        <div className="flex-1 p-6 md:p-10 lg:p-12 xl:p-16 lg:overflow-y-auto no-scrollbar pb-[240px] md:pb-[240px] lg:pb-10 space-y-10">
                            
                            {/* Header Section */}
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="w-8 h-[2px] bg-red-600 rounded-full" />
                                    <span className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] font-black text-red-500">
                                        {product.location || 'Premium Quality'}
                                    </span>
                                </div>
                                <h1 className="text-2xl md:text-3xl xl:text-4xl font-black uppercase tracking-tight leading-tight text-white break-words">
                                    {product.nameBg || product.name}
                                </h1>
                            </div>

                            {/* Price Config */}
                            <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 blur-3xl" />
                                 <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-600/20 blur-3xl" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40">Цена за Брой</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl md:text-5xl font-mono font-black text-white">{priceValue.toFixed(2)}</span>
                                        <span className="text-1xl md:text-2xl font-mono font-bold text-white-500">€</span>
                                    </div>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-sm font-mono font-medium text-white/50">/ {(priceValue * 1.95583).toFixed(2)}</span>
                                        <span className="text-xs font-mono font-bold text-white/40">лв</span>
                                    </div>
                                </div>

                                {product.size && (
                                    <div className="mt-6 pt-6 border-t border-white/5 flex gap-4">
                                        <div>
                                            <span className="text-[12px] uppercase tracking-[0.2em] font-bold text-white/40 block mb-2">Размер</span>
                                            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-bold uppercase text-xs">
                                                {product.size}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Product Info Description (Optional if you have descriptions) */}
                            <div className="space-y-4">
                                <h3 className="text-sm uppercase tracking-[0.2em] font-bold text-white/60">Детайли за продукта</h3>
                                <div className="text-sm md:text-base text-white/60 leading-relaxed font-medium space-y-4">
                                    <p>• Защита: Пълна водоустойчивост и вграден UV филтър срещу избледняване.</p>
                                    <p>• Издръжливост: Устойчиви на автомивка, високи температури и сняг.</p>
                                    <p>• Качество: Екологичен печат с висока резолюция и наситени, живи цветове.</p>
                                    <p>• Монтаж: Силно прилепващо лепило, което не оставя следи при премахване.</p>
                                </div>
                            </div>

                        </div>

                        {/* Desktop & Mobile Fixed Footer Container */}
                        <div className="hidden lg:block sticky bottom-0 w-full p-8 xl:p-12 bg-[#080808]/90 backdrop-blur-2xl border-t border-white/5 z-30 shadow-[0_-20px_40px_rgba(0,0,0,0.6)]">
                            <div className="flex items-end justify-between mb-4">
                                <div>
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 block mb-1">Крайна Сума</span>
                                    <div className="flex items-baseline gap-1" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                                        <span className="text-3xl font-mono font-black text-white">{(priceValue * Math.max(1, quantity)).toFixed(2)}</span>
                                        <span className="text-xl font-mono font-bold text-zinc-500">€</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 items-stretch h-14">
                                {/* Quantity Stepper */}
                                <div className="flex bg-[#0f0f0f] rounded-2xl border border-white/10 overflow-hidden w-[140px] shrink-0">
                                    <button 
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="flex-1 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={quantity === 0 ? '' : String(quantity)}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            if (val === '') { 
                                                setQuantity(0); 
                                            } else {
                                                const parsed = parseInt(val, 10);
                                                if (!isNaN(parsed)) setQuantity(parsed);
                                            }
                                        }}
                                        onBlur={() => { if (quantity < 1) setQuantity(1); }}
                                        className="w-14 bg-transparent text-center font-mono font-black border-x border-white/5 text-white/90 focus:outline-none text-lg"
                                    />
                                    <button 
                                        onClick={() => setQuantity(q => q + 1)}
                                        className="flex-1 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                
                                {/* CTA Button */}
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 bg-red-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.15em] text-sm transition-all hover:bg-red-500 shadow-[0_10px_30px_rgba(220,38,38,0.3)] hover:shadow-[0_10px_40px_rgba(220,38,38,0.5)] hover:-translate-y-1 active:translate-y-0"
                                >
                                    <ShoppingBag size={20} />
                                    <span>Добави Избора</span>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Mobile Fixed CTA */}
                <div className="lg:hidden absolute bottom-0 left-0 w-full bg-[#050505]/95 backdrop-blur-2xl border-t border-white/10 z-[100] pb-[env(safe-area-inset-bottom)]">
                    <div className="p-4 sm:p-6 shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
                        <div className="flex gap-3 justify-between items-end mb-4 px-2">
                           <div className="flex flex-col">
                               <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 block mb-1">Крайна Сума</span>
                               <div className="flex items-baseline gap-1">
                                   <span className="text-2xl font-mono font-black text-white">{(priceValue * Math.max(1, quantity)).toFixed(2)}</span>
                                   <span className="text-lg font-mono font-bold text-zinc-500">€</span>
                               </div>
                               <div className="flex items-baseline gap-1 mt-1">
                                   <span className="text-sm font-mono font-medium text-white/50">/ {(priceValue * Math.max(1, quantity) * 1.95583).toFixed(2)}</span>
                                   <span className="text-xs font-mono font-bold text-white/40">лв</span>
                               </div>
                           </div>
                            {/* Small quantity for mobile header */}
                           <div className="flex items-center gap-3">
                               <div className="flex bg-[#0f0f0f] rounded-xl border border-white/10 overflow-hidden h-10 w-[110px]">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="flex-1 flex items-center justify-center text-white/60"><Minus size={16} /></button>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={quantity === 0 ? '' : String(quantity)}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        if (val === '') { 
                                            setQuantity(0); 
                                        } else {
                                            const parsed = parseInt(val, 10);
                                            if (!isNaN(parsed)) setQuantity(parsed);
                                        }
                                    }}
                                    onBlur={() => { if (quantity < 1) setQuantity(1); }}
                                    className="w-10 text-center font-mono font-bold text-white text-sm bg-black/20 border-x border-white/5 focus:outline-none"
                                />
                                <button onClick={() => setQuantity(q => q + 1)} className="flex-1 flex items-center justify-center text-white/60"><Plus size={16} /></button>
                            </div>
                           </div>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            className="w-full h-[52px] bg-red-600 text-white rounded-[16px] flex items-center justify-center gap-2 font-black uppercase tracking-[0.1em] text-sm hover:bg-red-500 active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(220,38,38,0.3)]"
                        >
                            <ShoppingBag size={20} />
                            <span>Добави в количката</span>
                        </button>
                    </div>
                </div>

            </motion.div>

            <AnimatePresence>
                {lightboxSrc && (
                    <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
                )}
                {isShareOpen && (
                    <ShareProductModal
                        isOpen={isShareOpen}
                        onClose={() => setIsShareOpen(false)}
                        productTitle={product.nameBg || product.name}
                        productUrl={`${window.location.origin}/catalog/${product.slug}`}
                    />
                )}
            </AnimatePresence>

            {/* Close outer dialog div */}
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProductQuickViewModal;
