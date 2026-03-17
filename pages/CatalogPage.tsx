import React, { useState, useMemo, useEffect, useRef } from 'react';
import { normalizeSearch, findClosestMatch } from '../lib/search-utils';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '../context/UIContext';
import { Search, SlidersHorizontal, X, ChevronDown, LayoutGrid, List } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { Product } from '../types';
import { getOptimizedUrl } from '../lib/cloudinary-utils';
import ErrorStateCard from '../components/ErrorStateCard';
import SEO from '../components/SEO';

const CatalogPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { isMobileNavOpen } = useUI();
    const { category: urlCategory } = useParams<{ category?: string }>();
    const { getAllProducts, loading, categories: dbCategoriesMetadata } = useProducts();
    const allProducts = getAllProducts();
    const activeProducts = useMemo(() => allProducts.filter(p => !p.isHidden), [allProducts]);

    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const isModalOpen = !!location.state?.backgroundLocation || (location.pathname.startsWith('/catalog/') && location.pathname.split('/').length === 3);
    
    // Initial state from URL params
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [localSearchValue, setLocalSearchValue] = useState(searchTerm);
    const [selectedSizes, setSelectedSizes] = useState<string[]>(searchParams.get('sizes')?.split(',').filter(Boolean) || []);
    const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory || searchParams.get('cat') || 'All');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'default');
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
    
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]); 
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    
    // Pending states for mobile filters with staging logic
    const [pendingCategory, setPendingCategory] = useState<string>('All');
    const [pendingSizes, setPendingSizes] = useState<string[]>([]);
    
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const paginationRef = useRef<HTMLDivElement>(null);
    const [isGridView, setIsGridView] = useState(false); // Default to 1 column (false) based on "(defaut)" request
    const itemsPerPage = 18;

    // Dynamic Categories, Sizes & Tag counts
    const filterStats = useMemo(() => {
        const catMap: Record<string, number> = {};
        const dynamicSizeSet = new Set<string>();
        let maxP = 20;
        
        // Use pending category if mobile drawer is open to show real-time sizes
        const activeCategoryForSizes = isMobileFiltersOpen ? pendingCategory : selectedCategory;

        allProducts.forEach(p => {
            // Global categories count
            p.categories.forEach(cat => {
                const isSizeCandidate = cat.toLowerCase().includes('cm') || 
                                      /^\d+x\d+$/.test(cat.toLowerCase()) || 
                                      /^\d+×\d+$/.test(cat);
                if (!isSizeCandidate) {
                    catMap[cat] = (catMap[cat] || 0) + 1;
                }
            });

            // Dynamic sizes logic:
            // Check if product belongs to the currently active category (real-time for mobile)
            const matchesCategory = activeCategoryForSizes === 'All' || p.categories.includes(activeCategoryForSizes);
            
            if (matchesCategory) {
                // Find sizes associated with this product
                const productSizes = p.categories.filter(cat => 
                    cat.toLowerCase().includes('cm') || 
                    /^\d+x\d+$/.test(cat.toLowerCase()) ||
                    /^\d+×\d+$/.test(cat) 
                );
                if (p.size) productSizes.push(p.size);
                
                productSizes.forEach(s => dynamicSizeSet.add(s));
            }

            const pPrice = p.price_eur || p.wholesalePriceEur || 0;
            if (pPrice > maxP) maxP = Math.ceil(pPrice);
        });

        const genericSizes = ['small', 'medium', 'large', 'various', 'xl', 'xxl'];
        const finalSizes = Array.from(dynamicSizeSet)
            .filter(s => {
                const isGeneric = genericSizes.includes(s.toLowerCase());
                const isDimension = s.toLowerCase().includes('cm') || 
                                  /^\d+x\d+$/.test(s.toLowerCase()) || 
                                  /^\d+×\d+$/.test(s);
                return !isGeneric && isDimension;
            })
            .sort((a, b) => {
                // Custom sort to handle "30x40" and "10cm" types
                const aMatch = a.match(/\d+/);
                const bMatch = b.match(/\d+/);
                const aNum = aMatch ? parseInt(aMatch[0]) : 0;
                const bNum = bMatch ? parseInt(bMatch[0]) : 0;
                return aNum - bNum;
            });

        return {
            categories: Object.entries(catMap).map(([name, count]) => ({ name, count })),
            sizes: finalSizes,
            maxPrice: maxP
        };
    }, [allProducts, selectedCategory, pendingCategory, isMobileFiltersOpen]);

    // Dynamic Categories: Filter out categories that consist only of hidden products
    const dynamicCategories = useMemo(() => {
        const catMap: Record<string, number> = {};
        
        activeProducts.forEach(p => {
            p.categories.forEach(cat => {
                const isSizeCandidate = cat.toLowerCase().includes('cm') || 
                                      /^\d+x\d+$/.test(cat.toLowerCase()) || 
                                      /^\d+×\d+$/.test(cat);
                if (!isSizeCandidate) {
                    catMap[cat] = (catMap[cat] || 0) + 1;
                }
            });
        });

        // Use metadata from categories table to get Bulgarian names and order
        const EXCLUDED_NAMES = ["Всички", "Стикери", "Всички стикери"];
        
        const filtered = dbCategoriesMetadata
            .filter(cat => catMap[cat.name] && !EXCLUDED_NAMES.includes(cat.name))
            .map(cat => ({
                name: cat.name,
                name_bg: cat.name_bg || cat.name,
                count: catMap[cat.name] || 0,
                display_order: cat.display_order || 0
            }));

        // Append any categories found in products but not in metadata table (just in case)
        const metadataNames = new Set(dbCategoriesMetadata.map(c => c.name));
        Object.entries(catMap).forEach(([name, count]) => {
            const isExcluded = EXCLUDED_NAMES.some(ex => ex.toLowerCase() === name.toLowerCase());
            if (!metadataNames.has(name) && !isExcluded) {
                filtered.push({
                    name,
                    name_bg: name,
                    count,
                    display_order: 999
                });
            }
        });

        return filtered.sort((a, b) => a.display_order - b.display_order);
    }, [activeProducts, dbCategoriesMetadata]);

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

            const match = dynamicCategories.find(c => c.name.toLowerCase() === urlCategory.toLowerCase());
            if (match) {
                setSelectedCategory(match.name);
            } else {
                setSelectedCategory(urlCategory);
            }
        }
    }, [urlCategory, dynamicCategories, filterStats.sizes]);

    // Determine current state based on URL, if param is absent, fall back to default
    const currentSearchTerm = searchParams.get('q') || '';
    const currentSizes = searchParams.get('sizes')?.split(',').filter(Boolean) || [];
    const currentCategory = urlCategory || searchParams.get('cat') || 'All';
    const currentSortBy = searchParams.get('sort') || 'default';
    const currentPageNum = parseInt(searchParams.get('page') || '1');

    // URL to State synchronization (Handles Back/Forward navigation)
    useEffect(() => {
        if (isModalOpen) return;

        // Only update local state if URL represents a DIFFERENT state than what we have
        // This avoids the "bounce-back" effect while typing/debouncing
        if (searchTerm !== currentSearchTerm) {
            setSearchTerm(currentSearchTerm);
            setLocalSearchValue(currentSearchTerm);
        }
        
        if (selectedSizes.join(',') !== currentSizes.join(',')) {
            setSelectedSizes(currentSizes);
        }
        
        if (selectedCategory !== currentCategory) {
            setSelectedCategory(currentCategory);
        }
        
        if (sortBy !== currentSortBy) {
            setSortBy(currentSortBy);
        }
        
        if (currentPage !== currentPageNum) {
            setCurrentPage(currentPageNum);
        }
    }, [
        currentSearchTerm, 
        currentSizes.join(','), 
        currentCategory, 
        currentSortBy, 
        currentPageNum, 
        isModalOpen
    ]);

    // Debounce search term update to fix lag
    useEffect(() => {
        if (localSearchValue === searchTerm) return;

        const timer = setTimeout(() => {
            setSearchTerm(localSearchValue);
            const params = new URLSearchParams(searchParams);
            if (localSearchValue) params.set('q', localSearchValue); else params.delete('q');
            params.delete('page');
            setCurrentPage(1);
            setSearchParams(params, { replace: true });
        }, 400);

        return () => clearTimeout(timer);
    }, [localSearchValue, searchParams, setSearchParams, searchTerm]);

    // Provide setter functions that update BOTH local state and URL params at once
    const handleSetSearchTerm = (val: string) => {
        setLocalSearchValue(val);
    };

    const handleSetSelectedCategory = (val: string) => {
        setSelectedCategory(val);
        const params = new URLSearchParams(searchParams);
        if (val !== 'All') params.set('cat', val); else params.delete('cat');
        params.delete('page');
        setCurrentPage(1);
        setSearchParams(params, { replace: false }); // Push history for category change
    };

    const handleSetSelectedSizes = (updater: string[] | ((prev: string[]) => string[])) => {
        const newSizes = typeof updater === 'function' ? updater(selectedSizes) : updater;
        setSelectedSizes(newSizes);
        const params = new URLSearchParams(searchParams);
        if (newSizes.length > 0) params.set('sizes', newSizes.join(',')); else params.delete('sizes');
        params.delete('page');
        setCurrentPage(1);
        setSearchParams(params, { replace: false }); // Push history for size change
    };

    const handleSetSortBy = (val: string) => {
        setSortBy(val);
        const params = new URLSearchParams(searchParams);
        if (val !== 'default') params.set('sort', val); else params.delete('sort');
        params.delete('page');
        setCurrentPage(1);
        setSearchParams(params, { replace: true }); 
    };

    const handleSetCurrentPage = (updater: number | ((prev: number) => number)) => {
        const newPage = typeof updater === 'function' ? updater(currentPage) : updater;
        setCurrentPage(newPage);
        const params = new URLSearchParams(searchParams);
        if (newPage > 1) params.set('page', newPage.toString()); else params.delete('page');
        setSearchParams(params, { replace: false }); // Push history for page change
    };

    const clearFilters = () => {
        if (isMobileFiltersOpen) {
            setPendingCategory('All');
            setPendingSizes([]);
        } else {
            setSelectedCategory('All');
            setSelectedSizes([]);
            setSearchTerm('');
            setCurrentPage(1);
            setSearchParams({}, { replace: false });
        }
    };



    // Scroll to top when page or filters change
    useEffect(() => {
        if (isModalOpen) return;
        
        // Use a threshold to avoid jitter, but ensure it's smooth
        if (window.scrollY > 20) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, [
        currentPage, 
        searchTerm, 
        selectedSizes.join(','), 
        selectedCategory, 
        sortBy, 
        priceRange[0], 
        priceRange[1]
    ]);

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
        // Discard pending changes by not committing them
        if (window.history.state?.modal === 'mobile-filters') {
            window.history.back();
        }
    };

    const handleApplyFilters = () => {
        // Commit pending changes to actual state and URL
        handleSetSelectedCategory(pendingCategory);
        handleSetSelectedSizes(pendingSizes);
        setIsMobileFiltersOpen(false);
        if (window.history.state?.modal === 'mobile-filters') {
            window.history.back();
        }
    };

    const openMobileFilters = () => {
        setPendingCategory(selectedCategory);
        setPendingSizes(selectedSizes);
        setIsMobileFiltersOpen(true);
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

    const filteredProducts = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        const searchVariations = query ? normalizeSearch(query) : [];

        return allProducts.filter(product => {
            // Search Term Filter
            if (query) {
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
            // Priority 1: Top Order (Manually set position 1, 2, 3...)
            const topA = a.top_order ?? Infinity;
            const topB = b.top_order ?? Infinity;
            
            if (topA !== topB) {
                return topA - topB;
            }

            // Priority 2: Selected Sort Method
            const priceA = a.price_eur || a.wholesalePriceEur || 0;
            const priceB = b.price_eur || b.wholesalePriceEur || 0;
            if (sortBy === 'price_asc') return priceA - priceB;
            if (sortBy === 'price_desc') return priceB - priceA;
            if (sortBy === 'name_asc') {
                const nameA = (a.nameBg || a.name).toLowerCase();
                const nameB = (b.nameBg || b.name).toLowerCase();
                return nameA.localeCompare(nameB, i18n.language);
            }
            
            // Priority 3: Stable Natural Sort Fallback (Slug-based)
            const numA = parseInt(a.slug.match(/\d+/)?.[0] ?? '0', 10);
            const numB = parseInt(b.slug.match(/\d+/)?.[0] ?? '0', 10);
            if (numA !== numB) return numA - numB;
            return a.slug.localeCompare(b.slug);
        });
    }, [allProducts, searchTerm, selectedCategory, priceRange, selectedSizes, sortBy, i18n.language]);

    // Memoized dictionary for faster search suggestions
    const searchDictionary = useMemo(() => {
        const dictionary = Array.from(new Set([
            ...allProducts.map(p => p.nameBg || p.name),
            ...dynamicCategories.map(c => c.name),
            'черепи', 'бебе', 'кола', 'мерцедес', 'ауди', 'бмв', 'фолксваген', 'монстър', 'стикери'
        ].flatMap(s => s.toLowerCase().split(/\s+/).filter(w => w.length > 2))));
        return dictionary;
    }, [allProducts, dynamicCategories]);

    // Search Suggestion Logic
    const searchSuggestion = useMemo(() => {
        if (!searchTerm || searchTerm.length < 3 || filteredProducts.length > 0) return null;
        
        const words = searchTerm.toLowerCase().split(/\s+/);
        const correctedWords = words.map(word => {
            const match = findClosestMatch(word, searchDictionary);
            return match || word;
        });

        const suggestedTerm = correctedWords.join(' ');
        if (suggestedTerm.toLowerCase() !== searchTerm.toLowerCase()) {
            // CRITICAL: Only suggest if the suggested term actually returns products
            const wouldFindProducts = allProducts.some(product => {
                const searchVariations = normalizeSearch(suggestedTerm.toLowerCase());
                const productName = product.name.toLowerCase();
                const productNameBg = (product.nameBg || '').toLowerCase();
                const productSlug = (product.slug || '').toLowerCase();

                return searchVariations.some(v => 
                    productName.includes(v) || 
                    productNameBg.includes(v) ||
                    productSlug.includes(v)
                );
            });

            if (wouldFindProducts) {
                return suggestedTerm;
            }
        }
        return null;
    }, [searchTerm, filteredProducts.length, allProducts, searchDictionary]);

    // Products that match the suggestion
    const suggestedProducts = useMemo(() => {
        if (!searchSuggestion) return [];
        
        return allProducts.filter(product => {
            const searchVariations = normalizeSearch(searchSuggestion.toLowerCase());
            const productName = product.name.toLowerCase();
            const productNameBg = (product.nameBg || '').toLowerCase();
            const productSlug = (product.slug || '').toLowerCase();

            return searchVariations.some(v => 
                productName.includes(v) || 
                productNameBg.includes(v) ||
                productSlug.includes(v)
            );
        }).slice(0, 6); // Just show top 6 as "examples"
    }, [searchSuggestion, allProducts]);

    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(start, start + itemsPerPage);
    }, [filteredProducts, currentPage]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Detect scroll to hide floating filter button near the bottom (pagination/footer)
    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(() => {
                    const scrollPosition = window.scrollY + window.innerHeight;
                    const bottomPosition = document.documentElement.scrollHeight;
                    
                    // Check distance to pagination if it exists
                    let closeToPagination = false;
                    if (paginationRef.current) {
                        const rect = paginationRef.current.getBoundingClientRect();
                        // Hide 60px before reaching pagination for smoother transition
                        closeToPagination = rect.top < window.innerHeight + 60;
                    }

                    // 450px threshold is roughly the space taken by footer
                    setIsAtBottom(closeToPagination || (bottomPosition - scrollPosition < 450));
                    ticking = false;
                });
            }
        };
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [totalPages]); // Re-run when total pages change to ensure ref is tracked

    // Prefetch logic for pagination
    const prefetchPage = (pageNumber: number) => {
        // Disabled to prevent Cloudinary/Supabase free limit exhaustion 
        // especially on mobile devices where touch events can fire multiple times rapidly.
        return;
    };

    const renderFilters = (isMobile: boolean = false) => {
        const currentCat = isMobile ? pendingCategory : selectedCategory;
        const currentSelectedSizes = isMobile ? pendingSizes : selectedSizes;
        
        const setCat = (val: string) => {
            if (isMobile) setPendingCategory(val);
            else handleSetSelectedCategory(val);
        };

        const setSizes = (size: string) => {
            if (isMobile) {
                setPendingSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
            } else {
                handleSetSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
            }
        };

        return (
        <div className="space-y-0">
            {/* Search - Only for desktop sidebar */}
            <div className="relative mb-8 hidden lg:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#525252]" size={18} />
                <input 
                    type="text"
                    placeholder="Search..."
                    value={localSearchValue}
                    onChange={(e) => handleSetSearchTerm(e.target.value)}
                    className="w-full bg-[#161616] border border-[#262626] focus:border-[#404040] rounded-xl py-4 pl-12 pr-4 text-[13px] text-white placeholder:text-[#525252] outline-none transition-all"
                />
            </div>

            {/* Categories Section */}
            <div className="py-5">
                <div className="flex items-center justify-between text-white mb-6">
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#525252]">{t('catalog.all_categories')}</span>
                </div>
                <ul className="space-y-4">
                    <li 
                        onClick={() => setCat('All')}
                        className={`flex items-center justify-between cursor-pointer transition-colors group ${currentCat === 'All' ? 'text-white font-medium' : 'text-[#A3A3A3] hover:text-white'}`}
                    >
                        <div className="flex items-center gap-3">
                            {currentCat === 'All' ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                            ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-[#A3A3A3] transition-colors" />
                            )}
                            <span className="text-[14px]">{t('catalog.all')}</span>
                        </div>
                        <span className="text-xs text-[#525252]">{activeProducts.length}</span>
                    </li>
                    {dynamicCategories.map((cat) => (
                        <li 
                            key={cat.name} 
                            onClick={() => setCat(cat.name)}
                            className={`flex items-center justify-between cursor-pointer transition-colors group ${currentCat === cat.name ? 'text-white font-medium' : 'text-[#A3A3A3] hover:text-white'}`}
                        >
                            <div className="flex items-center gap-3">
                                {currentCat === cat.name ? (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-[#A3A3A3] transition-colors" />
                                )}
                                <span className="text-[14px]">{cat.name_bg}</span>
                            </div>
                            <span className="text-xs text-[#525252]">{cat.count}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Size Section */}
            <div className="py-5">
                <div className="flex items-center justify-between text-white mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#525252]">{t('profile.height')}</span>
                        {currentSelectedSizes.length > 0 && (
                            <div className="flex items-center justify-center bg-white text-black text-[10px] font-black w-5 h-5 rounded-full shadow-[0_4px_10px_rgba(255,255,255,0.3)]">
                                {currentSelectedSizes.length}
                            </div>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {filterStats.sizes.map(size => (
                        <button
                            key={size}
                            onClick={() => setSizes(size)}
                            className={`h-11 rounded-xl flex items-center justify-center text-xs font-bold transition-all border ${
                                currentSelectedSizes.includes(size) 
                                ? 'bg-white text-black border-white' 
                                : 'bg-[#1A1A1A] text-[#525252] border-transparent hover:border-[#404040]'
                            }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
    };

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
            <SEO title={selectedCategory === 'All' ? 'Онлайн Каталог' : selectedCategory} />
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
                            onClick={openMobileFilters}
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
                            className="fixed inset-0 bg-black/80 z-[110] lg:hidden"
                        />
                        <motion.aside 
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-0 bg-[#0F0F0F] z-[120] lg:hidden flex flex-col overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-8 pb-4 shrink-0">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Филтри</h2>
                                <button 
                                    onClick={clearFilters}
                                    className="text-[13px] font-medium text-[#525252] hover:text-white transition-colors"
                                >
                                    Изчисти всичко
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-0 pb-32">
                                {renderFilters(true)}
                            </div>
                            
                            <div className="absolute bottom-0 left-0 right-0 p-8 pt-12 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F] to-transparent pointer-events-none">
                                <div className="flex gap-4 pointer-events-auto">
                                    {(pendingCategory !== selectedCategory || pendingSizes.length !== selectedSizes.length || !pendingSizes.every(s => selectedSizes.includes(s))) ? (
                                        <>
                                            <button
                                                onClick={handleCloseFilters}
                                                className="flex-1 py-4 rounded-xl border border-[#262626] bg-[#0F0F0F] text-white text-sm font-black uppercase tracking-widest active:scale-95 transition-all"
                                            >
                                                Затвори
                                            </button>
                                            <button
                                                onClick={handleApplyFilters}
                                                className="flex-1 py-4 rounded-xl bg-white text-black text-sm font-black uppercase tracking-widest active:scale-95 transition-all shadow-[0_10px_40px_rgba(255,255,255,0.15)]"
                                            >
                                                Приложи
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={handleCloseFilters}
                                            className="w-full py-4 rounded-xl border border-[#262626] bg-[#0F0F0F] text-white text-sm font-black uppercase tracking-widest active:scale-95 transition-all"
                                        >
                                            Затвори
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <div className="flex">
                {/* --- Sidebar (Desktop) --- */}
                <aside className="w-[300px] xl:w-[340px] h-[calc(100vh-96px)] sticky top-[80px] sm:top-[96px] bg-[#0F0F0F] border-r border-[#262626] p-8 pb-32 overflow-y-auto no-scrollbar hidden lg:flex flex-col">
                    <div className="flex items-center gap-4 mb-10 text-white">
                        <SlidersHorizontal size={22} className="text-[#A3A3A3]" />
                        <h2 className="text-[18px] font-bold tracking-tight">{t('catalog.filters')}</h2>
                    </div>
                    <div className="flex-1">
                        {renderFilters()}
                    </div>
                </aside>

                <main className="flex-1 px-2 py-4 md:p-8 lg:p-12">
                    <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
                        {/* Sticky Header Section */}
                        <div className="relative z-30 bg-[#0F0F0F] -mx-2 md:-mx-8 lg:-mx-12 px-2 md:px-8 lg:px-12 pt-4 md:pt-8 pb-4 mb-8 border-b border-white/5 transition-all">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="w-full md:w-auto">
                                    <h1 className="text-[28px] md:text-[36px] xl:text-[42px] font-black text-white mb-2 md:mb-4 flex items-center gap-4">
                                        <span className="leading-none">{selectedCategory === 'All' ? t('catalog.welcome_modules.all') : selectedCategory}</span>
                                        <span className="text-sm md:text-lg font-bold text-[#575757] lg:hidden">
                                            {filteredProducts.length}
                                        </span>
                                    </h1>
                                    {/* Filter Chips */}
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {selectedCategory !== 'All' && (
                                            <div className="bg-[#1A1A1A] border border-[#262626] rounded-full px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-2 text-[12px] md:text-sm text-[#A3A3A3]">
                                                <span>{selectedCategory}</span>
                                                <button onClick={() => handleSetSelectedCategory('All')} className="hover:text-white transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                        { (priceRange[0] > 0 || priceRange[1] < filterStats.maxPrice) && (
                                            <div className="bg-[#1A1A1A] border border-[#262626] rounded-full px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-2 text-[12px] md:text-sm text-[#A3A3A3]">
                                                <span>€{priceRange[0].toFixed(0)}-{priceRange[1].toFixed(0)}</span>
                                                <button onClick={() => { setPriceRange([0, filterStats.maxPrice]); handleSetCurrentPage(1); }} className="hover:text-white transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                        {selectedSizes.map((size) => (
                                            <div key={size} className="bg-[#1A1A1A] border border-[#262626] rounded-full px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-2 text-[12px] md:text-sm text-[#A3A3A3]">
                                                <span>{size}</span>
                                                <button onClick={() => handleSetSelectedSizes(prev => prev.filter(s => s !== size))} className="hover:text-white transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Catalog Actions Row (Sort, Search, Count, View) */}
                                <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full md:w-auto ml-auto">
                                    <div className="relative shrink-0 hidden lg:block">
                                        <button 
                                            onClick={() => setIsSortOpen(!isSortOpen)}
                                            className="flex items-center gap-2 hover:text-white transition-colors py-2 text-xs md:text-[13px] text-[#A3A3A3]"
                                        >
                                            <span className="font-medium whitespace-nowrap">
                                                Сортиране
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
                                                        className="absolute top-full right-0 mt-2 w-56 bg-[#1A1A1A] border border-[#262626] rounded-2xl py-2 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                                                    >
                                                        {[
                                                            { id: 'default',   label: t('catalog.sort.default') },
                                                            { id: 'price_asc',  label: t('catalog.sort.price_asc') },
                                                            { id: 'price_desc', label: t('catalog.sort.price_desc') },
                                                            { id: 'name_asc',   label: t('catalog.sort.name_asc') }
                                                        ].map((opt) => (
                                                            <button 
                                                                key={opt.id}
                                                                onClick={() => { handleSetSortBy(opt.id); setIsSortOpen(false); }} 
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
                                    
                                    <div className="hidden lg:flex items-center justify-center bg-[#1A1A1A] rounded-full px-4 py-2 text-[10px] font-bold text-white uppercase tracking-[0.2em] shrink-0 border border-[#262626]">
                                        {filteredProducts.length} РЕЗУЛТАТА
                                    </div>

                                    {/* Mobile Action Row (Sort, Search, View) */}
                                    <div className="flex w-full items-center justify-between gap-3 lg:hidden">
                                        <div className="relative flex items-center shrink-0">
                                            <select 
                                                value={sortBy}
                                                onChange={(e) => handleSetSortBy(e.target.value)}
                                                className="appearance-none bg-transparent text-[#737373] hover:text-white transition-colors text-xs font-medium focus:outline-none cursor-pointer pr-4 z-10"
                                            >
                                                <option value="default" className="text-black bg-white">{t('catalog.sort.default')}</option>
                                                <option value="price_asc" className="text-black bg-white">{t('catalog.sort.price_asc')}</option>
                                                <option value="price_desc" className="text-black bg-white">{t('catalog.sort.price_desc')}</option>
                                                <option value="name_asc" className="text-black bg-white">{t('catalog.sort.name_asc')}</option>
                                            </select>
                                            <ChevronDown size={14} className="text-[#737373] absolute right-0 pointer-events-none" />
                                        </div>
                                        
                                        <div className="flex-1 relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#525252]" size={14} />
                                            <input 
                                                type="text"
                                                placeholder="Търсене..."
                                                value={localSearchValue}
                                                onChange={(e) => handleSetSearchTerm(e.target.value)}
                                                className="w-full bg-[#1A1A1A] border border-[#262626] focus:border-[#404040] rounded-full py-2.5 pl-9 pr-3 text-[13px] text-white outline-none transition-all"
                                            />
                                        </div>

                                        {/* View Switcher - Premium Toggle Style */}
                                        <div className="flex items-center bg-[#1A1A1A] border border-[#262626] rounded-full p-1 shrink-0 relative">
                                            <button 
                                                onClick={() => setIsGridView(false)}
                                                className={`relative z-10 p-2 md:p-3 rounded-full transition-all duration-300 ${!isGridView ? 'text-black' : 'text-[#737373] hover:text-white'}`}
                                            >
                                                <List size={16} className="md:w-[20px] md:h-[20px]" />
                                            </button>
                                            <button 
                                                onClick={() => setIsGridView(true)}
                                                className={`relative z-10 p-2 md:p-3 rounded-full transition-all duration-300 ${isGridView ? 'text-black' : 'text-[#737373] hover:text-white'}`}
                                            >
                                                <LayoutGrid size={16} className="md:w-[20px] md:h-[20px]" />
                                            </button>
                                            
                                            {/* Sliding Pill Background */}
                                            <motion.div 
                                                className="absolute top-1 bottom-1 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                                                initial={false}
                                                animate={{ 
                                                    left: isGridView ? "50%" : "4px",
                                                    right: isGridView ? "4px" : "50%",
                                                }}
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search Suggestion UI */}
                        <AnimatePresence>
                            {searchSuggestion && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-8 p-4 md:p-6 bg-red-600/5 border border-red-600/20 rounded-2xl flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                                            <Search size={18} />
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 text-[11px] uppercase tracking-widest font-bold mb-1">Няма точни съвпадения</p>
                                            <p className="text-sm md:text-base text-white">
                                                Може би имахте предвид: <button 
                                                    onClick={() => handleSetSearchTerm(searchSuggestion)}
                                                    className="text-red-500 font-black hover:underline underline-offset-4 decoration-2"
                                                >
                                                    {searchSuggestion}
                                                </button>?
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleSetSearchTerm(searchSuggestion)}
                                        className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-red-600/20"
                                    >
                                        Търси това
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Product Grid */}
                        {filteredProducts.length === 0 ? (
                            <div>
                                {searchSuggestion && suggestedProducts.length > 0 ? (
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-px flex-1 bg-white/5" />
                                            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-600">Примерни резултати за "{searchSuggestion}"</span>
                                            <div className="h-px flex-1 bg-white/5" />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
                                            {suggestedProducts.map((product) => (
                                                <ProductCard key={product.slug} product={product} />
                                            ))}
                                        </div>
                                        <div className="flex justify-center pt-4">
                                            <button 
                                                onClick={() => handleSetSearchTerm(searchSuggestion)}
                                                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all"
                                            >
                                                Виж всички за "{searchSuggestion}"
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <ErrorStateCard 
                                        title="Няма намерени продукти"
                                        description="Опитайте с други филтри или премахнете някои от тях. Ако смятате че става дума за грешка, моля да ни уведомите."
                                    />
                                )}
                            </div>
                        ) : (
                            <div className={`grid ${isGridView ? 'grid-cols-2 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-1'} lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-8 lg:gap-10 min-h-[500px]`}>
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
                        )}

                        {/* Pagination - Mobile First Minimalist Style */}
                        {totalPages > 1 && (
                            <div 
                                ref={paginationRef}
                                className="mt-12 md:mt-20 flex items-center gap-2 md:gap-6 overflow-x-auto no-scrollbar py-4 px-2 lg:justify-center w-full max-w-full"
                            >
                                <button 
                                    onClick={() => handleSetCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 text-[#525252] hover:text-white disabled:opacity-10 transition-all active:scale-90 shrink-0"
                                >
                                    <ChevronDown size={22} className="rotate-90" />
                                </button>
                                
                                <div className="flex items-center gap-1 md:gap-4">
                                        {[...Array(totalPages)].map((_, i) => {
                                            const page = i + 1;
                                            const isPageVisible = 
                                                page === 1 || 
                                                page === totalPages || 
                                                (page >= currentPage - 1 && page <= currentPage + 1);
                                            
                                            if (isPageVisible) {
                                                return (
                                                <button
                                                    key={page}
                                                    onClick={() => handleSetCurrentPage(page)}
                                                    className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl text-[14px] md:text-[16px] font-black transition-all shrink-0 ${
                                                        currentPage === page 
                                                        ? 'bg-[#1A1A1A] text-white border border-white/5 shadow-xl' 
                                                        : 'bg-transparent text-[#525252] hover:text-white'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                                );
                                            }
                                            
                                            if (page === currentPage - 2 || page === currentPage + 2) {
                                                return <span key={page} className="text-[#333] text-sm font-black shrink-0">...</span>;
                                            }
                                            return null;
                                        })}
                                </div>

                                <button 
                                    onClick={() => handleSetCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 text-[#525252] hover:text-white disabled:opacity-10 transition-all active:scale-90 shrink-0"
                                >
                                    <ChevronDown size={22} className="-rotate-90" />
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
