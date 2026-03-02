import React, { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { useToast } from '../hooks/useToast';
import { AnimatePresence, motion } from 'framer-motion';
import { getOptimizedUrl } from '../lib/cloudinary-utils';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { 
    ShoppingBag, 
    ArrowLeft, 
    ArrowRight, 
    Minus, 
    Plus, 
    Maximize2, 
    CheckCircle2,
    ShieldCheck,
    Truck,
    RotateCcw,
    X,
    ChevronRight,
    Search
} from 'lucide-react';

/* ─── Full-screen zoom lightbox ─── */
const Lightbox: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black/96 flex flex-col items-center justify-center backdrop-blur-xl"
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

/* ─── Main Page ─── */
const ProductDetailsPage: React.FC = () => {
    const { t } = useTranslation();
    const { slug } = useParams<{ slug: string }>();
    const { getProductBySlug, loading } = useProducts();
    const product = getProductBySlug(slug || '');

    const [activeIdx, setActiveIdx] = useState(0);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const thumbsRef = useRef<HTMLDivElement>(null);
    const { addToCart } = useCart();
    const { showToast } = useToast();
    
    /* breadcrumb logic */
    const displayCategory = product?.categories.find(c => c.toLowerCase().includes('cm')) || product?.categories[0];
    const isSize = displayCategory?.toLowerCase().includes('cm');
    const catalogPath = isSize 
        ? `/catalog?sizes=${encodeURIComponent(displayCategory)}` 
        : `/catalog/category/${encodeURIComponent(displayCategory?.toLowerCase() || '')}`;

    /* price */
    let price = '';
    if (product?.wholesalePriceEur) price = product.wholesalePriceEur.toFixed(2);
    else if (product?.price_eur) price = product.price_eur.toFixed(2);

    /* images */
    const images: string[] = product
        ? (product.cardImages && product.cardImages.length > 0
            ? product.cardImages
            : [product.coverImage || product.avatar])
        : [];

    const mainSrc = images[activeIdx] || '';

    if (loading) return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-600 text-xs uppercase tracking-widest">Зареждане</p>
            </div>
        </div>
    );

    if (!product) return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center">
            <p className="text-zinc-500 uppercase tracking-widest">{t('catalog.not_found', 'Продуктът не е намерен')}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-red-600/30">
            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                @keyframes pulse-soft {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                .animate-pulse-soft { animation: pulse-soft 3s infinite ease-in-out; }
            `}</style>
            
            {/* ── Breadcrumb & Mobile Back ── */}
            <div className="sticky top-20 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 py-4">
                <div className="container mx-auto max-w-7xl px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-medium text-zinc-500 overflow-x-auto no-scrollbar whitespace-nowrap">
                        <Link to="/catalog" className="hover:text-red-500 transition-colors flex items-center gap-1">
                            {t('nav.catalog', 'Каталог')}
                        </Link>
                        <ChevronRight size={10} className="text-zinc-700 shrink-0" />
                        {displayCategory && (
                            <>
                                <Link to={catalogPath} className="hover:text-red-500 transition-colors">
                                    {displayCategory}
                                </Link>
                                <ChevronRight size={10} className="text-zinc-700 shrink-0" />
                            </>
                        )}
                        <span className="text-zinc-300 truncate max-w-[150px] md:max-w-none">{product.name}</span>
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="container mx-auto max-w-7xl px-6 pt-8 pb-32 md:pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

                    {/* ═══ LEFT — Gallery Zone (7/12 cols) ═══ */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="relative group">
                            {/* Main Display */}
                            <motion.div
                                key={mainSrc}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="relative aspect-square w-full bg-[#0F0F0F] rounded-3xl border border-white/5 overflow-hidden flex items-center justify-center group/main cursor-zoom-in"
                                onClick={() => setLightboxSrc(mainSrc)}
                            >
                                {/* Background Glow */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-red-600/5 via-transparent to-red-600/5" />
                                
                                <img
                                    src={getOptimizedUrl(mainSrc, { width: 1200 })}
                                    alt={product.name}
                                    className="w-[85%] h-[85%] object-contain transition-transform duration-700 group-hover/main:scale-105 pointer-events-none select-none"
                                    draggable={false}
                                />

                                {product.isBestSeller && (
                                    <div className="absolute top-6 left-6 flex items-center gap-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-[0_4px_20px_rgba(220,38,38,0.4)]">
                                        <CheckCircle2 size={12} />
                                        {t('catalog.best_seller', 'Best Seller')}
                                    </div>
                                )}

                                {/* Interactive Overlay */}
                                <div className="absolute bottom-6 right-6 p-4 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white/60 group-hover/main:text-white transition-colors opacity-0 group-hover/main:opacity-100 duration-300">
                                    <Maximize2 size={20} />
                                </div>
                            </motion.div>

                            {/* Nav Buttons (Desktop) */}
                            {images.length > 1 && (
                                <>
                                    <button 
                                        onClick={() => setActiveIdx(prev => (prev > 0 ? prev - 1 : images.length - 1))}
                                        className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <button 
                                        onClick={() => setActiveIdx(prev => (prev < images.length - 1 ? prev + 1 : 0))}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <ArrowRight size={20} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails Control */}
                        {images.length > 1 && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-500">
                                        {t('catalog.variations', 'вариации')} ({images.length})
                                    </span>
                                    <span className="font-mono text-[10px] text-zinc-600">
                                        {activeIdx + 1} / {images.length}
                                    </span>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveIdx(idx)}
                                            className={`relative flex-shrink-0 snap-center h-20 md:h-24 min-w-[80px] md:min-w-[96px] max-w-[180px] md:max-w-[220px] bg-[#0F0F0F] rounded-2xl border-2 transition-all duration-500 overflow-hidden flex items-center justify-center px-4 py-3 ${
                                                activeIdx === idx
                                                    ? 'border-red-600 bg-[#151515] scale-105 shadow-[0_10px_30px_rgba(220,38,38,0.2)]'
                                                    : 'border-white/5 opacity-40 hover:opacity-100 hover:border-white/20'
                                            }`}
                                        >
                                            <img 
                                                src={getOptimizedUrl(img, { width: 200 })} 
                                                alt="" 
                                                className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] transition-transform duration-500 group-hover:scale-110 pointer-events-none select-none" 
                                                draggable={false}
                                            />
                                            {activeIdx === idx && (
                                                <div className="absolute top-2 right-2">
                                                    <motion.div 
                                                        layoutId="active-thumb"
                                                        className="w-2 h-2 bg-red-600 rounded-full shadow-[0_0_12px_rgba(220,38,38,0.8)]" 
                                                    />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ═══ RIGHT — Purchase Info (5/12 cols) ═══ */}
                    <div className="lg:col-span-5 flex flex-col pt-0 md:pt-4">
                        {/* Brand / Origin */}
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-10 h-px bg-red-600" />
                            <span className="text-xs uppercase tracking-[0.4em] font-bold text-red-500">{product.location || 'Premium Quality'}</span>
                        </div>

                        {/* Product Title */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[0.9] mb-8">
                            {product.nameBg || product.name}
                        </h1>

                        {/* Pricing Banner */}
                        <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-8 mb-10 relative overflow-hidden group/price transition-all hover:bg-black/40">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-600/10 blur-[80px] group-hover/price:bg-red-600/20 transition-all" />
                            
                            <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div>
                                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-600 block mb-2">{t('pricing.title', 'Price')}</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl md:text-6xl font-mono font-black text-white">{price}</span>
                                        <span className="text-xl md:text-2xl font-mono font-medium text-red-600">€</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-start md:items-end">
                                    {/* Availability and VAT removed as requested */}
                                </div>
                            </div>
                        </div>

                        {/* Order Controls (Desktop) */}
                        <div className="hidden md:flex flex-col gap-6 mb-10">
                            <div className="flex gap-4">
                                <div className="flex h-16 bg-[#0F0F0F] rounded-2xl border border-white/5 overflow-hidden">
                                    <button 
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="w-16 h-full flex items-center justify-center text-zinc-500 hover:bg-white/5 hover:text-white transition-all"
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
                                                if (!isNaN(parsed)) {
                                                    setQuantity(parsed);
                                                }
                                            }
                                        }}
                                        onBlur={() => {
                                            if (quantity < 1) setQuantity(1);
                                        }}
                                        className="w-14 h-full bg-transparent text-center text-xl font-mono font-black border-x border-white/5 text-white focus:outline-none"
                                    />
                                    <button 
                                        onClick={() => setQuantity(q => q + 1)}
                                        className="w-16 h-full flex items-center justify-center text-zinc-500 hover:bg-white/5 hover:text-white transition-all"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                
                                <button
                                    onClick={() => {
                                        const itemName = product.nameBg || product.name;
                                        addToCart({
                                            id: `${product.slug}-${activeIdx}`,
                                            name: product.name,
                                            name_bg: product.nameBg || product.name,
                                            variant: `Вариант ${activeIdx + 1}`,
                                            selectedSize: isSize ? displayCategory : undefined,
                                            price: parseFloat(price),
                                            quantity,
                                            image: mainSrc,
                                            slug: product.slug
                                        });
                                        showToast(`Добавени ${quantity}бр. от ${itemName}`, "success");
                                    }}
                                    className="flex-1 h-16 bg-white text-black rounded-2xl flex items-center justify-center gap-4 font-black uppercase tracking-[0.2em] text-sm hover:bg-red-600 hover:text-white transition-all group active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:shadow-red-600/30"
                                >
                                    <ShoppingBag size={20} className="transition-transform group-hover:-translate-y-1" />
                                    {t('cart.add_to_cart', 'Добави в количката')}
                                </button>
                            </div>
                        </div>



                    </div>
                </div>
            </div>

            {/* ── Mobile Sticky Purchase Bar ── */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0F0F0F]/90 backdrop-blur-2xl border-t border-white/10 p-5 z-[60] pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">{t('pricing.total', 'ОБЩО')}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-mono font-black text-white">{price}</span>
                            <span className="text-sm font-mono font-bold text-red-600">€</span>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const itemName = product.nameBg || product.name;
                            addToCart({
                                id: `${product.slug}-${activeIdx}`,
                                name: product.name,
                                name_bg: product.nameBg || product.name,
                                variant: `Вариант ${activeIdx + 1}`,
                                selectedSize: isSize ? displayCategory : undefined,
                                price: parseFloat(price),
                                quantity,
                                image: mainSrc,
                                slug: product.slug
                            });
                            showToast(`Добавени ${quantity}бр. от ${itemName}`, "success");
                        }}
                        className="flex-1 h-14 bg-white text-black rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.15em] text-xs hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-xl"
                    >
                        <ShoppingBag size={18} />
                        {t('cart.add_to_cart', 'Добави')}
                    </button>
                    {images.length > 1 && (
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mb-1">{t('catalog.qty', 'БРОЙ')}</span>
                            <div className="flex h-10 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-full flex items-center justify-center text-zinc-400"><Minus size={12}/></button>
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
                                            if (!isNaN(parsed)) {
                                                setQuantity(parsed);
                                            }
                                        }
                                    }}
                                    onBlur={() => {
                                        if (quantity < 1) setQuantity(1);
                                    }}
                                    className="w-8 h-full bg-transparent text-center font-mono font-bold text-xs focus:outline-none"
                                />
                                <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-full flex items-center justify-center text-zinc-400"><Plus size={12}/></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Lightbox ─── */}
            <AnimatePresence>
                {lightboxSrc && (
                    <Lightbox key="lb" src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductDetailsPage;
