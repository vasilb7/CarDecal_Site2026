import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Package, Truck, Calendar, 
    Printer, ArrowRight, Loader2, MapPin,
    CreditCard, Info
} from 'lucide-react';
import { getOrderById, Order } from '../lib/order-api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast/ToastProvider';

const OrderDetailPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const { user, isAdmin } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return;
            try {
                const data = await getOrderById(orderId);
                
                // Security Check: Only owner or admin
                if (user && data.user_id !== user.id && !isAdmin) {
                    showToast('Нямате достъп до тази поръчка.', 'error');
                    navigate('/profile');
                    return;
                }

                setOrder(data);
            } catch (err) {
                console.error('Error fetching order details:', err);
                showToast('Поръчката не бе намерена.', 'error');
                navigate('/profile');
            } finally {
                setLoading(false);
            }
        };

        if (user !== undefined) {
            fetchOrder();
        }
    }, [orderId, user, isAdmin, navigate, showToast]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            </div>
        );
    }

    if (!order) return null;

    const statusColors: Record<string, string> = {
        'pending': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        'processing': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        'shipped': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        'delivered': 'bg-green-500/10 text-green-500 border-green-500/20',
        'completed': 'bg-zinc-800 text-zinc-100 border-black',
        'cancelled': 'bg-red-500/10 text-red-500 border-red-500/20',
    };

    const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const isFreeShipping = order.total_amount >= (150 / 1.95583);
    const discount = subtotal - order.total_amount;

    const statusMap: Record<string, string> = {
        'pending': 'Очаква потвърждение',
        'processing': 'Обработва се',
        'shipped': 'Изпратена',
        'delivered': 'Доставена',
        'cancelled': 'Отказана',
    };

    return (
        <div className="min-h-screen bg-[#050505] pt-24 pb-20 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <Link 
                            to="/profile" 
                            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] uppercase tracking-[0.2em] font-black mb-4 group"
                        >
                            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Моят Профил
                        </Link>
                        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
                            Поръчка <span className="text-red-600">#{order.order_number}</span>
                        </h1>
                    </div>
                    
                    <div className="flex gap-3">
                        <Link 
                            to={`/order/receipt/${orderId}`}
                            target="_blank"
                            className="px-6 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all flex items-center gap-3"
                        >
                            <Printer size={16} />
                            Печат / PDF
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Status Summary Card */}
                        <div className="bg-[#101010] border border-white/5 rounded-[32px] p-6 md:p-8">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Текущ Статус</p>
                                    <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusColors[order.status] || statusColors.pending}`}>
                                        {statusMap[order.status] || statusMap.pending}
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Дата на поръчка</p>
                                    <p className="text-sm text-white font-black">{new Date(order.created_at).toLocaleDateString('bg-BG')}</p>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mb-4 flex items-center gap-2">
                                    <Package size={14} className="text-red-500" />
                                    Артикули
                                </h3>
                                <div className="space-y-3">
                                    {order.items.map((item: any) => (
                                        <div key={item.id} className="flex items-center gap-4 bg-white/2 p-4 rounded-2xl border border-white/5">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-black text-white uppercase tracking-wider truncate">
                                                    {item.name_bg || item.name}
                                                </h4>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {item.selectedSize && (
                                                        <span className="text-[9px] px-2 py-0.5 bg-white/5 text-zinc-300 rounded font-bold uppercase tracking-widest">
                                                            {item.selectedSize}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-white italic">{item.price.toFixed(2)} €</p>
                                                <p className="text-[10px] text-zinc-500 font-bold">x{item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Order Timeline (Mock) */}
                        <div className="bg-[#101010] border border-white/5 rounded-[32px] p-8">
                            <h3 className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mb-8">История на историята</h3>
                            <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                                <div className="relative pl-10">
                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-red-600 border-4 border-black" />
                                    <p className="text-xs font-black text-white uppercase tracking-tight">Поръчката е направена</p>
                                    <p className="text-[10px] text-zinc-500 mt-1">{new Date(order.created_at).toLocaleString('bg-BG')}</p>
                                </div>
                                <div className="relative pl-10 opacity-40">
                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-zinc-800 border-4 border-black" />
                                    <p className="text-xs font-black text-white uppercase tracking-tight">В процес на обработка</p>
                                    <p className="text-[10px] text-zinc-500 mt-1">Очаквайте скоро</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Info Cards */}
                    <div className="space-y-6">
                        <section className="bg-[#101010] border border-white/5 rounded-[32px] p-8">
                            <h3 className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mb-6 flex items-center gap-2">
                                <MapPin size={14} className="text-red-500" />
                                Адрес за доставка
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-white font-bold">{order.shipping_details.fullName}</p>
                                    <p className="text-xs text-zinc-400">{order.shipping_details.phone}</p>
                                    <p className="text-xs text-zinc-400">{order.shipping_details.email}</p>
                                </div>
                                <div className="pt-4 border-t border-white/5 space-y-1">
                                    <p className="text-xs font-black text-white uppercase tracking-tight italic">
                                        {order.shipping_details.deliveryType === 'econt' ? 'Еконт Офис' : 'Спиди Офис'}
                                    </p>
                                    <p className="text-xs text-zinc-400">{order.shipping_details.city}</p>
                                    <p className="text-xs text-zinc-400">{order.shipping_details.officeName}</p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-[#101010] border border-white/5 rounded-[32px] p-8">
                            <h3 className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mb-6 flex items-center gap-2">
                                <CreditCard size={14} className="text-red-500" />
                                Плащане
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500 font-bold uppercase tracking-widest">Метод:</span>
                                    <span className="text-white font-black uppercase tracking-tight">Наложен платеж</span>
                                </div>
                                <div className="pt-4 border-t border-white/5 space-y-3">
                                    <div className="flex justify-between text-xs font-bold text-zinc-400">
                                        <span>Подсума:</span>
                                        <span>{subtotal.toFixed(2)} €</span>
                                    </div>
                                    {discount > 0.01 && (
                                        <div className="flex justify-between text-xs font-bold text-green-500">
                                            <span>Отстъпка:</span>
                                            <span>-{discount.toFixed(2)} €</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xs font-bold text-zinc-400">
                                        <span>Доставка:</span>
                                        <span className={isFreeShipping ? "text-green-500 font-black uppercase" : "italic"}>
                                            {isFreeShipping ? "Безплатна" : "По тарифа"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-baseline pt-2">
                                        <span className="text-sm font-black text-white uppercase italic">Общо:</span>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-red-600 italic">{(order.total_amount).toFixed(2)} €</p>
                                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">≈ {(order.total_amount * 1.95583).toFixed(2)} лв.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {order.shipping_details.notes && (
                            <section className="bg-red-600/5 border border-red-600/10 rounded-[32px] p-8">
                                <h3 className="text-[10px] text-red-500 uppercase tracking-widest font-black mb-4 flex items-center gap-2">
                                    <Info size={14} />
                                    Бележка
                                </h3>
                                <p className="text-xs text-zinc-300 italic leading-relaxed">
                                    "{order.shipping_details.notes}"
                                </p>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;
