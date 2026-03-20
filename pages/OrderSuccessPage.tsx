import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    Check, ShoppingBag, History, Printer, X,
    ArrowRight, Loader2, Sparkles, Trophy
} from 'lucide-react';
import { getOrderById, Order } from '../lib/order-api';
import { useToast } from '../components/Toast/ToastProvider';
import SEO from '../components/SEO';

const OrderSuccessPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return;
            try {
                const data = await getOrderById(orderId);
                setOrder(data);
            } catch (err) {
                console.error('Error fetching order:', err);
                showToast('Поръчката не бе намерена.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, showToast]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Грешка при зареждане</h1>
                <Link to="/catalog" className="text-red-500 underline uppercase tracking-widest text-xs font-black">Обратно към каталога</Link>
            </div>
        );
    }

    const earnedCoins = Math.floor(order.total_amount);

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
            <SEO title={`Успешна поръчка #${order.order_number}`} />
            
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-600/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-red-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse" />
            
            {/* Close Button */}
            <button 
                onClick={() => navigate('/catalog')}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all z-50 group"
            >
                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl w-full relative z-10"
            >
                <div className="text-center">
                    {/* Large Checkmark Wrapper */}
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                        className="w-24 h-24 bg-green-500/10 border-2 border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-10 shadow-[0_0_60px_rgba(34,197,94,0.15)] relative"
                    >
                        <motion.div
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <Check className="w-10 h-10 text-green-500" strokeWidth={3} />
                        </motion.div>
                        
                        {/* Floating elements */}
                        <motion.div 
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-zinc-900 rounded-lg border border-white/5 flex items-center justify-center shadow-xl"
                        >
                            <Sparkles className="text-amber-500" size={12} />
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
                            Благодарим Ви за <span className="text-red-600">Доверието!</span>
                        </h1>
                        <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs max-w-[320px] mx-auto leading-relaxed">
                            Вашата транзакция бе завършена успешно. Очаквайте обаждане за потвърждение.
                        </p>
                    </motion.div>

                    {/* Loyalty Points Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-12 p-1 bg-gradient-to-br from-amber-500/20 via-transparent to-transparent rounded-[2.5rem]"
                    >
                        <div className="bg-[#0a0a0a] border border-white/5 p-6 md:p-8 rounded-[2.4rem] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                <Trophy size={100} className="rotate-12" />
                            </div>
                            
                            <div className="flex items-center justify-between gap-4 relative z-10">
                                <div className="flex items-center gap-4 text-left">
                                    <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                                        <img src="/CDcoin.png" alt="coin" className="w-8 h-8 object-contain" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-amber-500/60 font-black uppercase tracking-[0.2em] mb-1">Току-що спечелихте</p>
                                        <h2 className="text-3xl font-black text-white italic tracking-tight">+{earnedCoins} <span className="text-amber-500">Coins</span></h2>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest leading-none">
                                <div className="text-left">
                                    <p className="text-zinc-600 mb-1.5">Равностойност</p>
                                    <p className="text-white">{(earnedCoins * 0.01).toFixed(2)} € Отстъпка</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-zinc-600 mb-1.5">Статус</p>
                                    <p className="text-amber-500 animate-pulse">Обработка...</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Access Info */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-10 grid grid-cols-2 gap-4"
                    >
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left">
                            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1.5">Номер на поръчка</p>
                            <p className="text-xs font-black text-white tracking-widest italic">#{order.order_number}</p>
                        </div>
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left">
                            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1.5">Метод на плащане</p>
                            <p className="text-xs font-black text-white uppercase italic">Наложен платеж</p>
                        </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="mt-10 flex flex-col sm:flex-row items-center gap-4"
                    >
                        <Link 
                            to="/catalog"
                            className="w-full h-14 bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                        >
                            Продължи Пазаруването
                            <ArrowRight size={14} />
                        </Link>
                        <Link 
                            to="/profile"
                            className="w-full h-14 bg-[#101010] border border-white/5 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
                        >
                            Към Портфейла
                            <History size={14} className="text-amber-500" />
                        </Link>
                    </motion.div>

                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        transition={{ delay: 1 }}
                        className="mt-8 text-[9px] text-zinc-600 font-bold uppercase tracking-[0.3em]"
                    >
                        Изпратихме детайли на имейл: {order.shipping_details.email}
                    </motion.p>
                </div>
            </motion.div>
        </div>
    );
};

export default OrderSuccessPage;
