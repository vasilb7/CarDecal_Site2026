import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    CheckCircle2, Package, Truck, Calendar, 
    ArrowRight, Download, Printer, ShoppingBag,
    Loader2
} from 'lucide-react';
import { getOrderById, Order } from '../lib/order-api';
import { useToast } from '../components/Toast/ToastProvider';

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

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.6, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[#050505] pt-32 pb-24 px-4 overflow-hidden relative">
            {/* Ambient Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-red-900/10 to-transparent pointer-events-none" />
            
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-4xl mx-auto relative z-10"
            >
                {/* Status Hero */}
                <div className="text-center mb-16">
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12, stiffness: 200 }}
                        className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(34,197,94,0.1)]"
                    >
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </motion.div>
                    
                    <motion.h1 
                        variants={itemVariants}
                        className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4"
                    >
                        Поръчката е <span className="text-red-600">Приета!</span>
                    </motion.h1>
                    
                    <motion.p variants={itemVariants} className="text-[#B0BEC5] uppercase tracking-[0.3em] text-xs md:text-sm font-medium opacity-80 max-w-lg mx-auto leading-relaxed">
                        Благодарим Ви, че избрахте CarDecal. Очаквайте обаждане от наш консултант за потвърждение.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-16">
                    {/* Order Details Card */}
                    <motion.div variants={itemVariants} className="bg-[#101010] border border-white/5 rounded-[32px] p-8 md:p-10 shadow-2xl">
                        <div className="flex items-center gap-3 mb-8">
                            <Package className="w-5 h-5 text-red-600" />
                            <h2 className="text-xs uppercase tracking-[0.2em] text-white font-black">Информация за поръчката</h2>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Номер на поръчка</span>
                                <span className="text-sm font-black text-white uppercase tracking-wider">#{order.order_number}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Дата</span>
                                <span className="text-sm font-medium text-white">
                                    {new Date(order.created_at).toLocaleDateString('bg-BG')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Статус</span>
                                <span className="px-3 py-1 bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                                    Очаква потвърждение
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Обща сума</span>
                                <div className="flex flex-col items-end">
                                    <span className="text-xl font-black text-red-600 italic">{order.total_amount.toFixed(2)} €</span>
                                    <span className="text-[9px] text-zinc-500 font-bold opacity-60">≈ {(order.total_amount * 1.95583).toFixed(2)} лв.</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Delivery & Next Steps */}
                    <div className="space-y-8">
                        <motion.div variants={itemVariants} className="bg-[#101010] border border-white/5 rounded-[32px] p-8 md:p-10 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <Truck className="w-5 h-5 text-red-600" />
                                <h2 className="text-xs uppercase tracking-[0.2em] text-white font-black">Доставка</h2>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-white font-semibold uppercase tracking-tight">{order.shipping_details.fullName}</p>
                                <p className="text-zinc-400 text-xs">
                                    {order.shipping_details.deliveryType === 'econt' ? 'Еконт' : 'Спиди'} - {order.shipping_details.officeName}
                                </p>
                                <p className="text-zinc-400 text-xs">{order.shipping_details.city}</p>
                                <p className="text-zinc-400 text-xs">{order.shipping_details.phone}</p>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="bg-white/2 border border-white/5 rounded-[32px] p-8 md:p-10">
                            <h3 className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-black mb-6">Какво следва?</h3>
                            <div className="space-y-6">
                                {[
                                    { step: 1, text: "Проверка на наличност и подготовка." },
                                    { step: 2, text: "Потвърждение по телефона." },
                                    { step: 3, text: "Изпращане и доставка до 48ч." }
                                ].map((s) => (
                                    <div key={s.step} className="flex gap-4">
                                        <div className="w-6 h-6 rounded-full border border-red-600/30 flex items-center justify-center text-[10px] font-black text-red-600 shrink-0">{s.step}</div>
                                        <p className="text-xs text-zinc-300 font-medium leading-relaxed">{s.text}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Actions */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <Link 
                        to={`/account/orders/${orderId}`}
                        className="w-full md:w-auto px-10 py-5 bg-white text-black text-xs font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                        Виж детайли
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    
                    <Link 
                        to={`/order/receipt/${orderId}`}
                        target="_blank"
                        className="w-full md:w-auto px-10 py-5 bg-[#101010] border border-white/10 text-white text-xs font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-white/5 transition-all flex items-center justify-center gap-3"
                    >
                        <Printer className="w-4 h-4 text-red-600" />
                        Бележка (PDF)
                    </Link>
                    
                    <Link 
                        to="/catalog"
                        className="w-full md:w-auto px-10 py-5 text-zinc-500 hover:text-white text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Към магазина
                    </Link>
                </motion.div>
                
                <div className="mt-16 pt-8 border-t border-white/5 text-center">
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.4em]">CarDecal – Premium Style & Quality</p>
                </div>
            </motion.div>
        </div>
    );
};

export default OrderSuccessPage;
