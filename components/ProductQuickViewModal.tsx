import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { useToast } from '../hooks/useToast';
import { useWishlist } from '../context/WishlistContext';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedUrl } from '../lib/cloudinary-utils';
import OptimizedImage from './ui/OptimizedImage';
import ShareProductModal from './ShareProductModal';
import SEO from './SEO';
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
    Share2,
    Search,
    Heart
} from 'lucide-react';

const Lightbox: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black/98 flex flex-col items-center justify-center"
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
        <p className="absolute bottom-5 text-zinc-600 text-[11px] uppercase tracking-[0.25em]">
            Щипни / скролни за зуум &nbsp;·&nbsp; Кликни навън за затваряне
        </p>
    </motion.div>
);

const ProductQuickViewModal: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { i18n } = useTranslation();
    const { getProductBySlug, loading } = useProducts();
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const { isCartOpen, setIsProductModalOpen } = useUI();
    const { user } = useAuth();
    
    // Find product
    const product = getProductBySlug(slug || '');
    const [isVisible, setIsVisible] = useState(false);
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [activeIdx, setActiveIdx] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [zoomActive, setZoomActive] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [addedFeedback, setAddedFeedback] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const transformRef = useRef<any>(null);

    // Handle back button for zoom
    useEffect(() => {
        if (zoomActive) {
            // Push a temporary state so the "Back" button doesn't close the modal immediately
            window.history.pushState({ isZoom: true }, '');

            const handlePopState = (e: PopStateEvent) => {
                // If the user navigates back while we're in zoom mode, just exit zoom
                if (zoomActive) {
                    setZoomActive(false);
                    if (transformRef.current) {
                        transformRef.current.resetTransform(300);
                    }
                }
            };

            window.addEventListener('popstate', handlePopState);
            return () => {
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, [zoomActive]);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleCloseFinal = useCallback(() => {
        const backLoc = (location.state as any)?.backgroundLocation;
        const queryParams = new URLSearchParams(location.search);
        queryParams.delete('modal');

        // If we have a background location (where we came from), use its path + search
        const basePath = backLoc?.pathname || (location.state as any)?.from || '/catalog';
        const fromSearch = backLoc?.search || '';
        const fromParams = new URLSearchParams(fromSearch);
        
        // Merge current URL params (like search term 'q' or 'page') into the destination
        queryParams.forEach((value, key) => {
            fromParams.set(key, value);
        });

        const finalSearch = fromParams.toString();
        const finalPath = `${basePath}${finalSearch ? `?${finalSearch}` : ''}`;

        navigate(finalPath, { replace: true, state: { ...backLoc?.state, noScroll: true } });
    }, [location, navigate]);

    const handleClose = useCallback(() => {
        setIsVisible(false);
    }, []);

    useEffect(() => {
        if (product) {
            setIsVisible(true);
            setActiveIdx(0);
            setQuantity(1);
            setIsAdding(false);
            setAddedFeedback(false);
            
            // Preload the main product image for faster LCP
            const mainImage = product.cardImages?.[0] || product.coverImage || product.avatar;
            if (mainImage && mainImage.includes('cloudinary.com')) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = getOptimizedUrl(mainImage, { width: 800 });
                document.head.appendChild(link);
                return () => { document.head.removeChild(link); };
            }
        } else if (!loading) {
            // If product definitely not found, we show not found UI then eventually close
        }
    }, [product, loading]);

    useEffect(() => {
        if (isVisible) {
            setIsProductModalOpen(true);
        } else {
            setIsProductModalOpen(false);
        }
        return () => {
            setIsProductModalOpen(false);
        };
    }, [isVisible, setIsProductModalOpen]);

    // Track variation ribbon scroll
    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setScrollProgress(scrollLeft / (scrollWidth - clientWidth));
        }
    };

    const handleQuantityChange = (val: string) => {
        // Remove everything except numbers
        const clean = val.replace(/[^0-9]/g, '');
        
        // If it's an empty string, let it be (user is typing), but we will fix it on Blur
        if (clean === '') {
            setQuantity(0); // Temporary state while typing
            return;
        }

        const num = parseInt(clean, 10);
        
        // Final protection: no zero, no negative, no "01" (parseInt handles leading zeros)
        if (num > 0) {
            setQuantity(num);
        } else {
            setQuantity(1);
        }
    };

    const handleQuantityBlur = () => {
        if (quantity < 1) setQuantity(1);
    };

    const priceValue = product?.price_eur || product?.wholesalePriceEur || 0;
    
    // Combine main image with card images, ensuring uniqueness
    const images: string[] = product ? Array.from(new Set([
        ...(product.cardImages || []),
        product.coverImage || product.avatar
    ].filter(Boolean) as string[])) : [];

    // Use the unified scroll lock class from index.css
    useEffect(() => {
        const isLocked = isVisible || (slug && !product);
        if (isLocked) {
            document.documentElement.classList.add('scroll-locked');
        } else {
            document.documentElement.classList.remove('scroll-locked');
        }
        return () => {
            document.documentElement.classList.remove('scroll-locked');
        };
    }, [isVisible, slug, product]);

    if (!product && !loading) {
        return (
            <AnimatePresence onExitComplete={handleCloseFinal}>
                {isVisible && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
                    >
                        {/* Global scroll lock override - handled via class */}
                        
                        <div 
                            className="absolute inset-0 bg-[#020202]/80 backdrop-blur-xl" 
                            onClick={handleClose} 
                        />
                        <div className="relative z-10 bg-[#0A0A0A]/90 backdrop-blur-2xl p-12 rounded-[32px] border border-white/10 text-center flex flex-col items-center max-w-sm shadow-[0_30px_100_px_rgba(0,0,0,0.8)]">
                            <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mb-6 border border-red-600/20">
                                <Search className="w-8 h-8 text-red-500" />
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">Продуктът не е намерен</h2>
                            <p className="text-zinc-500 text-sm mb-8 leading-relaxed">Изглежда този артикул вече не е наличен или линкът е грешен.</p>
                            <button 
                                onClick={handleClose} 
                                className="w-full py-4 bg-white text-black hover:bg-red-600 hover:text-white rounded-2xl text-[11px] uppercase tracking-[0.2em] font-black transition-all active:scale-95 shadow-xl"
                            >
                                Към Каталога
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    const mainSrc = images[activeIdx] || '';

    const handleAddToCart = () => {
        if (!product || isAdding) return;
        setIsAdding(true);
        const finalQuantity = Math.max(1, quantity);
        addToCart({
            id: `${product.slug}-${activeIdx}`,
            name: product.name,
            name_bg: product.nameBg || product.name,
            variant: (product.cardImages && product.cardImages.length > 0) ? `Вариант ${activeIdx + 1}` : '',
            selectedSize: product.size,
            price: priceValue,
            quantity: finalQuantity,
            image: mainSrc,
            slug: product.slug
        });
        showToast(`Добавени ${finalQuantity}бр. от ${product.nameBg || product.name}`, "success");
        setAddedFeedback(true);
        
        // Use timeout to let cart update completely before unmounting
        setTimeout(() => {
            handleClose();
        }, 100);
    };

    const fadeSlide = {
        hidden: { x: '100%', opacity: 0 },
        visible: { x: 0, opacity: 1, transition: { type: 'spring', damping: 30, stiffness: 200 } },
        exit: { x: '100%', opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } }
    };

    return (
        <AnimatePresence onExitComplete={handleCloseFinal}>
            {isVisible && product && (
                <div 
                    className="fixed inset-0 z-[200] flex justify-end" 
                    role="dialog" 
                    aria-modal="true"
                >
                    <SEO title={addedFeedback ? "Добавено в количката!" : (product.nameBg || product.name)} />
                    {/* Global scroll lock override - handled via class */}
                    
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
                <AnimatePresence>
                    {!zoomActive && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={handleClose}
                            className="absolute top-4 left-4 z-50 p-3 bg-black/60 hover:bg-white/10 border border-white/10 rounded-full text-white/50 hover:text-white transition-all min-w-[48px] min-h-[48px] flex items-center justify-center group"
                        >
                            <X size={24} className="group-hover:scale-110 transition-transform" />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Container that handles split layout and internal scrolling */}
                <div className="w-full h-full flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative no-scrollbar">

                    {/* LEFT COLUMN: Large Image Viewer */}
                    <div className="w-full lg:w-[55%] xl:w-[60%] shrink-0 flex flex-col justify-center relative bg-[#020202] lg:h-full lg:border-r border-white/5 pb-8 lg:pb-0 z-10">
                        {/* Background subtle glow */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.03)_0%,transparent_70%)] pointer-events-none" />

                        <div className="relative w-full aspect-square md:aspect-auto md:flex-1 flex items-center justify-center p-8 lg:p-16 group mx-auto max-w-[800px]">
                            
                            {/* The actual high-res image with Pan & Zoom */}
                            <TransformWrapper 
                                ref={transformRef}
                                initialScale={1} 
                                minScale={1} 
                                maxScale={3} 
                                centerOnInit
                                doubleClick={{ disabled: true }} 
                                panning={{ disabled: !zoomActive }}
                                pinch={{ disabled: !zoomActive }}
                                wheel={{ disabled: !zoomActive }}
                            >
                                {({ resetTransform }) => {
                                    return (
                                    <>
                                        <div className="absolute inset-0 w-full h-full">
                                            <TransformComponent wrapperClass="!absolute !inset-0 !w-full !h-full" contentClass="!flex !items-center !justify-center !w-full !h-full !p-8 lg:!p-16">
                                                <OptimizedImage
                                                    src={mainSrc}
                                                    alt={product.nameBg || product.name}
                                                    className={`w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative z-10 transition-all ${zoomActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                                                    priority={true}
                                                    widths={[400, 800, 1200]}
                                                    sizes="(max-width: 1024px) 100vw, 60vw"
                                                    objectFit="contain"
                                                />
                                            </TransformComponent>
                                        </div>
                                        
                                        {/* Action Buttons Container */}
                                        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex items-center gap-3 z-30 pointer-events-none">
                                            <AnimatePresence>
                                                {!zoomActive && (
                                                    <>
                                                        {user && (
                                                            <motion.button
                                                                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                                                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                                                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleWishlist(product.slug);
                                                                    const newState = !isInWishlist(product.slug);
                                                                    showToast(
                                                                        newState ? `Добавено в любими: ${product.nameBg || product.name}` : `Премахнато от любими: ${product.nameBg || product.name}`,
                                                                        "success"
                                                                    );
                                                                }}
                                                                className={`p-3 md:p-4 rounded-full border transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] active:scale-95 flex items-center justify-center backdrop-blur-md pointer-events-auto ${isInWishlist(product.slug) ? 'bg-red-600 border-red-500 text-white' : 'bg-black/80 border-white/20 text-white hover:bg-black/90'}`}
                                                                title={isInWishlist(product.slug) ? "Премахни от любими" : "Добави в любими"}
                                                            >
                                                                <Heart size={22} className={`md:w-6 md:h-6 drop-shadow-md ${isInWishlist(product.slug) ? 'fill-white' : ''}`} />
                                                            </motion.button>
                                                        )}

                                                        <motion.button
                                                            initial={{ opacity: 0, scale: 0.8, x: 20 }}
                                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                                            exit={{ opacity: 0, scale: 0.8, x: 20 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setIsShareOpen(true);
                                                            }}
                                                            className="p-3 md:p-4 rounded-full border text-white transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] active:scale-95 flex items-center justify-center bg-black/80 border-white/20 hover:bg-black/90 backdrop-blur-md pointer-events-auto"
                                                            title="Сподели"
                                                        >
                                                            <Share2 size={22} className="md:w-6 md:h-6 drop-shadow-md" />
                                                        </motion.button>
                                                    </>
                                                )}
                                            </AnimatePresence>

                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (zoomActive) {
                                                        resetTransform(300);
                                                        setZoomActive(false);
                                                        // If we manually exit zoom, we should go back in history to remove the dummy state
                                                        window.history.back();
                                                    } else {
                                                        setZoomActive(true);
                                                    }
                                                }}
                                                className={`p-3 md:p-4 rounded-full border text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] active:scale-95 flex items-center justify-center backdrop-blur-md pointer-events-auto transition-all duration-300 ${zoomActive ? 'bg-red-600/90 border-red-500/50 opacity-70' : 'bg-black/80 border-white/20 hover:bg-black/90 opacity-100'}`}
                                                title={zoomActive ? "Излез от приближаване" : "Докосни за приближаване"}
                                            >
                                                {zoomActive ? <ZoomOut size={22} className="md:w-6 md:h-6 drop-shadow-md" /> : <ZoomIn size={22} className="md:w-6 md:h-6 drop-shadow-md" />}
                                            </button>
                                        </div>
                                    </>
                                )}}
                            </TransformWrapper>
                        </div>

                        {/* Variant Selection Buttons - Only if cardImages exist */}
                        {product.cardImages && product.cardImages.length > 0 && (
                            <div className="relative shrink-0 z-20 mt-auto pb-6 pt-4">
                                <div className="absolute left-0 top-0 bottom-10 w-12 bg-gradient-to-r from-[#020202] to-transparent z-30 pointer-events-none lg:hidden" />
                                <div className="absolute right-0 top-0 bottom-10 w-12 bg-gradient-to-l from-[#020202] to-transparent z-30 pointer-events-none lg:hidden" />
                                
                                <div 
                                    ref={scrollContainerRef}
                                    onScroll={handleScroll}
                                    className="relative flex gap-5 overflow-x-auto no-scrollbar justify-start lg:justify-center px-8 md:px-12 pb-6"
                                >
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveIdx(idx)}
                                            className="relative flex-shrink-0 group/thumb py-2"
                                        >
                                            <div className={`
                                                relative w-22 h-22 md:w-26 md:h-26 p-3 rounded-[24px] transition-all duration-500 flex items-center justify-center
                                                ${activeIdx === idx 
                                                    ? 'bg-gradient-to-b from-white/[0.12] to-white/[0.04] border border-white/20 shadow-[0_15px_35px_rgba(220,38,38,0.2)]' 
                                                    : 'bg-white/[0.03] border border-white/[0.05] hover:border-white/10 opacity-40 hover:opacity-100 backdrop-blur-md'
                                                }
                                            `}>
                                                {activeIdx === idx && (
                                                    <div className="absolute inset-0 bg-red-600/10 blur-2xl rounded-full animate-pulse pointer-events-none" />
                                                )}
                                                
                                                <OptimizedImage 
                                                    src={img} 
                                                    alt="" 
                                                    className={`w-full h-full pointer-events-none select-none transition-all duration-500 drop-shadow-2xl ${activeIdx === idx ? 'scale-110' : 'group-hover/thumb:scale-110'}`}
                                                    priority={false}
                                                    widths={[100, 200]}
                                                    sizes="100px"
                                                    objectFit="contain"
                                                />
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] md:w-[200px] h-[3px] bg-white/10 rounded-full overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                                    <div 
                                        className="absolute top-0 bottom-0 bg-red-600 rounded-full transition-all duration-100"
                                        style={{ 
                                            left: `${(Number.isNaN(scrollProgress) ? 0 : scrollProgress) * (100 - Math.max(20, 100 / images.length))}%`, 
                                            width: `${Math.max(20, 100 / images.length)}%` 
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Details & Actions */}
                    <div className="w-full lg:w-[45%] xl:w-[40%] shrink-0 flex flex-col lg:h-full relative bg-[#080808] z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
                        <div className="flex-1 p-6 md:p-10 lg:p-12 xl:p-16 lg:overflow-y-auto no-scrollbar pb-[120px] md:pb-[140px] lg:pb-10 space-y-10">
                            
                            {/* Header Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-[2px] bg-red-600 rounded-full" />
                                        <span className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] font-black text-red-600">
                                            Произведено от CarDecal
                                        </span>
                                    </div>
                                    {product.size && (
                                        <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white font-black uppercase text-[10px] tracking-widest shadow-2xl">
                                            {product.size}
                                        </div>
                                    )}
                                </div>
                                <h1 className="text-2xl md:text-3xl xl:text-4xl font-black uppercase tracking-tight leading-tight text-white mb-2 break-words">
                                    {product.nameBg || product.name}
                                </h1>
                            </div>

                            {/* Variant Selection Buttons - Only if cardImages exist */}
                            {product.cardImages && product.cardImages.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs uppercase tracking-[0.2em] font-black text-white">Изберете вариант</h3>
                                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                                            {activeIdx + 1} / {images.length}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 gap-3">
                                        {images.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveIdx(idx)}
                                                className={`
                                                    h-12 rounded-xl flex items-center justify-center font-mono font-black text-sm transition-all duration-300 border
                                                    ${activeIdx === idx 
                                                        ? 'bg-red-600 border-red-500 text-white shadow-[0_4px_15px_rgba(220,38,38,0.4)]' 
                                                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20'
                                                    }
                                                `}
                                            >
                                                {idx + 1}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Product Info Description */}
                            <div className="space-y-4">
                                <h3 className="text-sm uppercase tracking-[0.2em] font-bold text-white/60">Детайли за продукта</h3>
                                <div className="text-sm md:text-base text-white/60 leading-relaxed font-medium space-y-4">
                                    <p>• Защита: Пълна водоустойчивост и вграден UV филтър срещу избледняване.</p>
                                    <p>• Издръжливост: Устойчиви на автомивка, високи температури и сняг.</p>
                                    <p>• Качество: Професионален печат с висока резолюция и наситени, живи цветове.</p>
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
                                <div className="flex bg-[#0f0f0f] rounded-2xl border border-white/10 overflow-hidden w-[140px] shrink-0">
                                    <button 
                                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                        className="flex-1 flex items-center justify-center text-white hover:bg-white/5 transition-colors"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <input 
                                        type="text"
                                        inputMode="numeric"
                                        value={quantity === 0 ? "" : quantity}
                                        onChange={(e) => handleQuantityChange(e.target.value)}
                                        onBlur={handleQuantityBlur}
                                        className="flex-1 w-full bg-transparent border-x border-white/10 text-center font-mono font-black text-lg text-white outline-none focus:bg-white/5 transition-all"
                                    />
                                    <button 
                                        onClick={() => setQuantity(prev => prev + 1)}
                                        className="flex-1 flex items-center justify-center text-white hover:bg-white/5 transition-colors"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase text-xs tracking-widest shadow-[0_4px_25px_rgba(220,38,38,0.4)]"
                                >
                                    <ShoppingBag size={18} />
                                    Добави Избора
                                </button>
                            </div>
                        </div>

                         <div className="lg:hidden fixed bottom-0 left-0 right-0 p-6 bg-[#080808]/95 backdrop-blur-xl border-t border-white/5 z-[60] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pb-safe">
                             <div className="flex items-center gap-4 h-14">
                                 <div className="flex bg-[#0f0f0f] rounded-2xl border border-white/10 overflow-hidden h-full max-w-[120px]">
                                     <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="flex-1 px-3 flex items-center justify-center text-white"><Minus size={16} /></button>
                                     <input 
                                         type="text"
                                         inputMode="numeric"
                                         value={quantity === 0 ? "" : quantity}
                                         onChange={(e) => handleQuantityChange(e.target.value)}
                                         onBlur={handleQuantityBlur}
                                         className="flex-1 w-full bg-transparent border-x border-white/10 text-center font-mono font-black text-white outline-none focus:bg-white/5 transition-all min-w-[40px]"
                                     />
                                     <button onClick={() => setQuantity(prev => prev + 1)} className="flex-1 px-3 flex items-center justify-center text-white"><Plus size={16} /></button>
                                 </div>
                                 <button
                                     onClick={handleAddToCart}
                                     className="flex-1 h-full bg-red-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-[0.15em] shadow-[0_8px_30px_rgba(220,38,38,0.4)] active:scale-95 transition-all"
                                 >
                                     <ShoppingBag size={18} />
                                     Добави ({(priceValue * Math.max(1, quantity)).toFixed(2)}€)
                                 </button>
                             </div>
                         </div>

                    </div>
                </div>
            </motion.div>
            
            <AnimatePresence>
                {isShareOpen && (
                    <ShareProductModal 
                        isOpen={isShareOpen}
                        onClose={() => setIsShareOpen(false)}
                        product={product}
                        variantName={(product.cardImages && product.cardImages.length > 0) ? `Вариант ${activeIdx + 1}` : undefined}
                    />
                )}
            </AnimatePresence>

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

export default ProductQuickViewModal;
