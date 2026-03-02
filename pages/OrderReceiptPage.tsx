import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Printer, Download, ArrowLeft } from 'lucide-react';
import { getOrderById, Order } from '../lib/order-api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast/ToastProvider';

const OrderReceiptPage: React.FC = () => {
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
                    showToast('Нямате достъп до тази бележка.', 'error');
                    navigate('/profile');
                    return;
                }

                setOrder(data);
            } catch (err) {
                console.error('Error fetching order for receipt:', err);
                showToast('Поръчката не бе намерена.', 'error');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        if (user !== undefined) { // Wait for auth to initialize
            fetchOrder();
        }
    }, [orderId, user, isAdmin, navigate, showToast]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-black animate-spin" />
            </div>
        );
    }

    if (!order) return null;

    const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discount = subtotal - order.total_amount;

    return (
        <div className="min-h-screen bg-zinc-100 py-8 md:py-16 px-4 print:bg-white print:p-0 print:m-0">
            {/* Control Bar - Hidden on print */}
            <div className="max-w-[210mm] mx-auto mb-8 flex items-center justify-between print:hidden">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-zinc-600 hover:text-black transition-colors font-bold text-xs uppercase tracking-widest"
                >
                    <ArrowLeft size={16} />
                    Назад
                </button>
                <div className="flex gap-4">
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg"
                    >
                        <Printer size={16} />
                        Принтирай / PDF
                    </button>
                </div>
            </div>

            {/* Receipt Content - A4 Container */}
            <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[15mm] md:p-[20mm] min-h-[297mm] print:shadow-none print:p-0 print:mt-0 family-mono">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-10">
                    <div className="space-y-4">
                        <img src="/LOGO.png" alt="CarDecal" className="h-10 w-auto object-contain grayscale" />
                        <div className="text-[11px] text-zinc-600 leading-relaxed font-medium uppercase tracking-tighter">
                            <p className="font-black text-black text-xs">CARDECAL LTD</p>
                            <p>www.cardecal.bg</p>
                            <p>Email: support@cardecal.bg</p>
                            <p>Tel: +359 877 626 626</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">БЕЛЕЖКА</h1>
                        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Поръчка #{order.order_number}</p>
                        <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase">Дата: {new Date(order.created_at).toLocaleString('bg-BG')}</p>
                    </div>
                </div>

                {/* Client & Shipping */}
                <div className="grid grid-cols-2 gap-12 mb-12">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-zinc-400 border-b border-zinc-100 pb-2">КЛИЕНТ</h3>
                        <div className="text-xs space-y-1 font-bold">
                            <p className="text-sm text-black">{order.shipping_details.fullName}</p>
                            <p className="text-zinc-600">{order.shipping_details.email}</p>
                            <p className="text-zinc-600">{order.shipping_details.phone}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-zinc-400 border-b border-zinc-100 pb-2">ДОСТАВКА</h3>
                        <div className="text-xs space-y-1 font-bold">
                            <p className="text-black uppercase">{order.shipping_details.deliveryType}</p>
                            <p className="text-zinc-600">{order.shipping_details.city}</p>
                            <p className="text-zinc-600">{order.shipping_details.officeName}</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-12">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b-2 border-black">
                                <th className="py-4 font-black uppercase tracking-widest">№</th>
                                <th className="py-4 font-black uppercase tracking-widest">Артикул</th>
                                <th className="py-4 font-black uppercase tracking-widest">Вариант</th>
                                <th className="py-4 font-black uppercase tracking-widest text-center">Кол.</th>
                                <th className="py-4 font-black uppercase tracking-widest text-right">Цена</th>
                                <th className="py-4 font-black uppercase tracking-widest text-right">Общо</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item, idx) => (
                                <tr key={item.id} className="border-b border-zinc-100">
                                    <td className="py-4 text-zinc-400">{idx + 1}</td>
                                    <td className="py-4 font-black uppercase tracking-tight">{item.name}</td>
                                    <td className="py-4 text-zinc-600">{item.variant}</td>
                                    <td className="py-4 text-center font-bold">{item.quantity}</td>
                                    <td className="py-4 text-right">{item.price.toFixed(2)} €</td>
                                    <td className="py-4 text-right font-black">{(item.price * item.quantity).toFixed(2)} €</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end mb-20">
                    <div className="w-1/2 space-y-3">
                        <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase">
                            <span>Междинна сума:</span>
                            <span>{subtotal.toFixed(2)} €</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-xs font-black text-red-600 uppercase">
                                <span>Отстъпка:</span>
                                <span>-{discount.toFixed(2)} €</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase border-b border-zinc-100 pb-2">
                            <span>Доставка:</span>
                            <span className="italic">По тарифа</span>
                        </div>
                        <div className="flex justify-between items-baseline pt-2">
                            <span className="text-sm font-black uppercase tracking-tighter">ОБЩА СУМА:</span>
                            <div className="text-right">
                                <p className="text-3xl font-black italic leading-none">{order.total_amount.toFixed(2)} €</p>
                                <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-tighter">≈ {(order.total_amount * 1.95583).toFixed(2)} лв.</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t-2 border-black mt-4">
                            <p className="text-[10px] font-black uppercase text-zinc-400 mb-1">Плащане:</p>
                            <p className="text-xs font-bold uppercase">{order.payment_method === 'cash_on_delivery' ? 'Наложен платеж' : order.payment_method}</p>
                        </div>
                    </div>
                </div>

                {/* Footer / Notes */}
                <div className="mt-auto border-t border-zinc-100 pt-10 flex justify-between items-end">
                    <div className="max-w-md">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2">Бележка към поръчката:</p>
                        <p className="text-xs text-zinc-400 italic">
                            {order.shipping_details.notes || "Няма допълнителни бележки."}
                        </p>
                        <div className="mt-8 text-[9px] text-zinc-400 leading-relaxed uppercase font-bold">
                            <p>Благодарим Ви, че избрахте CarDecal!</p>
                            <p>Този документ е генериран автоматично и е валиден без печат.</p>
                            <p>При въпроси, моля използвайте номера на поръчката като референция.</p>
                        </div>
                    </div>
                    
                    {/* QR Code Placeholder (SVG) */}
                    <div className="text-center space-y-2">
                        <div className="w-24 h-24 bg-white border-2 border-black p-1">
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                <rect width="100" height="100" fill="white" />
                                <rect x="10" y="10" width="20" height="20" fill="black" />
                                <rect x="70" y="10" width="20" height="20" fill="black" />
                                <rect x="10" y="70" width="20" height="20" fill="black" />
                                <rect x="40" y="40" width="20" height="20" fill="black" />
                                <rect x="30" y="30" width="10" height="10" fill="black" />
                                <rect x="60" y="60" width="10" height="10" fill="black" />
                                <rect x="20" y="50" width="5" height="5" fill="black" />
                                <rect x="50" y="20" width="5" height="5" fill="black" />
                            </svg>
                        </div>
                        <p className="text-[8px] font-black uppercase tracking-tighter">СКАНИРАЙ ЗА ДЕТАЙЛИ</p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body { margin: 0; padding: 0; background: white !important; }
                    .print-hidden { display: none !important; }
                    @page { margin: 15mm; size: A4; }
                    .min-h-screen { min-height: auto !important; height: auto !important; }
                }
                .family-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
            `}} />
        </div>
    );
};

export default OrderReceiptPage;
