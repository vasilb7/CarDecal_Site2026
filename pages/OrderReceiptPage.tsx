import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Loader2,
  Printer,
  ArrowLeft,
  CheckCircle2,
  Truck,
  Home,
  CreditCard,
  Package,
  Calendar,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { getOrderById, Order } from "../lib/order-api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast/ToastProvider";

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
          showToast("Нямате достъп до тази бележка.", "error");
          navigate("/profile");
          return;
        }

        setOrder(data);
      } catch (err) {
        console.error("Error fetching order for receipt:", err);
        showToast("Поръчката не бе намерена.", "error");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    if (user !== undefined) {
      fetchOrder();
    }
  }, [orderId, user, isAdmin, navigate, showToast]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const subtotal = order.items.reduce(
    (acc, item: any) => acc + item.price * item.quantity,
    0,
  );
  const discount = subtotal - order.total_amount;
  const isFreeShipping = order.total_amount >= 150 / 1.95583;

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: {
      label: "Очаква потвърждение",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    processing: {
      label: "Обработва се",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    shipped: {
      label: "Изпратена",
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    delivered: {
      label: "Доставена",
      color: "bg-green-50 text-green-700 border-green-200",
    },
    completed: {
      label: "Завършена",
      color: "bg-zinc-100 text-zinc-800 border-zinc-300",
    },
    cancelled: {
      label: "Отказна",
      color: "bg-red-50 text-red-700 border-red-200",
    },
  };

  const currentStatus = statusMap[order.status] || {
    label: order.status,
    color: "bg-zinc-50 text-zinc-600",
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-8 md:py-16 px-4 print:bg-white print:p-0 print:m-0 selection:bg-red-100">
      {/* Control Bar - Hidden on print */}
      <div className="max-w-[210mm] mx-auto mb-8 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-500 hover:text-black transition-all font-bold text-xs uppercase tracking-widest group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Назад
        </button>
        <div className="flex gap-4">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl hover:-translate-y-0.5"
          >
            <Printer size={16} />
            Принтирай / PDF
          </button>
        </div>
      </div>

      {/* Receipt Content - A4 Container */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-[0_40px_100px_rgba(0,0,0,0.08)] p-[12mm] md:p-[20mm] min-h-[297mm] print:shadow-none print:p-0 print:mt-0 relative overflow-hidden flex flex-col">
        {/* Brand Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-red-600 print:hidden" />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
          <div className="space-y-6">
            <img
              src="/LOGO.png"
              alt="CarDecal"
              className="h-10 w-auto object-contain"
            />
            <div className="space-y-1">
              <h2 className="text-xl font-black uppercase tracking-tighter text-black">
                CarDecal OOD
              </h2>
              <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest space-y-1">
                <p className="flex items-center gap-2 text-zinc-400">
                  <Phone size={10} /> +359 877 626 626
                </p>
                <p className="flex items-center gap-2 text-zinc-400">
                  <Mail size={10} /> support@cardecal.bg
                </p>
              </div>
            </div>
          </div>

          <div className="text-right space-y-4">
            <div className="inline-block px-6 py-2 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              КЛИЕНТСКА РАЗПИСКА
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tighter text-black">
                #{order.order_number}
              </h1>
              <div className="flex items-center justify-end gap-3 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${currentStatus.color}`}
                >
                  {currentStatus.label}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-4 flex items-center justify-end gap-2">
                <Calendar size={12} />
                {new Date(order.created_at).toLocaleString("bg-BG", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-zinc-200 flex items-center justify-center text-zinc-400">
                <Home size={18} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                Клиент
              </h3>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-black text-black uppercase">
                {order.shipping_details.fullName}
              </p>
              <p className="text-sm font-bold text-zinc-500">
                {order.shipping_details.email}
              </p>
              <p className="text-sm font-bold text-zinc-500 mt-2">
                {order.shipping_details.phone}
              </p>
            </div>
          </div>

          <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Truck size={80} className="text-black" />
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-zinc-200 flex items-center justify-center text-zinc-400">
                <Truck size={18} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                Доставка
              </h3>
            </div>
            <div className="space-y-1 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded uppercase">
                  {order.shipping_details.deliveryType === "office"
                    ? "Еконт Офис"
                    : "Адрес"}
                </span>
              </div>
              <p className="text-sm font-black text-black">
                гр. {order.shipping_details.city}
              </p>
              <p className="text-sm font-bold text-zinc-500 italic">
                {order.shipping_details.deliveryType === "office"
                  ? order.shipping_details.officeName
                  : order.shipping_details.address}
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 w-12">
                  №
                </th>
                <th className="py-6 text-[10px] font-black uppercase tracking-widest text-black">
                  Артикул
                </th>
                <th className="py-6 text-[10px] font-black uppercase tracking-widest text-black/40 text-center">
                  Размер
                </th>
                <th className="py-6 text-[10px] font-black uppercase tracking-widest text-black/40 text-center">
                  Кол.
                </th>
                <th className="py-6 text-[10px] font-black uppercase tracking-widest text-black text-right">
                  Ед. Цена
                </th>
                <th className="py-6 text-[10px] font-black uppercase tracking-widest text-black text-right">
                  Общо
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {order.items.map((item: any, idx) => (
                <tr key={item.id}>
                  <td className="py-6 text-[11px] font-bold text-zinc-300">
                    {idx + 1}
                  </td>
                  <td className="py-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-tight text-black">
                        {item.name_bg || item.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                        {item.variant}
                      </span>
                    </div>
                  </td>
                  <td className="py-6 text-center">
                    {item.selectedSize ? (
                      <span className="text-[10px] font-black text-black uppercase tracking-widest bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">
                        {item.selectedSize}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest italic">
                        N/A
                      </span>
                    )}
                  </td>
                  <td className="py-6 text-center text-xs font-black text-black">
                    {item.quantity}бр.
                  </td>
                  <td className="py-6 text-right text-xs font-bold text-zinc-400">
                    <div className="flex flex-col">
                      <span>{item.price.toFixed(2)} €</span>
                      <span className="text-[9px] opacity-60">
                        ≈ {(item.price * 1.95583).toFixed(2)} лв.
                      </span>
                    </div>
                  </td>
                  <td className="py-6 text-right font-black text-black">
                    <div className="flex flex-col">
                      <span>{(item.price * item.quantity).toFixed(2)} €</span>
                      <span className="text-[9px] text-zinc-300">
                        ≈ {(item.price * item.quantity * 1.95583).toFixed(2)}{" "}
                        лв.
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Totals Section */}
        <div className="mt-12 pt-12 border-t-2 border-black flex flex-col md:flex-row justify-between gap-12">
          <div className="max-w-xs space-y-4">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Бележка от клиента:
              </p>
              <p className="text-[11px] text-zinc-500 leading-relaxed italic font-medium bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                {order.shipping_details.notes ||
                  "Няма допълнителни бележки към поръчката."}
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <CreditCard size={18} className="text-zinc-400" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">
                  Метод на плащане
                </span>
                <span className="text-[10px] font-black uppercase text-black">
                  Наложен платеж (Cash)
                </span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-80 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase">
                <span>Междинна сума</span>
                <span>{subtotal.toFixed(2)} €</span>
              </div>
              {discount > 0.01 && (
                <div className="flex justify-between text-xs font-black text-green-600 uppercase bg-green-50/50 p-3 rounded-xl border border-green-100/50">
                  <div className="flex flex-col">
                    <span>Пакетна Отстъпка</span>
                    <span className="text-[8px] opacity-60 font-bold italic normal-case">Спестявате от общото количество</span>
                  </div>
                  <span>-{discount.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold items-center border-b border-zinc-100 pb-4 pt-2">
                <span className="text-zinc-500 uppercase font-bold text-[10px]">Доставка (Над 150 лв. - Безплатна)</span>
                {isFreeShipping ? (
                  <span className="text-green-600 font-black tracking-widest bg-green-50 px-2 py-1 rounded-md text-[10px]">БЕЗПЛАТНА</span>
                ) : (
                  <span className="text-black font-black italic text-[9px] uppercase tracking-widest">По стандартна тарифа</span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-end pt-4">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-1">
                  ОБЩА СУМА
                </h4>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/40">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-[10px] font-black text-red-600 uppercase">
                    Final Total
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black italic tracking-tighter text-black leading-none">
                  {order.total_amount.toFixed(2)} €
                </p>
                <p className="text-sm font-black text-zinc-300 tracking-tight mt-1">
                  ≈ {(order.total_amount * 1.95583).toFixed(2)} лв.
                </p>
              </div>
            </div>

            {isFreeShipping && (
              <div className="mt-8 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3">
                <Truck size={20} className="text-green-600" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-green-700 uppercase">
                    Поздравления!
                  </span>
                  <span className="text-[9px] text-green-600 font-bold">
                    Тази поръчка покрива прага за безплатна доставка.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-10 border-t border-zinc-100 flex justify-between items-end">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest space-y-1">
            <p>Благодарим Ви, че избрахте CarDecal!</p>
            <p>© {new Date().getFullYear()} CarDecal OOD • www.cardecal.bg</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest mb-1">
                Официална разписка
              </p>
              <p className="text-[7px] text-zinc-200">
                Valid without physical stamp
              </p>
            </div>
            <div className="p-2 border-2 border-zinc-50 rounded-xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${window.location.origin}/order/receipt/${order.id}`}
                alt="QR Code"
                className="w-14 h-14 object-contain grayscale opacity-30"
              />
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
                @media print {
                    body { margin: 0; padding: 0; background: white !important; -webkit-print-color-adjust: exact; }
                    .print-hidden { display: none !important; }
                    @page { margin: 0; size: A4; }
                    .min-h-screen { min-height: auto !important; height: auto !important; py: 0 !important; }
                    .shadow-2xl, .shadow-xl { shadow: none !important; }
                    .bg-zinc-50 { background-color: #f9fafb !important; }
                }
            `,
        }}
      />
    </div>
  );
};

export default OrderReceiptPage;
