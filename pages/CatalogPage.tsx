import React, { useState, useMemo, useEffect } from 'react';
import { normalizeSearch } from '../lib/search-utils';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '../context/UIContext';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { Product } from '../types';
import { getOptimizedUrl } from '../lib/cloudinary-utils';

const CatalogPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { isMobileNavOpen } = useUI();
    const { category: urlCategory } = useParams<{ category?: string }>();
    const { getAllProducts, loading } = useProducts();
    const allProducts = getAllProducts();

    const [searchParams, setSearchParams] = useSearchParams();
    
    // Initial state from URL params
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [selectedSizes, setSelectedSizes] = useState<string[]>(searchParams.get('sizes')?.split(',').filter(Boolean) || []);
    const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory || searchParams.get('cat') || 'All');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'default');
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
    
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]); 
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const itemsPerPage = 18;

    // Dynamic Categories, Sizes & Tag counts
    const filterStats = useMemo(() => {
        const catMap: Record<string, number> = {};
        const sizeSet = new Set<string>();
        let maxP = 20;
        
        allProducts.forEach(p => {
            p.categories.forEach(cat => {
                const isSizeCandidate = cat.toLowerCase().includes('cm') || /^\d+x\d+$/.test(cat.toLowerCase());
                if (isSizeCandidate) {
                    sizeSet.add(cat);
                } else {
                    catMap[cat] = (catMap[cat] || 0) + 1;
                }
            });
            const genericSizes = ['small', 'medium', 'large', 'various', 'xl', 'xxl'];
            if (p.size && !genericSizes.includes(p.size.toLowerCase())) sizeSet.add(p.size);

            const pPrice = p.price_eur || p.wholesalePriceEur || 0;
            if (pPrice > maxP) maxP = Math.ceil(pPrice);
        });

        return { 
            categories: Object.entries(catMap).map(([name, count]) => ({ name, count })),
            sizes: Array.from(sizeSet).sort((a, b) => {
                const aNum = parseInt(a) || 0;
                const bNum = parseInt(b) || 0;
                return aNum - bNum;
            }),
            maxPrice: maxP
        };
    }, [allProducts]);

    // Prices distribution data
    const priceBins = useMemo(() => {
        const bins = 40;
        const distribution = new Array(bins).fill(0);
        const max = filterStats.maxPrice;
        
        allProducts.forEach(p => {
            const price = p.price_eur || p.wholesalePriceEur || 0;
            const binIdx = Math.min(Math.floor((price / max) * bins), bins - 1);
            distribution[binIdx]++;
        });

        const maxCount = Math.max(...distribution, 1);
        return distribution.map(count => (count / maxCount) * 100);
    }, [allProducts, filterStats.maxPrice]);

    // Update selected category if URL changes (Case-insensitive matching)
    useEffect(() => {
        if (urlCategory) {
            if (urlCategory.toLowerCase() === 'all') {
                setSelectedCategory('All');
                return;
            }
            
            // If the category URL matches a size (contains 'cm'), set it as size instead
            const isSize = urlCategory.toLowerCase().includes('cm');
            if (isSize) {
                const matchingSize = filterStats.sizes.find(s => s.toLowerCase() === urlCategory.toLowerCase()) || urlCategory;
                setSelectedSizes(prev => prev.includes(matchingSize) ? prev : [...prev, matchingSize]);
                setSelectedCategory('All');
                return;
            }

            const match = filterStats.categories.find(c => c.name.toLowerCase() === urlCategory.toLowerCase());
            if (match) {
                setSelectedCategory(match.name);
            } else {
                setSelectedCategory(urlCategory);
            }
        }
    }, [urlCategory, filterStats.categories, filterStats.sizes]);

    // Sync state to URL params
    useEffect(() => {
        const params: Record<string, string> = {};
        if (searchTerm) params.q = searchTerm;
        if (selectedCategory !== 'All' && !urlCategory) params.cat = selectedCategory;
        if (selectedSizes.length > 0) params.sizes = selectedSizes.join(',');
        if (sortBy !== 'default') params.sort = sortBy;
        if (currentPage > 1) params.page = currentPage.toString();
        
        setSearchParams(params, { replace: true });
    }, [searchTerm, selectedCategory, selectedSizes, sortBy, currentPage, urlCategory, setSearchParams]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedSizes, selectedCategory, sortBy, priceRange]);

    // Scroll to top when page or filters change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage, searchTerm, selectedSizes, selectedCategory, sortBy, priceRange]);

    // Sync initial price range once products load
    useEffect(() => {
        if (allProducts.length > 0) {
            setPriceRange([0, filterStats.maxPrice]);
        }
    }, [allProducts.length, filterStats.maxPrice]);

    // Handle mobile filters drawer (Body Scroll Lock & Back Button)
    useEffect(() => {
        if (isMobileFiltersOpen) {
            document.body.style.overflow = 'hidden';
            
            // Push state for back button handling
            window.history.pushState({ modal: 'mobile-filters' }, '');
            
            const handlePopState = (e: PopStateEvent) => {
                // When back button is pressed, close the filters
                setIsMobileFiltersOpen(false);
            };

            window.addEventListener('popstate', handlePopState);
            
            return () => {
                window.removeEventListener('popstate', handlePopState);
                document.body.style.overflow = '';
            };
        }
    }, [isMobileFiltersOpen]);

    const handleCloseFilters = () => {
        setIsMobileFiltersOpen(false);
        // If we still have our custom state in history, go back to remove it
        if (window.history.state?.modal === 'mobile-filters') {
            window.history.back();
        }
    };

    // Detect mobile keyboard close (e.g. via Android/iOS Back button or done button) and remove focus
    useEffect(() => {
        if (typeof window !== 'undefined' && window.visualViewport) {
          let isKeyboardOpen = false;
    
          const handleViewportResize = () => {
            const currentHeight = window.visualViewport?.height || window.innerHeight;
            const screenHeight = window.innerHeight;
            
            if (currentHeight < screenHeight * 0.8) {
              isKeyboardOpen = true;
            } else if (currentHeight > screenHeight * 0.9 && isKeyboardOpen) {
              isKeyboardOpen = false;
              if (
                document.activeElement instanceof HTMLInputElement ||
                document.activeElement instanceof HTMLTextAreaElement ||
                document.activeElement instanceof HTMLButtonElement
              ) {
                document.activeElement.blur();
              }
            }
          };
    
          window.visualViewport.addEventListener('resize', handleViewportResize);
          return () => {
            window.visualViewport?.removeEventListener('resize', handleViewportResize);
          };
        }
    }, []);

    // Detect scroll to hide floating filter button near the bottom (pagination/footer)
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + window.innerHeight;
            const bottomPosition = document.documentElement.scrollHeight;
            // 450px threshold is roughly the space taken by pagination + footer
            setIsAtBottom(bottomPosition - scrollPosition < 450);
        };
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const filteredProducts = useMemo(() => {
        return allProducts.filter(product => {
            // Search Term Filter
            if (searchTerm.trim()) {
                const query = searchTerm.toLowerCase().trim();
                const searchVariations = normalizeSearch(query);
                const productName = product.name.toLowerCase();
                const productNameBg = (product.nameBg || '').toLowerCase();
                const productSlug = (product.slug || '').toLowerCase();

                const searchMatch = searchVariations.some(v => 
                    productName.includes(v) || 
                    productNameBg.includes(v) ||
                    productSlug.includes(v)
                );
                
                if (!searchMatch) return false;
            }

            // Category Filter
            if (selectedCategory !== 'All' && !product.categories.includes(selectedCategory)) return false;

            // Price Filter
            const price = product.price_eur || product.wholesalePriceEur || 0;
            if (price < priceRange[0] || price > priceRange[1]) return false;

            // Size Filter
            if (selectedSizes.length > 0) {
                const isSizeMatch = selectedSizes.some(size => product.size === size || product.categories.includes(size));
                if (!isSizeMatch) return false;
            }

            if (product.isHidden) return false;

            return true;
        }).sort((a, b) => {
            const priceA = a.price_eur || a.wholesalePriceEur || 0;
            const priceB = b.price_eur || b.wholesalePriceEur || 0;
            if (sortBy === 'price_asc') return priceA - priceB;
            if (sortBy === 'price_desc') return priceB - priceA;
            if (sortBy === 'name_asc') {
                const nameA = (a.nameBg || a.name).toLowerCase();
                const nameB = (b.nameBg || b.name).toLowerCase();
                return nameA.localeCompare(nameB, i18n.language);
            }
            return 0;
        });
    }, [allProducts, searchTerm, selectedCategory, priceRange, selectedSizes, sortBy, i18n.language]);

    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(start, start + itemsPerPage);
    }, [filteredProducts, currentPage]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Prefetch logic for pagination
    const prefetchPage = (pageNumber: number) => {
        // Disabled to prevent Cloudinary/Supabase free limit exhaustion 
        // especially on mobile devices where touch events can fire multiple times rapidly.
        return;
    };

    const renderFilters = () => (
        <>
            {/* Search */}
            <div className="relative mb-10">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#525252]" size={18} />
                <input 
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.currentTarget.blur();
                        }
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    className="w-full bg-[#1A1A1A] border border-transparent focus:border-[#404040] rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-[#525252] outline-none transition-all"
                />
            </div>

            {/* Categories */}
            <div className="mb-10">
                <h3 className="text-[11px] font-bold text-[#525252] uppercase tracking-[0.2em] mb-6">{t('catalog.all_categories')}</h3>
                <ul className="space-y-4">
                    <li 
                        onClick={() => setSelectedCategory('All')}
                        className="group cursor-pointer flex items-center justify-between transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full ${selectedCategory === 'All' ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-transparent group-hover:bg-[#404040]'}`} />
                            <span className={`text-[15px] ${selectedCategory === 'All' ? 'text-white font-medium' : 'text-[#A3A3A3] group-hover:text-white'}`}>
                                {t('catalog.all')}
                            </span>
                        </div>
                        <span className="text-xs text-[#525252]">{allProducts.length}</span>
                    </li>
                    {filterStats.categories.map((cat) => (
                        <li 
                            key={cat.name} 
                            onClick={() => setSelectedCategory(cat.name)}
                            className="group cursor-pointer flex items-center justify-between transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full ${selectedCategory === cat.name ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-transparent group-hover:bg-[#404040]'}`} />
                                <span className={`text-[15px] ${selectedCategory === cat.name ? 'text-white font-medium' : 'text-[#A3A3A3] group-hover:text-white'}`}>
                                    {cat.name}
                                </span>
                            </div>
                            <span className="text-xs text-[#525252] group-hover:text-white transition-colors">{cat.count}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Size */}
            <div className="mb-10">
                <h3 className="text-[11px] font-bold text-[#525252] uppercase tracking-[0.2em] mb-6">{t('profile.height')}</h3>
                <div className="grid grid-cols-2 gap-2">
                    {filterStats.sizes.map(size => (
                        <button
                            key={size}
                            onClick={() => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                            className={`h-11 md:h-10 px-3 rounded-xl flex items-center justify-center text-xs md:text-[10px] font-bold transition-all border ${
                                selectedSizes.includes(size) 
                                ? 'bg-white text-black border-white shadow-[0_4px_12px_rgba(255,255,255,0.2)]' 
                                : 'bg-[#1A1A1A] text-[#525252] border-transparent hover:border-[#404040] hover:text-[#A3A3A3]'
                            }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

            { (selectedCategory !== 'All' || selectedSizes.length > 0 || searchTerm) && (
                <button
                    onClick={() => {
                        setSelectedCategory('All');
                        setSelectedSizes([]);
                        setSearchTerm('');
                    }}
                    className="w-full py-4 rounded-xl border border-[#262626] text-[#A3A3A3] text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all mb-10"
                >
                    Изчисти филтрите
                </button>
            )}

        </>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-[#E2E8F0] font-sans pb-20 lg:pb-0">
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            
            {/* --- Mobile Bottom Nav (Filter Toggle) --- */}
            <AnimatePresence>
                {!isMobileNavOpen && !isAtBottom && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: 50, x: "-50%" }}
                        transition={{ duration: 0.3 }}
                        className="lg:hidden fixed bottom-10 left-1/2 z-[100]"
                    >
                        <button 
                            onClick={() => setIsMobileFiltersOpen(true)}
                            className="bg-white text-black px-6 py-3.5 rounded-full flex items-center gap-2 font-bold shadow-[0_10px_30px_rgba(255,255,255,0.2)] active:scale-95 transition-all text-sm uppercase tracking-wider"
                        >
                            <SlidersHorizontal size={18} />
                            <span>{t('catalog.filters')}</span>
                            { (selectedCategory !== 'All' || selectedSizes.length > 0) && (
                                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Mobile Filter Drawer --- */}
            <AnimatePresence>
                {isMobileFiltersOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseFilters}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] lg:hidden"
                        />
                        <motion.aside 
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-x-0 bottom-0 max-h-[90vh] bg-[#0F0F0F] border-t border-[#262626] rounded-t-[40px] p-8 overflow-y-auto no-scrollbar z-[120] lg:hidden shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-semibold text-white">{t('catalog.filters')}</h2>
                                <button onClick={handleCloseFilters} className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            {renderFilters()}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <div className="flex">
                {/* --- Sidebar (Desktop) --- */}
                <aside className="w-80 h-screen sticky top-0 bg-[#0F0F0F] border-r border-[#262626] p-8 overflow-y-auto no-scrollbar hidden lg:block">
                    <div className="flex items-center gap-3 mb-10 text-white">
                        <SlidersHorizontal size={20} />
                        <h2 className="text-xl font-semibold tracking-tight">{t('catalog.filters')}</h2>
                    </div>
                    {renderFilters()}
                </aside>

                <main className="flex-1 p-4 md:p-8 lg:p-12">
                    <div className="max-w-[1400px] mx-auto">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
                            <div className="w-full md:w-auto">
                                <h1 className="text-[28px] md:text-[40px] font-bold text-white mb-4 md:mb-6">
                                    {selectedCategory === 'All' ? t('catalog.welcome_modules.all') : selectedCategory}
                                </h1>
                                {/* Filter Chips */}
                                <div className="flex flex-wrap gap-2 items-center">
                                    {selectedCategory !== 'All' && (
                                        <div className="bg-[#1A1A1A] border border-[#262626] rounded-full px-3 py-1.5 md:px-4 md:py-2.5 flex items-center gap-2 text-[12px] md:text-sm text-[#A3A3A3]">
                                            <span>{selectedCategory}</span>
                                            <button onClick={() => setSelectedCategory('All')} className="hover:text-white transition-colors">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                    { (priceRange[0] > 0 || priceRange[1] < filterStats.maxPrice) && (
                                        <div className="bg-[#1A1A1A] border border-[#262626] rounded-full px-3 py-1.5 md:px-4 md:py-2.5 flex items-center gap-2 text-[12px] md:text-sm text-[#A3A3A3]">
                                            <span>€{priceRange[0].toFixed(0)}-{priceRange[1].toFixed(0)}</span>
                                            <button onClick={() => setPriceRange([0, filterStats.maxPrice])} className="hover:text-white transition-colors">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                    {selectedSizes.map((size) => (
                                        <div key={size} className="bg-[#1A1A1A] border border-[#262626] rounded-full px-3 py-1.5 md:px-4 md:py-2.5 flex items-center gap-2 text-[12px] md:text-sm text-[#A3A3A3]">
                                            <span>{size}</span>
                                            <button onClick={() => setSelectedSizes(prev => prev.filter(s => s !== size))} className="hover:text-white transition-colors">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-6 text-xs md:text-sm text-[#737373]">
                                <div className="relative">
                                    <button 
                                        onClick={() => setIsSortOpen(!isSortOpen)}
                                        className="flex items-center gap-2 hover:text-white transition-colors py-2"
                                    >
                                        <span className="font-medium">
                                            {sortBy === 'default' ? t('catalog.sort.label') : t(`catalog.sort.${sortBy}`)}
                                        </span>
                                        <ChevronDown size={14} className={`transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    <AnimatePresence>
                                        {isSortOpen && (
                                            <>
                                                <motion.div 
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setIsSortOpen(false)}
                                                />
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute top-full left-0 md:left-auto md:right-0 mt-2 w-56 bg-[#1A1A1A] border border-[#262626] rounded-2xl py-2 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                                                >
                                                    {[
                                                        { id: 'default',   label: t('catalog.sort.default') },
                                                        { id: 'price_asc',  label: t('catalog.sort.price_asc') },
                                                        { id: 'price_desc', label: t('catalog.sort.price_desc') },
                                                        { id: 'name_asc',   label: t('catalog.sort.name_asc') }
                                                    ].map((opt) => (
                                                        <button 
                                                            key={opt.id}
                                                            onClick={() => { setSortBy(opt.id); setIsSortOpen(false); }} 
                                                            className={`w-full text-left px-5 py-3.5 text-xs transition-colors hover:bg-white/5 flex items-center justify-between ${sortBy === opt.id ? 'text-white font-bold bg-white/5' : 'text-[#737373]'}`}
                                                        >
                                                            {opt.label}
                                                            {sortBy === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="font-mono text-[10px] md:text-[11px] uppercase tracking-widest bg-[#1A1A1A] px-3 py-1.5 rounded-full border border-[#262626] text-white">
                                    {filteredProducts.length} {t('catalog.results')}
                                </div>
                            </div>
                        </div>

                        {/* Product Grid - Reduced padding for mobile to gain space */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-5 md:gap-8 min-h-[500px]">
                            {paginatedProducts.map((product, index) => (
                                <motion.div
                                    key={product.slug}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ProductCard product={product} isPriority={index < 6} />
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination - Add flex-wrap and slightly smaller mobile buttons to prevent horizontal overflow on middle pages */}
                        {totalPages > 1 && (
                            <div className="mt-16 md:mt-24 flex flex-wrap items-center justify-center gap-2 px-2">
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="w-12 h-12 rounded-xl md:rounded-2xl bg-[#1A1A1A] border border-[#262626] flex items-center justify-center text-[#A3A3A3] hover:text-white hover:border-[#404040] disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90 shrink-0"
                                >
                                    <ChevronDown size={20} className="rotate-90" />
                                </button>
                                
                                <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar max-w-[calc(100vw-130px)] sm:max-w-none px-2 py-2">
                                    {[...Array(totalPages)].map((_, i) => {
                                        const page = i + 1;
                                        // Mobile Window Logic: First, Last, Current, and neighbors
                                        const isPageVisible = 
                                            page === 1 || 
                                            page === totalPages || 
                                            (page >= currentPage - 1 && page <= currentPage + 1);
                                        
                                        if (isPageVisible) {
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl md:rounded-2xl text-[15px] font-black transition-all border ${
                                                        currentPage === page 
                                                        ? 'bg-white text-black border-white shadow-[0_4px_15px_rgba(255,255,255,0.3)] scale-110 z-10' 
                                                        : 'bg-[#1A1A1A] text-[#525252] border-transparent hover:border-[#404040] hover:text-[#A3A3A3]'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        }
                                        
                                        // Show Dots if gap exists
                                        if (page === currentPage - 2 || page === currentPage + 2) {
                                            return <span key={page} className="text-[#333] px-1 text-[10px] font-bold shrink-0 self-center">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="w-12 h-12 rounded-xl md:rounded-2xl bg-[#1A1A1A] border border-[#262626] flex items-center justify-center text-[#A3A3A3] hover:text-white hover:border-[#404040] disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90 shrink-0"
                                >
                                    <ChevronDown size={20} className="-rotate-90" />
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CatalogPage;
