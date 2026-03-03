import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Loader2,
    Printer,
    ArrowLeft,
    User,
    Truck,
    Phone,
    Mail,
    MapPin,
    CreditCard,
} from 'lucide-react';
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
        if (user !== undefined) {
            fetchOrder();
        }
    }, [orderId, user, isAdmin, navigate, showToast]);

    const handlePrint = () => window.print();

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#FF0000] animate-spin" />
            </div>
        );
    }

    if (!order) return null;

    const subtotal = order.items.reduce((acc, item: any) => acc + item.price * item.quantity, 0);
    const discount = subtotal - order.total_amount;
    const isFreeShipping = order.total_amount >= (150 / 1.95583);
    const totalBGN = (order.total_amount * 1.95583).toFixed(2);

    const statusMap: Record<string, { label: string; bg: string; text: string; border: string }> = {
        pending:    { label: 'Очаква потвърждение', bg: '#FEF9C3', text: '#92400E', border: '#FDE68A' },
        processing: { label: 'Потвърдена',          bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
        shipped:    { label: 'Изпратена',           bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' },
        delivered:  { label: 'Доставена',           bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
        completed:  { label: 'Завършена',            bg: '#F3F4F6', text: '#1F2937', border: '#D1D5DB' },
        cancelled:  { label: 'Отказана',            bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
    };
    const status = statusMap[order.status] || statusMap.pending;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('bg-BG', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}
             className="min-h-screen bg-[#EAEAEA] py-6 md:py-12 px-4 print:bg-white print:p-0 print:m-0">

            {/* --- Action Bar (hidden on print) --- */}
            <div className="max-w-[210mm] mx-auto mb-6 flex items-center justify-between print:hidden">
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[#555] hover:text-black transition-colors font-semibold text-sm group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Назад
                </button>
                <button onClick={handlePrint}
                    className="flex items-center gap-2 text-white px-6 py-3 font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #000, #3D0000)', borderRadius: '12px' }}>
                    <Printer size={16} />
                    Принтирай / PDF
                </button>
            </div>

            {/* === A4 Page Container === */}
            <div className="max-w-[210mm] mx-auto bg-white relative overflow-hidden flex flex-col print:shadow-none print:p-0 print:mt-0"
                 style={{
                     minHeight: '297mm',
                     padding: '20mm',
                     boxShadow: '0 25px 80px rgba(0,0,0,0.12)',
                 }}>

                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none print:hidden" style={{ opacity: 0.03 }}>
                    <img src="/LOGO.png" alt="" className="w-[400px] h-auto" />
                </div>

                {/* ========== 1) HEADER ========== */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-0 relative z-10">
                    {/* Left: Brand */}
                    <div className="space-y-3">
                        <img src="/LOGO.png" alt="CarDecal" className="h-12 w-auto object-contain" />
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '2px', color: '#000', textTransform: 'uppercase', margin: 0 }}>
                                КАР ДЕКАЛ ООД
                            </h2>
                            <div style={{ fontSize: '12px', color: '#555', marginTop: '6px', lineHeight: '1.8' }}>
                                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Phone size={12} style={{ color: '#999' }} /> +359 89 478 9942
                                </p>
                                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Mail size={12} style={{ color: '#999' }} /> cardecal@abv.bg
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Order Meta */}
                    <div className="text-right space-y-2">
                        <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '2px', color: '#999', textTransform: 'uppercase' }}>
                            Клиентска Разписка
                        </div>
                        <h1 style={{ fontSize: '42px', fontWeight: 900, letterSpacing: '-1px', color: '#000', margin: 0, lineHeight: 1 }}>
                            #{order.order_number}
                        </h1>
                        <div className="flex items-center justify-end gap-3 mt-2">
                            <span style={{
                                display: 'inline-block',
                                padding: '5px 14px',
                                borderRadius: '20px',
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                background: status.bg,
                                color: status.text,
                                border: `1px solid ${status.border}`,
                            }}>
                                {status.label}
                            </span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#999', fontWeight: 600, marginTop: '8px' }}>
                            {formatDate(order.created_at)}
                        </p>
                    </div>
                </div>

                {/* Red separator */}
                <div style={{ height: '3px', background: '#FF0000', margin: '20px 0 28px 0', borderRadius: '2px' }} />

                {/* ========== 2) CLIENT + DELIVERY CARDS ========== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
                    {/* Card A: Client */}
                    <div style={{
                        background: '#fff',
                        border: '1px solid #E5E5E5',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div style={{
                                width: '36px', height: '36px',
                                borderRadius: '50%',
                                background: '#FFEBEE',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <User size={16} style={{ color: '#FF0000' }} />
                            </div>
                            <h3 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: '#999', margin: 0 }}>
                                Клиент
                            </h3>
                        </div>
                        <p style={{ fontSize: '16px', fontWeight: 800, color: '#111', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                            {order.shipping_details.fullName}
                        </p>
                        <p style={{ fontSize: '13px', color: '#555', margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={12} style={{ color: '#bbb' }} /> {order.shipping_details.email}
                        </p>
                        <p style={{ fontSize: '13px', color: '#555', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={12} style={{ color: '#bbb' }} /> {order.shipping_details.phone}
                        </p>
                    </div>

                    {/* Card B: Delivery */}
                    <div style={{
                        background: '#fff',
                        border: '1px solid #E5E5E5',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div style={{
                                width: '36px', height: '36px',
                                borderRadius: '50%',
                                background: '#FFEBEE',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Truck size={16} style={{ color: '#FF0000' }} />
                            </div>
                            <h3 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: '#999', margin: 0 }}>
                                Доставка
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <span style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                background: '#3D0000',
                                color: '#fff',
                            }}>
                                {order.shipping_details.deliveryType === 'office' ? 'Еконт Офис' : 'До адрес'}
                            </span>
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#111', margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={14} style={{ color: '#bbb' }} /> гр. {order.shipping_details.city}
                        </p>
                        <p style={{ fontSize: '13px', color: '#555', margin: 0, fontStyle: 'italic' }}>
                            {order.shipping_details.deliveryType === 'office'
                                ? order.shipping_details.officeName
                                : order.shipping_details.address}
                        </p>
                    </div>
                </div>

                {/* Customer Notes */}
                {order.shipping_details.notes && (
                    <div style={{
                        background: '#FFFDE7',
                        border: '1px solid #FFF9C4',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        marginBottom: '24px',
                        fontSize: '12px',
                        color: '#555',
                    }} className="relative z-10">
                        <span style={{ fontWeight: 800, color: '#92400E', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Бележка от клиента:
                        </span>
                        <p style={{ margin: '6px 0 0 0', fontStyle: 'italic', lineHeight: 1.5 }}>
                            "{order.shipping_details.notes}"
                        </p>
                    </div>
                )}

                {/* ========== 3) PRODUCT TABLE ========== */}
                <div className="flex-1 relative z-10">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#F5F5F5' }}>
                                <th style={{ ...thStyle, width: '36px', textAlign: 'center' }}>№</th>
                                <th style={{ ...thStyle, textAlign: 'left' }}>Артикул</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Размер</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Кол.</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Ед. Цена</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Общо</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item: any, idx: number) => (
                                <tr key={item.id || idx} style={{ background: idx % 2 === 1 ? '#FAFAFA' : '#fff', borderBottom: '1px solid #F0F0F0' }}>
                                    <td style={{ ...tdStyle, textAlign: 'center', color: '#bbb', fontWeight: 700 }}>{idx + 1}</td>
                                    <td style={tdStyle}>
                                        <div>
                                            <span style={{ fontWeight: 700, color: '#111', display: 'block', fontSize: '13px' }}>
                                                {item.name_bg || item.name}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#999', fontWeight: 500 }}>
                                                {item.variant}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        {item.selectedSize ? (
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '3px 10px',
                                                background: '#F5F5F5',
                                                border: '1px solid #E5E5E5',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                color: '#111',
                                            }}>
                                                {item.selectedSize}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '11px', color: '#ccc', fontStyle: 'italic' }}>Стандартен</span>
                                        )}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#111' }}>
                                        {item.quantity} бр.
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'right', color: '#555' }}>
                                        <div>
                                            <span style={{ display: 'block' }}>{item.price.toFixed(2)} &euro;</span>
                                            <span style={{ fontSize: '10px', color: '#bbb' }}>
                                                ≈ {(item.price * 1.95583).toFixed(2)} лв.
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: '#111' }}>
                                        <div>
                                            <span style={{ display: 'block' }}>{(item.price * item.quantity).toFixed(2)} &euro;</span>
                                            <span style={{ fontSize: '10px', color: '#bbb', fontWeight: 500 }}>
                                                ≈ {(item.price * item.quantity * 1.95583).toFixed(2)} лв.
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ========== 4) SUMMARY / TOTALS ========== */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mt-10 relative z-10">
                    {/* Left: Payment Method */}
                    <div style={{ maxWidth: '260px' }} className="space-y-3">
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: '#F5F5F5', border: '1px solid #E5E5E5',
                            borderRadius: '12px', padding: '14px 16px',
                        }}>
                            <CreditCard size={18} style={{ color: '#999' }} />
                            <div>
                                <span style={{ display: 'block', fontSize: '9px', fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Метод на плащане
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: '#111', textTransform: 'uppercase' }}>
                                    Наложен платеж
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Summary Card */}
                    <div style={{
                        width: '100%', maxWidth: '340px',
                        border: '1px solid #E5E5E5',
                        borderRadius: '16px',
                        overflow: 'hidden',
                    }}>
                        <div style={{ padding: '20px 24px' }} className="space-y-3">
                            {/* Subtotal */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#555' }}>
                                <span>Междинна сума</span>
                                <span style={{ fontWeight: 600 }}>{subtotal.toFixed(2)} &euro;</span>
                            </div>

                            {/* Discount */}
                            {discount > 0.01 && (
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', fontSize: '13px',
                                    color: '#166534', background: '#F0FDF4',
                                    padding: '10px 14px', borderRadius: '10px',
                                    border: '1px solid #BBF7D0',
                                }}>
                                    <div>
                                        <span style={{ fontWeight: 700, display: 'block' }}>Пакетна отстъпка</span>
                                        <span style={{ fontSize: '10px', opacity: 0.7, fontStyle: 'italic' }}>Спестявате от количеството</span>
                                    </div>
                                    <span style={{ fontWeight: 800 }}>-{discount.toFixed(2)} &euro;</span>
                                </div>
                            )}

                            {/* Shipping */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                fontSize: '13px', color: '#555',
                                borderBottom: '1px solid #E5E5E5', paddingBottom: '14px',
                            }}>
                                <span>Доставка <span style={{ fontSize: '10px', color: '#999' }}>(над 150 лв. - безплатна)</span></span>
                                {isFreeShipping ? (
                                    <span style={{
                                        fontWeight: 800, color: '#166534',
                                        background: '#DCFCE7', padding: '3px 10px',
                                        borderRadius: '6px', fontSize: '11px',
                                        textTransform: 'uppercase',
                                    }}>
                                        Безплатна
                                    </span>
                                ) : (
                                    <span style={{ fontWeight: 700, fontSize: '11px', color: '#111', fontStyle: 'italic' }}>
                                        По стандартна тарифа
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Final Total - Premium gradient bar */}
                        <div style={{
                            background: 'linear-gradient(135deg, #000000, #3D0000)',
                            padding: '22px 24px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <div>
                                <span style={{ display: 'block', fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                    Обща Сума
                                </span>
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                    ≈ {totalBGN} лв.
                                </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{
                                    fontSize: '36px', fontWeight: 900,
                                    color: '#fff', letterSpacing: '-1px',
                                    lineHeight: 1,
                                }}>
                                    {order.total_amount.toFixed(2)} &euro;
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========== 5) FOOTER + QR ========== */}
                <div style={{
                    marginTop: 'auto', paddingTop: '40px',
                    borderTop: '1px solid #E5E5E5',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                    position: 'relative', zIndex: 10,
                }}>
                    <div>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#555', margin: '0 0 4px 0' }}>
                            Благодарим Ви, че избрахте CarDecal!
                        </p>
                        <p style={{ fontSize: '10px', fontWeight: 600, color: '#bbb', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                            &copy; {new Date().getFullYear()} CARDECAL OOD &bull; WWW.CARDECAL.BG
                        </p>
                    </div>

                    <div className="flex items-end gap-4">
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '9px', fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px 0' }}>
                                Официална разписка
                            </p>
                            <p style={{ fontSize: '8px', color: '#ccc', margin: 0 }}>
                                Valid without physical stamp
                            </p>
                        </div>
                        <div style={{
                            padding: '8px',
                            background: '#fff',
                            border: '1px solid #E5E5E5',
                            borderRadius: '12px',
                        }}>
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&color=000000&bgcolor=FFFFFF&data=${window.location.origin}/order/receipt/${order.id}`}
                                alt="QR Code"
                                style={{ width: '100px', height: '100px', display: 'block' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* === Print Styles === */}
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @media print {
                    body { margin: 0; padding: 0; background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                    @page { margin: 0; size: A4; }
                }
            `}} />
        </div>
    );
};

/* Reusable table cell styles */
const thStyle: React.CSSProperties = {
    padding: '12px 14px',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: '#555',
    borderBottom: '2px solid #E5E5E5',
};

const tdStyle: React.CSSProperties = {
    padding: '14px 14px',
    fontSize: '13px',
    verticalAlign: 'middle',
};

export default OrderReceiptPage;
