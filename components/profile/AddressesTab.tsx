import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Toast/ToastProvider';
import { Loader2, Plus, MapPin, Building2, Trash2, Edit2, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { isValidFullName, isValidPhone as isValidBulgarianPhone, formatPhoneNumber, formatToE164 } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type DeliveryMethod = 'address' | 'speedy' | 'econt';

export interface UserAddress {
    id?: string;
    full_name: string;
    phone: string;
    delivery_type: DeliveryMethod;
    city: string;
    neighborhood?: string;
    street_address: string;
    is_default: boolean;
}

const AddressesTab: React.FC = () => {
    const { user, profile } = useAuth();
    const { showToast } = useToast();
    
    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState<UserAddress>({
        full_name: '',
        phone: '+359 ',
        delivery_type: 'econt',
        city: '',
        neighborhood: '',
        street_address: '',
        is_default: false
    });

    useEffect(() => {
        if (user) {
            fetchAddresses();
        }
    }, [user]);

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_addresses')
                .select('*')
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            setAddresses(data || []);
        } catch (e: any) {
            console.error('Error fetching addresses:', e);
            showToast('Грешка при зареждане на адреси.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenForm = (address?: UserAddress) => {
        if (address) {
            setEditingId(address.id!);
            setFormData(address);
        } else {
            setEditingId(null);
            setFormData({
                full_name: profile?.full_name || '',
                phone: profile?.phone ? formatPhoneNumber(profile.phone) : '+359 ',
                delivery_type: 'econt',
                city: '',
                neighborhood: '',
                street_address: '',
                is_default: addresses.length === 0
            });
        }
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(p => ({ ...p, [name]: checked }));
        } else {
            let val = value;
            if (name === 'full_name') val = val.replace(/[0-9]/g, '');
            if (name === 'phone') val = formatPhoneNumber(val);
            
            setFormData(p => ({ ...p, [name]: val }));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isValidFullName(formData.full_name)) {
            showToast('Въведете име и фамилия (поне 3 символа).', 'error');
            return;
        }
        if (!isValidBulgarianPhone(formData.phone)) {
            showToast('Невалиден телефонен номер.', 'error');
            return;
        }
        if (!formData.city.trim()) {
            showToast('Моля, въведете населено място.', 'error');
            return;
        }
        if (!formData.street_address.trim()) {
            showToast('Моля, въведете адрес или име на офис.', 'error');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                user_id: user?.id,
                phone: formatToE164(formData.phone)
            };

            if (editingId) {
                const { error } = await supabase.from('user_addresses').update(payload).eq('id', editingId);
                if (error) throw error;
                showToast('Адресът е обновен успешно!', 'success');
            } else {
                const { error } = await supabase.from('user_addresses').insert(payload);
                if (error) throw error;
                showToast('Адресът е добавен успешно!', 'success');
            }
            
            await fetchAddresses();
            handleCloseForm();
        } catch (e: any) {
            console.error('Error saving address:', e);
            showToast(e.message || 'Грешка при запазване.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Сигурни ли сте, че искате да изтриете този адрес?')) return;
        
        try {
            const { error } = await supabase.from('user_addresses').delete().eq('id', id);
            if (error) throw error;
            setAddresses(prev => prev.filter(a => a.id !== id));
            showToast('Адресът е изтрит.', 'success');
        } catch (e: any) {
            showToast('Грешка при изтриване.', 'error');
        }
    };

    const setAsDefault = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const { error } = await supabase.from('user_addresses').update({ is_default: true }).eq('id', id);
            if (error) throw error;
            await fetchAddresses();
            showToast('Основният адрес е променен.', 'success');
        } catch (e: any) {
            showToast('Грешка при промяна.', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-4" />
            </div>
        );
    }

    const inputCls = "w-full bg-[#111] border border-white/10 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/20 transition-all placeholder:text-zinc-600";
    const labelCls = "text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2 block ml-1";

    return (
        <div className="space-y-6">
            {!isFormOpen ? (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold tracking-tight text-white">Моите адреси</h2>
                        <button 
                            onClick={() => handleOpenForm()}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                        >
                            <Plus size={16} /> Добави
                        </button>
                    </div>

                    {addresses.length === 0 ? (
                        <div className="text-center py-16 bg-[#0a0a0a] border border-white/5 rounded-3xl">
                            <MapPin className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <h3 className="text-white font-bold text-base uppercase tracking-widest mb-2">Няма запазени адреси</h3>
                            <p className="text-zinc-500 text-sm mb-6">Добавете адрес за по-бърза доставка при следваща поръчка.</p>
                            <button 
                                onClick={() => handleOpenForm()}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                            >
                                Добави нов адрес
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {addresses.map(addr => (
                                <div 
                                    key={addr.id} 
                                    className={`relative p-6 rounded-2xl border transition-all ${addr.is_default ? 'bg-red-950/20 border-red-500/30 shadow-[0_4px_30px_rgba(255,0,0,0.05)]' : 'bg-[#0a0a0a] border-white/5 hover:border-white/20'}`}
                                >
                                    {addr.is_default && (
                                        <div className="absolute -top-3 left-6 px-3 py-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                            Основен
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${addr.is_default ? 'bg-red-600/20 text-red-500' : 'bg-white/5 text-zinc-400'}`}>
                                                {addr.delivery_type === 'address' ? <MapPin size={18} /> : <Building2 size={18} />}
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold text-sm">{addr.full_name}</h3>
                                                <p className="text-xs text-zinc-500">{addr.phone}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1 mb-6">
                                        <p className="text-sm text-zinc-300">
                                            <span className="text-zinc-500 mr-2 text-xs">Доставка:</span>
                                            {addr.delivery_type === 'address' ? 'До личен адрес' : `До офис на ${addr.delivery_type === 'econt' ? 'Еконт' : 'Speedy'}`}
                                        </p>
                                        <p className="text-sm text-zinc-300">
                                            <span className="text-zinc-500 mr-2 text-xs">Град:</span>
                                            {addr.city}
                                        </p>
                                        {addr.neighborhood && (
                                            <p className="text-sm text-zinc-300">
                                                <span className="text-zinc-500 mr-2 text-xs">Квартал:</span>
                                                {addr.neighborhood}
                                            </p>
                                        )}
                                        <p className="text-sm text-zinc-300">
                                            <span className="text-zinc-500 mr-2 text-xs">{addr.delivery_type === 'address' ? 'Адрес:' : 'Офис:'}</span>
                                            {addr.street_address}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 border-t border-white/5 pt-4">
                                        <button 
                                            onClick={() => handleOpenForm(addr)}
                                            className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] uppercase font-bold tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Edit2 size={12} /> Редактирай
                                        </button>
                                        {!addr.is_default && (
                                            <button 
                                                onClick={(e) => setAsDefault(addr.id!, e)}
                                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[10px] uppercase font-bold tracking-widest rounded-lg transition-colors"
                                            >
                                                Направи основен
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => handleDelete(addr.id!, e)}
                                            className="p-2 bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 rounded-lg transition-colors"
                                            title="Изтрий"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 md:p-8 relative"
                >
                    <button 
                        onClick={handleCloseForm}
                        className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white bg-white/5 rounded-full transition-colors"
                    >
                        <X size={16} />
                    </button>
                    
                    <h2 className="text-xl font-bold tracking-tight text-white mb-8">
                        {editingId ? 'Редактиране на адрес' : 'Добави нов адрес'}
                    </h2>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelCls}>Име и фамилия <span className="text-red-600">*</span></label>
                                <input 
                                    type="text" name="full_name" value={formData.full_name} onChange={handleInputChange}
                                    className={inputCls} placeholder="Иван Иванов" required
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Телефон <span className="text-red-600">*</span></label>
                                <input 
                                    type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                                    className={inputCls} placeholder="+359 88 888 8888" required
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>Метод на доставка <span className="text-red-600">*</span></label>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all flex-1 ${formData.delivery_type === 'address' ? 'border-red-600 bg-red-600/10' : 'border-white/10 bg-[#111] hover:border-white/20'}`}>
                                    <input type="radio" name="delivery_type" value="address" checked={formData.delivery_type === 'address'} onChange={handleInputChange} className="hidden" />
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.delivery_type === 'address' ? 'border-red-600' : 'border-zinc-500'}`}>
                                        {formData.delivery_type === 'address' && <div className="w-2 h-2 rounded-full bg-red-600" />}
                                    </div>
                                    <span className="text-sm font-bold text-white">До адрес</span>
                                </label>
                                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all flex-1 ${formData.delivery_type === 'speedy' ? 'border-red-600 bg-red-600/10' : 'border-white/10 bg-[#111] hover:border-white/20'}`}>
                                    <input type="radio" name="delivery_type" value="speedy" checked={formData.delivery_type === 'speedy'} onChange={handleInputChange} className="hidden" />
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.delivery_type === 'speedy' ? 'border-red-600' : 'border-zinc-500'}`}>
                                        {formData.delivery_type === 'speedy' && <div className="w-2 h-2 rounded-full bg-red-600" />}
                                    </div>
                                    <span className="text-sm font-bold text-white">Офис на Speedy</span>
                                </label>
                                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all flex-1 ${formData.delivery_type === 'econt' ? 'border-red-600 bg-red-600/10' : 'border-white/10 bg-[#111] hover:border-white/20'}`}>
                                    <input type="radio" name="delivery_type" value="econt" checked={formData.delivery_type === 'econt'} onChange={handleInputChange} className="hidden" />
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.delivery_type === 'econt' ? 'border-red-600' : 'border-zinc-500'}`}>
                                        {formData.delivery_type === 'econt' && <div className="w-2 h-2 rounded-full bg-red-600" />}
                                    </div>
                                    <span className="text-sm font-bold text-white">Офис на Еконт</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelCls}>Населено място <span className="text-red-600">*</span></label>
                                <input 
                                    type="text" name="city" value={formData.city} onChange={handleInputChange}
                                    className={inputCls} placeholder="София" required
                                />
                            </div>
                            {formData.delivery_type === 'address' && (
                                <div>
                                    <label className={labelCls}>Квартал</label>
                                    <input 
                                        type="text" name="neighborhood" value={formData.neighborhood} onChange={handleInputChange}
                                        className={inputCls} placeholder="Избери квартал (опционално)"
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className={labelCls}>{formData.delivery_type === 'address' ? 'Адрес' : 'Офис'} <span className="text-red-600">*</span></label>
                            <input 
                                type="text" name="street_address" value={formData.street_address} onChange={handleInputChange}
                                className={inputCls} placeholder={formData.delivery_type === 'address' ? "ул. Независимост 1" : "Офис име или номер"} required
                            />
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer pt-2 w-fit group">
                            <input 
                                type="checkbox" name="is_default" checked={formData.is_default} onChange={handleInputChange}
                                className="w-5 h-5 rounded bg-[#111] border border-white/20 cursor-pointer accent-red-600"
                            />
                            <span className="text-xs uppercase tracking-widest font-bold text-zinc-400 group-hover:text-white transition-colors">
                                Използвай като основен адрес
                            </span>
                        </label>

                        <div className="pt-6 border-t border-white/5 flex gap-4">
                            <button 
                                type="button" onClick={handleCloseForm}
                                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                            >
                                Отказ
                            </button>
                            <button 
                                type="submit" disabled={saving}
                                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.2)]"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Запази Адрес'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}
        </div>
    );
};

export default AddressesTab;
