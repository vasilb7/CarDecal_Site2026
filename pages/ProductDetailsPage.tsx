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
    Search,
    Share2
} from 'lucide-react';
import ShareProductModal from '../components/ShareProductModal';
import OptimizedImage from '../components/ui/OptimizedImage';
import SEO from '../components/SEO';

/* ─── Full-screen zoom lightbox ─── */
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
            className="absolute top-6 right-6 z-50 p-3 bg-zinc-900/90 hover:bg-zinc-800 rounded-full text-white transition-all hover:scale-110 active:scale-90 flex items-center justify-center border border-white/10"
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
    const [isShareOpen, setIsShareOpen] = useState(false);
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
    const priceValue = product?.price_eur ?? product?.wholesalePriceEur ?? 0;
    price = priceValue.toFixed(2);

    /* images */
    const images: string[] = product ? Array.from(new Set([
        ...(product.cardImages || []),
        product.coverImage || product.avatar
    ].filter(Boolean) as string[])) : [];

    const mainSrc = images[activeIdx] || '';

    const handleAddToCart = () => {
        if (!product) return;
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
    };

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
            <SEO title={product?.nameBg || product?.name} />
            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                @keyframes pulse-soft {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                .animate-pulse-soft { animation: pulse-soft 3s infinite ease-in-out; }
            `}</style>
            
            {/* ── Breadcrumb & Mobile Back ── */}
            <div className="sticky top-20 z-40 bg-[#0A0A0A] border-b border-white/5 py-4">
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
            <div className="container mx-auto max-w-7xl px-6 pt-8 pb-[240px] md:pb-20">
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

                                <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex items-center gap-2 opacity-0 group-hover/main:opacity-100 transition-opacity duration-300">
                                    <button 
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsShareOpen(true);
                                        }}
                                        className="p-3 md:p-4 bg-black/60 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-black transition-colors"
                                        title="Сподели"
                                    >
                                        <Share2 size={20} />
                                    </button>
                                    <div className="p-3 md:p-4 bg-black/60 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-black transition-colors">
                                        <Maximize2 size={20} />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Nav Buttons (Desktop) - Only if multiple images */}
                            {images.length > 1 && (
                                <>
                                    <button 
                                        onClick={() => setActiveIdx(prev => (prev > 0 ? prev - 1 : images.length - 1))}
                                        className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <button 
                                        onClick={() => setActiveIdx(prev => (prev < images.length - 1 ? prev + 1 : 0))}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <ArrowRight size={20} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails Control - Only if cardImages exist */}
                        {product.cardImages && product.cardImages.length > 0 && (
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
                                            <OptimizedImage 
                                                src={img} 
                                                alt="" 
                                                className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] transition-transform duration-500 group-hover:scale-110 pointer-events-none select-none" 
                                                priority={false}
                                                widths={[200]}
                                                sizes="100px"
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
                            <span className="text-xs uppercase tracking-[0.4em] font-bold text-red-500">{product.location || 'Произведено от CarDecal'}</span>
                        </div>

                        {/* Product Title */}
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-tight mb-8 break-words">
                            {product.nameBg || product.name}
                        </h1>

                        {/* Pricing Banner */}
                        <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-8 mb-8 relative overflow-hidden group/price transition-all hover:bg-black/40">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-600/10 blur-[80px] group-hover/price:bg-red-600/20 transition-all" />
                            
                            <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div>
                                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-600 block mb-2">{t('pricing.title', 'Price')}</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl md:text-6xl font-mono font-black text-white">{price}</span>
                                        <span className="text-xl md:text-2xl font-mono font-medium text-red-600">€</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Variant Selection Buttons - Only if cardImages exist */}
                        {product.cardImages && product.cardImages.length > 0 && (
                            <div className="mb-8 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase tracking-[0.3em] font-black text-white/60">
                                        Изберете вариант
                                    </span>
                                    <span className="font-mono text-[10px] text-zinc-600">
                                        {activeIdx + 1} / {images.length}
                                    </span>
                                </div>
                                <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-3">
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

                        {/* Add to Cart Actions */}
                        <div className="flex flex-col gap-4 mb-10">
                            <div className="flex gap-4 h-16">
                                <div className="flex bg-[#0F0F0F] rounded-2xl border border-white/10 overflow-hidden w-32 shrink-0">
                                    <button 
                                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                        className="flex-1 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <Minus size={20} />
                                    </button>
                                    <div className="flex-1 flex items-center justify-center font-mono font-black text-lg border-x border-white/10">
                                        {quantity}
                                    </div>
                                    <button 
                                        onClick={() => setQuantity(prev => prev + 1)}
                                        className="flex-1 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase text-xs tracking-widest shadow-[0_8px_30px_rgba(220,38,38,0.4)]"
                                >
                                    <ShoppingBag size={20} />
                                    {t('catalog.add_to_cart', 'Добави Избора')}
                                </button>
                            </div>
                        </div>

                        {/* Description & Specs */}
                        <div className="space-y-8 border-t border-white/5 pt-10">
                            <div className="space-y-4">
                                <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-500">Детайли за продукта</h3>
                                <div className="text-zinc-400 text-sm md:text-base leading-relaxed font-medium space-y-4">
                                    <p>• Защита: Пълна водоустойчивост и вграден UV филтър срещу избледняване.</p>
                                    <p>• Издръжливост: Устойчиви на автомивка, високи температури и сняг.</p>
                                    <p>• Качество: Професионален печат с висока резолюция и наситени, живи цветове.</p>
                                    <p>• Монтаж: Силно прилепващо лепило, което не оставя следи при премахване.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox / Share Modals */}
            <AnimatePresence>
                {lightboxSrc && (
                    <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
                )}
                {isShareOpen && (
                    <ShareProductModal 
                        isOpen={isShareOpen}
                        onClose={() => setIsShareOpen(false)}
                        product={product}
                        variantName={(product.cardImages && product.cardImages.length > 0) ? `Вариант ${activeIdx + 1}` : undefined}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductDetailsPage;
