import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../Toast/ToastProvider';
import { Plus, Trash2, Ticket, CheckCircle2, XCircle, RefreshCw, Edit2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PromoCodesTab = () => {
    const { showToast } = useToast();
    const [codes, setCodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [newCode, setNewCode] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
    const [discountValue, setDiscountValue] = useState<number | ''>('');
    const [maxUses, setMaxUses] = useState<number | ''>('');
    const [maxUsesPerUser, setMaxUsesPerUser] = useState<number | ''>('');
    const [minOrderAmount, setMinOrderAmount] = useState<number | ''>('');
    const [validFrom, setValidFrom] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [conditionType, setConditionType] = useState<'none' | 'new_users' | 'loyal_customers'>('none');
    const [conditionValue, setConditionValue] = useState<number | ''>('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchCodes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('promo_codes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                // Return silently if table does not exist or user hasn't ran migration
                if (error.code === '42P01') {
                    showToast('Трябва да стартирате SQL миграцията за промо кодовете в Supabase редактора.', 'error');
                } else {
                    throw error;
                }
            } else {
                setCodes(data || []);
            }
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCodes();
    }, []);

    const generateRandomCode = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        setNewCode(result);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCode || discountValue === '') {
            showToast('Въведете код и стойност на отстъпката.', 'warning');
            return;
        }

        try {
            const fromDate = validFrom ? new Date(validFrom) : null;
            const untilDate = validUntil ? new Date(validUntil) : null;

            if (untilDate && fromDate && untilDate <= fromDate) {
                showToast('Крайната дата трябва да е след началната.', 'warning');
                return;
            }

            const payload = {
                code: newCode.toUpperCase(),
                discount_type: discountType,
                discount_value: Number(discountValue),
                max_uses: maxUses === '' ? null : Number(maxUses),
                max_uses_per_user: maxUsesPerUser === '' ? null : Number(maxUsesPerUser),
                min_order_amount: minOrderAmount === '' ? null : Number(minOrderAmount),
                valid_from: validFrom ? new Date(validFrom).toISOString() : null,
                valid_until: validUntil ? new Date(validUntil).toISOString() : null,
                condition_type: conditionType,
                condition_value: conditionValue === '' ? null : Number(conditionValue)
            };

            let error;
            if (editingId) {
                const { error: updateError } = await supabase
                    .from('promo_codes')
                    .update(payload)
                    .eq('id', editingId);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('promo_codes')
                    .insert(payload);
                error = insertError;
            }

            if (error) throw error;
            showToast(editingId ? 'Успешно обновен промо код.' : 'Успешно създаден промо код.', 'success');
            setIsAdding(false);
            setEditingId(null);
            
            // Reset form
            setNewCode('');
            setDiscountType('percentage');
            setDiscountValue('');
            setMaxUses('');
            setMaxUsesPerUser('');
            setMinOrderAmount('');
            setValidUntil('');
            setConditionType('none');
            setConditionValue('');
            
            fetchCodes();
        } catch (err: any) {
            if (err.code === '23505') {
                showToast('Този код вече съществува.', 'error');
            } else {
                showToast('Грешка: ' + err.message, 'error');
            }
        }
    };

    const startEditing = (code: any) => {
        setEditingId(code.id);
        setNewCode(code.code);
        setDiscountType(code.discount_type);
        setDiscountValue(code.discount_value);
        setMaxUses(code.max_uses ?? '');
        setMaxUsesPerUser(code.max_uses_per_user ?? '');
        setMinOrderAmount(code.min_order_amount ?? '');
        
        // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
        if (code.valid_from) {
            const date = new Date(code.valid_from);
            const offset = date.getTimezoneOffset() * 60000;
            const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
            setValidFrom(localISOTime);
        } else {
            setValidFrom('');
        }

        if (code.valid_until) {
            const date = new Date(code.valid_until);
            const offset = date.getTimezoneOffset() * 60000;
            const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
            setValidUntil(localISOTime);
        } else {
            setValidUntil('');
        }
        
        setConditionType(code.condition_type);
        setConditionValue(code.condition_value ?? '');
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditing = () => {
        setIsAdding(false);
        setEditingId(null);
        setNewCode('');
        setDiscountType('percentage');
        setDiscountValue('');
        setMaxUses('');
        setMaxUsesPerUser('');
        setMinOrderAmount('');
        setValidFrom('');
        setValidUntil('');
        setConditionType('none');
        setConditionValue('');
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase.from('promo_codes').update({ is_active: !currentStatus }).eq('id', id);
            if (error) throw error;
            showToast(currentStatus ? 'Кодът е деактивиран.' : 'Кодът е активиран.', 'success');
            fetchCodes();
        } catch (err: any) {
            showToast('Грешка: ' + err.message, 'error');
        }
    };

    const deleteCode = async (id: string) => {
        if (!confirm('Сигурни ли сте, че искате да изтриете този код?')) return;
        try {
            const { error } = await supabase.from('promo_codes').delete().eq('id', id);
            if (error) throw error;
            showToast('Кодът е изтрит.', 'success');
            fetchCodes();
        } catch (err: any) {
            showToast('Грешка при изтриване: ' + err.message, 'error');
        }
    };

    if (loading) return <div className="text-white">Зареждане на промо кодовете...</div>;

    const inputClasses = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-600 focus:outline-none transition-all placeholder:text-zinc-600";
    const labelClasses = "flex items-center gap-1.5 text-[10px] font-black uppercase text-zinc-500 mb-1.5 ml-1 tracking-widest";

    const InfoTooltip = ({ text }: { text: string }) => (
        <div className="group relative inline-block">
            <Info size={12} className="text-zinc-600 cursor-help hover:text-red-500 transition-colors" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-800 text-[10px] text-zinc-200 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl border border-white/10 z-50 normal-case font-medium tracking-normal text-center">
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-800"></div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between bg-[#111] p-6 rounded-3xl border border-white/5">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-3">
                        <Ticket className="text-red-500" size={24} /> 
                        Промо Кодове
                    </h2>
                    <p className="text-xs text-zinc-500 uppercase mt-1">Управление на кодове за отстъпка</p>
                </div>
                <button
                    onClick={() => isAdding ? cancelEditing() : setIsAdding(true)}
                    className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all flex items-center gap-2"
                >
                    {isAdding ? <XCircle size={16} /> : <Plus size={16} />}
                    {isAdding ? 'Отказ' : 'Нов Код'}
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleSave} className="bg-[#111] p-6 lg:p-8 rounded-[2rem] border border-red-600/20 shadow-[0_0_50px_rgba(255,0,0,0.05)] space-y-6">
                            <h3 className="text-xs font-black uppercase text-zinc-400 border-b border-white/5 pb-4 mb-6">
                                {editingId ? `Редактиране на код: ${newCode}` : 'Създаване на нов код'}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClasses}>
                                        Код (напр. SUMMER20)
                                        <InfoTooltip text="Уникален код, който клиентите въвеждат при плащане." />
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCode}
                                            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                            className={inputClasses}
                                            placeholder="ВЪВЕДИ КОД"
                                            required
                                        />
                                        <button type="button" onClick={generateRandomCode} className="px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white transition-colors" title="Генерирай произволен">
                                            <RefreshCw size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClasses}>
                                            Тип отстъпка
                                            <InfoTooltip text="Изберте дали отстъпката да е процент от сумата или фиксирана сума в евро." />
                                        </label>
                                        <select
                                            value={discountType}
                                            onChange={(e) => setDiscountType(e.target.value as any)}
                                            className={inputClasses}
                                        >
                                            <option value="percentage">% Процент</option>
                                            <option value="fixed_amount">Фиксирана сума (€)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClasses}>
                                            Стойност
                                            <InfoTooltip text="Размерът на отстъпката (число)." />
                                        </label>
                                        <input
                                            type="number"
                                            min="0.01" step="0.01"
                                            value={discountValue}
                                            onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : '')}
                                            className={inputClasses}
                                            placeholder="Напр. 15"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                                <div>
                                    <label className={labelClasses}>
                                        Макс. брой използвания (общо)
                                        <InfoTooltip text="Колко пъти общо може да бъде използван този код от всички клиенти." />
                                    </label>
                                    <input
                                        type="number" min="1"
                                        value={maxUses}
                                        onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : '')}
                                        className={inputClasses}
                                        placeholder="Без ограничение"
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>
                                        Използвания на човек
                                        <InfoTooltip text="Колко пъти един и същ човек (един имейл) може да ползва този код." />
                                    </label>
                                    <input
                                        type="number" min="1"
                                        value={maxUsesPerUser}
                                        onChange={(e) => setMaxUsesPerUser(e.target.value ? Number(e.target.value) : '')}
                                        className={inputClasses}
                                        placeholder="Напр. 1"
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>
                                        Мин. стойност на поръчката (€)
                                        <InfoTooltip text="Минималната сума в количката, за да се задейства отстъпката." />
                                    </label>
                                    <input
                                        type="number" min="0" step="0.01"
                                        value={minOrderAmount}
                                        onChange={(e) => setMinOrderAmount(e.target.value ? Number(e.target.value) : '')}
                                        className={inputClasses}
                                        placeholder="Напр. 50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                                <div>
                                    <label className={labelClasses}>
                                        Валиден от (начална дата)
                                        <InfoTooltip text="Кодът ще стане активен автоматично от тази дата." />
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={validFrom}
                                        onChange={(e) => setValidFrom(e.target.value)}
                                        className={inputClasses}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>
                                        Валиден до (крайна дата)
                                        <InfoTooltip text="Дата и час, след които кодът автоматично ще се деактивира." />
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={validUntil}
                                        onChange={(e) => setValidUntil(e.target.value)}
                                        className={inputClasses}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>
                                        Условие
                                        <InfoTooltip text="Специфично условие за клиента, който прилага кода." />
                                    </label>
                                    <select
                                        value={conditionType}
                                        onChange={(e) => setConditionType(e.target.value as any)}
                                        className={inputClasses}
                                    >
                                        <option value="none">Без условие (за всички)</option>
                                        <option value="new_users">Само за нови клиенти (0 поръчки)</option>
                                        <option value="loyal_customers">За лоялни клиенти (+X поръчки)</option>
                                    </select>
                                </div>
                                {conditionType === 'loyal_customers' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <label className={labelClasses}>
                                            Мин. брой предишни поръчки
                                            <InfoTooltip text="Клиентът трябва да има поне този брой успешни поръчки, за да ползва кода." />
                                        </label>
                                        <input
                                            type="number" min="1"
                                            value={conditionValue}
                                            onChange={(e) => setConditionValue(e.target.value ? Number(e.target.value) : '')}
                                            className={inputClasses}
                                            placeholder="Напр. 5"
                                            required
                                        />
                                    </motion.div>
                                )}
                            </div>

                            <div className="flex justify-end pt-6">
                                <button type="submit" className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.2)] transition-all">
                                    {editingId ? 'Запази промените' : 'Създай код'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-[#111] rounded-3xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02]">
                                <th className="p-4 text-[9px] uppercase tracking-widest text-zinc-500 font-black">Код / Състояние</th>
                                <th className="p-4 text-[9px] uppercase tracking-widest text-zinc-500 font-black">Отстъпка</th>
                                <th className="p-4 text-[9px] uppercase tracking-widest text-zinc-500 font-black">Използван</th>
                                <th className="p-4 text-[9px] uppercase tracking-widest text-zinc-500 font-black">Срок / Условие</th>
                                <th className="p-4 text-[9px] uppercase tracking-widest text-zinc-500 font-black text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {codes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-zinc-600 text-xs uppercase tracking-widest font-black">
                                        Няма съществуващи промо кодове
                                    </td>
                                </tr>
                            ) : (
                                codes.map(c => (
                                    <tr key={c.id} className={`hover:bg-white/[0.02] transition-colors ${!c.is_active ? 'opacity-50' : ''}`}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-black text-sm tracking-wider">{c.code}</span>
                                                    <span className={`text-[9px] uppercase tracking-widest font-bold mt-1 ${
                                                        !c.is_active ? 'text-red-500' : 
                                                        (c.valid_from && new Date(c.valid_from) > new Date()) ? 'text-blue-500' :
                                                        (c.valid_until && new Date(c.valid_until) < new Date()) ? 'text-orange-500' : 'text-green-500'
                                                    }`}>
                                                        {!c.is_active ? 'Спрян' : 
                                                         (c.valid_from && new Date(c.valid_from) > new Date()) ? 'Предстои' :
                                                         (c.valid_until && new Date(c.valid_until) < new Date()) ? 'Изтекъл' : 'Активен'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-black bg-red-600/20 text-red-500 px-3 py-1 rounded-md text-sm border border-red-600/30">
                                                {c.discount_type === 'percentage' ? `-${c.discount_value}%` : `-${c.discount_value} €`}
                                            </span>
                                            {c.min_order_amount && (
                                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mt-2">
                                                    при над {c.min_order_amount} €
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-black">{c.current_uses}</span>
                                                <span className="text-zinc-500">/</span>
                                                <span className="text-zinc-500">{c.max_uses ? c.max_uses : '∞'}</span>
                                            </div>
                                            {(c.max_uses_per_user && c.max_uses_per_user > 0) && <div className="text-[9px] text-zinc-400 mt-1 uppercase font-bold">Лимит: {c.max_uses_per_user}/човек</div>}
                                        </td>
                                        <td className="p-4">
                                            {c.valid_from && (
                                                <div className="text-[10px] text-zinc-400 font-bold mb-1">
                                                    От: {new Date(c.valid_from).toLocaleString('bg-BG', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                            {c.valid_until && (
                                                <div className="text-[10px] text-zinc-200 font-bold mb-1">
                                                    До: {new Date(c.valid_until).toLocaleString('bg-BG', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                            {c.condition_type === 'new_users' && <div className="text-[9px] uppercase tracking-widest text-blue-400 font-black mt-1">Само нови</div>}
                                            {c.condition_type === 'loyal_customers' && <div className="text-[9px] uppercase tracking-widest text-purple-400 font-black mt-1">Лоялни (+{c.condition_value})</div>}
                                            {c.condition_type === 'none' && !c.valid_until && !c.valid_from && <div className="text-[9px] uppercase tracking-widest text-zinc-600 font-black mt-1">Завинаги / Всички</div>}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => startEditing(c)}
                                                    className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-white hover:border-white text-zinc-400 hover:text-black transition-all"
                                                    title="Редактирай"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(c.id, c.is_active)}
                                                    className={`p-2 rounded-xl border transition-all ${c.is_active ? 'bg-red-600/10 border-red-600/20 hover:bg-red-600/20 text-red-500' : 'bg-green-600/10 border-green-600/20 hover:bg-green-600/20 text-green-500'}`}
                                                    title={c.is_active ? "Спри" : "Активирай"}
                                                >
                                                    {c.is_active ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => deleteCode(c.id)}
                                                    className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-red-600 hover:border-red-500 text-zinc-400 hover:text-white transition-all"
                                                    title="Изтрий завинаги"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
