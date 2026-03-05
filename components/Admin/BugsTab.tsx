import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Bug, CheckCircle2, ChevronDown, CheckSquare, RefreshCw, X } from 'lucide-react';
import { useToast } from '../Toast/ToastProvider';
import { motion, AnimatePresence } from 'framer-motion';

export const BugsTab: React.FC = () => {
    const [bugs, setBugs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const fetchBugs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bug_reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBugs(data || []);
        } catch (err: any) {
            showToast('Грешка: ' + err.message, 'error');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBugs();
    }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('bug_reports')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            showToast('Статусът е обновен успешно', 'success');
            fetchBugs();
        } catch (err: any) {
            showToast('Грешка: ' + err.message, 'error');
        }
    };

    const categoryMap: Record<string, string> = {
        catalog: 'Разглеждане на продукти',
        cart: 'Количка и поръчка',
        payment: 'Завършване на поръчка',
        account: 'Профил / Влизане',
        other: 'Друго'
    };

    const statusMap: Record<string, string> = {
        new: 'Нов',
        in_progress: 'В процес',
        resolved: 'Разрешен',
        closed: 'Затворен'
    };

    const statusOptions = [
        { value: 'new', label: 'Нов' },
        { value: 'in_progress', label: 'В процес' },
        { value: 'resolved', label: 'Разрешен' },
        { value: 'closed', label: 'Затворен' },
    ];

    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-red-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-3">
                    <Bug className="w-5 h-5 text-red-500" />
                    Доклади за проблеми ({bugs.length})
                </h2>
                <button onClick={fetchBugs} className="p-2 border border-white/10 text-zinc-500 hover:text-white transition-colors rounded-lg flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Обнови
                </button>
            </div>

            {bugs.length === 0 ? (
                <div className="border border-dashed border-white/10 p-20 text-center rounded-2xl">
                    <p className="text-zinc-600 uppercase tracking-widest text-xs">Няма докладвани проблеми</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bugs.map((bug) => (
                        <div key={bug.id} className="bg-white/5 border border-white/10 rounded-2xl flex flex-col hover:border-white/20 transition-all duration-300">
                            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40 rounded-t-2xl">
                                <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-sm border ${bug.status === 'new' ? 'border-red-500/50 bg-red-500/10 text-red-500' : bug.status === 'in_progress' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500' : 'border-green-500/50 bg-green-500/10 text-green-500'}`}>
                                    {categoryMap[bug.category] || bug.category}
                                </span>
                                
                                <select 
                                    className="bg-black/60 border border-white/10 text-white text-[10px] uppercase font-black p-1 rounded focus:outline-none focus:border-red-600"
                                    value={bug.status}
                                    onChange={(e) => updateStatus(bug.id, e.target.value)}
                                >
                                    {statusOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="mb-4">
                                    <h3 className="text-sm font-bold text-white mb-2 line-clamp-2">{bug.description}</h3>
                                    <div className="text-[10px] font-mono text-zinc-500 flex flex-col gap-1">
                                        {bug.email && <span>От: <a href={`mailto:${bug.email}`} className="text-zinc-400 hover:text-white underline">{bug.email}</a></span>}
                                        {bug.url && <span>URL: <span className="text-zinc-400">{bug.url}</span></span>}
                                        <span className="text-zinc-600 pt-1 mt-1 border-t border-white/5">{new Date(bug.created_at).toLocaleString('bg-BG')}</span>
                                    </div>
                                </div>
                                
                                {bug.images && bug.images.length > 0 && (
                                    <div className="mt-auto border-t border-white/5 pt-4">
                                        <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Прикачени снимки</h4>
                                        <div className="flex gap-2">
                                            {bug.images.map((img: string, i: number) => (
                                                <button 
                                                    key={i} 
                                                    onClick={() => setSelectedImage(img)}
                                                    className="w-12 h-12 border border-white/10 hover:border-red-500 transition-colors overflow-hidden rounded-lg bg-black/40 flex items-center justify-center cursor-zoom-in"
                                                >
                                                    <img src={img} alt="Bug Upload" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {selectedImage && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative max-w-5xl w-full h-[85vh] flex items-center justify-center p-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={() => setSelectedImage(null)} className="absolute top-0 right-0 p-4 text-white/50 hover:text-white bg-black/50 hover:bg-black rounded-full transition-colors z-10 m-4 shadow-2xl">
                                <X size={24} />
                            </button>
                            <img src={selectedImage} alt="Bug Fullscreen" className="max-w-full max-h-full object-contain border border-white/10 rounded-lg shadow-2xl bg-black" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
