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
    Megaphone, Palette, Type, ShoppingBag, Receipt
} from 'lucide-react';
import { useToast } from '../components/Toast/ToastProvider';
import { uploadToCloudinary } from '../lib/cloudinary-utils';

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

type AdminTab = 'dashboard' | 'homepage' | 'messages' | 'maintenance' | 'products' | 'users' | 'archived_users' | 'custom_orders' | 'orders';

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
    finish: string | null;
    material: string | null;
    description: string | null;
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
        finish: product?.finish || '',
        material: product?.material || '',
        description: product?.description || '',
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
                finish: form.finish || null,
                material: form.material || null,
                description: form.description || null,
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
                .select('id,slug,name,name_bg,avatar,price,price_eur,wholesale_price,wholesale_price_eur,is_best_seller,categories,dimensions,finish,material,description,cover_image,is_hidden,updated_at')
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
    const [users, setUsers] = useState<DBUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [banModal, setBanModal] = useState<DBUser | null>(null);
    const [deleteModal, setDeleteModal] = useState<DBUser | null>(null);
    const [banReason, setBanReason] = useState('');
    
    // Role change confirmation
    const [roleConfirmation, setRoleConfirmation] = useState<{ user: DBUser, targetRole: 'user' | 'editor' | 'admin' } | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id,email,full_name,avatar_url,role,is_banned,banned_reason,created_at')
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
                        <div key={u.id} className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border ${u.is_banned ? 'border-red-900/40 bg-red-950/10' : 'border-white/5 bg-white/2'} hover:border-white/10 transition-colors`}>
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
                                        <p className="text-white font-medium text-sm">{u.full_name || 'Без Име'}</p>
                                        {u.is_banned && <span className="text-[10px] bg-red-900/40 text-red-400 px-2 py-0.5 uppercase tracking-widest">Блокиран</span>}
                                        {u.id === currentUser?.id && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 uppercase tracking-widest">Аз</span>}
                                    </div>
                                    <p className="text-zinc-500 text-xs">{u.email}</p>
                                    {u.is_banned && u.banned_reason && (
                                        <p className="text-red-400/60 text-xs mt-0.5">Причина: {u.banned_reason}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-white/5">
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
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
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

// ─── Hero Media Section ───────────────────────────────────────────────────
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
                            <label className="block text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3 font-black flex items-center gap-2">
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
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-bold flex items-center gap-2">
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
    const { settings, loading, updateSetting } = useSiteSettings();
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
        if (!text.includes("{timer}")) return text;
        
        const parts = text.split("{timer}");
        return (
            <span className="flex items-center inline-flex">
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
            await updateSetting('maintenance_title', title);
            await updateSetting('maintenance_message', msg);
            await updateSetting('maintenance_end_time', endTime || null as any);
            await updateSetting('maintenance_features', JSON.stringify(features));
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
            const targetTime = new Date(Date.now() + ms).toISOString();
            await updateSetting('maintenance_auto_start_at', targetTime);
            await updateSetting('announcement_mode', 'true');
            await updateSetting('announcement_text', modalAnnText);
            await updateSetting('maintenance_features', JSON.stringify(features));
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
            await updateSetting('announcement_mode', 'false');
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
            await updateSetting('maintenance_auto_start_at', null as any);
            await updateSetting('announcement_mode', 'false');
            showToast('Поддръжката и таймерите са изключени!', 'success');
        } catch (err) {
            showToast('Грешка при превключване.', 'error');
        }
    };

    const handleInstantStart = async () => {
        setIsActivationMenuOpen(false);
        try {
            await updateSetting('maintenance_mode', 'true');
            await updateSetting('maintenance_auto_start_at', null as any);
            await updateSetting('announcement_mode', 'false');
            await updateSetting('maintenance_features', JSON.stringify(features));
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
    const [stats, setStats] = useState({ products: 0, users: 0, banned: 0, editors: 0, admins: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const [{ count: products }, { data: profiles }] = await Promise.all([
                supabase.from('products').select('id', { count: 'exact', head: true }),
                supabase.from('profiles').select('role,is_banned'),
            ]);
            const profilesArr = profiles || [];
            setStats({
                products: products || 0,
                users: profilesArr.length,
                banned: profilesArr.filter((p: any) => p.is_banned).length,
                editors: profilesArr.filter((p: any) => p.role === 'editor').length,
                admins: profilesArr.filter((p: any) => p.role === 'admin').length,
            });
            setLoading(false);
        };
        fetchStats();
    }, []);

    const cards = [
        { label: 'Стикери в Базата', value: stats.products, icon: Package, color: 'text-blue-400' },
        { label: 'Потребители', value: stats.users, icon: Users, color: 'text-green-400' },
        { label: 'Администратори', value: stats.admins, icon: Crown, color: 'text-red-400' },
        { label: 'Редактори', value: stats.editors, icon: Edit3, color: 'text-yellow-400' },
        { label: 'Блокирани', value: stats.banned, icon: ShieldBan, color: 'text-zinc-400' },
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
}

const OrdersTab: React.FC = () => {
    const [orders, setOrders] = useState<RegularOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

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

    useEffect(() => {
        fetchOrders();
    }, []);

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
            <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-6">Всички Поръчки ({orders.length})</h2>
            
            <div className="space-y-4">
                {orders.map(order => (
                    <div key={order.id} className="bg-black/40 border border-white/5 p-6 rounded-xl hover:border-white/10 transition-colors">
                        <div className="flex flex-col lg:flex-row gap-8">
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
                                        <p className="text-xs text-zinc-400">"{order.shipping_details.notes}"</p>
                                    </div>
                                )}
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
                                                <p className="text-[10px] font-bold text-white uppercase truncate">{item.name}</p>
                                                <p className="text-[9px] text-zinc-500">{item.variant} x{item.quantity}</p>
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
                            <div className="lg:w-48 space-y-3 border-l-0 lg:border-l border-white/5 lg:pl-8">
                                <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3 font-bold">Управление</h4>
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
                        </div>
                    </div>
                ))}

                {orders.length === 0 && (
                    <div className="border border-dashed border-white/10 p-20 text-center">
                        <p className="text-zinc-500 uppercase tracking-widest text-sm">Все още няма направени поръчки</p>
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
}

const CustomOrdersTab: React.FC = () => {
    const [orders, setOrders] = useState<CustomOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [deleteModal, setDeleteModal] = useState<CustomOrder | null>(null);

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

    if (loading) return <div className="flex items-center justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-6">Индивидуални дизайни ({orders.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {orders.map(order => (
                    <div key={order.id} className="bg-black/40 border border-white/10 p-5 relative group">
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
                            <p className="text-xs text-zinc-400 mt-2">Телефон: <span className="text-white">{order.phone}</span></p>
                            {order.email && <p className="text-xs text-zinc-400 mt-0.5">Имейл: <span className="text-white">{order.email}</span></p>}
                            <p className="text-xs text-zinc-400 mt-0.5">Дата: <span className="text-white">{new Date(order.created_at).toLocaleString('bg-BG')}</span></p>
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
                        
                        <div className="bg-white/5 p-3 text-sm text-zinc-300 min-h-[80px] mb-4">
                            {order.description || <span className="text-zinc-600 italic">Няма описание</span>}
                        </div>
                        
                        {order.images && order.images.length > 0 && (
                            <div>
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
                    </div>
                ))}
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

const ArchivedUsersTab: React.FC = () => {
    const [archived, setArchived] = useState<ArchivedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrders, setSelectedOrders] = useState<any[] | null>(null);
    const { showToast } = useToast();

    const fetchArchived = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('deleted_users_archive')
                .select('*')
                .order('deleted_at', { ascending: false });
            
            if (error) throw error;
            setArchived(data || []);
        } catch (err: any) {
            showToast("Грешка при зареждане на архива", "error");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchArchived();
    }, []);

    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-red-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold uppercase tracking-widest text-white">Архив на изтрити акаунти ({archived.length})</h2>
                <button onClick={() => fetchArchived()} className="p-2 border border-white/10 text-zinc-500 hover:text-white transition-colors">
                    <RefreshCw className="w-4 h-4" />
                </button>
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
        </div>
    );
};

// ─── Main Admin Page ──────────────────────────────────────────────────────
const AdminPage: React.FC = () => {
    const { user, profile, loading, isAdmin, isEditor, userRole } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

    useEffect(() => {
        console.log('🚔 Admin Access Check:', { userEmail: user?.email, isAdmin, isEditor, loading });
        if (!loading && (!user || (!isAdmin && !isEditor))) {
            console.warn('🚫 Non-admin access attempt. Redirecting to home.');
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
        ...(isAdmin ? [
            { id: 'users' as AdminTab, label: 'Потребители', icon: Users },
            { id: 'archived_users' as AdminTab, label: 'Архив Изтрити', icon: Trash2 }
        ] : []),
        { id: 'maintenance' as AdminTab, label: 'Поддръжка', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
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
                    {activeTab === 'homepage' && <HeroMediaSection />}
                    {activeTab === 'messages' && <MessagesTab />}
                    {activeTab === 'maintenance' && <MaintenanceSettingsSection />}
                    {activeTab === 'products' && <ProductsTab />}
                    {activeTab === 'orders' && <OrdersTab />}
                    {activeTab === 'custom_orders' && <CustomOrdersTab />}
                    {activeTab === 'users' && <UsersTab />}
                    {activeTab === 'archived_users' && <ArchivedUsersTab />}
                </main>
            </div>
        </div>
    );
};
export default AdminPage;
