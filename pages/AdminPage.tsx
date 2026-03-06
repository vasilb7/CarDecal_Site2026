import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { normalizeSearch } from '../lib/search-utils';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useSiteSettings } from '../context/SiteSettingsContext';
import {
    LayoutDashboard, Package, Users, User, Settings, LogOut,
    Search, Plus, Edit3, Trash2, Shield, ShieldBan,
    ChevronDown, ChevronUp, Save, X, CheckCircle, AlertTriangle,
    Eye, EyeOff, Tag, Image, ArrowLeft, Loader2, RefreshCw,
    UserCheck, UserX, Crown, Upload, Video, Film, AlertCircle, Mail,
    Megaphone, Palette, Type, ShoppingBag, Receipt, Printer, Download,
    FileText, BoxSelect, LayoutGrid, ClipboardCheck, Boxes, FileJson, Clock, Bug,
    Banknote, TrendingUp, Key
} from 'lucide-react';
import { useToast } from '../components/Toast/ToastProvider';
import { uploadToCloudinary } from '../lib/cloudinary-utils';
import { BugsTab } from '../components/Admin/BugsTab';
import { StealthTab } from '../components/Admin/StealthTab';
import SEO from '../components/SEO';

// ─── Custom Confirm Dialog ──────────────────────────────────────────────────
interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDanger?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen, title, message, confirmLabel = 'Потвърди', cancelLabel = 'Отказ', onConfirm, onCancel, isDanger = false
}) => {
    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-[#111] border border-white/10 w-full max-w-sm overflow-hidden shadow-2xl"
                    >
                        <div className={`h-1 w-full ${isDanger ? 'bg-red-600' : 'bg-white/20'}`} />
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                {isDanger ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <AlertCircle className="w-5 h-5 text-white/40" />}
                                <h3 className="text-sm uppercase tracking-widest text-white font-bold">{title}</h3>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                                {message}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 py-3 border border-white/10 text-zinc-500 text-[10px] uppercase font-bold tracking-widest hover:text-white hover:bg-white/5 transition-all"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex-1 py-3 font-bold text-[10px] uppercase tracking-widest transition-all ${
                                        isDanger ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white text-black hover:bg-zinc-200'
                                    }`}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

type AdminTab = 'dashboard' | 'homepage' | 'messages' | 'maintenance' | 'products' | 'users' | 'archived_users' | 'custom_orders' | 'orders' | 'bugs' | 'stealth';

interface DBProduct {
    id: string;
    slug: string;
    name: string;
    name_bg: string | null;
    avatar: string;
    price: string | null;
    price_eur: number | null;
    wholesale_price_eur: number | null;
    is_best_seller: boolean;
    categories: string[];
    dimensions: string | null;
    cover_image: string | null;
    card_images?: string[] | null;
    is_hidden: boolean;
    updated_at: string;
}

interface DBUser {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    role: 'user' | 'editor' | 'admin';
    is_banned: boolean;
    banned_reason: string | null;
    created_at: string;
    last_login_at: string | null;
    last_device_info: string | null;
    last_ip_address: string | null;
    ip_history: string[] | null;
    admin_notes?: string | null;
}

// ─── Product Edit Modal ────────────────────────────────────────────────────
const ProductEditModal: React.FC<{
    product: DBProduct | null;
    isNew: boolean;
    onClose: () => void;
    onSave: () => void;
}> = ({ product, isNew, onClose, onSave }) => {
    // Prevent background scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const [form, setForm] = useState({
        slug: product?.slug || '',
        name: product?.name || '',
        name_bg: product?.name_bg || '',
        wholesale_price_eur: product?.wholesale_price_eur?.toString() || '',
        avatar: product?.avatar || '',
        cover_image: product?.cover_image || '',
        is_best_seller: product?.is_best_seller || false,
        dimensions: product?.dimensions || '',
        categories: (product?.categories || []).join(', '),
        card_images: product?.card_images || [],
        is_hidden: product?.is_hidden || false,
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'cover_image') => {
        if (!e.target.files?.[0]) return;
        setUploading(field);
        try {
            const url = await uploadToCloudinary(e.target.files[0], 'Decals');
            setForm(prev => ({ ...prev, [field]: url }));
        } catch (err: any) {
            setError(err.message || 'Грешка при качване');
        } finally {
            setUploading(null);
        }
    };

    const handleCardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        if (!e.target.files?.[0]) return;
        setUploading(`card_${index}`);
        try {
            const url = await uploadToCloudinary(e.target.files[0], 'Decals');
            const newImgs = [...form.card_images];
            newImgs[index] = url;
            setForm(prev => ({ ...prev, card_images: newImgs }));
        } catch (err: any) {
            setError(err.message || 'Грешка при качване');
        } finally {
            setUploading(null);
        }
    };

    /* const eurToBgn = ... */

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const wholesaleEur = parseFloat(form.wholesale_price_eur) || null;
            const payload: any = {
                slug: form.slug,
                name: form.name,
                name_bg: form.name_bg || null,
                price_eur: wholesaleEur,
                price: null,
                wholesale_price_eur: wholesaleEur,
                wholesale_price: null, // Вече не пазим цена в лева в низа
                avatar: form.avatar,
                cover_image: form.cover_image || null,
                is_best_seller: form.is_best_seller,
                dimensions: form.dimensions || null,
                categories: form.categories.split(',').map(c => c.trim()).filter(Boolean),
                card_images: form.card_images.filter(Boolean),
                is_hidden: form.is_hidden,
                updated_at: new Date().toISOString(),
            };

            if (isNew) {
                const { error } = await supabase.from('products').insert(payload);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('products').update(payload).eq('id', product!.id);
                if (error) throw error;
            }
            onSave();
        } catch (e: any) {
            setError(e.message || 'Неизвестна грешка');
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full bg-black/40 border border-white/10 text-white text-sm px-4 py-2.5 focus:outline-none focus:border-red-600/60 transition-colors placeholder-zinc-600";

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-lg font-bold uppercase tracking-widest text-white">
                        {isNew ? 'Добавяне на Стикер' : 'Редактиране на Стикер'}
                    </h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-900/30 border border-red-600/40 px-4 py-3 text-red-400 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1.5">Slug (URL)</label>
                            <input value={form.slug} onChange={e => setForm(p => ({...p, slug: e.target.value}))} className={inputClass} placeholder="6cm-01" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1.5">Наименование</label>
                            <input 
                                value={form.name_bg || form.name} 
                                onChange={e => setForm(p => ({...p, name: e.target.value, name_bg: e.target.value}))} 
                                className={inputClass} 
                                placeholder="Орлови Очи" 
                            />
                        </div>
                    </div>

                    {/* Only Wholesale Price */}
                    <div className="bg-black/20 border border-white/5 p-4">
                        <p className="text-xs uppercase tracking-widest text-red-600 mb-3 font-bold">Цена на едро (в евро €)</p>
                        <div className="grid grid-cols-1">
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1.5">Цена на едро (€)</label>
                                <input 
                                    type="number" step="0.01" min="0"
                                    value={form.wholesale_price_eur}
                                    onChange={e => setForm(p => ({...p, wholesale_price_eur: e.target.value}))}
                                    className={inputClass}
                                    placeholder="2.99"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1.5">Снимка (Avatar)</label>
                        <div className="flex gap-2">
                            <input value={form.avatar} onChange={e => setForm(p => ({...p, avatar: e.target.value}))} className={inputClass} placeholder="URL към снимка..." />
                            <label className="bg-white/5 border border-white/10 px-4 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors shrink-0">
                                {uploading === 'avatar' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'avatar')} />
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1.5">Cover Image</label>
                        <div className="flex gap-2">
                            <input value={form.cover_image} onChange={e => setForm(p => ({...p, cover_image: e.target.value}))} className={inputClass} placeholder="URL към корица..." />
                            <label className="bg-white/5 border border-white/10 px-4 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors shrink-0">
                                {uploading === 'cover_image' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'cover_image')} />
                            </label>
                        </div>
                    </div>

                    {/* Gallery Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-xs uppercase tracking-widest text-zinc-400">Галерия (Вариации / Card Images)</label>
                            <button 
                                type="button"
                                onClick={() => setForm(p => ({...p, card_images: [...p.card_images, '']}))}
                                className="text-[10px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-white"
                            >
                                <Plus size={12} /> Добави снимка
                            </button>
                        </div>
                        <div className="space-y-3">
                            {form.card_images.map((img, i) => (
                                <div key={i} className="flex gap-2">
                                    <input 
                                        value={img} 
                                        onChange={e => {
                                            const newImgs = [...form.card_images];
                                            newImgs[i] = e.target.value;
                                            setForm(p => ({...p, card_images: newImgs}));
                                        }} 
                                        className={inputClass} 
                                        placeholder="URL към вариация..." 
                                    />
                                    <label className="bg-white/5 border border-white/10 px-4 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors shrink-0">
                                        {uploading === `card_${i}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        <input type="file" className="hidden" accept="image/*" onChange={e => handleCardImageUpload(e, i)} />
                                    </label>
                                    <button 
                                        type="button"
                                        onClick={() => setForm(p => ({...p, card_images: p.card_images.filter((_, idx) => idx !== i)}))}
                                        className="bg-red-900/10 border border-red-500/20 px-4 flex items-center justify-center hover:bg-red-900/30 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1.5">Размери</label>
                            <input value={form.dimensions} onChange={e => setForm(p => ({...p, dimensions: e.target.value}))} className={inputClass} placeholder="6 x 6 cm" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1.5">Категории (разделени със запетая)</label>
                        <input value={form.categories} onChange={e => setForm(p => ({...p, categories: e.target.value}))} className={inputClass} placeholder="JDM, Anime, Racing" />
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setForm(p => ({...p, is_best_seller: !p.is_best_seller}))}
                                className={`w-10 h-5 rounded-full transition-colors relative ${form.is_best_seller ? 'bg-red-600' : 'bg-zinc-700'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.is_best_seller ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                            <span className="text-sm text-zinc-300 uppercase tracking-widest">Топ Продукт</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setForm(p => ({...p, is_hidden: !p.is_hidden}))}
                                className={`w-10 h-5 rounded-full transition-colors relative ${form.is_hidden ? 'bg-amber-600' : 'bg-zinc-700'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.is_hidden ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                            <div className="flex items-center gap-2">
                                <EyeOff className={`w-4 h-4 ${form.is_hidden ? 'text-amber-500' : 'text-zinc-500'}`} />
                                <span className="text-sm text-zinc-300 uppercase tracking-widest">Скрит артикул</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 p-6 border-t border-white/10">
                    <button onClick={onClose} className="flex-1 px-6 py-3 border border-white/20 text-zinc-400 hover:text-white text-xs uppercase tracking-widest transition-colors">
                        Отказ
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-red-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Запазване...' : 'Запази'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Products Tab ─────────────────────────────────────────────────────────
const ProductsTab: React.FC = () => {
    const { showToast } = useToast();
    const [products, setProducts] = useState<DBProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editProduct, setEditProduct] = useState<DBProduct | null>(null);
    const [isNewProduct, setIsNewProduct] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'slug' | 'dimensions' | 'price' | 'name'>('slug');
    const [sizeFilter, setSizeFilter] = useState<string>('All');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const [showHidden, setShowHidden] = useState(false);

    const scrollPosRef = useRef<number>(0);

    const fetchProducts = useCallback(async (shouldRestoreScroll = false, silent = false) => {
        if (shouldRestoreScroll) {
            scrollPosRef.current = window.scrollY;
        }
        if (!silent) setLoading(true);
        let allData: DBProduct[] = [];
        let rFrom = 0;
        const rSize = 1000;
        
        while (true) {
            const { data, error } = await supabase
                .from('products')
                .select('id,slug,name,name_bg,avatar,price,price_eur,wholesale_price,wholesale_price_eur,is_best_seller,categories,dimensions,cover_image,is_hidden,updated_at')
                .order('id', { ascending: false })
                .range(rFrom, rFrom + rSize - 1);
                
            if (error) break;
            if (data) allData = [...allData, ...data as DBProduct[]];
            if (!data || data.length < rSize) break;
            rFrom += rSize;
        }
        
        setProducts(allData);
        if (!silent) setLoading(false);

        if (shouldRestoreScroll) {
            setTimeout(() => {
                window.scrollTo({
                    top: scrollPosRef.current,
                    behavior: 'instant'
                });
            }, 0);
        }
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const availableSizes = useMemo(() => {
        const sizes = new Set<string>();
        products.forEach(p => {
            if (p.dimensions) sizes.add(p.dimensions);
            p.categories.forEach(cat => {
                if (cat.toLowerCase().includes('cm')) sizes.add(cat);
            });
        });
        return Array.from(sizes).sort((a,b) => {
            const na = parseFloat(a) || 0;
            const nb = parseFloat(b) || 0;
            return na - nb;
        });
    }, [products]);

    // ── Filter + Sort ────────────────────────────────────────────────────
    const filtered = products
        .filter(p => {
            if (search.trim()) {
                const query = search.toLowerCase().trim();
                const searchVariations = normalizeSearch(query);
                const productName = (p.name || '').toLowerCase();
                const productNameBg = (p.name_bg || '').toLowerCase();
                const productSlug = (p.slug || '').toLowerCase();

                const searchMatch = searchVariations.some(v => 
                    productName.includes(v) || 
                    productNameBg.includes(v) ||
                    productSlug.includes(v)
                );
                
                if (!searchMatch) return false;
            }

            if (sizeFilter !== 'All') {
                const pSize = p.dimensions || '';
                const hasSizeInCats = p.categories.some(c => c === sizeFilter);
                if (pSize !== sizeFilter && !hasSizeInCats) return false;
            }

            if (showHidden) {
                if (!p.is_hidden) return false;
            } else {
                if (p.is_hidden) return false;
            }

            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'price') {
                return (a.wholesale_price_eur ?? 999) - (b.wholesale_price_eur ?? 999);
            }
            if (sortBy === 'dimensions') {
                // Sort by the numeric part of dimensions e.g. "6 x 6 cm" → 6
                const numA = parseFloat(a.dimensions?.replace(/[^\d.]/g, '') ?? '0');
                const numB = parseFloat(b.dimensions?.replace(/[^\d.]/g, '') ?? '0');
                return numA - numB;
            }
            if (sortBy === 'name') {
                return (a.name_bg || a.name).localeCompare(b.name_bg || b.name);
            }
            // default: slug natural sort
            const nA = parseInt(a.slug.match(/\d+/)?.[0] ?? '0', 10);
            const nB = parseInt(b.slug.match(/\d+/)?.[0] ?? '0', 10);
            if (nA !== nB) return nA - nB;
            return a.slug.localeCompare(b.slug);
        });

    const handleDelete = (id: string) => setConfirmDelete(id);

    // Reset to page 1 on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, sortBy, sizeFilter]);

    // Scroll to top on page change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, currentPage]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const confirmDeleteAction = async () => {
        if (!confirmDelete) return;
        const id = confirmDelete;
        setConfirmDelete(null);
        setDeletingId(id);
        try {
            await supabase.from('products').delete().eq('id', id);
            await fetchProducts(true);
            showToast('Стикерът е изтрит успешно!', 'success');
        } catch {
            showToast('Грешка при изтриване.', 'error');
        }
        setDeletingId(null);
    };


    return (
        <div>
            {/* ── Toolbar ── */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Търси по slug, размер, название..."
                        className="w-full bg-black/40 border border-white/10 text-white text-sm pl-10 pr-4 py-2.5 focus:outline-none focus:border-red-600/60"
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Sort */}
                     <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as typeof sortBy)}
                        className="bg-black/40 border border-white/10 text-zinc-300 text-xs uppercase tracking-widest px-3 py-2.5 focus:outline-none focus:border-red-600/60 cursor-pointer"
                    >
                        <option value="slug">По Slug</option>
                        <option value="dimensions">Сортирай по Размер</option>
                        <option value="price">Сортирай по Цена</option>
                        <option value="name">Сортирай по Название</option>
                    </select>

                    {/* Size Filter */}
                    <select
                        value={sizeFilter}
                        onChange={e => setSizeFilter(e.target.value)}
                        className="bg-black/40 border border-white/10 text-zinc-300 text-xs uppercase tracking-widest px-3 py-2.5 focus:outline-none focus:border-red-600/60 cursor-pointer"
                    >
                        <option value="All">Всички размери</option>
                        {availableSizes.map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>

                    {/* Grid / List toggle */}
                    <button
                        onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
                        className="px-4 py-2.5 border border-white/10 text-zinc-400 hover:text-white text-xs uppercase tracking-widest transition-colors flex items-center gap-2"
                        title={viewMode === 'grid' ? 'Смени на Списък' : 'Смени на Грид'}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        {viewMode === 'grid' ? 'Списък' : 'Грид'}
                    </button>

                    <button
                        onClick={() => setShowHidden(!showHidden)}
                        className={`px-4 py-2.5 border transition-all text-xs uppercase tracking-widest flex items-center gap-2 ${showHidden ? 'border-amber-500/50 bg-amber-500/10 text-amber-500' : 'border-white/10 text-zinc-400 hover:text-white'}`}
                        title={showHidden ? 'Скрий скритите' : 'Покажи скритите'}
                    >
                        {showHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {showHidden ? 'Само Скрити' : 'Всички Активни'}
                    </button>

                    <button onClick={() => fetchProducts(true)} className="px-4 py-2.5 border border-white/10 text-zinc-400 hover:text-white text-xs uppercase tracking-widest transition-colors flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Обнови
                    </button>
                    <button
                        onClick={() => { setIsNewProduct(true); setEditProduct(null); }}
                        className="px-6 py-2.5 bg-red-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Нов Стикер
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                </div>
            ) : viewMode === 'grid' ? (
                /* ── GRID VIEW (карти като каталог) ── */
                <div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                        {paginatedProducts.map(p => (
                            <div
                                key={p.id}
                                className="group relative bg-zinc-900 border border-white/5 hover:border-red-600/40 transition-all duration-200 overflow-hidden flex flex-col"
                            >
                                {/* Image */}
                                <div className="relative aspect-square bg-zinc-950 overflow-hidden"
                                   style={{ backgroundImage: 'radial-gradient(circle, #2a2a2a 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
                                     <img
                                         src={p.avatar}
                                         alt={p.name_bg || p.name}
                                         className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-300"
                                     />
                                    {/* Badges */}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                        {p.is_best_seller && (
                                            <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 uppercase tracking-widest font-bold">Топ</span>
                                        )}
                                        {p.is_hidden && (
                                            <span className="text-[9px] bg-amber-600 text-white px-2 py-0.5 uppercase tracking-widest font-bold flex items-center gap-1">
                                                <EyeOff className="w-2.5 h-2.5" /> Скрит
                                            </span>
                                        )}
                                        {p.dimensions && (
                                            <span className="text-[9px] bg-black/70 text-white/80 px-2 py-0.5 font-mono backdrop-blur-sm">{p.dimensions}</span>
                                        )}
                                    </div>
                                    {/* Actions overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <button
                                            onClick={() => { setEditProduct(p); setIsNewProduct(false); }}
                                            className="p-2.5 bg-white text-black hover:bg-red-600 hover:text-white transition-colors rounded-sm"
                                            title="Редактирай"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            disabled={deletingId === p.id}
                                            className="p-2.5 bg-white text-black hover:bg-red-600 hover:text-white transition-colors rounded-sm disabled:opacity-40"
                                            title="Изтрий"
                                        >
                                            {deletingId === p.id
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Trash2 className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-3 flex flex-col gap-1 flex-1">
                                    <p className="text-white text-xs font-bold uppercase tracking-tight leading-tight line-clamp-2">
                                        {p.name_bg || p.name}
                                    </p>
                                    <p className="text-zinc-600 text-[10px] font-mono">{p.slug}</p>
                                    <div className="flex items-center justify-between mt-auto pt-2">
                                        {p.wholesale_price_eur != null && (
                                            <span className="text-red-400 font-mono font-bold text-xs">{p.wholesale_price_eur.toFixed(2)} €</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-zinc-600 text-xs mt-4">{filtered.length} от {products.length} стикери • Сортирано по: {sortBy}</p>
                </div>
            ) : (
                /* ── LIST VIEW (таблица) ── */
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-left">
                                <th className="text-xs uppercase tracking-widest text-zinc-500 pb-3 font-normal">Стикер</th>
                                <th className="text-xs uppercase tracking-widest text-zinc-500 pb-3 font-normal">Размер</th>
                                <th className="text-xs uppercase tracking-widest text-zinc-500 pb-3 font-normal">Цена Едро (€)</th>
                                <th className="text-xs uppercase tracking-widest text-zinc-500 pb-3 font-normal hidden lg:table-cell">Обновен</th>
                                <th className="pb-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {paginatedProducts.map(p => (
                                <tr key={p.id} className="group hover:bg-white/2 transition-colors">
                                    <td className="py-3 pr-4">
                                        <div className="flex items-center gap-3">
                                            <img src={p.avatar} alt={p.name} className="w-14 h-14 object-cover bg-zinc-900 flex-shrink-0 border border-white/5" />
                                            <div>
                                                <p className="text-white font-medium">{p.name_bg || p.name}</p>
                                                <p className="text-zinc-500 text-xs font-mono">{p.slug}</p>
                                            </div>
                                            {p.is_best_seller && <span className="text-[10px] bg-red-600/20 text-red-400 px-2 py-0.5 uppercase tracking-widest">Топ</span>}
                                            {p.is_hidden && <span className="text-[10px] bg-amber-600/20 text-amber-500 px-2 py-0.5 uppercase tracking-widest flex items-center gap-1"><EyeOff className="w-3 h-3"/> Скрит</span>}
                                        </div>
                                    </td>
                                    <td className="py-3 pr-4 text-zinc-300 text-xs font-mono">{p.dimensions || '—'}</td>
                                    <td className="py-3 pr-4">
                                        <div className="flex flex-col">
                                            {p.wholesale_price_eur != null
                                                ? <span className="text-white font-mono">{p.wholesale_price_eur.toFixed(2)} €</span>
                                                : <span className="text-zinc-600">—</span>}
                                        </div>
                                    </td>
                                    <td className="py-3 pr-4 hidden lg:table-cell text-zinc-500 text-xs">
                                        {new Date(p.updated_at).toLocaleDateString('bg-BG')}
                                    </td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                            <button onClick={() => { setEditProduct(p); setIsNewProduct(false); }} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors">
                                                {deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="text-zinc-600 text-xs mt-4">{filtered.length} от {products.length} стикери</p>
                </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="mt-12 mb-16 flex items-center justify-center gap-2 md:gap-3">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-[#1A1A1A] border border-[#262626] flex items-center justify-center text-[#A3A3A3] hover:text-white hover:border-[#404040] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronDown size={18} className="rotate-90" />
                    </button>
                    
                    <div className="flex items-center gap-1 md:gap-2">
                        {[...Array(totalPages)].map((_, i) => {
                            const page = i + 1;
                            // Logic to show current page, first, last, and neighbors
                            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl text-[13px] md:text-sm font-bold transition-all border ${
                                            currentPage === page 
                                            ? 'bg-red-600 text-white border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.3)]' 
                                            : 'bg-[#1A1A1A] text-[#525252] border-transparent hover:border-[#404040] hover:text-[#A3A3A3]'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            }
                            if ((page === currentPage - 2 && page > 1) || (page === currentPage + 2 && page < totalPages)) {
                                return <span key={page} className="text-[#262626] px-1">...</span>;
                            }
                            return null;
                        })}
                    </div>

                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-[#1A1A1A] border border-[#262626] flex items-center justify-center text-[#A3A3A3] hover:text-white hover:border-[#404040] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronDown size={18} className="-rotate-90" />
                    </button>
                </div>
            )}

            <AnimatePresence>
                {(editProduct || isNewProduct) && (
                    <ProductEditModal
                        product={editProduct}
                        isNew={isNewProduct}
                        onClose={() => { setEditProduct(null); setIsNewProduct(false); }}
                        onSave={() => { setEditProduct(null); setIsNewProduct(false); fetchProducts(true, true); }}
                    />
                )}
            </AnimatePresence>

            <ConfirmDialog
                isOpen={!!confirmDelete}
                title="Изтриване на Стикер"
                message="Сигурни ли сте, че искате да изтриете този стикер? Това действие е необратимо."
                isDanger
                confirmLabel="Изтрий"
                onConfirm={confirmDeleteAction}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
};

// ─── Users Tab ────────────────────────────────────────────────────────────
const UsersTab: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();
    const [users, setUsers] = useState<DBUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [banModal, setBanModal] = useState<DBUser | null>(null);
    const [deleteModal, setDeleteModal] = useState<DBUser | null>(null);
    const [banReason, setBanReason] = useState('');
    const [userProfileModal, setUserProfileModal] = useState<DBUser | null>(null);
    
    // Role change confirmation
    const [roleConfirmation, setRoleConfirmation] = useState<{ user: DBUser, targetRole: 'user' | 'editor' | 'admin' } | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id,email,full_name,avatar_url,role,is_banned,banned_reason,created_at,last_login_at,last_device_info,last_ip_address,ip_history,admin_notes')
            .is('deletion_scheduled_at', null)
            .order('created_at', { ascending: false });
        if (!error && data) setUsers(data as DBUser[]);
        setLoading(false);
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Prevent background scrolling when modals are open
    useEffect(() => {
        if (banModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [banModal]);

    const filtered = users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    const handleRoleUpdate = (user: DBUser, targetRole: 'user' | 'editor' | 'admin') => {
        if (targetRole === 'user') {
            confirmRoleUpdate(user.id, targetRole);
        } else {
            setRoleConfirmation({ user, targetRole });
        }
    };

    const confirmRoleUpdate = async (userId: string, role: 'user' | 'editor' | 'admin') => {
        setUpdatingId(userId);
        await supabase.from('profiles').update({ role }).eq('id', userId);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
        setUpdatingId(null);
        setRoleConfirmation(null);
    };

    const toggleBan = async (user: DBUser) => {
        if (user.is_banned) {
            setUpdatingId(user.id);
            await supabase.from('profiles').update({ is_banned: false, banned_reason: null }).eq('id', user.id);
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_banned: false, banned_reason: null } : u));
            setUpdatingId(null);
        } else {
            setBanModal(user);
        }
    };

    const confirmBan = async () => {
        if (!banModal) return;
        setUpdatingId(banModal.id);
        await supabase.from('profiles').update({ is_banned: true, banned_reason: banReason || 'Нарушение на правилата' }).eq('id', banModal.id);
        setUsers(prev => prev.map(u => u.id === banModal.id ? { ...u, is_banned: true, banned_reason: banReason } : u));
        setBanModal(null);
        setBanReason('');
        setUpdatingId(null);
    };

    const updateAdminNotes = async (userId: string, notes: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ admin_notes: notes })
            .eq('id', userId);
        
        if (error) {
            showToast("Грешка при запазване на бележка", "error");
        } else {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, admin_notes: notes } : u));
        }
    };

    const confirmDeleteEntirely = async () => {
        if (!deleteModal) return;
        setUpdatingId(deleteModal.id);
        
        try {
            // First find all custom orders images for this user
            const { data: userOrders } = await supabase
                .from('custom_orders')
                .select('images')
                .eq('user_id', deleteModal.id);
                
            const imagesToDelete: string[] = [];
            if (userOrders) {
                userOrders.forEach(o => o.images?.forEach((img: string) => imagesToDelete.push(img)));
            }
            if (imagesToDelete.length > 0) {
                await supabase.storage.from('custom_orders').remove(imagesToDelete);
            }

            // Next delete their avatar folder (this works if the folder is their id)
            const { data: avatarFiles } = await supabase.storage.from('avatars').list(deleteModal.id);
            if (avatarFiles && avatarFiles.length > 0) {
                const avatarPaths = avatarFiles.map(f => `${deleteModal.id}/${f.name}`);
                await supabase.storage.from('avatars').remove(avatarPaths);
            }

            // Now call the rpc function to delete user
            const { error: rpcErr } = await supabase.rpc('delete_user_entirely', { target_user_id: deleteModal.id });
            if (rpcErr) throw rpcErr;

            setUsers(prev => prev.filter(u => u.id !== deleteModal.id));
        } catch (error) {
            console.error('Delete User Error:', error);
            alert("Възникна грешка при изтриването: " + (error as Error).message);
        } finally {
            setUpdatingId(null);
            setDeleteModal(null);
        }
    };

    const roleColor = (role: string) => {
        if (role === 'admin') return 'text-red-400';
        if (role === 'editor') return 'text-yellow-400';
        return 'text-zinc-500';
    };

    const roleLabel = (role: string) => {
        if (role === 'admin') return 'Администратор';
        if (role === 'editor') return 'Редактор';
        return 'Потребител';
    };

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Търси по email или име..."
                        className="w-full bg-black/40 border border-white/10 text-white text-sm pl-10 pr-4 py-2.5 focus:outline-none focus:border-red-600/60"
                    />
                </div>
                <button onClick={fetchUsers} className="px-4 py-2.5 border border-white/10 text-zinc-400 hover:text-white text-xs uppercase tracking-widest transition-colors flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Обнови
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(u => (
                        <div key={u.id} className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border ${u.is_banned ? 'border-red-900/40 bg-red-950/10' : 'border-white/5 bg-white/2'} hover:border-white/10 transition-colors cursor-pointer group/row`} onClick={() => setUserProfileModal(u)}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-900 flex-shrink-0">
                                    {u.avatar_url ? (
                                        <img src={u.avatar_url} alt={u.full_name || ''} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-lg font-bold">
                                            {(u.full_name || u.email || '?')[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-white font-medium text-sm group-hover/row:text-red-500 transition-colors uppercase tracking-tight">{u.full_name || 'Без Име'}</p>
                                        {u.is_banned && <span className="text-[10px] bg-red-900/40 text-red-400 px-2 py-0.5 uppercase tracking-widest">Блокиран</span>}
                                        {u.id === currentUser?.id && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 uppercase tracking-widest">Аз</span>}
                                    </div>
                                    <p className="text-zinc-500 text-xs">{u.email}</p>
                                    {u.is_banned && u.banned_reason && (
                                        <p className="text-red-400/60 text-xs mt-0.5">Причина: {u.banned_reason}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mt-1.5 pt-1.5 border-t border-white/5">
                                        {u.last_login_at && (
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                                                Последно: {new Date(u.last_login_at).toLocaleString('bg-BG', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        )}
                                        {u.last_device_info && (
                                            <p className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded flex items-center gap-1">
                                                💻 {u.last_device_info}
                                            </p>
                                        )}
                                        {u.last_ip_address && (
                                            <p className="text-[10px] text-red-400/80 bg-red-950/20 px-2 py-0.5 rounded flex items-center gap-1 font-mono border border-red-900/10">
                                                🌐 {u.last_ip_address}
                                            </p>
                                        )}
                                        {u.ip_history && u.ip_history.length > 1 && (
                                            <p className="text-[9px] text-zinc-500 bg-zinc-900/50 px-2 py-0.5 rounded border border-white/5 hover:border-white/10 transition-colors" title={u.ip_history.join(', ')}>
                                                📝 {u.ip_history.length} уникални IP-та
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Center Column: Admin Notes */}
                            <div className="flex-1 max-w-sm mt-3 md:mt-0" onClick={(e) => e.stopPropagation()}>
                                <div className="space-y-1 group/note relative">
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <FileText className="w-2.5 h-2.5 text-zinc-500" />
                                        <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Бележки за клиента</span>
                                    </div>
                                    <textarea
                                        defaultValue={u.admin_notes || ''}
                                        onBlur={(e) => updateAdminNotes(u.id, e.target.value)}
                                        placeholder="Добави вътрешна бележка..."
                                        className="w-full bg-black/40 border border-white/5 focus:border-red-600/40 rounded-lg p-3 text-[11px] text-white placeholder-zinc-800 focus:outline-none transition-all resize-none h-[70px] leading-tight"
                                    />
                                    <div className="absolute right-2 bottom-2 opacity-0 group-focus-within/note:opacity-100 transition-opacity pointer-events-none">
                                        <span className="text-[8px] text-zinc-600 uppercase font-bold tracking-tighter">Auto-saves on blur</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                                {/* View Profile Button */}
                                <button
                                    onClick={() => setUserProfileModal(u)}
                                    className="p-2.5 text-xs uppercase tracking-widest border border-white/10 text-white hover:bg-white/5 transition-all flex items-center gap-2"
                                    title="Виж Профил"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* Role Selector */}
                                <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1">
                                    {(['user', 'editor', 'admin'] as const).map(role => (
                                        <button
                                            key={role}
                                            disabled={updatingId === u.id || u.id === currentUser?.id}
                                            onClick={() => handleRoleUpdate(u, role)}
                                            className={`px-3 py-1.5 text-[10px] uppercase tracking-widest transition-all disabled:opacity-30 ${u.role === role ? (role === 'admin' ? 'bg-red-600 text-white' : role === 'editor' ? 'bg-yellow-600 text-black' : 'bg-zinc-700 text-white') : 'text-zinc-500 hover:text-white'}`}
                                        >
                                            {role === 'admin' ? 'Админ' : role === 'editor' ? 'Редактор' : 'Потребител'}
                                        </button>
                                    ))}
                                </div>

                                {/* Ban button */}
                                <button
                                    disabled={updatingId === u.id || u.id === currentUser?.id}
                                    onClick={() => toggleBan(u)}
                                    className={`p-2.5 text-xs uppercase tracking-widest border transition-all disabled:opacity-30 flex items-center gap-1.5 ${u.is_banned ? 'border-green-600/40 text-green-400 hover:bg-green-900/20' : 'border-red-600/40 text-red-400 hover:bg-red-900/20'}`}
                                    title={u.is_banned ? 'Разблокирай' : 'Блокирай'}
                                >
                                    {updatingId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (u.is_banned ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />)}
                                </button>
                                
                                {/* Delete Entirely button */}
                                <button
                                    disabled={updatingId === u.id || u.id === currentUser?.id}
                                    onClick={() => setDeleteModal(u)}
                                    className={`p-2.5 text-xs uppercase tracking-widest border transition-all disabled:opacity-30 flex items-center bg-transparent border-red-900/40 text-[#ff4444] hover:bg-red-950/60 hover:text-white hover:border-red-600/80`}
                                    title="ИЗТРИЙ НАПЪЛНО И БЕЗВЪЗВРАТНО"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    <p className="text-zinc-600 text-xs mt-4">{filtered.length} от {users.length} потребители</p>
                </div>
            )}

            {/* User Profile Modal */}
            <AnimatePresence>
                {userProfileModal && (
                    <UserProfileModal
                        user={userProfileModal}
                        onClose={() => setUserProfileModal(null)}
                    />
                )}
            </AnimatePresence>


            {/* Ban Modal */}
            <AnimatePresence>
                {banModal && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-[#111] border border-red-600/30 w-full max-w-md p-6"
                        >
                            <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-2">Блокиране на Потребител</h3>
                            <p className="text-zinc-400 text-sm mb-4">Потребителят <strong className="text-white">{banModal.email}</strong> ще бъде блокиран.</p>
                            <textarea
                                rows={3}
                                value={banReason}
                                onChange={e => setBanReason(e.target.value)}
                                placeholder="Причина за блокиране (по желание)..."
                                className="w-full bg-black/40 border border-white/10 text-white text-sm px-4 py-2.5 focus:outline-none focus:border-red-600/60 resize-none mb-4"
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setBanModal(null)} className="flex-1 py-3 border border-white/20 text-zinc-400 text-xs uppercase tracking-widest hover:text-white transition-colors">Отказ</button>
                                <button onClick={confirmBan} className="flex-1 py-3 bg-red-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                                    <ShieldBan className="w-4 h-4" />
                                    Блокирай
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog 
                isOpen={!!deleteModal}
                title="ИЗТРИВАНЕ ЗАВИНАГИ"
                message={`ВНИМАНИЕ: На път сте напълно да изтриете акаунта на ${deleteModal?.email}. Всички свързани с него лични данни, профил, снимки, история и бъдещи поръчки ще бъдат изтрити завинаги от базата данни без възможност за връщане!`}
                confirmLabel="Изтрий Напълно"
                isDanger={true}
                onConfirm={confirmDeleteEntirely}
                onCancel={() => setDeleteModal(null)}
            />

            {/* Role Change Confirmation */}
            <ConfirmDialog 
                isOpen={!!roleConfirmation}
                title="ПРОМЯНА НА ПРАВА"
                message={`Сигурни ли сте, че искате да направите ${roleConfirmation?.user.email} ${roleConfirmation?.targetRole === 'admin' ? 'АДМИНИСТРАТОР' : 'РЕДАКТОР'}? Това ще даде достъп до критични функции на системата!`}
                confirmLabel="Потвърди Промяната"
                isDanger={roleConfirmation?.targetRole === 'admin'}
                onConfirm={() => roleConfirmation && confirmRoleUpdate(roleConfirmation.user.id, roleConfirmation.targetRole)}
                onCancel={() => setRoleConfirmation(null)}
            />
        </div>
    );
};

// ─── User Profile Modal ──────────────────────────────────────────────────
const UserProfileModal: React.FC<{
    user: DBUser;
    onClose: () => void;
}> = ({ user, onClose }) => {
    const [orders, setOrders] = useState<RegularOrder[]>([]);
    const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { showToast } = useToast();

    const handleExportJSON = (order: RegularOrder) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(order, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `order_${order.id}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        showToast('JSON генериран успешно', 'success');
    };

    const handlePrint = (order: RegularOrder) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const dateFormatted = new Date(order.created_at).toLocaleString('bg-BG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const paymentMap: Record<string, string> = {
            'cash_on_delivery': 'Наложен платеж',
            'card': 'Карта',
            'bank': 'Банков превод'
        };

        const FREE_SHIPPING_THRESHOLD_EUR = 150 / 1.95583;
        const isFreeShipping = order.total_amount >= FREE_SHIPPING_THRESHOLD_EUR;

        const rawSubtotal = order.items.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
        const discountAmount = rawSubtotal - order.total_amount;
        const hasDiscount = discountAmount > 0.01;

        const statusStyles: Record<string, { label: string, color: string, bg: string, border: string }> = {
            'pending': { label: 'Приета', color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
            'processing': { label: 'Обработва се', color: '#c2410c', bg: '#ffedd5', border: '#fed7aa' },
            'shipped': { label: 'Изпратена', color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe' },
            'completed': { label: 'Завършена', color: '#f8fafc', bg: '#0f172a', border: '#000000' },
            'cancelled': { label: 'Отказана', color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' }
        };
        const st = statusStyles[order.status] || { label: order.status, color: '#333', bg: '#f5f5f5', border: '#ddd' };

        const itemsHtml = order.items.map((item, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'};">
                <td style="padding: 14px 16px;">
                    <div style="font-weight: 800; color: #000000; font-size: 13px; text-transform: uppercase; margin-bottom: 2px;">${item.name_bg || item.name}</div>
                    <div style="font-size: 10px; color: #666666; font-family: monospace; letter-spacing: 0.5px;">SKU: ${item.slug || 'N/A'}</div>
                </td>
                <td style="padding: 14px 16px; font-size: 12px; font-weight: 500; color: #4A0000;">
                    ${item.variant && item.variant !== '-' ? item.variant : ''}
                    ${item.material ? `<br><span style="font-size:10px;color:#666666">${item.material}</span>` : ''}
                </td>
                <td style="padding: 14px 16px; font-size: 12px; font-weight: 600; color: #4A0000;">
                    ${(item as any).dimensions || (item as any).size || (item as any).selectedSize || '-'}
                </td>
                <td style="padding: 14px 16px; text-align: center; font-weight: 700; font-size: 13px; color: #000000;">
                    ${item.quantity}
                </td>
                <td style="padding: 14px 16px; text-align: right; white-space: nowrap;">
                    <div style="font-weight: 600; font-size: 13px; color: #4A0000;">${Number(item.price).toFixed(2)} \u20ac</div>
                    <div style="font-size: 10px; color: #666666; margin-top: 2px;">${(Number(item.price) * 1.95583).toFixed(2)} \u043b\u0432.</div>
                </td>
                <td style="padding: 14px 16px; text-align: right; white-space: nowrap;">
                    <div style="font-weight: 800; color: #000000; font-size: 14px;">${(Number(item.price) * item.quantity).toFixed(2)} \u20ac</div>
                    <div style="font-size: 10px; color: #666666; margin-top: 2px;">${(Number(item.price) * item.quantity * 1.95583).toFixed(2)} \u043b\u0432.</div>
                </td>
            </tr>
        `).join('');

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${window.location.origin}/order/receipt/${order.id}`;
        const logoUrl = `${window.location.origin}/LOGO.png`;

        const html = `
            <!DOCTYPE html>
            <html lang="bg">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>\u041a\u043b\u0438\u0435\u043d\u0442\u0441\u043a\u0430 \u0420\u0430\u0437\u043f\u0438\u0441\u043a\u0430 #${order.id.slice(0, 8)}</title>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --primary: #000000;
                        --accent-red: #D32F2F;
                        --bg-color: #F9F9F9;
                        --surface: #FFFFFF;
                        --text-main: #4A0000;
                        --text-muted: #666666;
                        --border-light: #EAEAEA;
                    }
                    @page { size: A4; margin: 0; }
                    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body { font-family: 'Outfit', sans-serif; margin: 0; padding: 40px; color: var(--text-main); background: var(--bg-color); line-height: 1.5; }
                    .invoice-wrapper { max-width: 900px; margin: 0 auto; background: var(--surface); padding: 40px 50px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.04); }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 30px; border-bottom: 2px solid var(--border-light); margin-bottom: 40px; }
                    .header-left .logo { height: 48px; margin-bottom: 16px; }
                    .company-details { font-size: 12px; color: var(--text-muted); line-height: 1.6; }
                    .company-details strong { color: var(--primary); font-size: 14px; display: block; margin-bottom: 4px; }
                    .header-right { text-align: right; }
                    .receipt-badge { font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: var(--accent-red); margin-bottom: 8px; display: block; }
                    .order-number { font-size: 28px; font-weight: 900; color: var(--primary); margin: 0 0 4px 0; }
                    .order-date { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }
                    .status-pill { display: inline-block; padding: 6px 16px; border-radius: 50px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: ${st.color}; background: ${st.bg}; border: 1px solid ${st.border}; }
                    .cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 40px; }
                    .info-card { background: var(--surface); border: 1px solid var(--border-light); border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
                    .card-title { font-size: 13px; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0; display: flex; align-items: center; gap: 10px; padding-bottom: 12px; border-bottom: 1px solid var(--border-light); }
                    .card-title svg { width: 18px; height: 18px; color: var(--accent-red); }
                    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; }
                    .info-row:last-child { border-bottom: none; }
                    .info-label { color: var(--text-muted); font-weight: 500; }
                    .info-value { color: var(--primary); font-weight: 700; text-align: right; }
                    .table-wrapper { margin-bottom: 40px; border: 1px solid var(--border-light); border-radius: 12px; overflow: hidden; }
                    table { width: 100%; border-collapse: collapse; }
                    thead { background: #F4F4F4; }
                    th { text-align: left; padding: 14px 16px; font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--border-light); }
                    td { border-bottom: 1px solid var(--border-light); }
                    tr:last-child td { border-bottom: none; }
                    .summary-container { display: flex; justify-content: flex-end; margin-bottom: 50px; }
                    .summary-card { width: 400px; background: var(--surface); border: 1px solid var(--border-light); border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
                    .summary-row { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid var(--border-light); font-size: 13px; color: var(--text-muted); font-weight: 500; }
                    .summary-row:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
                    .summary-val { color: var(--primary); font-weight: 700; text-align: right; }
                    .total-row { margin-top: 16px; padding-top: 16px; border-top: 2px solid var(--primary); display: flex; justify-content: space-between; align-items: flex-start; }
                    .total-label { font-size: 14px; font-weight: 900; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
                    .total-amount { text-align: right; }
                    .total-eur { font-size: 32px; font-weight: 900; color: var(--accent-red); line-height: 1; letter-spacing: -1px; }
                    .total-eur-currency { font-size: 16px; font-weight: 700; margin-left: 4px; }
                    .total-bgn { font-size: 15px; font-weight: 700; color: var(--text-muted); margin-top: 6px; }
                    .footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 30px; border-top: 2px solid var(--border-light); }
                    .footer-message { max-width: 400px; }
                    .footer-thankyou { font-size: 16px; font-weight: 800; color: var(--primary); margin: 0 0 8px 0; }
                    .footer-text { font-size: 12px; color: var(--text-muted); margin: 0 0 16px 0; line-height: 1.6; }
                    .footer-links a { font-size: 11px; font-weight: 600; color: var(--text-muted); text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 16px; }
                    .qr-section { text-align: center; }
                    .qr-section img { width: 70px; height: 70px; margin-bottom: 8px; border-radius: 8px; padding: 4px; background: #fff; border: 1px solid var(--border-light); }
                    .qr-section p { margin: 0; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); }
                    .free-shipping-badge { display: inline-block; padding: 8px 16px; background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 11px; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 30px; }
                    @media (max-width: 768px) {
                        .cards-grid { grid-template-columns: 1fr; }
                        .header { flex-direction: column; gap: 24px; }
                        .header-right { text-align: left; }
                        .summary-container { justify-content: flex-start; }
                        .summary-card { width: 100%; }
                        .footer { flex-direction: column; gap: 30px; align-items: flex-start; }
                    }
                    @media print {
                        body { background: #fff; padding: 0; }
                        .invoice-wrapper { box-shadow: none; padding: 0; max-width: 100%; border-radius: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-wrapper">
                    <div class="header">
                        <div class="header-left">
                            <img src="${logoUrl}" alt="CarDecal" class="logo">
                            <div class="company-details">
                                <strong>CarDecal.bg</strong>
                                \u0415\u0418\u041a/\u0411\u0423\u041b\u0421\u0422\u0410\u0422: 207399120<br>
                                \u0411\u044a\u043b\u0433\u0430\u0440\u0438\u044f, \u0433\u0440. \u0421\u043e\u0444\u0438\u044f<br>
                                \u0422\u0435\u043b\u0435\u0444\u043e\u043d: +359 89 478 9942<br>
                                Email: cardecal@abv.bg
                            </div>
                        </div>
                        <div class="header-right">
                            <span class="receipt-badge">\u041a\u041b\u0418\u0415\u041d\u0422\u0421\u041a\u0410 \u0420\u0410\u0417\u041f\u0418\u0421\u041a\u0410</span>
                            <h1 class="order-number">\u2116 ${order.id.slice(0, 10).toUpperCase()}</h1>
                            <div class="order-date">${dateFormatted} \u0447.</div>
                            <div class="status-pill">${st.label}</div>
                        </div>
                    </div>

                    ${isFreeShipping ? '<div class="free-shipping-badge">\u2714 \u041f\u043e\u0440\u044a\u0447\u043a\u0430\u0442\u0430 \u0435 \u0441 \u0411\u0415\u0417\u041f\u041b\u0410\u0422\u041d\u0410 \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0430 (\u043d\u0430\u0434 150 \u043b\u0432.)</div>' : ''}

                    <div class="cards-grid">
                        <div class="info-card">
                            <h2 class="card-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                \u0414\u0430\u043d\u043d\u0438 \u0437\u0430 \u043a\u043b\u0438\u0435\u043d\u0442\u0430
                            </h2>
                            <div class="info-row">
                                <span class="info-label">\u0418\u043c\u0435 \u0438 \u0424\u0430\u043c\u0438\u043b\u0438\u044f</span>
                                <span class="info-value">${order.shipping_details.fullName}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">\u0422\u0435\u043b\u0435\u0444\u043e\u043d</span>
                                <span class="info-value">${order.shipping_details.phone}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">\u0418\u043c\u0435\u0439\u043b \u0430\u0434\u0440\u0435\u0441</span>
                                <span class="info-value">${order.shipping_details.email || '-'}</span>
                            </div>
                        </div>
                        <div class="info-card">
                            <h2 class="card-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                                \u0414\u043e\u0441\u0442\u0430\u0432\u043a\u0430 \u0438 \u041f\u043b\u0430\u0449\u0430\u043d\u0435
                            </h2>
                            <div class="info-row">
                                <span class="info-label">\u041a\u0443\u0440\u0438\u0435\u0440 \u0438 \u041d\u0430\u0441\u0435\u043b\u0435\u043d\u043e \u043c\u044f\u0441\u0442\u043e</span>
                                <span class="info-value">${order.shipping_details.deliveryType === 'econt' ? '\u0415\u043a\u043e\u043d\u0442' : order.shipping_details.deliveryType === 'speedy' ? '\u0421\u043f\u0438\u0434\u0438' : '\u0410\u0434\u0440\u0435\u0441'} - \u0433. ${order.shipping_details.city}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">\u041e\u0444\u0438\u0441 / \u0410\u0434\u0440\u0435\u0441</span>
                                <span class="info-value">${order.shipping_details.officeName}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">\u041f\u043b\u0430\u0449\u0430\u043d\u0435</span>
                                <span class="info-value">${paymentMap[order.payment_method] || order.payment_method}</span>
                            </div>
                        </div>
                    </div>

                    ${order.shipping_details.notes ? `
                    <div style="background: #FFF9C4; border-left: 4px solid #FBC02D; padding: 16px; margin-bottom: 40px; border-radius: 8px;">
                        <strong style="color: #F57F17; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">\u0411\u0435\u043b\u0435\u0436\u043a\u0430 \u043e\u0442 \u043a\u043b\u0438\u0435\u043d\u0442\u0430:</strong>
                        <span style="color: #333; font-size: 13px; font-weight: 500;">${order.shipping_details.notes}</span>
                    </div>
                    ` : ''}

                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 35%">\u041f\u0440\u043e\u0434\u0443\u043a\u0442</th>
                                    <th style="width: 25%">\u0412\u0430\u0440\u0438\u0430\u043d\u0442</th>
                                    <th style="width: 15%">\u0420\u0430\u0437\u043c\u0435\u0440</th>
                                    <th style="width: 5%; text-align: center;">\u041a-\u0432\u043e</th>
                                    <th style="width: 10%; text-align: right;">\u0415\u0434. \u0446\u0435\u043d\u0430</th>
                                    <th style="width: 10%; text-align: right;">\u041e\u0431\u0449\u043e</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </div>

                    <div class="summary-container">
                        <div class="summary-card">
                            <div class="summary-row">
                                <span>\u0411\u0440\u043e\u0439 \u0430\u0440\u0442\u0438\u043a\u0443\u043b\u0438</span>
                                <span class="summary-val">${order.items.length}</span>
                            </div>
                            <div class="summary-row">
                                <span>\u0414\u043e\u0441\u0442\u0430\u0432\u043a\u0430</span>
                                <span class="summary-val">
                                    ${isFreeShipping 
                                        ? '<span style="color: #16a34a; font-weight: 800;">\u0411\u0435\u0437\u043f\u043b\u0430\u0442\u043d\u0430 (\u043d\u0430\u0434 150 \u043b\u0432.)</span>' 
                                        : '\u041f\u043e \u0442\u0430\u0440\u0438\u0444\u0430 \u043d\u0430 \u043a\u0443\u0440\u0438\u0435\u0440\u0430'}
                                </span>
                            </div>
                            <div class="summary-row">
                                <span>\u041c\u0435\u0436\u0434\u0438\u043d\u043d\u0430 \u0441\u0443\u043c\u0430</span>
                                <div class="summary-val">
                                    ${rawSubtotal.toFixed(2)} EUR
                                    <div style="font-size: 10px; color: var(--text-muted); font-weight: 500; margin-top:2px;">${(rawSubtotal * 1.95583).toFixed(2)} \u043b\u0432.</div>
                                </div>
                            </div>
                            ${hasDiscount ? `
                            <div class="summary-row" style="color: #16a34a; border-top: 1px dashed var(--border-light); padding-top: 12px; margin-top: 4px;">
                                <span style="font-weight: 700;">\u041e\u0442\u0441\u0442\u044a\u043f\u043a\u0430</span>
                                <div class="summary-val" style="color: #16a34a;">
                                    -${discountAmount.toFixed(2)} EUR
                                    <div style="font-size: 10px; opacity: 0.8; font-weight: 500; margin-top:2px;">-${(discountAmount * 1.95583).toFixed(2)} \u043b\u0432.</div>
                                </div>
                            </div>
                            ` : ''}
                            
                            <div class="total-row">
                                <span class="total-label">\u041e\u0411\u0429\u041e \u0417\u0410 \u041f\u041b\u0410\u0429\u0410\u041d\u0415</span>
                                <div class="total-amount">
                                    <div class="total-eur">${(order.total_amount).toFixed(2)}<span class="total-eur-currency">EUR</span></div>
                                    <div class="total-bgn">${(order.total_amount * 1.95583).toFixed(2)} BGN</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <div class="footer-message">
                            <h3 class="footer-thankyou">\u0411\u043b\u0430\u0433\u043e\u0434\u0430\u0440\u0438\u043c \u0412\u0438 \u0437\u0430 \u0434\u043e\u0432\u0435\u0440\u0438\u0435\u0442\u043e!</h3>
                            <p class="footer-text">
                                \u0421 \u0412\u0430\u0448\u0430\u0442\u0430 \u043f\u043e\u0440\u044a\u0447\u043a\u0430 \u043f\u043e\u043c\u0430\u0433\u0430\u0442\u0435 \u043d\u0430 CarDecal \u0434\u0430 \u043f\u0440\u043e\u0434\u044a\u043b\u0436\u0438 \u0434\u0430 \u0441\u044a\u0437\u0434\u0430\u0432\u0430 \u0432\u0438\u0441\u043e\u043a\u043e\u043a\u0430\u0447\u0435\u0441\u0442\u0432\u0435\u043d\u0438 \u0441\u0442\u0438\u043a\u0435\u0440\u0438 \u0438 \u0434\u0438\u0437\u0430\u0439\u043d\u0438. 
                                \u0412\u0430\u0448\u0435\u0442\u043e \u0443\u0434\u043e\u0432\u043b\u0435\u0442\u0432\u043e\u0440\u0435\u043d\u0438\u0435 \u0435 \u043d\u0430\u0448 \u043e\u0441\u043d\u043e\u0432\u0435\u043d \u043f\u0440\u0438\u043e\u0440\u0438\u0442\u0435\u0442.
                            </p>
                            <div class="footer-links">
                                <a href="${window.location.origin}/terms">\u041e\u0431\u0449\u0438 \u0443\u0441\u043b\u043e\u0432\u0438\u044f</a>
                                <a href="${window.location.origin}/privacy">\u0414\u0435\u043a\u043b\u0430\u0440\u0430\u0446\u0438\u044f \u0437\u0430 \u043f\u043e\u0432\u0435\u0440\u0438\u0442\u0435\u043b\u043d\u043e\u0441\u0442</a>
                            </div>
                        </div>
                        <div class="qr-section">
                            <img src="${qrUrl}" alt="QR code" />
                            <p>\u041f\u0440\u043e\u0441\u043b\u0435\u0434\u0438 \u043f\u043e\u0440\u044a\u0447\u043a\u0430\u0442\u0430</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 1500);
    };


    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                const [ordersRes, customOrdersRes] = await Promise.all([
                    supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
                    supabase.from('custom_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
                ]);

                if (ordersRes.error) throw ordersRes.error;
                if (customOrdersRes.error) throw customOrdersRes.error;

                setOrders(ordersRes.data || []);
                setCustomOrders(customOrdersRes.data || []);
            } catch (err: any) {
                showToast("Грешка при зареждане на историята", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [user.id]);

    const filteredOrders = orders.filter(o => 
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.items.some((item: any) => (item.name_bg || item.name).toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredCustom = customOrders.filter(o => 
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="bg-[#0a0a0a] border border-white/10 w-full max-w-5xl h-[90vh] flex flex-col shadow-3xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-red-600/5 to-transparent">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-zinc-900 flex-shrink-0">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.full_name || ''} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-700 text-3xl font-black">
                                    {user.email?.[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{user.full_name || 'Без име'}</h2>
                                <span className={`text-[10px] px-3 py-1 rounded font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-red-600 text-white' : user.role === 'editor' ? 'bg-yellow-600 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                                    {user.role}
                                </span>
                            </div>
                            <p className="text-zinc-500 font-mono text-xs">{user.email}</p>
                            <div className="flex items-center gap-4 mt-2">
                                <p className="text-[10px] text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                    <UserCheck className="w-3 h-3" /> Регистриран: {new Date(user.created_at).toLocaleDateString('bg-BG')}
                                </p>
                                {user.phone && (
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                        📞 {user.phone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all rounded-xl">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left Side: Stats & Details */}
                    <div className="w-full md:w-80 border-r border-white/5 p-8 space-y-8 bg-black/40">
                        <div>
                            <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4 font-black">Статистика</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-zinc-900/50 p-4 border border-white/5 rounded-xl">
                                    <p className="text-2xl font-black text-white">{orders.length}</p>
                                    <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Поръчки</p>
                                </div>
                                <div className="bg-zinc-900/50 p-4 border border-white/5 rounded-xl">
                                    <p className="text-2xl font-black text-white">{customOrders.length}</p>
                                    <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Дизайни</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4 font-black">Инфромация за достъп</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-white/5">
                                        <RefreshCw size={14} className="text-zinc-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Последен вход</p>
                                        <p className="text-[11px] text-zinc-300 truncate tracking-tight">{user.last_login_at ? new Date(user.last_login_at).toLocaleString('bg-BG') : 'Няма данни'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-white/5">
                                        <LayoutDashboard size={14} className="text-zinc-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Устройство</p>
                                        <p className="text-[11px] text-zinc-300 truncate tracking-tight">{user.last_device_info || 'Няма данни'}</p>
                                    </div>
                                </div>
                                {user.is_banned && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-red-900/20 flex items-center justify-center border border-red-600/20 text-red-500">
                                            <ShieldBan size={14} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-red-500 uppercase font-bold tracking-widest">Блокиран акаунт</p>
                                            <p className="text-[11px] text-red-400 truncate tracking-tight">{user.banned_reason || 'Без посочена причина'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {user.admin_notes && (
                            <div>
                                <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3 font-black">Вътрешни бележки</h3>
                                <div className="p-4 bg-red-600/5 border border-red-600/10 rounded-xl text-xs text-zinc-400 italic leading-relaxed">
                                    {user.admin_notes}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Tab History */}
                    <div className="flex-1 flex flex-col bg-black/20">
                        <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                <ClipboardCheck className="w-4 h-4 text-red-600" />
                                История на активността
                            </h3>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Търси в историята..."
                                    className="w-full bg-black/60 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-red-600/60"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                                </div>
                            ) : (
                                <>
                                    {/* Regular Orders */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] text-zinc-600 uppercase font-black tracking-widest flex items-center gap-2">
                                            📦 Обикновени Поръчки ({filteredOrders.length})
                                        </h4>
                                        <div className="space-y-3">
                                            {filteredOrders.map(order => (
                                                <div key={order.id} className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl hover:bg-white/[0.04] transition-all group">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <p className="text-xs font-black text-white uppercase tracking-widest">№ {order.id.slice(0, 8)}</p>
                                                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest border ${
                                                                    order.status === 'completed' ? 'bg-zinc-800 text-zinc-100 border-black' :
                                                                    order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                                                                    order.status === 'processing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                                                                    order.status === 'shipped' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 
                                                                    order.status === 'delivered' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                                                    'bg-zinc-800 text-zinc-500 border-white/5'
                                                                }`}>
                                                                    {order.status === 'pending' ? 'Очаква' : 
                                                                     order.status === 'processing' ? 'Обработва се' : 
                                                                     order.status === 'shipped' ? 'Изпратена' : 
                                                                     order.status === 'delivered' ? 'Доставена' : 
                                                                     order.status === 'completed' ? 'Завършена' : 
                                                                     order.status === 'cancelled' ? 'Отказна' : order.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-zinc-600">{new Date(order.created_at).toLocaleString('bg-BG')}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-black text-red-600 italic">{order.total_amount.toFixed(2)} €</p>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <p className="text-[9px] text-zinc-600 uppercase font-bold">{order.payment_method === 'cash_on_delivery' ? 'Наложен Платеж' : order.payment_method}</p>
                                                                {order.total_amount >= (150 / 1.95583) && (
                                                                    <span className="text-[7px] bg-green-500/10 text-green-500 px-1 rounded font-black tracking-widest border border-green-500/20">БЕЗПЛАТНА ДОСТАВКА</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {order.items.map((item: any, iNum: number) => (
                                                            <div key={iNum} className="flex items-center gap-2 bg-black/40 border border-white/5 py-1 px-2 rounded-lg">
                                                                <img src={item.image} className="w-4 h-4 object-contain opacity-50" alt="" />
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] text-zinc-300 font-bold uppercase truncate max-w-[120px]">{item.name_bg || item.name}</span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-[8px] text-zinc-500 uppercase tracking-tighter">{item.variant}</span>
                                                                        {item.selectedSize && <span className="text-[8px] text-red-500/60 font-bold uppercase">{item.selectedSize}</span>}
                                                                        <span className="text-[9px] text-zinc-400 font-black">x{item.quantity}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {order.shipping_details?.notes && (
                                                        <div className="mt-3 p-3 bg-red-600/5 border border-red-600/10 rounded-xl">
                                                            <p className="text-[8px] text-red-500 uppercase font-black tracking-widest mb-1">Бележки към поръчката:</p>
                                                            <p className="text-[10px] text-zinc-400 leading-relaxed italic">"{order.shipping_details.notes}"</p>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Actions Row */}
                                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleExportJSON(order);
                                                            }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors border border-blue-600/10"
                                                        >
                                                            <FileJson className="w-3 h-3" />
                                                            JSON
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlePrint(order);
                                                            }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors border border-white/5"
                                                        >
                                                            <Printer className="w-3 h-3 text-zinc-400" />
                                                            Разписка
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredOrders.length === 0 && <p className="text-zinc-700 text-[10px] uppercase font-bold italic">Няма открити поръчки по този критерий.</p>}
                                        </div>
                                    </div>

                                    {/* Custom Orders */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] text-zinc-600 uppercase font-black tracking-widest flex items-center gap-2">
                                            ✨ Индивидуални Дизайни ({filteredCustom.length})
                                        </h4>
                                        <div className="space-y-3">
                                            {filteredCustom.map(order => (
                                                <div key={order.id} className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl hover:bg-white/[0.04] transition-all">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <p className="text-xs font-black text-white uppercase tracking-widest">№ {order.id.slice(0, 8)}</p>
                                                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest ${
                                                                    order.status === 'completed' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                                                                }`}>
                                                                    {order.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-zinc-600">{new Date(order.created_at).toLocaleString('bg-BG')}</p>
                                                        </div>
                                                        <div className="bg-black/40 px-3 py-1.5 border border-white/5 rounded-lg">
                                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{order.width} x {order.height} cm</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-zinc-400 line-clamp-2 italic">"{order.description || 'Няма описание'}"</p>
                                                    {order.images?.length > 0 && (
                                                        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                                                            {order.images.map((img, idx) => {
                                                                const { data } = supabase.storage.from('custom_orders').getPublicUrl(img);
                                                                return <img key={idx} src={data.publicUrl} className="w-12 h-12 object-cover rounded border border-white/10" alt="" />;
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {filteredCustom.length === 0 && <p className="text-zinc-700 text-[10px] uppercase font-bold italic">Няма открити запитвания по този критерий.</p>}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Hero Media Section ───
const HeroMediaSection: React.FC = () => {
    const { showToast } = useToast();
    const { settings, loading: settingsLoading, updateSetting, refetch } = useSiteSettings();
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        if (!isVideo && !isImage) {
            setError('Позволени са само видео (mp4, webm) или снимка (jpg, png, webp).');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess('');

        try {
            // Always upload to the SAME filename to replace old and avoid storage bloat
            const ext = file.name.split('.').pop();
            const mediaType = isVideo ? 'video' : 'image';
            const fixedFileName = isVideo ? 'hero_video.mp4' : `hero_image.${ext}`;
            const storagePath = `hero/${fixedFileName}`;

            // Upsert (overwrite) in storage
            const { error: uploadError } = await supabase.storage
                .from('site-media')
                .upload(storagePath, file, { upsert: true, contentType: file.type });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('site-media')
                .getPublicUrl(storagePath);

            // Add cache buster (timestamp) to the URL to force browser refresh
            const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

            // Save to site_settings
            await updateSetting('hero_media_url', publicUrl);
            await updateSetting('hero_media_type', mediaType);

            showToast(`✓ ${isVideo ? 'Видеото' : 'Снимката'} беше качена успешно!`, 'success');
        } catch (err: any) {
            showToast(err.message || 'Грешка при качване.', 'error');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="bg-black/20 border border-white/5 p-6 mt-6">
            <div className="flex items-center gap-3 mb-4">
                <Film className="w-5 h-5 text-red-500" />
                <h3 className="text-sm uppercase tracking-widest text-white font-bold">Начален Екран (Hero)</h3>
            </div>

            {/* Current Preview */}
            <div className="mb-5 rounded-sm overflow-hidden border border-white/10 aspect-video w-full max-w-lg bg-black flex items-center justify-center">
                {settingsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
                ) : settings.hero_media_type === 'video' ? (
                    <video
                        key={settings.hero_media_url}
                        src={settings.hero_media_url}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        autoPlay
                        playsInline
                    />
                ) : (
                    <img
                        src={settings.hero_media_url}
                        alt="Hero"
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            {/* Upload */}
            <div className="flex flex-col gap-3">
                <p className="text-zinc-500 text-xs uppercase tracking-wider">
                    Текущ тип: <span className="text-white">{settings.hero_media_type === 'video' ? '🎬 Видео' : '🖼️ Снимка'}</span>
                </p>

                <label className={`flex items-center gap-3 px-5 py-3 border cursor-pointer text-sm font-bold uppercase tracking-widest transition-all w-fit ${
                    uploading
                        ? 'border-white/10 text-zinc-600 cursor-not-allowed'
                        : 'border-red-600/50 text-red-500 hover:bg-red-600/10'
                }`}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Качване...' : 'Качи Ново Видео или Снимка'}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/mp4,video/webm"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                    />
                </label>

                <p className="text-zinc-600 text-xs">Поддържани: JPG, PNG, WEBP, MP4, WEBM. Файлът замества старото медийно съдържание — не се пълни хранилището.</p>

                {success && <p className="text-green-400 text-sm">{success}</p>}
                {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
        </div>
    );
};

// ─── Individual Projects Section ───
interface ShowcaseProject {
    id: string;
    image_url: string;
    title_bg: string;
    order_index: number;
}

const IndividualProjectsSection: React.FC = () => {
    const [projects, setProjects] = useState<ShowcaseProject[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [uploadingNew, setUploadingNew] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const fetchProjects = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('showcase_projects')
                .select('*')
                .order('order_index', { ascending: true });
            if (error) throw error;
            setProjects(data || []);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();

        let timeoutId: NodeJS.Timeout;
        const channel = supabase
            .channel('admin_showcase_sync')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'showcase_projects' },
                () => {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => {
                        fetchProjects();
                    }, 500);
                }
            )
            .subscribe();

        return () => {
            clearTimeout(timeoutId);
            supabase.removeChannel(channel);
        };
    }, [fetchProjects]);

    const handleNewFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingNew(true);
        try {
            const ext = file.name.split('.').pop() || 'jpg';
            // Use generating uuid instead of project id since we don't have it yet
            const fileName = `showcase_new_${Date.now()}.${ext}`;
            const storagePath = `showcase/${fileName}`;

            const { error: upErr } = await supabase.storage
                .from('site-media')
                .upload(storagePath, file, { contentType: file.type });

            if (upErr) throw upErr;

            const { data: urlData } = supabase.storage
                .from('site-media')
                .getPublicUrl(storagePath);

            const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

            const maxOrder = projects.length > 0 ? Math.max(...projects.map(p => p.order_index)) : 0;
            const { data, error } = await supabase
                .from('showcase_projects')
                .insert([{ 
                    image_url: publicUrl, 
                    title_bg: 'Индивидуален Дизайн',
                    order_index: maxOrder + 1 
                }])
                .select();
            
            if (error) throw error;

            setProjects(prev => [...prev, data[0]]);
            showToast('Добавен нов проект!', 'success');
        } catch (err: any) {
            showToast(err.message || 'Грешка при качване.', 'error');
        } finally {
            setUploadingNew(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Сигурни ли сте, че искате да изтриете този проект?')) return;
        
        const { error } = await supabase.from('showcase_projects').delete().eq('id', id);
        if (error) {
            showToast('Грешка при изтриване', 'error');
        } else {
            setProjects(projects.filter(p => p.id !== id));
            setSelectedIds(prev => prev.filter(i => i !== id));
            showToast('Проектът беше изтрит.', 'info');
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Сигурни ли сте, че искате да изтриете всички ${selectedIds.length} избрани проекта?`)) return;
        
        const { error } = await supabase.from('showcase_projects').delete().in('id', selectedIds);
        if (error) {
            showToast('Грешка при масовото изтриване', 'error');
        } else {
            setProjects(projects.filter(p => !selectedIds.includes(p.id)));
            setSelectedIds([]);
            showToast('Избраните проекти бяха изтрити.', 'info');
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Ghost image setting could go here
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;

        const newProjects = [...projects];
        const item = newProjects.splice(draggedIndex, 1)[0];
        newProjects.splice(dropIndex, 0, item);

        setProjects(newProjects);
        setDraggedIndex(null);

        try {
            const updates = newProjects.map((p, i) => ({
                id: p.id,
                order_index: i + 1
            }));

            for (const item of updates) {
                await supabase.from('showcase_projects')
                    .update({ order_index: item.order_index })
                    .eq('id', item.id);
            }
        } catch (err) {
            showToast('Грешка при пренареждане.', 'error');
            fetchProjects();
        }
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingId(id);
        try {
            const ext = file.name.split('.').pop() || 'jpg';
            const fileName = `showcase_${id}_${Date.now()}.${ext}`;
            const storagePath = `showcase/${fileName}`;

            const { error: upErr } = await supabase.storage
                .from('site-media')
                .upload(storagePath, file, { contentType: file.type });

            if (upErr) throw upErr;

            const { data: urlData } = supabase.storage
                .from('site-media')
                .getPublicUrl(storagePath);

            const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

            await supabase.from('showcase_projects')
                .update({ image_url: publicUrl })
                .eq('id', id);
            
            setProjects(prev => prev.map(p => p.id === id ? { ...p, image_url: publicUrl } : p));
            showToast('Снимката е качена успешно!', 'success');
        } catch (err: any) {
            showToast(err.message || 'Грешка при качване.', 'error');
        } finally {
            setUploadingId(null);
            if (e.target) e.target.value = '';
        }
    };

    return (
        <div className="mt-12">
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center border border-red-500/30">
                        <LayoutGrid className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-wider">Индивидуални Проекти</h3>
                        <p className="text-zinc-500 text-xs text-left">Управлявайте слайдера със завършени обекти на началната страница. Хванете и плъзнете за пренареждане.</p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-5 py-3 border border-red-600/30 text-red-500 text-xs font-black uppercase tracking-widest rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Изтрий избраните ({selectedIds.length})</span>
                        </button>
                    )}
                    <label className={`flex items-center gap-2 px-6 py-3 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] cursor-pointer active:scale-[0.98] ${uploadingNew ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        <span>Добави Снимка</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleNewFileUpload} />
                    </label>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-700" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {projects.map((project, idx) => (
                        <div 
                            key={project.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, idx)}
                            onDragEnd={handleDragEnd}
                            className={`bg-[#050505] border ${draggedIndex === idx ? 'border-red-600 opacity-50 scale-95' : selectedIds.includes(project.id) ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-white/10'} rounded-xl overflow-hidden group flex flex-col hover:border-red-600/30 transition-all duration-300 cursor-grab active:cursor-grabbing relative`}
                            onClick={() => setSelectedIds(prev => prev.includes(project.id) ? prev.filter(i => i !== project.id) : [...prev, project.id])}
                        >
                            <div className="relative aspect-video flex items-center justify-center overflow-hidden p-2 pointer-events-none">
                                <img src={project.image_url} alt="" className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]" />
                                
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 pointer-events-auto">
                                    <label className="w-10 h-10 bg-white/10 hover:bg-white text-white hover:text-black rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-white/20">
                                        {uploadingId === project.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                        <input type="file" className="hidden" accept="image/*" onChange={e => { e.stopPropagation(); handleFileUpload(e, project.id); }} disabled={!!uploadingId} />
                                    </label>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                                        className="w-10 h-10 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-full flex items-center justify-center transition-all active:scale-90 border border-red-600/30"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="absolute top-2 left-2 flex items-center gap-2 pointer-events-none">
                                    <span className="bg-black/90 text-white text-[10px] font-black px-2 py-1 rounded shadow-md border border-white/20">#{idx + 1}</span>
                                </div>
                                
                                <div className="absolute top-2 right-2 z-10 pointer-events-auto">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedIds(prev => prev.includes(project.id) ? prev.filter(i => i !== project.id) : [...prev, project.id]);
                                        }}
                                        className={`w-6 h-6 flex items-center justify-center rounded border transition-colors ${selectedIds.includes(project.id) ? 'bg-red-600 border-red-500 text-white' : 'bg-black/50 border-white/30 text-transparent hover:border-red-500 hover:text-white/50'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {projects.length === 0 && (
                        <div className="col-span-full py-32 border border-dashed border-white/5 bg-zinc-900/20 rounded-2xl flex flex-col items-center justify-center">
                            <BoxSelect className="w-12 h-12 text-zinc-800 mb-4" />
                            <p className="text-zinc-600 text-xs uppercase tracking-widest font-black">Няма открити проекти</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};



// ─── Messages Tab (Announcement Bar) ──────────────────────────────────────
const MessagesTab: React.FC = () => {
    const { settings, loading, updateSetting } = useSiteSettings();
    const [saving, setSaving] = useState(false);
    const [annText, setAnnText] = useState('');
    const [annMode, setAnnMode] = useState(false);
    const [annBgColor, setAnnBgColor] = useState('#000000');
    const [annTextColor, setAnnTextColor] = useState('#ffffff');
    const [annFontSize, setAnnFontSize] = useState('11px');
    const [annFontWeight, setAnnFontWeight] = useState('bold');
    const [annLetterSpacing, setAnnLetterSpacing] = useState('0.15em');
    const { showToast } = useToast();

    useEffect(() => {
        if (!loading) {
            setAnnText(settings.announcement_text || '');
            setAnnMode(settings.announcement_mode);
            setAnnBgColor(settings.announcement_bg_color || '#000000');
            setAnnTextColor(settings.announcement_text_color || '#ffffff');
            setAnnFontSize(settings.announcement_font_size || '11px');
            setAnnFontWeight(settings.announcement_font_weight || 'bold');
            setAnnLetterSpacing(settings.announcement_letter_spacing || '0.15em');
        }
    }, [loading, settings]);

    const handleSaveAnnouncement = async () => {
        setSaving(true);
        try {
            await Promise.all([
                updateSetting('announcement_text', annText),
                updateSetting('announcement_mode', annMode.toString()),
                updateSetting('announcement_bg_color', annBgColor),
                updateSetting('announcement_text_color', annTextColor),
                updateSetting('announcement_font_size', annFontSize),
                updateSetting('announcement_font_weight', annFontWeight),
                updateSetting('announcement_letter_spacing', annLetterSpacing)
            ]);
            showToast('Настройките на лентата са запазени!', 'success');
        } catch (err: any) {
            showToast('Грешка при запазване.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-black/40 border border-white/10 p-8 rounded-xl backdrop-blur-md relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl group-hover:bg-red-600/20 transition-all duration-700" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center border border-red-500/30">
                            <Megaphone className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-wider">Рекламни Съобщения</h3>
                            <p className="text-zinc-500 text-xs text-left">Управлявайте лентата със съобщения в горната част на сайта</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={() => setAnnMode(!annMode)}
                        className={`px-8 py-3 rounded-lg text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 border ${
                            annMode 
                            ? 'bg-red-600 border-red-400 text-white shadow-[0_0_30px_rgba(220,38,38,0.4)]' 
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                        }`}
                    >
                        {annMode ? 'АКТИВНА' : 'ДЕАКТИВИРАНА'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                    <div className="space-y-6">
                        <div className="text-left">
                            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3 font-black flex items-center gap-2">
                                <Edit3 className="w-3.5 h-3.5" /> Списък със съобщения
                            </label>
                            <textarea
                                value={annText}
                                onChange={e => setAnnText(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-white/10 text-white text-base px-5 py-4 focus:outline-none focus:border-red-600/60 rounded-xl min-h-[220px] transition-all font-medium leading-relaxed"
                                placeholder={"Всяко съобщение на нов ред...\nПример:\nБезплатна доставка над 150лв!\nЕдинствен имейл: cardecal@abv.bg"}
                            />
                            <div className="mt-4 flex items-start gap-2 text-zinc-500">
                                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                <p className="text-[10px] uppercase tracking-widest leading-relaxed">Системата автоматично ще върти съобщенията през 5 секунди.</p>
                            </div>
                        </div>
                        
                        <button
                            onClick={handleSaveAnnouncement}
                            disabled={saving}
                            className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-xs rounded-xl hover:bg-red-600 hover:text-white transition-all duration-500 flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50 shadow-xl"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            ЗАПАЗИ ПРОМЕНИТЕ
                        </button>
                    </div>

                    <div className="space-y-8 bg-zinc-900/30 p-8 rounded-2xl border border-white/5 text-left">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-5">
                            <Palette className="w-5 h-5 text-red-500" />
                            <span className="text-sm uppercase font-black tracking-widest text-white">Визуален Стил</span>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3 font-bold">Цвят на Фон</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <input 
                                            type="color" 
                                            value={annBgColor} 
                                            onChange={e => setAnnBgColor(e.target.value)} 
                                            className="w-12 h-12 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden" 
                                        />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={annBgColor} 
                                        onChange={e => setAnnBgColor(e.target.value)} 
                                        className="flex-1 bg-black/40 border border-white/10 text-white text-xs p-3 focus:border-red-500/50 outline-none uppercase font-mono rounded" 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3 font-bold">Цвят на Текст</label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="color" 
                                        value={annTextColor} 
                                        onChange={e => setAnnTextColor(e.target.value)} 
                                        className="w-12 h-12 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden" 
                                    />
                                    <input 
                                        type="text" 
                                        value={annTextColor} 
                                        onChange={e => setAnnTextColor(e.target.value)} 
                                        className="flex-1 bg-black/40 border border-white/10 text-white text-xs p-3 focus:border-red-500/50 outline-none uppercase font-mono rounded" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold flex items-center gap-2">
                                    <Type className="w-3 h-3" /> Размер
                                </label>
                                <select 
                                    value={annFontSize} 
                                    onChange={e => setAnnFontSize(e.target.value)} 
                                    className="w-full bg-black/60 border border-white/10 text-white text-xs p-3 outline-none focus:border-red-500/50 rounded"
                                >
                                    {['9px', '10px', '11px', '12px', '13px', '14px', '16px'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">Тегло</label>
                                <select 
                                    value={annFontWeight} 
                                    onChange={e => setAnnFontWeight(e.target.value)} 
                                    className="w-full bg-black/60 border border-white/10 text-white text-xs p-3 outline-none focus:border-red-500/50 rounded"
                                >
                                    {['normal', 'medium', 'semibold', 'bold', 'black'].map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold">Спейсинг</label>
                                <select 
                                    value={annLetterSpacing} 
                                    onChange={e => setAnnLetterSpacing(e.target.value)} 
                                    className="w-full bg-black/60 border border-white/10 text-white text-xs p-3 outline-none focus:border-red-500/50 rounded"
                                >
                                    {['normal', '0.05em', '0.1em', '0.15em', '0.2em', '0.3em', '0.4em'].map(sp => <option key={sp} value={sp}>{sp}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/10">
                            <label className="block text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-4 text-center font-black">Преглед в Реално Време</label>
                            <div 
                                className="w-full h-14 flex items-center justify-center rounded-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden" 
                                style={{ backgroundColor: annBgColor }}
                            >
                                <span 
                                    style={{ 
                                        color: annTextColor, 
                                        fontSize: annFontSize, 
                                        fontWeight: annFontWeight === 'black' ? 900 : (annFontWeight === 'bold' ? 700 : (annFontWeight === 'semibold' ? 600 : 400)), 
                                        letterSpacing: annLetterSpacing 
                                    }} 
                                    className="uppercase px-6 text-center"
                                >
                                    Вашето рекламно съобщение ще изглежда така
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MaintenanceSettingsSection: React.FC = () => {
    const { settings, loading, updateSetting, serverTimeOffset } = useSiteSettings();
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<'bg' | 'logo' | 'bg_mobile' | null>(null);
    const [title, setTitle] = useState('');
    const [msg, setMsg] = useState('');
    const [endTime, setEndTime] = useState('');
    const [features, setFeatures] = useState<string[]>([]);
    const [newFeature, setNewFeature] = useState('');

    const { showToast } = useToast();
    const [confirmToggle, setConfirmToggle] = useState(false);
    const [isActivationMenuOpen, setIsActivationMenuOpen] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    
    // Timer state for the Modal
    const [modalAnnText, setModalAnnText] = useState('Сайтът ще влезе в профилактика след {timer}');
    const [customDuration, setCustomDuration] = useState('3');
    const [durationUnit, setDurationUnit] = useState<'sec' | 'min'>('min');
    
    // Preview timer logic
    const [previewTime, setPreviewTime] = useState<string | null>(null);

    useEffect(() => {
        if (!isActivationMenuOpen) return;
        
        const updatePreview = () => {
            const val = parseInt(customDuration);
            if (isNaN(val) || val <= 0) {
                setPreviewTime(null);
                return;
            }
            
            if (durationUnit === 'min') {
                setPreviewTime(`${val}:00`);
            } else {
                setPreviewTime(`${val} сек`);
            }
        };

        updatePreview();
    }, [customDuration, durationUnit, isActivationMenuOpen]);

    const formatPreview = (text: string) => {
        if (!text) return "";
        if (!text.toLowerCase().includes("{timer}")) return text;
        
        const parts = text.split(/{timer}/i);
        return (
            <span className="items-center inline-flex">
                {parts[0]}
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-[#ff0000] text-white text-[9px] font-black rounded font-mono mx-1 shrink-0 shadow-[0_0_8px_rgba(255,0,0,0.4)]">
                    {previewTime || "..."}
                </span>
                {parts[1]}
            </span>
        );
    };

    useEffect(() => {
        if (!loading) {
            setTitle(settings.maintenance_title);
            setMsg(settings.maintenance_message || '');
            setEndTime(settings.maintenance_end_time || '');
            
            try {
                const parsed = JSON.parse(settings.maintenance_features || '[]');
                setFeatures(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
                setFeatures([]);
            }
        }
    }, [loading, settings]);

    // Prevent background scrolling when activation menu is open
    useEffect(() => {
        if (isActivationMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isActivationMenuOpen]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                updateSetting('maintenance_title', title),
                updateSetting('maintenance_message', msg),
                updateSetting('maintenance_end_time', endTime || null as any),
                updateSetting('maintenance_features', JSON.stringify(features))
            ]);
            showToast('Настройките са запазени успешно!', 'success');
        } catch (err) {
            showToast('Грешка при запис на съобщението.', 'error');
        } finally {
            setSaving(false);
        }
    };


    const handleStartTimer = async (val: number, unit: 'sec' | 'min') => {
        setSaving(true);
        try {
            const ms = unit === 'min' ? val * 60000 : val * 1000;
            // Calculate time just before saving
            const targetTime = new Date(Date.now() + serverTimeOffset + ms).toISOString();
            
            await Promise.all([
                updateSetting('maintenance_auto_start_at', targetTime),
                updateSetting('maintenance_end_time', endTime || null as any),
                updateSetting('announcement_mode', 'true'),
                updateSetting('announcement_text', modalAnnText),
                updateSetting('maintenance_features', JSON.stringify(features))
            ]);
            showToast(`Таймерът е пуснат за ${val} ${unit === 'min' ? 'минути' : 'секунди'}!`, 'success');
        } catch (err) {
            showToast('Грешка при пускане на таймера.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelTimer = async () => {
        setSaving(true);
        try {
            await updateSetting('maintenance_auto_start_at', null as any);
            // await updateSetting('announcement_mode', 'false'); // Do not disable announcement bar

            showToast('Таймерът е спрян.', 'info');
        } catch (err) {
            showToast('Грешка при спиране на таймера.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'bg' | 'bg_mobile' | 'logo') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Моля, изберете валидно изображение.', 'error');
            return;
        }

        setUploading(type);
        try {
            const ext = file.name.split('.').pop() || 'png';
            let prefix = 'maintenance_bg';
            let settingKey = 'maintenance_bg_url';
            
            if (type === 'bg_mobile') {
                prefix = 'maintenance_bg_mobile';
                settingKey = 'maintenance_bg_url_mobile';
            } else if (type === 'logo') {
                prefix = 'maintenance_logo';
                settingKey = 'maintenance_logo_url';
            }
            
            const fileName = `${prefix}.${ext}`;
            const storagePath = `maintenance/${fileName}`;

            // 1. Почистване
            const { data: existingFiles } = await supabase.storage.from('site-media').list('maintenance');
            if (existingFiles) {
                const toDel = existingFiles.filter(f => f.name.startsWith(prefix)).map(f => `maintenance/${f.name}`);
                if (toDel.length) await supabase.storage.from('site-media').remove(toDel);
            }

            // 2. Качване
            const { error: upErr } = await supabase.storage.from('site-media').upload(storagePath, file, { upsert: true, contentType: file.type });
            if (upErr) throw upErr;

            const { data: urlData } = supabase.storage.from('site-media').getPublicUrl(storagePath);
            await updateSetting(settingKey, `${urlData.publicUrl}?t=${Date.now()}`);
            
            showToast('Медията е обновена!', 'success');
        } catch (err: any) {
            showToast('Грешка: ' + err.message, 'error');
        } finally {
            setUploading(null);
        }
    };

    const toggleMaintenance = async () => {
        // If maintenance is ON OR a timer is running, we want to TURN OFF/CANCEL
        if (settings.maintenance_mode || settings.maintenance_auto_start_at) {
            setConfirmToggle(true);
        } else {
            setIsActivationMenuOpen(true); // Turning ON
        }
    };

    const handleConfirmToggle = async () => {
        setConfirmToggle(false);
        try {
            await updateSetting('maintenance_mode', 'false');
            await Promise.all([
                updateSetting('maintenance_auto_start_at', null as any),
                updateSetting('maintenance_end_time', null as any),
                updateSetting('announcement_mode', 'false')
            ]);

            showToast('Поддръжката и таймерите са изключени!', 'success');
        } catch (err) {
            showToast('Грешка при превключване.', 'error');
        }
    };

    const handleInstantStart = async () => {
        setIsActivationMenuOpen(false);
        try {
            await Promise.all([
                updateSetting('maintenance_mode', 'true'),
                updateSetting('maintenance_auto_start_at', null as any),
                updateSetting('maintenance_end_time', endTime || null as any),
                updateSetting('maintenance_features', JSON.stringify(features))
            ]);
            showToast('Режимът е ВКЛЮЧЕН мигновено!', 'success');
        } catch (err) {
            showToast('Грешка при пускане.', 'error');
        }
    };

    const handleSendEmail = async () => {
        setSendingEmail(true);
        try {
            const subject = "CarDecal.BG - Сайтът е отново активен! 🎉";
            const html = `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #dc2626; text-transform: uppercase;">Сайтът е отново активен! 🎉</h2>
                    <p>Здравейте,</p>
                    <p>CarDecal.BG е отново онлайн след профилактика. Благодарим ви за търпението!</p>
                    ${features.length > 0 ? `
                    <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #dc2626;">
                        <h3 style="margin-top: 0; text-transform: uppercase; font-size: 14px;">Какво ново?</h3>
                        <ul style="padding-left: 20px;">
                            ${features.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    <p style="margin-top: 30px;">
                        <a href="https://cardecal.bg" style="display: inline-block; padding: 12px 24px; background: #dc2626; color: #fff; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Към сайта</a>
                    </p>
                </div>
            `;
            
            const { error, data } = await supabase.functions.invoke('resend-email', {
                body: { subject, html }
            });
            
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            showToast('Известията бяха изпратени успешно до всички!', 'success');
        } catch (err: any) {
            console.error(err);
            showToast('Грешка при изпращане на имейлите.', 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    return (
        <div className="space-y-6">

            <div className="bg-black/20 border border-white/5 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-red-500" />
                        <h3 className="text-sm uppercase tracking-widest text-white font-bold">Управление на Поддръжка</h3>
                    </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSendEmail}
                        disabled={sendingEmail}
                        className="px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 flex items-center gap-2"
                        title="Ще изпрати имейл до всички потребители"
                    >
                        {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                        ИЗВЕСТИ ПОТРЕБИТЕЛИТЕ ЗА СТАРТ
                    </button>

                    <button
                        onClick={toggleMaintenance}
                        className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                            (settings.maintenance_mode || settings.maintenance_auto_start_at)
                            ? 'bg-red-600 text-white hover:bg-red-700' 
                            : 'border border-white/20 text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {(settings.maintenance_mode || settings.maintenance_auto_start_at) ? 'ИЗКЛЮЧИ ПОДДРЪЖКАТА' : 'ВКЛЮЧИ ПОДДРЪЖКАТА'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Text Settings */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5">Заглавие</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 text-white text-base font-bold px-4 py-2.5 focus:outline-none focus:border-red-600/60"
                            placeholder="ОЧАКВАЙТЕ СКОРО!"
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5">Съобщение при поддръжка</label>
                        <textarea
                            value={msg}
                            onChange={e => setMsg(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 text-white text-sm px-4 py-2.5 focus:outline-none focus:border-red-600/60 resize-none h-24"
                            placeholder="Нашият сайт е в процес на профилактика..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5">Краен час (за брояча)</label>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 text-white text-sm px-4 py-2.5 focus:outline-none focus:border-red-600/60"
                        />
                    </div>


                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 bg-white/5 border border-white/10 text-white text-xs uppercase tracking-widest font-bold hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Запази Текста
                    </button>
                </div>

                {/* Media Settings */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-3">Главна фонова снимка (Desktop 16:9)</label>
                        <div className="relative group aspect-video bg-black rounded border border-white/10 overflow-hidden mb-3">
                            <img src={settings.maintenance_bg_url} alt="Background" className="w-full h-full object-cover" />
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                {uploading === 'bg' ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Upload className="w-6 h-6 text-white" />}
                                <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'bg')} disabled={!!uploading} />
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-3">Фонова снимка за телефони (Mobile 9:16)</label>
                        <div className="relative group aspect-[9/16] w-full max-w-[240px] bg-black rounded border border-white/10 overflow-hidden mb-3">
                            <img src={settings.maintenance_bg_url_mobile} alt="Background Mobile" className="w-full h-full object-cover" />
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                {uploading === 'bg_mobile' ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Upload className="w-6 h-6 text-white" />}
                                <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'bg_mobile')} disabled={!!uploading} />
                            </label>
                        </div>
                    </div>



                    <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-3">Лого</label>
                        <div className="relative group h-20 bg-zinc-900 rounded border border-white/10 overflow-hidden px-4 flex items-center justify-center">
                            <img src={settings.maintenance_logo_url} alt="Logo" className="h-12 object-contain brightness-0 invert" />
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <Plus className="w-4 h-4 text-white" />
                                <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'logo')} disabled={!!uploading} />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>

            <ConfirmDialog
                isOpen={confirmToggle}
                title={(settings.maintenance_mode || settings.maintenance_auto_start_at) ? 'Изключване на Поддръжка' : 'Включване на Поддръжка'}
                message={`Сигурни ли сте, че искате да спрете всички активни таймери и режими за поддръжка?`}
                confirmLabel="Изключи"
                onConfirm={handleConfirmToggle}
                onCancel={() => setConfirmToggle(false)}
            />

            <AnimatePresence>
                {isActivationMenuOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsActivationMenuOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 p-8 shadow-2xl"
                        >
                            <h2 className="text-xl font-bold text-white uppercase tracking-[0.2em] mb-6">Активиране на поддръжка</h2>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Съобщение за клиенти</label>
                                    <div className="flex flex-col gap-2">
                                        <input 
                                            type="text"
                                            value={modalAnnText}
                                            onChange={e => setModalAnnText(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 p-4 text-white text-xs uppercase tracking-widest focus:outline-none focus:border-red-600 transition-colors"
                                            placeholder="Сайтът ще влезе в профилактика след {timer}..."
                                        />
                                        <div className="px-4 py-3 bg-black/40 border border-white/5 rounded text-[10px] text-zinc-500 uppercase tracking-widest italic min-h-[44px] flex items-center">
                                            Преглед: <span className="text-zinc-300 ml-2">{formatPreview(modalAnnText)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 mt-4">Нови функции / Промени (Какво ново)</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={newFeature}
                                            onChange={e => setNewFeature(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if(newFeature.trim()) {
                                                        setFeatures([...features, newFeature.trim()]);
                                                        setNewFeature('');
                                                    }
                                                }
                                            }}
                                            className="flex-1 bg-white/5 border border-white/10 p-3 text-white text-xs focus:outline-none focus:border-red-600 transition-colors"
                                            placeholder="Опишете очакваните промени..."
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                if(newFeature.trim()) {
                                                    setFeatures([...features, newFeature.trim()]);
                                                    setNewFeature('');
                                                }
                                            }}
                                            className="px-4 py-3 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center font-bold"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
                                        {features.map((f, i) => (
                                            <div key={i} className="group flex items-center justify-between bg-white/[0.03] border border-white/5 px-3 py-2">
                                                <span className="text-zinc-300 text-xs whitespace-pre-wrap">{f}</span>
                                                <button 
                                                    type="button"
                                                    onClick={() => setFeatures(features.filter((_, idx) => idx !== i))}
                                                    className="p-1 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    onClick={handleInstantStart}
                                    className="w-full group relative flex flex-col items-center justify-center gap-1.5 p-5 bg-red-600 hover:bg-red-700 transition-all border border-red-500 overflow-hidden"
                                >
                                    <span className="text-white font-black uppercase tracking-widest text-sm z-10">ПУСНИ ВЕДНАГА</span>
                                    <span className="text-white/60 text-[9px] uppercase tracking-wider z-10">Без предупреждение</span>
                                </button>

                                <div className="py-2 flex items-center gap-4">
                                    <div className="h-[1px] flex-grow bg-white/5" />
                                    <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">ИЛИ ПУСНИ ТАЙМЕР</span>
                                    <div className="h-[1px] flex-grow bg-white/5" />
                                </div>

                                <div className="grid grid-cols-[1fr,100px] gap-2">
                                    <input 
                                        type="number"
                                        value={customDuration}
                                        onChange={e => setCustomDuration(e.target.value)}
                                        className="bg-white/5 border border-white/10 p-4 text-white text-sm font-bold focus:outline-none"
                                        placeholder="Време..."
                                    />
                                    <select 
                                        value={durationUnit}
                                        onChange={e => setDurationUnit(e.target.value as any)}
                                        className="bg-white/10 border border-white/10 p-4 text-white text-xs uppercase font-bold focus:outline-none"
                                    >
                                        <option value="sec" className="bg-[#0a0a0a]">СЕК</option>
                                        <option value="min" className="bg-[#0a0a0a]">МИН</option>
                                    </select>
                                </div>

                                <button 
                                    onClick={() => {
                                        const val = parseInt(customDuration);
                                        if (isNaN(val) || val <= 0) {
                                            showToast('Моля, въведете валидно време.', 'error');
                                            return;
                                        }
                                        handleStartTimer(val, durationUnit);
                                        setIsActivationMenuOpen(false);
                                    }}
                                    className="w-full p-4 bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all"
                                >
                                    ПУСНИ БРОЯЧА
                                </button>

                                <button 
                                    onClick={() => setIsActivationMenuOpen(false)}
                                    className="w-full p-2 text-zinc-600 hover:text-white transition-colors text-[9px] font-bold uppercase tracking-widest"
                                >
                                    Отказ
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────
const DashboardTab: React.FC = () => {
    const [stats, setStats] = useState({ 
        products: 0, 
        users: 0, 
        banned: 0, 
        editors: 0, 
        admins: 0,
        monthlyRevenue: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const [
                { count: products }, 
                { data: profiles },
                { data: completedOrders }
            ] = await Promise.all([
                supabase.from('products').select('id', { count: 'exact', head: true }),
                supabase.from('profiles').select('role,is_banned'),
                supabase.from('orders')
                    .select('total_amount, created_at')
                    .eq('status', 'completed')
            ]);

            const profilesArr = profiles || [];
            const orders = completedOrders || [];
            
            const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
            const monthlyRevenue = orders
                .filter(o => o.created_at >= startOfMonth)
                .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

            setStats({
                products: products || 0,
                users: profilesArr.length,
                banned: profilesArr.filter((p: any) => p.is_banned).length,
                editors: profilesArr.filter((p: any) => p.role === 'editor').length,
                admins: profilesArr.filter((p: any) => p.role === 'admin').length,
                monthlyRevenue,
                totalRevenue
            });
            setLoading(false);
        };
        fetchStats();
    }, []);

    const cards = [
        { label: 'Приход (Месец)', value: stats.monthlyRevenue.toFixed(2) + ' €', icon: Banknote, color: 'text-green-500' },
        { label: 'Общ Приход', value: stats.totalRevenue.toFixed(2) + ' €', icon: TrendingUp, color: 'text-emerald-400' },
        { label: 'Стикери', value: stats.products, icon: Package, color: 'text-blue-400' },
        { label: 'Потребители', value: stats.users, icon: Users, color: 'text-zinc-400' },
        { label: 'Администратори', value: stats.admins, icon: Crown, color: 'text-red-400' },
    ];

    return (
        <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {cards.map(c => (
                    <div key={c.label} className="bg-black/30 border border-white/5 p-5">
                        <c.icon className={`w-5 h-5 ${c.color} mb-3`} />
                        {loading ? (
                            <div className="h-8 w-16 bg-white/5 animate-pulse rounded" />
                        ) : (
                            <p className="text-3xl font-black text-white">{c.value}</p>
                        )}
                        <p className="text-xs uppercase tracking-widest text-zinc-500 mt-1">{c.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-black/20 border border-white/5 p-6 mt-6">
                <h3 className="text-sm uppercase tracking-widest text-zinc-400 mb-4">Бърз Достъп</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <a href="/catalog" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 transition-all text-sm">
                        <Eye className="w-4 h-4" />
                        Преглед на Каталога
                    </a>
                </div>
            </div>
        </div>
    );
};

// ─── Orders Tab ───────────────────────────────────────────────────────────
interface RegularOrder {
    id: string;
    user_id: string | null;
    items: any[];
    total_amount: number;
    shipping_details: {
        fullName: string;
        phone: string;
        email?: string;
        city: string;
        deliveryType: string;
        officeName: string;
        notes?: string;
    };
    status: string;
    payment_method: string;
    created_at: string;
    admin_notes?: string;
}

const OrdersTab: React.FC = () => {
    const [orders, setOrders] = useState<RegularOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [bulkUpdating, setBulkUpdating] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [archivedData, setArchivedData] = useState<{user: any, orders: any[]}[]>([]);
    const [archivedLoading, setArchivedLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const searchVal = params.get('search_id');
        if (searchVal) {
            setSearchTerm(searchVal);
        }

        fetchOrders();

        // Real-time listener for regular orders
        const channel = supabase
            .channel('admin_orders_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    showToast('Нова поръчка е получена!', 'success');
                }
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            showToast("Грешка при зареждане на поръчки", "error");
        } else {
            setOrders(data || []);
        }
        setLoading(false);
    };

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            showToast("Грешка при обновяване на статуса", "error");
        } else {
            showToast("Статусът е обновен", "success");
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
        }
    };

    const updateAdminNotes = async (id: string, notes: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ admin_notes: notes })
            .eq('id', id);
        
        if (error) {
            showToast("Грешка при запазване на бележка", "error");
        } else {
            setOrders(prev => prev.map(o => o.id === id ? { ...o, admin_notes: notes } : o));
        }
    };

    const confirmDeleteAction = async () => {
        if (!confirmDelete) return;
        const id = confirmDelete;
        setConfirmDelete(null);
        setDeletingId(id);
        try {
            const { error } = await supabase.from('orders').delete().eq('id', id);
            if (error) throw error;
            showToast('Поръчката е изтрита успешно', 'success');
            setOrders(prev => prev.filter(o => o.id !== id));
        } catch (err: any) {
            showToast('Грешка при изтриване: ' + err.message, 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedOrders.length === 0) return;
        if (!window.confirm(`Сигурни ли сте, че искате да изтриете ${selectedOrders.length} поръчки?`)) return;

        setBulkUpdating(true);
        try {
            const { error } = await supabase.from('orders').delete().in('id', selectedOrders);
            if (error) throw error;
            showToast(`${selectedOrders.length} поръчки бяха изтрити`, 'success');
            setOrders(prev => prev.filter(o => !selectedOrders.includes(o.id)));
            setSelectedOrders([]);
        } catch (err: any) {
            showToast('Грешка при масово изтриване: ' + err.message, 'error');
        } finally {
            setBulkUpdating(false);
        }
    };

    const handleBulkStatusUpdate = async (newStatus: string) => {
        if (selectedOrders.length === 0 || !newStatus) return;
        
        setBulkUpdating(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .in('id', selectedOrders);
            
            if (error) throw error;
            
            showToast(`Статусът на ${selectedOrders.length} поръчки е обновен`, 'success');
            setOrders(prev => prev.map(o => selectedOrders.includes(o.id) ? { ...o, status: newStatus } : o));
            setSelectedOrders([]);
        } catch (err: any) {
            showToast('Грешка при масово обновяване: ' + err.message, 'error');
        } finally {
            setBulkUpdating(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map(o => o.id));
        }
    };

    const toggleSelectOrder = (id: string) => {
        setSelectedOrders(prev => 
            prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
        );
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = 
                order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                order.shipping_details.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.shipping_details.phone.includes(searchTerm);
            
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter]);

    const handleExport = () => {
        try {
            const dataToExport = selectedOrders.length > 0 
                ? orders.filter(o => selectedOrders.includes(o.id))
                : orders;
            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `orders_export_${new Date().toISOString().slice(0, 10)}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            showToast('Успешно изтеглен файл', 'success');
        } catch (err: any) {
            showToast('Грешка при експорт', 'error');
        }
    };

    const handlePrint = (order: RegularOrder) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const dateFormatted = new Date(order.created_at).toLocaleString('bg-BG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusMap: Record<string, string> = {
            'pending': 'Очаква потвърждение',
            'shipped': 'Изпратена',
            'completed': 'Завършена',
            'cancelled': 'Отказана'
        };

        const paymentMap: Record<string, string> = {
            'cash_on_delivery': 'Наложен платеж',
            'card': 'Карта',
            'bank': 'Банков превод'
        };

        const itemsHtml = order.items.map((item, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'};">
                <td style="padding: 14px 16px;">
                    <div style="font-weight: 800; color: #000000; font-size: 13px; text-transform: uppercase; margin-bottom: 2px;">${item.name_bg || item.name}</div>
                    <div style="font-size: 10px; color: #666666; font-family: monospace; letter-spacing: 0.5px;">SKU: ${item.slug || 'N/A'}</div>
                </td>
                <td style="padding: 14px 16px; font-size: 12px; font-weight: 500; color: #4A0000;">
                    ${item.variant || '-'}
                    ${item.material ? `<br><span style="font-size:10px;color:#666666">${item.material}</span>` : ''}
                </td>
                <td style="padding: 14px 16px; font-size: 12px; font-weight: 600; color: #4A0000;">
                    ${(item as any).dimensions || (item as any).size || (item as any).selectedSize || '-'}
                </td>
                <td style="padding: 14px 16px; text-align: center; font-weight: 700; font-size: 13px; color: #000000;">
                    ${item.quantity}
                </td>
                <td style="padding: 14px 16px; text-align: right; white-space: nowrap;">
                    <div style="font-weight: 600; font-size: 13px; color: #4A0000;">${Number(item.price).toFixed(2)} €</div>
                    <div style="font-size: 10px; color: #666666; margin-top: 2px;">${(Number(item.price) * 1.95583).toFixed(2)} лв.</div>
                </td>
                <td style="padding: 14px 16px; text-align: right; white-space: nowrap;">
                    <div style="font-weight: 800; color: #000000; font-size: 14px;">${(Number(item.price) * item.quantity).toFixed(2)} €</div>
                    <div style="font-size: 10px; color: #666666; margin-top: 2px;">${(Number(item.price) * item.quantity * 1.95583).toFixed(2)} лв.</div>
                </td>
            </tr>
        `).join('');

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${window.location.origin}/order/receipt/${order.id}`;
        const logoUrl = `${window.location.origin}/LOGO.png`;

        const rawSubtotal = order.items.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
        const discountAmount = rawSubtotal - order.total_amount;
        const hasDiscount = discountAmount > 0.01;

        const FREE_SHIPPING_THRESHOLD_EUR = 150 / 1.95583;
        const isFreeShipping = order.total_amount >= FREE_SHIPPING_THRESHOLD_EUR;

        const statusStyles: Record<string, { label: string, color: string, bg: string, border: string }> = {
            'pending': { label: 'Приета', color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
            'processing': { label: 'Обработва се', color: '#c2410c', bg: '#ffedd5', border: '#fed7aa' },
            'shipped': { label: 'Изпратена', color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe' },
            'completed': { label: 'Завършена', color: '#f8fafc', bg: '#0f172a', border: '#000000' },
            'cancelled': { label: 'Отказана', color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' }
        };
        const st = statusStyles[order.status] || { label: order.status, color: '#333', bg: '#f5f5f5', border: '#ddd' };

        const html = `
            <!DOCTYPE html>
            <html lang="bg">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Клиентска Разписка #${order.id.slice(0, 8)}</title>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --primary: #000000;
                        --primary-dark: #3D0000;
                        --primary-red: #950101;
                        --accent-red: #D32F2F;
                        --soft-red: #FFEBEE;
                        --bg-color: #F9F9F9;
                        --surface: #FFFFFF;
                        --text-main: #4A0000;
                        --text-muted: #666666;
                        --border-light: #EAEAEA;
                    }

                    @page { size: A4; margin: 0; }
                    
                    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    
                    body { 
                        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        margin: 0; 
                        padding: 40px; 
                        color: var(--text-main); 
                        background: var(--bg-color); 
                        line-height: 1.5;
                        -webkit-font-smoothing: antialiased;
                    }

                    .invoice-wrapper {
                        max-width: 900px;
                        margin: 0 auto;
                        background: var(--surface);
                        padding: 40px 50px;
                        border-radius: 16px;
                        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
                    }

                    /* 1. Header Section */
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        padding-bottom: 30px;
                        border-bottom: 2px solid var(--border-light);
                        margin-bottom: 40px;
                    }

                    .header-left .logo {
                        height: 48px;
                        margin-bottom: 16px;
                    }
                    
                    .company-details {
                        font-size: 12px;
                        color: var(--text-muted);
                        line-height: 1.6;
                    }
                    .company-details strong {
                        color: var(--primary);
                        font-size: 14px;
                        display: block;
                        margin-bottom: 4px;
                    }

                    .header-right {
                        text-align: right;
                    }

                    .receipt-badge {
                        font-size: 10px;
                        font-weight: 800;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                        color: var(--accent-red);
                        margin-bottom: 8px;
                        display: block;
                    }

                    .order-number {
                        font-size: 28px;
                        font-weight: 900;
                        color: var(--primary);
                        margin: 0 0 4px 0;
                        letter-spacing: -0.5px;
                    }

                    .order-date {
                        font-size: 13px;
                        color: var(--text-muted);
                        margin-bottom: 16px;
                    }

                    .status-pill {
                        display: inline-block;
                        padding: 6px 16px;
                        border-radius: 50px;
                        font-size: 11px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: ${st.color};
                        background-color: ${st.bg};
                        border: 1px solid ${st.border};
                    }

                    /* 2. Customer & Delivery Cards */
                    .cards-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 24px;
                        margin-bottom: 40px;
                    }

                    .info-card {
                        background: var(--surface);
                        border: 1px solid var(--border-light);
                        border-radius: 12px;
                        padding: 24px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
                    }

                    .card-title {
                        font-size: 11px;
                        font-weight: 800;
                        color: var(--text-muted);
                        text-transform: uppercase;
                        letter-spacing: 1.5px;
                        margin: 0 0 16px 0;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    
                    .card-title svg {
                        width: 14px;
                        height: 14px;
                        color: var(--accent-red);
                    }

                    .info-row {
                        margin-bottom: 12px;
                        font-size: 13px;
                        display: flex;
                        flex-direction: column;
                    }
                    .info-row:last-child {
                        margin-bottom: 0;
                    }
                    .info-label {
                        font-size: 10px;
                        color: var(--text-muted);
                        text-transform: uppercase;
                        font-weight: 600;
                        margin-bottom: 3px;
                        letter-spacing: 0.5px;
                    }
                    .info-value {
                        color: var(--primary);
                        font-weight: 600;
                        font-size: 14px;
                        line-height: 1.4;
                    }

                    /* 3. Products Table */
                    .table-wrapper {
                        border: 1px solid var(--border-light);
                        border-radius: 12px;
                        overflow: hidden;
                        margin-bottom: 30px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }

                    thead {
                        background: #F4F4F4;
                    }

                    th {
                        text-align: left;
                        padding: 14px 16px;
                        font-size: 11px;
                        font-weight: 800;
                        color: var(--text-muted);
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        border-bottom: 1px solid var(--border-light);
                    }

                    td {
                        border-bottom: 1px solid var(--border-light);
                    }

                    tr:last-child td {
                        border-bottom: none;
                    }

                    /* 4. Summary Section */
                    .summary-container {
                        display: flex;
                        justify-content: flex-end;
                        margin-bottom: 50px;
                    }

                    .summary-card {
                        width: 400px;
                        background: var(--surface);
                        border: 1px solid var(--border-light);
                        border-radius: 12px;
                        padding: 24px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
                    }

                    .summary-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding-bottom: 12px;
                        margin-bottom: 12px;
                        border-bottom: 1px solid var(--border-light);
                        font-size: 13px;
                        color: var(--text-muted);
                        font-weight: 500;
                    }
                    
                    .summary-row:last-of-type {
                        border-bottom: none;
                        margin-bottom: 0;
                        padding-bottom: 0;
                    }

                    .summary-val {
                        color: var(--primary);
                        font-weight: 700;
                        text-align: right;
                    }

                    .total-row {
                        margin-top: 16px;
                        padding-top: 16px;
                        border-top: 2px solid var(--primary);
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                    }

                    .total-label {
                        font-size: 14px;
                        font-weight: 900;
                        color: var(--primary);
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-top: 8px;
                    }

                    .total-amount {
                        text-align: right;
                    }

                    .total-eur {
                        font-size: 32px;
                        font-weight: 900;
                        color: var(--accent-red);
                        line-height: 1;
                        letter-spacing: -1px;
                    }

                    .total-eur-currency {
                        font-size: 16px;
                        font-weight: 700;
                        margin-left: 4px;
                    }

                    .total-bgn {
                        font-size: 15px;
                        font-weight: 700;
                        color: var(--text-muted);
                        margin-top: 6px;
                    }

                    /* 5. Footer & Trust Section */
                    .footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        padding-top: 30px;
                        border-top: 2px solid var(--border-light);
                    }

                    .footer-message {
                        max-width: 400px;
                    }

                    .footer-thankyou {
                        font-size: 16px;
                        font-weight: 800;
                        color: var(--primary);
                        margin: 0 0 8px 0;
                    }

                    .footer-text {
                        font-size: 12px;
                        color: var(--text-muted);
                        margin: 0 0 16px 0;
                        line-height: 1.6;
                    }

                    .footer-links a {
                        font-size: 11px;
                        font-weight: 600;
                        color: var(--text-muted);
                        text-decoration: none;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-right: 16px;
                        border-bottom: 1px solid transparent;
                        transition: all 0.2s;
                    }
                    
                    .footer-links a:hover {
                        color: var(--primary);
                        border-color: var(--primary);
                    }

                    .qr-section {
                        text-align: center;
                    }

                    .qr-section img {
                        width: 70px;
                        height: 70px;
                        margin-bottom: 8px;
                        border-radius: 8px;
                        padding: 4px;
                        background: #fff;
                        border: 1px solid var(--border-light);
                    }

                    .qr-section p {
                        margin: 0;
                        font-size: 9px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: var(--text-muted);
                    }

                    /* Print and Mobile Adjustments */
                    @media (max-width: 768px) {
                        .cards-grid { grid-template-columns: 1fr; }
                        .header { flex-direction: column; gap: 24px; }
                        .header-right { text-align: left; }
                        .table-wrapper { overflow-x: auto; }
                        .summary-container { justify-content: flex-start; }
                        .summary-card { width: 100%; }
                        .footer { flex-direction: column; gap: 30px; align-items: flex-start; }
                        .invoice-wrapper { padding: 20px; border-radius: 0; box-shadow: none; background: transparent; }
                        body { padding: 0; background: var(--surface); }
                    }

                    @media print {
                        body { background: #fff; padding: 0; }
                        .invoice-wrapper { box-shadow: none; padding: 0; max-width: 100%; border-radius: 0; }
                        .no-print { display: none; }
                        .summary-card, .info-card, .table-wrapper { border-color: #ddd; box-shadow: none; }
                        .qr-section { border: none !important; }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-wrapper">
                    <!-- 1. Header -->
                    <div class="header">
                        <div class="header-left">
                            <img src="${logoUrl}" alt="CarDecal" class="logo">
                            <div class="company-details">
                                <strong>CarDecal.bg</strong>
                                ЕИК/БУЛСТАТ: 207399120<br>
                                България, гр. София<br>
                                Телефон: +359 89 478 9942<br>
                                Email: cardecal@abv.bg
                            </div>
                        </div>
                        <div class="header-right">
                            <span class="receipt-badge">КЛИЕНТСКА РАЗПИСКА</span>
                            <h1 class="order-number">№ ${order.id.slice(0, 10).toUpperCase()}</h1>
                            <div class="order-date">${dateFormatted} ч.</div>
                            <div class="status-pill">${st.label}</div>
                        </div>
                    </div>

                    ${isFreeShipping ? '<div style="display: inline-block; padding: 8px 16px; background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 11px; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 30px;">✔ Поръчката е с БЕЗПЛАТНА доставка (над 150 лв.)</div>' : ''}

                    <!-- 2. Customer & Delivery -->
                    <div class="cards-grid">
                        <div class="info-card">
                            <h2 class="card-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                Данни за клиента
                            </h2>
                            <div class="info-row">
                                <span class="info-label">Име и Фамилия</span>
                                <span class="info-value">${order.shipping_details.fullName}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Телефон</span>
                                <span class="info-value">${order.shipping_details.phone}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Имейл адрес</span>
                                <span class="info-value">${order.shipping_details.email || '-'}</span>
                            </div>
                        </div>
                        <div class="info-card">
                            <h2 class="card-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                                Доставка и Плащане
                            </h2>
                            <div class="info-row">
                                <span class="info-label">Куриер и Населено място</span>
                                <span class="info-value">${order.shipping_details.deliveryType === 'econt' ? 'Еконт' : order.shipping_details.deliveryType === 'speedy' ? 'Спиди' : 'Адрес'} - г. ${order.shipping_details.city}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Офис / Адрес</span>
                                <span class="info-value">${order.shipping_details.officeName}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Плащане</span>
                                <span class="info-value">${paymentMap[order.payment_method] || order.payment_method}</span>
                            </div>
                        </div>
                    </div>

                    ${order.shipping_details.notes ? `
                    <div style="background: #FFF9C4; border-left: 4px solid #FBC02D; padding: 16px; margin-bottom: 40px; border-radius: 8px;">
                        <strong style="color: #F57F17; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Бележка от клиента:</strong>
                        <span style="color: #333; font-size: 13px; font-weight: 500;">${order.shipping_details.notes}</span>
                    </div>
                    ` : ''}

                    <!-- 3. Products Table -->
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 35%">Продукт</th>
                                    <th style="width: 25%">Вариант</th>
                                    <th style="width: 15%">Размер</th>
                                    <th style="width: 5%; text-align: center;">К-во</th>
                                    <th style="width: 10%; text-align: right;">Ед. цена</th>
                                    <th style="width: 10%; text-align: right;">Общо</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </div>

                    <!-- 4. Summary Section -->
                    <div class="summary-container">
                        <div class="summary-card">
                            <div class="summary-row">
                                <span>Брой артикули</span>
                                <span class="summary-val">${order.items.length}</span>
                            </div>
                            <div class="summary-row">
                                <span>Доставка</span>
                                <span class="summary-val">
                                    ${isFreeShipping 
                                        ? '<span style="color: #16a34a; font-weight: 800;">Безплатна (над 150 лв.)</span>' 
                                        : 'По тарифа на куриера'}
                                </span>
                            </div>
                            <div class="summary-row">
                                <span>Междинна сума</span>
                                <div class="summary-val">
                                    ${rawSubtotal.toFixed(2)} EUR
                                    <div style="font-size: 10px; color: var(--text-muted); font-weight: 500; margin-top:2px;">${(rawSubtotal * 1.95583).toFixed(2)} лв.</div>
                                </div>
                            </div>
                            ${hasDiscount ? `
                            <div class="summary-row" style="color: #16a34a; border-top: 1px dashed var(--border-light); padding-top: 12px; margin-top: 4px;">
                                <span style="font-weight: 700;">Отстъпка</span>
                                <div class="summary-val" style="color: #16a34a;">
                                    -${discountAmount.toFixed(2)} EUR
                                    <div style="font-size: 10px; opacity: 0.8; font-weight: 500; margin-top:2px;">-${(discountAmount * 1.95583).toFixed(2)} лв.</div>
                                </div>
                            </div>
                            ` : ''}
                            
                            <div class="total-row">
                                <span class="total-label">ОБЩО ЗА ПЛАЩАНЕ</span>
                                <div class="total-amount">
                                    <div class="total-eur">${(order.total_amount).toFixed(2)}<span class="total-eur-currency">EUR</span></div>
                                    <div class="total-bgn">${(order.total_amount * 1.95583).toFixed(2)} BGN</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 5. Trust & Legitimacy -->
                    <div class="footer">
                        <div class="footer-message">
                            <h3 class="footer-thankyou">Благодарим Ви за доверието!</h3>
                            <p class="footer-text">
                                С Вашата поръчка помагате на CarDecal да продължи да създава висококачествени стикери и дизайни. 
                                Вашето удовлетворение е наш основен приоритет.
                            </p>
                            <div class="footer-links">
                                <a href="${window.location.origin}/terms">Общи условия</a>
                                <a href="${window.location.origin}/privacy">Декларация за поверителност</a>
                            </div>
                        </div>
                        <div class="qr-section">
                            <img src="${qrUrl}" alt="QR code" />
                            <p>Проследи поръчката</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Wait for images and fonts to load
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 1500);
    };



    const fetchArchivedOrders = async () => {
        setArchivedLoading(true);
        try {
            const { data, error } = await supabase
                .from('deleted_users_archive')
                .select('id, user_id, email, full_name, phone, reason, orders_snapshot, deleted_at')
                .order('deleted_at', { ascending: false });
            if (error) throw error;
            const result = (data || []).filter((u: any) => u.orders_snapshot && u.orders_snapshot.length > 0).map((u: any) => ({
                user: { id: u.id, user_id: u.user_id, email: u.email, full_name: u.full_name, phone: u.phone, reason: u.reason, deleted_at: u.deleted_at },
                orders: u.orders_snapshot || []
            }));
            setArchivedData(result);
        } catch (err: any) {
            showToast('Грешка при зареждане на архивирани поръчки', 'error');
        }
        setArchivedLoading(false);
    };



    if (loading) return <div className="flex items-center justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20';
            case 'shipped': return 'bg-blue-500/20 text-blue-500 border-blue-500/20';
            case 'completed': return 'bg-green-500/20 text-green-500 border-green-500/20';
            case 'cancelled': return 'bg-red-500/20 text-red-500 border-red-500/20';
            default: return 'bg-zinc-500/20 text-zinc-500 border-zinc-500/20';
        }
    };

    return (
        <div className="space-y-6">
            <ConfirmDialog 
                isOpen={!!confirmDelete}
                title="Изтриване на поръчка"
                message="Сигурни ли сте, че искате да изтриете тази поръчка? Това действие е необратимо и всички данни за поръчката ще бъдат загубени."
                confirmLabel="Изтрий Перманентно"
                cancelLabel="Отказ"
                onConfirm={confirmDeleteAction}
                onCancel={() => setConfirmDelete(null)}
                isDanger={true}
            />

            <div className="flex flex-col gap-6 mb-8">
                {/* Tab switcher */}
                <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                    <button
                        onClick={() => setShowArchived(false)}
                        className={`px-5 py-2.5 text-[11px] uppercase font-black tracking-widest transition-all rounded-lg ${!showArchived ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'bg-white/5 text-zinc-500 hover:text-white border border-white/10'}`}
                    >
                        Активни ({orders.length})
                    </button>
                    <button
                        onClick={() => { setShowArchived(true); if (archivedData.length === 0) fetchArchivedOrders(); }}
                        className={`px-5 py-2.5 text-[11px] uppercase font-black tracking-widest transition-all rounded-lg flex items-center gap-2 ${showArchived ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'bg-white/5 text-zinc-500 hover:text-white border border-white/10'}`}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Изтрити
                    </button>
                </div>

                {!showArchived ? (
                <>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-white">Всички Поръчки ({filteredOrders.length})</h2>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[240px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input 
                                type="text"
                                placeholder="Търси по номер на поръчка, име или телефон..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-red-600 transition-colors"
                            />
                        </div>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest text-white focus:outline-none focus:border-red-600 cursor-pointer"
                        >
                            <option value="all">Всички статуси</option>
                            <option value="pending">Изчакващи</option>
                            <option value="shipped">Изпратени</option>
                            <option value="completed">Завършени</option>
                            <option value="cancelled">Отказни</option>
                        </select>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[10px] uppercase tracking-widest transition-colors border border-white/10 rounded-lg"
                        >
                            <Download className="w-4 h-4" /> {selectedOrders.length > 0 ? 'Експорт Избрани' : 'Експорт'}
                        </button>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                <AnimatePresence>
                    {selectedOrders.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-red-600/10 border border-red-600/20 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedOrders.length === filteredOrders.length}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-white/10 bg-black/40 text-red-600 focus:ring-red-600"
                                    />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                        Избрани: {selectedOrders.length}
                                    </span>
                                </label>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <select 
                                    className="bg-black/60 border border-white/10 text-white text-[10px] uppercase font-black p-2 rounded focus:outline-none focus:border-red-600"
                                    onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Промени статус на избраните</option>
                                    <option value="pending">Изчакваща</option>
                                    <option value="shipped">Изпратена</option>
                                    <option value="completed">Завършена</option>
                                    <option value="cancelled">Отказна</option>
                                </select>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={bulkUpdating}
                                    className="p-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all rounded-lg"
                                    title="Изтрий избраните"
                                >
                                    {bulkUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            
            <div className="space-y-4">
                {filteredOrders.map(order => (
                    <div key={order.id} className={`bg-black/40 border transition-all p-6 rounded-xl hover:border-white/20 ${selectedOrders.includes(order.id) ? 'border-red-600/40 bg-red-600/5' : 'border-white/5'}`}>
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Checkbox Column */}
                            <div className="lg:pt-2 flex items-start">
                                <input 
                                    type="checkbox"
                                    checked={selectedOrders.includes(order.id)}
                                    onChange={() => toggleSelectOrder(order.id)}
                                    className="w-5 h-5 rounded border-white/10 bg-black/40 text-red-600 focus:ring-red-600 cursor-pointer"
                                />
                            </div>

                            {/* Left Side: Order Info */}
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Поръчка #{order.id.slice(0, 8)}</h3>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                                            {new Date(order.created_at).toLocaleString('bg-BG')}
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">Клиент</h4>
                                        <p className="text-white text-sm font-medium">{order.shipping_details.fullName}</p>
                                        <p className="text-zinc-400 text-xs">{order.shipping_details.phone}</p>
                                        <p className="text-zinc-400 text-xs">{order.shipping_details.email}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">Доставка</h4>
                                        <p className="text-white text-sm font-medium">
                                            {order.shipping_details.deliveryType === 'econt' ? 'Еконт Офис' : 'Спиди Офис'}
                                        </p>
                                        <p className="text-zinc-400 text-xs">{order.shipping_details.city}</p>
                                        <p className="text-zinc-400 text-xs">{order.shipping_details.officeName}</p>
                                    </div>
                                </div>

                                {order.shipping_details.notes && (
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5 italic">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Бележка от клиент</p>
                                        <p className="text-xs text-zinc-400">"{order.shipping_details.notes}"</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-2">
                                        <FileText className="w-3 h-3" /> Административни Бележки
                                    </h4>
                                    <div className="relative group/note">
                                        <textarea
                                            defaultValue={order.admin_notes || ''}
                                            onBlur={(e) => updateAdminNotes(order.id, e.target.value)}
                                            placeholder="Добави вътрешна бележка за поръчката..."
                                            className="w-full bg-black/40 border border-white/5 focus:border-red-600/40 rounded-lg p-3 text-xs text-white placeholder-zinc-700 focus:outline-none transition-all resize-none min-h-[80px]"
                                        />
                                        <div className="absolute right-2 bottom-2 opacity-0 group-focus-within/note:opacity-100 transition-opacity">
                                            <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-tighter">Auto-saves on blur</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Middle Side: Items */}
                            <div className="lg:w-1/3 space-y-3">
                                <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3 font-bold">Артикули ({order.items.length})</h4>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {order.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex gap-3 bg-white/2 p-2 rounded-lg border border-white/5">
                                            <div className="w-10 h-10 rounded overflow-hidden shrink-0">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-white uppercase truncate">{item.name_bg || item.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {item.variant && <span className="text-[9px] text-zinc-500 uppercase tracking-tighter">{item.variant}</span>}
                                                    {item.selectedSize && <span className="text-[9px] text-red-500/60 font-black uppercase tracking-widest">{item.selectedSize}</span>}
                                                    <span className="text-[9px] text-zinc-400 font-black">x{item.quantity}</span>
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-black text-red-500">{(item.price * item.quantity).toFixed(2)} €</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-[10px] text-white uppercase tracking-widest font-black">Общо за плащане</span>
                                    <span className="text-lg font-black text-red-600">{order.total_amount.toFixed(2)} €</span>
                                </div>
                            </div>

                            {/* Right Side: Actions */}
                            <div className="lg:w-48 space-y-4 border-l-0 lg:border-l border-white/5 lg:pl-8">
                                <div>
                                    <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3 font-bold">Статус</h4>
                                    <select 
                                        value={order.status} 
                                        onChange={(e) => updateStatus(order.id, e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 text-white text-[10px] uppercase font-black p-2 focus:outline-none focus:border-red-600 transition-colors cursor-pointer"
                                    >
                                        <option value="pending">Изчакваща</option>
                                        <option value="shipped">Изпратена</option>
                                        <option value="completed">Завършена</option>
                                        <option value="cancelled">Отказна</option>
                                    </select>
                                </div>
                                <div>
                                    <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3 font-bold">Управление</h4>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handlePrint(order)}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 text-white text-[10px] uppercase font-black tracking-widest hover:bg-white/10 transition-all shadow-sm"
                                        >
                                            <Printer className="w-4 h-4" />
                                            ПЕЧАТ КЛИЕНТ
                                        </button>

                                    </div>
                                    <button 
                                        onClick={() => setConfirmDelete(order.id)}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] uppercase font-black tracking-widest hover:bg-red-600 hover:text-white transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        ИЗТРИЙ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredOrders.length === 0 && (
                    <div className="border border-dashed border-white/10 p-20 text-center rounded-2xl">
                        <p className="text-zinc-500 uppercase tracking-widest text-sm">
                            {searchTerm || statusFilter !== 'all' ? 'Няма намерени поръчки по тези критерии' : 'Все още няма направени поръчки'}
                        </p>
                    </div>
                )}
            </div>
            </>
            ) : (

                /* ─── Archived Orders View ─── */
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-3">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            Поръчки от изтрити потребители
                        </h2>
                        <button onClick={fetchArchivedOrders} className="p-2 border border-white/10 text-zinc-500 hover:text-white transition-colors rounded-lg">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    {archivedLoading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>
                    ) : archivedData.length === 0 ? (
                        <div className="border border-dashed border-white/10 p-20 text-center rounded-2xl">
                            <p className="text-zinc-600 uppercase tracking-widest text-xs">Няма архивирани поръчки от изтрити потребители</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {archivedData.map((entry) => (
                                <div key={entry.user.id} className="border border-red-900/20 rounded-2xl overflow-hidden">
                                    {/* User Header */}
                                    <div className="bg-red-950/20 border-b border-red-900/20 p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div>
                                            <p className="text-white font-black uppercase tracking-tight">{entry.user.full_name || 'Без име'}</p>
                                            <p className="text-zinc-500 text-xs">{entry.user.email}</p>
                                            {entry.user.phone && <p className="text-zinc-600 text-[10px] font-mono mt-0.5">{entry.user.phone}</p>}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] uppercase tracking-widest text-red-500 font-black">Изтрит на:</p>
                                            <p className="text-zinc-400 text-xs">{new Date(entry.user.deleted_at).toLocaleString('bg-BG')}</p>
                                            {entry.user.reason && <p className="text-zinc-600 text-[10px] italic mt-0.5">"{entry.user.reason}"</p>}
                                        </div>
                                    </div>
                                    {/* Orders */}
                                    <div className="p-5 space-y-4">
                                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">{entry.orders.length} поръчки</p>
                                        {entry.orders.map((order: any, idx: number) => {
                                            const statusLabel: Record<string, string> = { pending: 'Приета', processing: 'Обработва се', shipped: 'Изпратена', completed: 'Завършена', cancelled: 'Отказана' };
                                            const statusColor: Record<string, string> = { pending: 'text-yellow-500', processing: 'text-orange-500', shipped: 'text-blue-500', completed: 'text-green-500', cancelled: 'text-red-500' };
                                            return (
                                                <div key={idx} className="bg-white/3 border border-white/5 rounded-xl p-4">
                                                    <div className="flex flex-col md:flex-row justify-between items-start mb-3 pb-3 border-b border-white/5 gap-2">
                                                        <div>
                                                            <p className="text-white text-xs font-bold uppercase">Поръчка #{(order.id || '').slice(0, 8)}</p>
                                                            <p className="text-[10px] text-zinc-500 mt-0.5">{order.created_at ? new Date(order.created_at).toLocaleString('bg-BG') : '—'}</p>
                                                            <p className="text-[10px] text-zinc-600 mt-0.5">Клиент: {order.shipping_details?.fullName || entry.user.full_name || '—'}</p>
                                                        </div>
                                                        <div className="text-right flex items-center gap-3">
                                                            <div>
                                                                <p className="text-red-500 font-black">{order.total_amount?.toFixed(2)} &euro;</p>
                                                                <span className={`text-[9px] uppercase tracking-widest font-bold ${statusColor[order.status] || 'text-zinc-500'}`}>{statusLabel[order.status] || order.status}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const fakeOrder = { ...order, items: order.items || [] } as RegularOrder;
                                                                    handlePrint(fakeOrder);
                                                                }}
                                                                className="p-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all rounded-lg"
                                                                title="Печат"
                                                            >
                                                                <Printer className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {order.items?.map((item: any, i: number) => (
                                                            <div key={i} className="flex justify-between text-[11px]">
                                                                <span className="text-zinc-400">{item.name_bg || item.name} x{item.quantity}</span>
                                                                <span className="text-white">{(Number(item.price) * item.quantity).toFixed(2)} &euro;</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
        </div>
    );
};

// ─── Custom Orders Tab ──────────────────────────────────────────────────
interface CustomOrder {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string | null;
    width: string | null;
    height: string | null;
    quantity: string | null;
    description: string | null;
    images: string[];
    status: string;
    created_at: string;
    user_id: string | null;
    admin_notes?: string;
}

const CustomOrdersTab: React.FC = () => {
    const [orders, setOrders] = useState<CustomOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [deleteModal, setDeleteModal] = useState<CustomOrder | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [bulkUpdating, setBulkUpdating] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [archivedData, setArchivedData] = useState<{user: any, orders: any[]}[]>([]);
    const [archivedLoading, setArchivedLoading] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('custom_orders')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            showToast("Грешка при зареждане на индивидуални дизайни", "error");
        } else {
            setOrders(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();

        // Real-time listener for custom orders
        const channel = supabase
            .channel('admin_custom_orders_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_orders' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    showToast('Ново запитване за индивидуален дизайн!', 'success');
                }
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleDelete = async () => {
        if (!deleteModal) return;
        try {
            if (deleteModal.images && deleteModal.images.length > 0) {
                const { error: storageError } = await supabase.storage
                    .from('custom_orders')
                    .remove(deleteModal.images);
                if (storageError) console.error("Storage delete error", storageError);
            }
            
            const { error: dbError } = await supabase
                .from('custom_orders')
                .delete()
                .eq('id', deleteModal.id);
                
            if (dbError) throw dbError;
            
            showToast("Запитването е изтрито", "success");
            setOrders(prev => prev.filter(o => o.id !== deleteModal.id));
        } catch (err: any) {
            showToast(err.message || "Грешка при изтриване", "error");
        } finally {
            setDeleteModal(null);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedOrders.length === 0) return;
        if (!window.confirm(`Сигурни ли сте, че искате да изтриете ${selectedOrders.length} запитвания?`)) return;

        setBulkUpdating(true);
        try {
            // Collect images to delete from storage
            const ordersToDelete = orders.filter(o => selectedOrders.includes(o.id));
            const allImages = ordersToDelete.flatMap(o => o.images || []);
            
            if (allImages.length > 0) {
                await supabase.storage.from('custom_orders').remove(allImages);
            }

            const { error } = await supabase.from('custom_orders').delete().in('id', selectedOrders);
            if (error) throw error;
            
            showToast(`${selectedOrders.length} запитвания бяха изтрити`, 'success');
            setOrders(prev => prev.filter(o => !selectedOrders.includes(o.id)));
            setSelectedOrders([]);
        } catch (err: any) {
            showToast('Грешка при масово изтриване: ' + err.message, 'error');
        } finally {
            setBulkUpdating(false);
        }
    };

    const handleBulkStatusUpdate = async (newStatus: string) => {
        if (selectedOrders.length === 0 || !newStatus) return;
        
        setBulkUpdating(true);
        try {
            const { error } = await supabase
                .from('custom_orders')
                .update({ status: newStatus })
                .in('id', selectedOrders);
            
            if (error) throw error;
            
            showToast(`Статусът на ${selectedOrders.length} запитвания е обновен`, 'success');
            setOrders(prev => prev.map(o => selectedOrders.includes(o.id) ? { ...o, status: newStatus } : o));
            setSelectedOrders([]);
        } catch (err: any) {
            showToast('Грешка при масово обновяване: ' + err.message, 'error');
        } finally {
            setBulkUpdating(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map(o => o.id));
        }
    };

    const toggleSelectOrder = (id: string) => {
        setSelectedOrders(prev => 
            prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
        );
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const fullName = `${order.first_name || ''} ${order.last_name || ''}`.toLowerCase();
            const matchesSearch = 
                fullName.includes(searchTerm.toLowerCase()) || 
                (order.phone && order.phone.includes(searchTerm)) ||
                (order.email && order.email.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter]);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('custom_orders')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            showToast("Грешка при обновяване на статуса", "error");
        } else {
            showToast("Статусът е обновен", "success");
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
        }
    };

    const handleUpdateAdminNotes = async (id: string, notes: string) => {
        const { error } = await supabase
            .from('custom_orders')
            .update({ admin_notes: notes })
            .eq('id', id);
        
        if (error) {
            showToast("Грешка при запазване на бележка", "error");
        } else {
            setOrders(prev => prev.map(o => o.id === id ? { ...o, admin_notes: notes } : o));
        }
    };

    const handlePrintCustom = (order: CustomOrder) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const dateFormatted = new Date(order.created_at).toLocaleString('bg-BG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusMap: Record<string, string> = {
            'pending': 'Ново запитване',
            'processed': 'В процес',
            'completed': 'Завършено',
            'cancelled': 'Отказано'
        };

        const imagesHtml = order.images && order.images.length > 0 
            ? order.images.map(img => {
                const { data } = supabase.storage.from('custom_orders').getPublicUrl(img);
                return `<img src="${data.publicUrl}" style="width: 150px; height: 150px; object-fit: cover; border: 1px solid #eee; border-radius: 4px; margin-right: 10px; margin-bottom: 10px;">`;
            }).join('')
            : '<p style="color: #999; font-style: italic; font-size: 12px;">Няма прикачени файлове</p>';

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${window.location.origin}/order/${order.id}`;
        const logoUrl = `${window.location.origin}/LOGO.png`;

        const html = `
            <!DOCTYPE html>
            <html lang="bg">
                <head>
                    <meta charset="UTF-8">
                    <title>Индивидуална Поръчка #${order.id.slice(0, 8)} - CarDecal.bg</title>
                    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
                    <style>
                        @page { size: A4; margin: 0; }
                        * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
                        body { 
                            font-family: 'Outfit', sans-serif; 
                            margin: 0; padding: 40px; 
                            color: #1a1a1a; background: #fff; line-height: 1.5;
                        }
                        .container { max-width: 800px; margin: 0 auto; }
                        
                        /* Header */
                        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px; }
                        .brand { flex: 1; }
                        .logo-container { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
                        .logo-img { height: 45px; width: auto; }
                        .brand-name { font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #000; text-transform: uppercase; }
                        
                        .order-meta { text-align: right; }
                        .order-label { display: inline-block; padding: 6px 12px; background: #3D0000; color: #fff; font-size: 10px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
                        .order-number { font-size: 20px; font-weight: 900; margin: 0; color: #000; }
                        .order-date { font-size: 13px; color: #888; margin-top: 4px; }

                        /* Grid Layout */
                        .blocks-wrapper { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                        .block-title { font-size: 10px; font-weight: 900; color: #888; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 12px; }
                        .block-content p { margin: 4px 0; font-size: 13px; color: #333; }
                        .block-content strong { color: #000; font-weight: 600; }

                        /* Specs Grid */
                        .specs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
                        .spec-box { background: #fcfcfc; border: 1px solid #f0f0f0; padding: 15px; border-radius: 6px; text-align: center; }
                        .spec-label { font-size: 10px; color: #aaa; text-transform: uppercase; font-weight: 900; display: block; margin-bottom: 5px; }
                        .spec-value { font-size: 16px; font-weight: 700; color: #000; }

                        /* Description Block */
                        .desc-block { background: #f9f9f9; border-left: 4px solid #FF0000; padding: 25px; margin-bottom: 40px; }
                        .desc-title { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #000; margin-bottom: 10px; }
                        .desc-text { font-size: 14px; color: #333; white-space: pre-wrap; font-style: italic; }

                        /* Footer */
                        .footer { margin-top: 60px; padding-top: 40px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: flex-end; }
                        .footer-note { font-size: 12px; color: #888; max-width: 450px; }
                        .footer-note h4 { color: #000; font-size: 13px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px; }
                        .qr-block { text-align: center; }
                        .qr-img { width: 85px; height: 85px; margin-bottom: 8px; padding: 6px; border: 1px solid #eee; border-radius: 8px; background: #fff; }
                        .qr-text { font-size: 9px; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; }

                        @media print {
                            body { padding: 40px; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="brand">
                                <div class="logo-container">
                                    <img src="${logoUrl}" alt="CarDecal" class="logo-img">
                                    <span class="brand-name">CarDecal.bg</span>
                                </div>
                                <div style="font-size: 11px; color: #666;">Индивидуален Дизайн и Проект</div>
                            </div>
                            <div class="order-meta">
                                <div class="order-label">Custom Project</div>
                                <h1 class="order-number">№ ${order.id.slice(0, 10).toUpperCase()}</h1>
                                <div class="order-date">${dateFormatted} ч.</div>
                            </div>
                        </div>

                        <div class="blocks-wrapper">
                            <div>
                                <div class="block-title">Данни за клиента</div>
                                <div class="block-content">
                                    <p><strong>${order.first_name} ${order.last_name}</strong></p>
                                    <p>${order.phone}</p>
                                    <p>${order.email || '-'}</p>
                                </div>
                            </div>
                            <div>
                                <div class="block-title">Статус на проекта</div>
                                <div class="block-content">
                                    <div style="font-size: 14px; font-weight: 700; color: #FF0000; text-transform: uppercase;">
                                        ${statusMap[order.status] || order.status}
                                    </div>
                                    <p style="margin-top: 10px; color: #888; font-size: 11px;">Срок за отговор: до 24 часа след поръчка.</p>
                                </div>
                            </div>
                        </div>

                        <div class="block-title">Характеристики</div>
                        <div class="specs-grid">
                            <div class="spec-box">
                                <span class="spec-label">Ширина</span>
                                <span class="spec-value">${order.width || '-'} cm</span>
                            </div>
                            <div class="spec-box">
                                <span class="spec-label">Височина</span>
                                <span class="spec-value">${order.height || '-'} cm</span>
                            </div>
                            <div class="spec-box">
                                <span class="spec-label">Количество</span>
                                <span class="spec-value">${order.quantity || '-'} бр</span>
                            </div>
                        </div>

                        <div class="desc-block">
                            <div class="desc-title">Описание на проекта</div>
                            <div class="desc-text">"${order.description || 'Няма допълнително описание'}"</div>
                        </div>

                        <div class="block-title" style="margin-bottom: 20px;">Прикачени материали</div>
                        <div style="display: flex; flex-wrap: wrap;">
                            ${imagesHtml}
                        </div>

                        <div class="footer">
                            <div class="footer-note">
                                <h4>Благодарим Ви за проекта!</h4>
                                <p>Нашият екип ще се свърже с Вас скоро. С Вас градим индивидуалния стил на Вашия автомобил.</p>
                                <p style="margin-top: 15px;">
                                    <a href="${window.location.origin}/terms" style="color: #888; text-decoration: none; border-bottom: 1px solid #eee;">Общи условия</a> • 
                                    <a href="${window.location.origin}/privacy" style="color: #888; text-decoration: none; border-bottom: 1px solid #eee; margin-left: 10px;">Декларация за поверителност</a>
                                </p>
                                <p style="margin-top: 10px; font-weight: 900; color: #000;">CarDecal.bg - Premium Vinyl Decals</p>
                            </div>
                            <div class="qr-block">
                                <img src="${qrUrl}" alt="QR Code" class="qr-img">
                                <div class="qr-text">Проследи проекта</div>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 1500);
    };

    const handleExport = () => {
        try {
            const dataToExport = selectedOrders.length > 0 
                ? orders.filter(o => selectedOrders.includes(o.id))
                : orders;
            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `custom_orders_export_${new Date().toISOString().slice(0, 10)}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            showToast('Успешно изтеглен файл', 'success');
        } catch (err: any) {
            showToast('Грешка при експорт', 'error');
        }
    };

    const fetchArchivedCustomOrders = async () => {
        setArchivedLoading(true);
        try {
            const { data, error } = await supabase
                .from('deleted_users_archive')
                .select('id, user_id, email, full_name, phone, reason, custom_orders_snapshot, deleted_at')
                .order('deleted_at', { ascending: false });
            if (error) throw error;
            const result = (data || []).filter((u: any) => u.custom_orders_snapshot && u.custom_orders_snapshot.length > 0).map((u: any) => ({
                user: { id: u.id, user_id: u.user_id, email: u.email, full_name: u.full_name, phone: u.phone, reason: u.reason, deleted_at: u.deleted_at },
                orders: u.custom_orders_snapshot || []
            }));
            setArchivedData(result);
        } catch (err: any) {
            showToast('Грешка при зареждане на архивирани индивидуални', 'error');
        }
        setArchivedLoading(false);
    };

    if (loading) return <div className="flex items-center justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6 mb-8">
                {/* Tab switcher */}
                <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                    <button
                        onClick={() => setShowArchived(false)}
                        className={`px-5 py-2.5 text-[11px] uppercase font-black tracking-widest transition-all rounded-lg ${!showArchived ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'bg-white/5 text-zinc-500 hover:text-white border border-white/10'}`}
                    >
                        Активни ({orders.length})
                    </button>
                    <button
                        onClick={() => { setShowArchived(true); if (archivedData.length === 0) fetchArchivedCustomOrders(); }}
                        className={`px-5 py-2.5 text-[11px] uppercase font-black tracking-widest transition-all rounded-lg flex items-center gap-2 ${showArchived ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'bg-white/5 text-zinc-500 hover:text-white border border-white/10'}`}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Изтрити
                    </button>
                </div>

                {!showArchived ? (
                <>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-white">Индивидуални дизайни ({filteredOrders.length})</h2>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[240px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input 
                                type="text"
                                placeholder="Търси по име, телефон или имейл..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-red-600 transition-colors"
                            />
                        </div>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest text-white focus:outline-none focus:border-red-600 cursor-pointer"
                        >
                            <option value="all">Всички статуси</option>
                            <option value="pending">Нови</option>
                            <option value="processed">В процес</option>
                            <option value="completed">Завършени</option>
                            <option value="cancelled">Отказни</option>
                        </select>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[10px] uppercase tracking-widest transition-colors border border-white/10 rounded-lg"
                        >
                            <Download className="w-4 h-4" /> {selectedOrders.length > 0 ? 'Експорт Избрани' : 'Експорт JSON'}
                        </button>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                <AnimatePresence>
                    {selectedOrders.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-red-600/10 border border-red-600/20 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedOrders.length === filteredOrders.length}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-white/10 bg-black/40 text-red-600 focus:ring-red-600"
                                    />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                        Избрани: {selectedOrders.length}
                                    </span>
                                </label>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <select 
                                    className="bg-black/60 border border-white/10 text-white text-[10px] uppercase font-black p-2 rounded focus:outline-none focus:border-red-600"
                                    onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Промени статус на избраните</option>
                                    <option value="pending">Нови</option>
                                    <option value="processed">В процес</option>
                                    <option value="completed">Завършени</option>
                                    <option value="cancelled">Отказни</option>
                                </select>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={bulkUpdating}
                                    className="p-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all rounded-lg"
                                    title="Изтрий избраните"
                                >
                                    {bulkUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredOrders.map(order => (
                    <div key={order.id} className={`bg-black/40 border transition-all p-5 relative group flex gap-4 ${selectedOrders.includes(order.id) ? 'border-red-600/40 bg-red-600/5' : 'border-white/10'}`}>
                        {/* Checkbox */}
                        <div className="pt-1 select-none">
                            <input 
                                type="checkbox"
                                checked={selectedOrders.includes(order.id)}
                                onChange={() => toggleSelectOrder(order.id)}
                                className="w-5 h-5 rounded border-white/10 bg-black/40 text-red-600 focus:ring-red-600 cursor-pointer"
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                        <button 
                            onClick={() => setDeleteModal(order)}
                            className="absolute top-4 right-4 p-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all rounded-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Изтрий запитване"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div className="mb-4 pr-10">
                            <h3 className="text-lg font-bold text-white uppercase flex items-center gap-2 flex-wrap">
                                {order.first_name} {order.last_name}
                                {order.user_id && (
                                    <span className="bg-[#cebc89]/20 text-[#cebc89] border border-[#cebc89]/50 text-[10px] px-2 py-0.5 rounded-sm flex items-center gap-1 font-semibold uppercase tracking-wider">
                                        <User className="w-3 h-3" /> Профил
                                    </span>
                                )}
                            </h3>
                            <div className="flex flex-wrap gap-4 mt-2">
                                <p className="text-xs text-zinc-400">Телефон: <span className="text-white">{order.phone}</span></p>
                                {order.email && <p className="text-xs text-zinc-400">Имейл: <span className="text-white">{order.email}</span></p>}
                                <p className="text-xs text-zinc-400">Дата: <span className="text-white">{new Date(order.created_at).toLocaleString('bg-BG')}</span></p>
                            </div>
                            
                            <div className="mt-3 flex items-center gap-3">
                                <span className="text-[10px] text-zinc-500 uppercase font-black">Статус:</span>
                                <select 
                                    value={order.status || 'pending'} 
                                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                    className="bg-black/60 border border-white/5 text-white text-[10px] uppercase font-black px-2 py-1 focus:outline-none focus:border-red-600 transition-colors cursor-pointer rounded"
                                >
                                    <option value="pending">Нова</option>
                                    <option value="processed">В процес</option>
                                    <option value="completed">Завършена</option>
                                    <option value="cancelled">Отказна</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                            <div className="bg-black/50 p-2 border border-white/5">
                                <span className="text-zinc-500 block mb-1">Ширина</span>
                                <span className="text-white font-bold">{order.width || '-'} cm</span>
                            </div>
                            <div className="bg-black/50 p-2 border border-white/5">
                                <span className="text-zinc-500 block mb-1">Височина</span>
                                <span className="text-white font-bold">{order.height || '-'} cm</span>
                            </div>
                            <div className="bg-black/50 p-2 border border-white/5">
                                <span className="text-zinc-500 block mb-1">Бройки</span>
                                <span className="text-white font-bold">{order.quantity || '-'} бр</span>
                            </div>
                        </div>
                        
                        <div className="bg-white/5 p-3 text-sm text-zinc-300 min-h-[80px] mb-4 rounded-lg relative">
                            <span className="absolute top-2 left-3 text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Описание от клиент</span>
                            <div className="pt-4">
                                {order.description || <span className="text-zinc-600 italic">Няма описание</span>}
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-2">
                                <FileText className="w-3 h-3" /> Административни Бележки
                            </h4>
                            <div className="relative group/note">
                                <textarea
                                    defaultValue={order.admin_notes || ''}
                                    onBlur={(e) => handleUpdateAdminNotes(order.id, e.target.value)}
                                    placeholder="Добави вътрешна бележка за това запитване..."
                                    className="w-full bg-black/40 border border-white/5 focus:border-red-600/40 rounded-lg p-3 text-xs text-white placeholder-zinc-700 focus:outline-none transition-all resize-none min-h-[100px]"
                                />
                                <div className="absolute right-2 bottom-2 opacity-0 group-focus-within/note:opacity-100 transition-opacity">
                                    <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-tighter">Auto-saves on blur</span>
                                </div>
                            </div>
                        </div>
                        
                        {order.images && order.images.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Снимки ({order.images.length})</h4>
                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                    {order.images.map((img, i) => {
                                        const { data } = supabase.storage.from('custom_orders').getPublicUrl(img);
                                        return (
                                            <a key={i} href={data.publicUrl} target="_blank" rel="noreferrer" className="flex-shrink-0 block w-16 h-16 border border-white/10 hover:border-red-500 transition-colors">
                                                <img src={data.publicUrl} alt={`Order ${i}`} className="w-full h-full object-cover" />
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/5">
                            <button
                                onClick={() => handlePrintCustom(order)}
                                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors"
                            >
                                <Printer size={14} />
                                Печат на запитване
                            </button>
                        </div>
                        </div>
                    </div>
                ))}
            </div>
            </>
            ) : (
                /* ─── Archived Custom Orders View ─── */
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-3">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            Индивидуални от изтрити потребители
                        </h2>
                        <button onClick={fetchArchivedCustomOrders} className="p-2 border border-white/10 text-zinc-500 hover:text-white transition-colors rounded-lg">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    {archivedLoading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>
                    ) : archivedData.length === 0 ? (
                        <div className="border border-dashed border-white/10 p-20 text-center rounded-2xl">
                            <p className="text-zinc-600 uppercase tracking-widest text-xs">Няма архивирани индивидуални от изтрити потребители</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {archivedData.map((entry) => (
                                <div key={entry.user.id} className="border border-red-900/20 rounded-2xl overflow-hidden">
                                    <div className="bg-red-950/20 border-b border-red-900/20 p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div>
                                            <p className="text-white font-black uppercase tracking-tight">{entry.user.full_name || 'Без име'}</p>
                                            <p className="text-zinc-500 text-xs">{entry.user.email}</p>
                                            {entry.user.phone && <p className="text-zinc-600 text-[10px] font-mono mt-0.5">{entry.user.phone}</p>}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] uppercase tracking-widest text-red-500 font-black">Изтрит на:</p>
                                            <p className="text-zinc-400 text-xs">{new Date(entry.user.deleted_at).toLocaleString('bg-BG')}</p>
                                            {entry.user.reason && <p className="text-zinc-600 text-[10px] italic mt-0.5">"{entry.user.reason}"</p>}
                                        </div>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">{entry.orders.length} запитвания</p>
                                        {entry.orders.map((order: any, idx: number) => {
                                            const statusMap: Record<string, string> = { pending: 'Ново', processed: 'В процес', completed: 'Завършено', cancelled: 'Отказано' };
                                            const statusColor: Record<string, string> = { pending: 'text-yellow-500', processed: 'text-orange-500', completed: 'text-green-500', cancelled: 'text-red-500' };
                                            return (
                                                <div key={idx} className="bg-white/3 border border-white/5 rounded-xl p-4">
                                                    <div className="flex flex-col md:flex-row justify-between items-start mb-3 pb-3 border-b border-white/5 gap-2">
                                                        <div>
                                                            <p className="text-white text-xs font-bold uppercase">{order.first_name} {order.last_name}</p>
                                                            <p className="text-[10px] text-zinc-500 mt-0.5">{order.created_at ? new Date(order.created_at).toLocaleString('bg-BG') : '—'}</p>
                                                            <p className="text-[10px] text-zinc-600">Тел: {order.phone || '—'}</p>
                                                        </div>
                                                        <div className="text-right flex items-center gap-3">
                                                            <span className={`text-[9px] uppercase tracking-widest font-bold ${statusColor[order.status] || 'text-zinc-500'}`}>{statusMap[order.status] || order.status}</span>
                                                            <button
                                                                onClick={() => handlePrintCustom(order as CustomOrder)}
                                                                className="p-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all rounded-lg"
                                                                title="Печат"
                                                            >
                                                                <Printer className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
                                                        <div className="bg-black/30 p-2 rounded"><span className="text-zinc-600 block">Ширина</span><span className="text-white font-bold">{order.width || '-'} cm</span></div>
                                                        <div className="bg-black/30 p-2 rounded"><span className="text-zinc-600 block">Височина</span><span className="text-white font-bold">{order.height || '-'} cm</span></div>
                                                        <div className="bg-black/30 p-2 rounded"><span className="text-zinc-600 block">Бройки</span><span className="text-white font-bold">{order.quantity || '-'} бр</span></div>
                                                    </div>
                                                    {order.description && <p className="text-zinc-500 text-[11px] italic">"{order.description}"</p>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            </div>

            <ConfirmDialog 
                isOpen={!!deleteModal}
                title="Изтриване на запитване"
                message={`Сигурни ли сте, че искате да изтриете запитването от ${deleteModal?.first_name} ${deleteModal?.last_name}?`}
                confirmLabel="Изтрий"
                isDanger={true}
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal(null)}
            />
        </div>
    );
};

// ─── Archived Users Tab ────────────────────────────────────────────────────
interface ArchivedUser {
    id: string;
    user_id: string;
    email: string | null;
    full_name: string | null;
    phone: string | null;
    reason: string | null;
    orders_snapshot: any;
    deleted_at: string;
}

interface ScheduledUser {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    deletion_scheduled_at: string;
    deletion_reason: string | null;
}

const ArchivedUsersTab: React.FC = () => {
    const [archived, setArchived] = useState<ArchivedUser[]>([]);
    const [scheduled, setScheduled] = useState<ScheduledUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrders, setSelectedOrders] = useState<any[] | null>(null);
    const [viewingUser, setViewingUser] = useState<ScheduledUser | null>(null);
    const [viewingUserOrders, setViewingUserOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const { showToast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: archiveData, error: archiveError } = await supabase
                .from('deleted_users_archive')
                .select('*')
                .order('deleted_at', { ascending: false });
            if (archiveError) throw archiveError;
            setArchived(archiveData || []);

            const { data: scheduledData, error: scheduledError } = await supabase
                .from('profiles')
                .select('id, full_name, email, phone, deletion_scheduled_at, deletion_reason')
                .not('deletion_scheduled_at', 'is', null)
                .order('deletion_scheduled_at', { ascending: true });
            if (scheduledError) throw scheduledError;
            setScheduled(scheduledData || []);
        } catch (err: any) {
            showToast("Грешка при зареждане на архива", "error");
        }
        setLoading(false);
    };

    const cancelDeletion = async (userId: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ deletion_scheduled_at: null, deletion_reason: null })
                .eq('id', userId);
            if (error) throw error;
            showToast('Изтриването е отменено.', 'success');
            fetchData();
        } catch (err: any) {
            showToast('Грешка при отмяна: ' + err.message, 'error');
        }
    };

    const getDaysRemaining = (scheduledAt: string) => {
        const now = new Date();
        const target = new Date(scheduledAt);
        const diffMs = target.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    };

    const openUserProfile = async (u: ScheduledUser) => {
        setViewingUser(u);
        setOrdersLoading(true);
        try {
            const { data } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', u.id)
                .order('created_at', { ascending: false });
            setViewingUserOrders(data || []);
        } catch (err) {
            setViewingUserOrders([]);
        }
        setOrdersLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-red-600" /></div>;

    return (
        <div className="space-y-10">
            {/* ─── Section: Scheduled for Deletion ─── */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-500" />
                        Чакащи изтриване ({scheduled.length})
                    </h2>
                    <button onClick={() => fetchData()} className="p-2 border border-white/10 text-zinc-500 hover:text-white transition-colors rounded-lg">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
                {scheduled.length === 0 ? (
                    <div className="border border-dashed border-white/10 p-12 text-center rounded-2xl">
                        <p className="text-zinc-600 uppercase tracking-widest text-xs">Няма потребители, насрочени за изтриване</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {scheduled.map(u => {
                            const daysLeft = getDaysRemaining(u.deletion_scheduled_at);
                            const isExpired = daysLeft <= 0;
                            return (
                                <div key={u.id} className="bg-[#0a0a0a] border border-yellow-600/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:border-yellow-500/40 transition-colors" onClick={() => openUserProfile(u)}>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-sm uppercase truncate">{u.full_name || 'Без име'}</p>
                                        <p className="text-zinc-500 text-xs">{u.email}</p>
                                        {u.phone && <p className="text-zinc-600 text-[10px] font-mono mt-0.5">{u.phone}</p>}
                                        {u.deletion_reason && (
                                            <p className="text-zinc-500 text-[10px] mt-1 italic">"{u.deletion_reason}"</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center px-4 py-2 rounded-xl border" style={{
                                            background: isExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                            borderColor: isExpired ? 'rgba(239, 68, 68, 0.3)' : 'rgba(234, 179, 8, 0.2)',
                                        }}>
                                            <p className={`text-2xl font-black ${isExpired ? 'text-red-500' : 'text-yellow-500'}`}>
                                                {daysLeft}
                                            </p>
                                            <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: isExpired ? '#ef4444' : '#eab308' }}>
                                                {isExpired ? 'Изтекъл срок' : daysLeft === 1 ? 'ден остава' : 'дни остават'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); cancelDeletion(u.id); }}
                                            className="px-4 py-2 bg-green-600/10 border border-green-600/20 text-green-500 text-[10px] uppercase font-black tracking-widest hover:bg-green-600 hover:text-white transition-all rounded-xl"
                                        >
                                            Отмени
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openUserProfile(u); }}
                                            className="px-4 py-2 bg-white/5 border border-white/10 text-zinc-400 text-[10px] uppercase font-black tracking-widest hover:text-white hover:border-white/30 transition-all rounded-xl"
                                        >
                                            Профил
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ─── Section: Archive ─── */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-white">Архив на изтрити акаунти ({archived.length})</h2>
                </div>

            <div className="overflow-x-auto border border-white/5 rounded-xl">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Потребител</th>
                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Дата на изтриване</th>
                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Причина</th>
                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-500 font-black">История</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {archived.map(user => (
                            <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                    <p className="text-white font-bold">{user.full_name || '—'}</p>
                                    <p className="text-zinc-500 text-xs">{user.email}</p>
                                    <p className="text-zinc-600 text-[10px] mt-1 font-mono">{user.phone}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-zinc-300 text-xs">{new Date(user.deleted_at).toLocaleString('bg-BG')}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-zinc-400 text-xs max-w-xs">{user.reason || 'Няма посочена причина'}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={() => setSelectedOrders(user.orders_snapshot)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-[10px] uppercase font-bold tracking-widest text-zinc-400 hover:text-white hover:border-white/30 transition-all"
                                    >
                                        <ShoppingBag size={12} />
                                        Виж {user.orders_snapshot?.length || 0} поръчки
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {archived.length === 0 && (
                    <div className="p-20 text-center text-zinc-600 uppercase tracking-widest text-xs">Все още няма изтрити акаунти</div>
                )}
            </div>
            </div>

            {/* Orders Snapshot Modal */}
            <AnimatePresence>
                {selectedOrders && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-[#111] border border-white/10 w-full max-w-3xl overflow-hidden shadow-2xl rounded-2xl flex flex-col max-h-[80vh]"
                        >
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-white font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3">
                                    <Receipt className="w-4 h-4 text-red-600" />
                                    Архивирана история на поръчките
                                </h3>
                                <button onClick={() => setSelectedOrders(null)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
                            </div>
                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                                {!selectedOrders || selectedOrders.length === 0 ? (
                                    <p className="text-zinc-600 text-center py-10 uppercase tracking-widest text-xs">Няма история на поръчки</p>
                                ) : (
                                    selectedOrders.map((order: any, idx: number) => (
                                        <div key={idx} className="bg-white/3 border border-white/5 p-4 rounded-xl">
                                            <div className="flex justify-between items-start mb-3 pb-2 border-b border-white/5">
                                                <div>
                                                    <p className="text-white text-xs font-bold uppercase">Поръчка #{order.id.slice(0, 8)}</p>
                                                    <p className="text-[10px] text-zinc-500 mt-0.5">{new Date(order.created_at).toLocaleString('bg-BG')}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-red-500 font-black">{order.total_amount.toFixed(2)} €</p>
                                                    <span className="text-[9px] uppercase tracking-widest text-zinc-600">{order.status}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {order.items?.map((item: any, i: number) => (
                                                    <div key={i} className="flex justify-between text-[11px]">
                                                        <span className="text-zinc-400">{item.name} x{item.quantity}</span>
                                                        <span className="text-white">{(item.price * item.quantity).toFixed(2)} €</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── User Profile Detail Modal ─── */}
            <AnimatePresence>
                {viewingUser && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-[#111] border border-white/10 w-full max-w-2xl overflow-hidden shadow-2xl rounded-2xl flex flex-col max-h-[85vh]"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-white font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3">
                                    <User className="w-4 h-4 text-yellow-500" />
                                    Профил на потребител
                                </h3>
                                <button onClick={() => setViewingUser(null)} className="text-zinc-500 hover:text-white transition-colors"><X size={20}/></button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                {/* User Info Card */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-white font-black text-lg uppercase">{viewingUser.full_name || 'Без име'}</p>
                                            <p className="text-zinc-400 text-sm mt-1">{viewingUser.email}</p>
                                            {viewingUser.phone && <p className="text-zinc-500 text-xs font-mono mt-1">{viewingUser.phone}</p>}
                                        </div>
                                        <div className="text-center px-4 py-2 rounded-xl border" style={{
                                            background: getDaysRemaining(viewingUser.deletion_scheduled_at) <= 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                            borderColor: getDaysRemaining(viewingUser.deletion_scheduled_at) <= 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(234, 179, 8, 0.2)',
                                        }}>
                                            <p className={`text-2xl font-black ${getDaysRemaining(viewingUser.deletion_scheduled_at) <= 0 ? 'text-red-500' : 'text-yellow-500'}`}>
                                                {getDaysRemaining(viewingUser.deletion_scheduled_at)}
                                            </p>
                                            <p className="text-[8px] uppercase tracking-widest font-bold text-yellow-500">дни остават</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                        <div>
                                            <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Насрочено изтриване:</p>
                                            <p className="text-zinc-300 text-xs font-bold mt-1">{new Date(viewingUser.deletion_scheduled_at).toLocaleString('bg-BG')}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Причина:</p>
                                            <p className="text-zinc-300 text-xs font-bold mt-1 italic">{viewingUser.deletion_reason || 'Няма посочена'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Orders */}
                                <div>
                                    <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <ShoppingBag size={14} className="text-red-600" />
                                        Поръчки ({viewingUserOrders.length})
                                    </h4>
                                    {ordersLoading ? (
                                        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-red-600" /></div>
                                    ) : viewingUserOrders.length === 0 ? (
                                        <p className="text-zinc-600 text-center py-8 uppercase tracking-widest text-xs">Няма поръчки</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {viewingUserOrders.map((order: any) => (
                                                <div key={order.id} className="bg-white/3 border border-white/5 p-4 rounded-xl">
                                                    <div className="flex justify-between items-start mb-3 pb-2 border-b border-white/5">
                                                        <div>
                                                            <p className="text-white text-xs font-bold uppercase">Поръчка #{order.order_number || order.id.slice(0, 8)}</p>
                                                            <p className="text-[10px] text-zinc-500 mt-0.5">{new Date(order.created_at).toLocaleString('bg-BG')}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-red-500 font-black">{order.total_amount?.toFixed(2)} &euro;</p>
                                                            <span className="text-[9px] uppercase tracking-widest text-zinc-600">{order.status}</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {order.items?.map((item: any, i: number) => (
                                                            <div key={i} className="flex justify-between text-[11px]">
                                                                <span className="text-zinc-400">{item.name_bg || item.name} x{item.quantity}</span>
                                                                <span className="text-white">{(item.price * item.quantity).toFixed(2)} &euro;</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 border-t border-white/5 flex items-center justify-between">
                                <button onClick={() => { cancelDeletion(viewingUser.id); setViewingUser(null); }}
                                    className="px-6 py-2.5 bg-green-600/10 border border-green-600/20 text-green-500 text-[10px] uppercase font-black tracking-widest hover:bg-green-600 hover:text-white transition-all rounded-xl">
                                    Отмени изтриването
                                </button>
                                <button onClick={() => setViewingUser(null)}
                                    className="px-6 py-2.5 bg-white/5 border border-white/10 text-zinc-400 text-[10px] uppercase font-black tracking-widest hover:text-white transition-all rounded-xl">
                                    Затвори
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Main Admin Page ──────────────────────────────────────────────────────
const AdminPage: React.FC = () => {
    const { user, profile, loading, isAdmin, isEditor, userRole } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [scheduledCount, setScheduledCount] = useState(0);
    const [newBugsCount, setNewBugsCount] = useState(0);

    useEffect(() => {
        const fetchCounts = async () => {
            const [scheduledRes, bugsRes] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('id', { count: 'exact', head: true })
                    .not('deletion_scheduled_at', 'is', null),
                supabase
                    .from('bug_reports')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'new')
            ]);
            setScheduledCount(scheduledRes.count || 0);
            setNewBugsCount(bugsRes.count || 0);
        };
        fetchCounts();
    }, [activeTab]);

    useEffect(() => {

        if (!loading && (!user || (!isAdmin && !isEditor))) {

            navigate('/', { replace: true });
        }
    }, [user, loading, isAdmin, isEditor, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            </div>
        );
    }

    if (!user || (!isAdmin && !isEditor)) return null;

    const navItems = [
        { id: 'dashboard' as AdminTab, label: 'Основно', icon: LayoutDashboard },
        { id: 'homepage' as AdminTab, label: 'Начална', icon: Film },
        { id: 'messages' as AdminTab, label: 'Съобщения', icon: Megaphone },
        { id: 'products' as AdminTab, label: 'Стикери', icon: Package },
        { id: 'orders' as AdminTab, label: 'Поръчки', icon: CheckCircle },
        { id: 'custom_orders' as AdminTab, label: 'Индивидуални', icon: Edit3 },
        { id: 'bugs' as AdminTab, label: 'Доклади', icon: Bug, badge: newBugsCount },
        ...(isAdmin ? [
            { id: 'users' as AdminTab, label: 'Потребители', icon: Users },
            { id: 'archived_users' as AdminTab, label: 'Архив Изтрити', icon: Trash2, badge: scheduledCount }
        ] : []),
        { id: 'maintenance' as AdminTab, label: 'Поддръжка', icon: Settings },
        { id: 'stealth' as AdminTab, label: 'Таен Вход', icon: Key },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <SEO title="Админ Панел" />
            <div className="flex min-h-screen">
                {/* Sidebar */}
                <aside className="w-64 bg-black border-r border-white/5 flex flex-col py-8 flex-shrink-0">
                    <div className="px-6 mb-8">
                        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-1">Admin Panel</p>
                        <p className="text-white font-bold">{profile?.full_name || user.email}</p>
                        <div className={`mt-1 inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 ${isAdmin ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                            {isAdmin ? 'Администратор' : 'Редактор'}
                        </div>
                    </div>

                    <nav className="flex-1 px-3 space-y-1">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${activeTab === item.id ? 'bg-white/5 text-white border-l-2 border-red-600' : 'text-zinc-500 hover:text-white border-l-2 border-transparent'}`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                                {(item as any).badge > 0 && (
                                    <span className="ml-auto bg-red-600 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full">
                                        {(item as any).badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                    <div className="px-3 mt-auto">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-500 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Към сайта
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8 overflow-y-auto">
                    <header className="mb-10 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter text-white">
                                {navItems.find(i => i.id === activeTab)?.label}
                            </h1>
                            <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">
                                {new Date().toLocaleDateString('bg-BG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </header>

                    {activeTab === 'dashboard' && <DashboardTab />}
                    {activeTab === 'homepage' && (
                        <div className="space-y-12 animate-in fade-in duration-700">
                             <HeroMediaSection />
                             <IndividualProjectsSection />
                        </div>
                    )}
                    {activeTab === 'messages' && <MessagesTab />}
                    {activeTab === 'maintenance' && <MaintenanceSettingsSection />}
                    {activeTab === 'products' && <ProductsTab />}
                    {activeTab === 'orders' && <OrdersTab />}
                    {activeTab === 'custom_orders' && <CustomOrdersTab />}
                    {activeTab === 'users' && <UsersTab />}
                    {activeTab === 'archived_users' && <ArchivedUsersTab />}
                    {activeTab === 'bugs' && <BugsTab />}
                    {activeTab === 'stealth' && <StealthTab />}
                </main>
            </div>
        </div>
    );
};
export default AdminPage;
