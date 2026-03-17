import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Truck, Package, X, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { DiscountProgress } from '../components/DiscountProgress';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ErrorStateCard from '../components/ErrorStateCard';
import SEO from '../components/SEO';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const CartPage: React.FC = () => {
    const { items, subtotal, discountPercentage, total, initiateRemove, cancelRemove, increase, decrease, updateQuantity, isFreeShipping, amountToFreeShipping } = useCart();
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleCheckout = () => {
        if (!user) {
            navigate('/login', { state: { from: '/checkout' } });
        } else {
            navigate('/checkout');
        }
    };

    // Delivery logic removed as per user request (free/external)

    if (items.length === 0) {
        return (
            <div className="pt-32 pb-24 min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center"
                >
                    <span className="mb-6 opacity-80 inline-block">
                      <svg
                        viewBox="0 0 129.88 129.88"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        className="w-24 h-24"
                      >
                        <defs>
                          <linearGradient
                            id="cart-page-gradient"
                            x1="21.08"
                            x2="108.88"
                            y1="90.47"
                            y2="39.78"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop offset="0.02" stopColor="red" />
                            <stop offset="1" stopColor="#9e005d" />
                          </linearGradient>
                          <linearGradient
                            id="cart-page-gradient-2"
                            x1="46.14"
                            x2="88.56"
                            y1="57.75"
                            y2="57.75"
                            xlinkHref="#cart-page-gradient"
                          />
                        </defs>

                        <g id="Layer_1" data-name="Layer 1">
                          <path
                            d="M86.37,14.44H43.59a13.65,13.65,0,0,0-11.82,6.82L10.38,58.31a13.67,13.67,0,0,0,0,13.64L31.77,109a13.65,13.65,0,0,0,11.82,6.82H86.37A13.63,13.63,0,0,0,98.18,109l21.4-37a13.67,13.67,0,0,0,0-13.64l-21.4-37A13.63,13.63,0,0,0,86.37,14.44Z"
                            fill="url(#cart-page-gradient)"
                          />
                          <path
                            d="M62.32,91.8a5.08,5.08,0,1,1-5.08-5.08A5.08,5.08,0,0,1,62.32,91.8Z"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="4.6"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M82.53,91.8a5.08,5.08,0,1,1-5.08-5.08A5.08,5.08,0,0,1,82.53,91.8Z"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="4.6"
                            strokeLinejoin="round"
                          />
                          <polyline
                            points="34.12 40.87 44.55 40.87 52.15 75.69 48.62 80.81 87.92 80.81"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="4.6"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          />
                          <polygon
                            points="88.56 68.62 51.62 71.62 46.14 43.87 88.56 43.87 88.56 68.62"
                            fill="url(#cart-page-gradient-2)"
                            stroke="#fff"
                            strokeWidth="4"
                            strokeMiterlimit="10"
                          />
                          <line
                            x1="55.59"
                            y1="51.36"
                            x2="80.24"
                            y2="51.36"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="4.6"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          />
                        </g>
                      </svg>
                    </span>
                    <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-4">Количката е празна</h1>
                    <p className="text-[#B0BEC5] uppercase tracking-widest text-sm max-w-md mx-auto mb-8 leading-relaxed">
                        Все още не сте добавили продукти в количката си. Разгледайте нашите каталози и намерете перфектния стикер за вашия автомобил.
                    </p>
                    <Link 
                        to="/catalog" 
                        className="px-8 py-4 bg-gradient-to-r from-[#3d0000] to-[#950101] text-white text-xs font-bold uppercase tracking-[0.2em] hover:from-[#950101] hover:to-[#ff0000] rounded-sm transition-all focus:scale-[0.98] active:scale-[0.98] shadow-lg shadow-red-900/20 mb-8"
                    >
                        КЪМ КАТАЛОГА
                    </Link>

                    <button 
                        onClick={() => window.dispatchEvent(new Event('open-bug-report'))}
                        className="text-xs uppercase tracking-widest text-[#B0BEC5] hover:text-white underline decoration-[#B0BEC5]/30 hover:decoration-white/50 underline-offset-4 transition-all"
                    >
                        Нещо се обърка? Докладвай проблем
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="pt-24 pb-16 min-h-screen">
            <SEO title="Количка" />
            <div className="container mx-auto px-6">
                
                {/* Back link & Header */}
                <div className="mb-8">
                    <Link to="/catalog" className="inline-flex items-center text-[#B0BEC5] hover:text-white transition-colors text-xs uppercase tracking-widest gap-2 mb-6 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Към Каталога
                    </Link>
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter"
                    >
                        Вашата <span className="text-[#ff0000]">Количка</span>
                    </motion.h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Left Column - Product List */}
                    <div className="lg:col-span-8">
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-4"
                        >
                            <AnimatePresence>
                                {items.map(item => {
                                    if (item.isRemoving) {
                                        const elapsed = item.removeInitiatedAt ? Date.now() - item.removeInitiatedAt : 0;
                                        const remainingTime = Math.max(0, 5000 - elapsed) / 1000;
                                        const initialPercentage = (remainingTime / 5) * 100;

                                        return (
                                            <motion.div 
                                                key={item.id}
                                                variants={itemVariants}
                                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                                layout
                                                className="bg-[#1a0505] border border-[#ff0000]/20 rounded-2xl p-6 flex flex-col items-center justify-center relative group min-h-[160px] overflow-hidden"
                                            >
                                                <p className="text-white text-sm tracking-widest uppercase font-bold text-center relative z-10 w-full drop-shadow-md mb-3">
                                                    Артикулът е премахнат
                                                </p>
                                                <button 
                                                    onClick={() => cancelRemove(item.id)}
                                                    className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs uppercase font-black tracking-[0.2em] transition-colors relative z-10"
                                                >
                                                    ОТКАЗ
                                                </button>
                                                {/* Progress bar timeline */}
                                                <motion.div 
                                                    initial={{ width: `${initialPercentage}%` }}
                                                    animate={{ width: "0%" }}
                                                    transition={{ duration: remainingTime, ease: "linear" }}
                                                    className="absolute bottom-0 left-0 h-1 bg-[#ff0000]"
                                                />
                                            </motion.div>
                                        );
                                    }

                                    return (
                                        <motion.div 
                                            key={item.id}
                                            variants={itemVariants}
                                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                            layout
                                            className="bg-[#101010] border border-white/5 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row gap-6 relative group"
                                        >
                                            {/* Remove Button (Desktop Top-Right or Mobile Bottom) */}
                                            <button 
                                                onClick={() => initiateRemove(item.id)}
                                                className="absolute top-4 right-4 text-white/30 hover:text-[#ff0000] p-1 transition-colors z-10 hidden md:block"
                                                title="Премахни"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>

                                            {/* Image */}
                                            <Link 
                                                to={`/catalog/${item.slug}`}
                                                state={{ backgroundLocation: location }}
                                                className="w-full md:w-32 h-32 bg-black/50 border border-white/5 rounded-xl overflow-hidden shrink-0 flex items-center justify-center relative p-2 group/img hover:border-white/20 transition-colors"
                                            >
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-contain pointer-events-none select-none group-hover/img:scale-110 transition-transform duration-500" draggable={false} />
                                                ) : (
                                                    <div className="text-white/20 text-xs text-center px-4 uppercase tracking-widest font-black">НЯМА СНИМКА</div>
                                                )}
                                            </Link>

                                            {/* Details */}
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div className="pr-8">
                                                    <Link to={`/catalog/${item.slug}`} state={{ backgroundLocation: location }}>
                                                        <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-wider mb-1 line-clamp-2 md:line-clamp-1 hover:text-red-600 transition-colors">
                                                            {item.name}
                                                        </h3>
                                                    </Link>
                                                    {item.selectedSize && (
                                                      <p className="text-sm text-[#B0BEC5] uppercase tracking-widest font-medium mb-4">
                                                          {item.selectedSize}
                                                      </p>
                                                    )}
                                                </div>

                                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-auto border-t border-white/5 pt-4 md:border-0 md:pt-0">
                                                    
                                                    {/* Price details per unit */}
                                                    <div className="hidden md:block text-xs uppercase tracking-widest text-[#B0BEC5]">
                                                        Ед. Цена: <span className="text-white font-bold ml-1">{item.price.toFixed(2)} €</span>
                                                    </div>

                                                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full md:w-auto">
                                                        {/* Quantity Controls */}
                                                        <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-1 shrink-0">
                                                            <button 
                                                                onClick={() => decrease(item.id)}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-white hover:bg-white/10 hover:text-[#ff0000] transition-colors"
                                                            >
                                                                –
                                                            </button>
                                                            <input 
                                                                 type="text"
                                                                 inputMode="numeric"
                                                                 pattern="[0-9]*"
                                                                 value={item.quantity === 0 ? '' : String(item.quantity)}
                                                                 onChange={(e) => {
                                                                     const val = e.target.value.replace(/[^0-9]/g, '');
                                                                     if (val === '') {
                                                                         updateQuantity(item.id, 0); 
                                                                     } else {
                                                                         const parsed = parseInt(val, 10);
                                                                         if (!isNaN(parsed)) {
                                                                             updateQuantity(item.id, parsed);
                                                                         }
                                                                     }
                                                                 }}
                                                                 onBlur={() => {
                                                                     if (item.quantity < 1) updateQuantity(item.id, 1);
                                                                 }}
                                                                 className="w-8 bg-transparent text-center text-sm font-black text-white focus:outline-none"
                                                             />
                                                            <button 
                                                                onClick={() => increase(item.id)}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-white hover:bg-white/10 hover:text-[#ff0000] transition-colors"
                                                            >
                                                                +
                                                            </button>
                                                        </div>

                                                        {/* Total per item */}
                                                        <div className="text-right shrink-0">
                                                            <div className="text-xl font-black text-[#ff0000] tracking-wider drop-shadow-sm">
                                                                {(item.price * Math.max(1, item.quantity)).toFixed(2)} <span className="text-sm">€</span>
                                                            </div>
                                                        </div>

                                                        {/* Mobile Remove Button */}
                                                        <button 
                                                            onClick={() => initiateRemove(item.id)}
                                                            className="md:hidden text-[10px] text-white/40 hover:text-[#ff0000] uppercase tracking-[0.1em] transition-colors underline decoration-white/20 underline-offset-4"
                                                        >
                                                            Премахни
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>
                    </div>

                    {/* Right Column - Summary */}
                    <div className="lg:col-span-4">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-[#101010] border border-white/5 rounded-3xl p-6 md:p-8 sticky top-24 shadow-2xl"
                        >
                            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
                                Обобщение
                            </h2>

                            <DiscountProgress subtotal={subtotal} />

                            <div className="space-y-4 mb-6 text-sm">
                                <div className="flex justify-between items-center text-[#B0BEC5]">
                                    <span className="uppercase tracking-widest font-medium">Междинна Сума</span>
                                    <span className="text-gray-400 line-through decoration-red-500/50">{subtotal.toFixed(2)} €</span>
                                </div>
                                
                                {discountPercentage > 0 && (
                                    <div className="flex justify-between items-center text-[#B0BEC5]">
                                        <span className="uppercase tracking-widest font-medium">Отстъпка (-{discountPercentage}%)</span>
                                        <span className="text-[#ff0000] font-black">-{ (subtotal - total).toFixed(2) } €</span>
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-center text-[#B0BEC5]">
                                    <span className="uppercase tracking-widest font-medium">Доставка</span>
                                    {isFreeShipping ? (
                                        <span className="text-green-500 font-black uppercase">Безплатна</span>
                                    ) : (
                                        <span className="text-gray-400 italic">Калкулира се при изпращане</span>
                                    )}
                                </div>

                                {!isFreeShipping && (
                                    <div className="mt-4 p-4 rounded-xl bg-red-600/5 border border-red-600/10">
                                        <div className="flex justify-between items-end mb-2">
                                            <div className="flex flex-col">
                                                 <span className="text-[10px] text-red-500 font-black uppercase tracking-widest">До безплатна доставка</span>
                                                 <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Още {(amountToFreeShipping * 1.95583).toFixed(2)} лв.</span>
                                            </div>
                                            <Truck className="w-4 h-4 text-red-600 mb-0.5" />
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((total / (total + amountToFreeShipping)) * 100, 100)}%` }}
                                                className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                                            />
                                        </div>
                                    </div>
                                )}
                                
                                {isFreeShipping && (
                                    <div className="mt-4 p-4 rounded-xl bg-green-500/5 border border-green-500/10 flex items-center gap-3">
                                        <Truck className="w-5 h-5 text-green-500" />
                                        <span className="text-[10px] text-green-500 font-black uppercase tracking-widest leading-none">Честито! Кошницата ви е с безплатна доставка!</span>
                                    </div>
                                )}

                                { /* Delivery tip removed */ }
                            </div>

                            <div className="border-t border-white/10 pt-6 mb-8 flex justify-between items-end">
                                <span className="text-xs uppercase tracking-[0.2em] text-white font-bold">ОБЩО ЗА ПЛАЩАНЕ</span>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-[#ff0000] tracking-wider drop-shadow-md">
                                            {total.toFixed(2)}
                                        </span>
                                        <span className="text-xl font-black text-[#ff0000]">€</span>
                                    </div>
                                    <div className="text-xs text-zinc-500 font-bold opacity-70">
                                        ≈ {(total * 1.95583).toFixed(2)} лв.
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleCheckout}
                                className="w-full flex justify-center py-5 bg-gradient-to-r from-[#3d0000] to-[#950101] text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl hover:from-[#950101] hover:to-[#ff0000] transition-all shadow-[0_5px_25px_rgba(255,0,0,0.25)] hover:shadow-[0_5px_30px_rgba(255,0,0,0.4)] focus:scale-[0.98] active:scale-[0.98] border border-red-500/20"
                            >
                                ПОРЪЧАЙ СЕГА
                            </button>

                            {/* Trust badges */}
                            <div className="mt-8 space-y-4 border-t border-white/5 pt-6">
                                <div className="flex items-center gap-3 text-white/50 text-xs">
                                    <Shield className="w-4 h-4 text-green-500 shrink-0" />
                                    <span className="uppercase tracking-widest">Сигурно плащане при доставка</span>
                                </div>
                                <div className="flex items-center gap-3 text-white/50 text-xs">
                                    <Truck className="w-4 h-4 text-blue-400 shrink-0" />
                                    <span className="uppercase tracking-widest">Бърза доставка с Еконт / Спиди</span>
                                </div>
                                <div className="flex items-center gap-3 text-white/50 text-xs">
                                    <Package className="w-4 h-4 text-orange-400 shrink-0" />
                                    <span className="uppercase tracking-widest">Включен преглед преди плащане</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
                
                <div className="mt-12">
                   <ErrorStateCard />
                </div>
            </div>
        </div>
    );
};

export default CartPage;
