import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2, ArrowDownWideNarrow } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { useNavigate, Link } from 'react-router-dom';
import { DiscountProgress } from './DiscountProgress';
import { useAuth } from '../context/AuthContext';

export const CartDrawer: React.FC = () => {
  const { isCartOpen, setIsCartOpen } = useUI();
  const { 
    items, 
    activeItems, 
    subtotal, 
    discountPercentage, 
    total, 
    increase, 
    decrease, 
    updateQuantity, 
    initiateRemove, 
    cancelRemove,
    clearCart
  } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sortBy, setSortBy] = React.useState<'none' | 'price' | 'qty'>('none');
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  // Handle Cart Drawer (Body Scroll Lock & Back Button)
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Push state for back button handling
      window.history.pushState({ modal: 'cart-drawer' }, '');
      
      const handlePopState = () => {
        // When back button is pressed, close the cart
        setIsCartOpen(false);
      };

      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      };
    }
  }, [isCartOpen, setIsCartOpen]);

  const handleCloseCart = () => {
    setIsCartOpen(false);
    setIsFilterOpen(false);
    // If we still have our custom state in history, go back to remove it
    if (window.history.state?.modal === 'cart-drawer') {
      window.history.back();
    }
  };

  const close = handleCloseCart;

  const handleCheckout = () => {
    if (user) {
      navigate('/checkout');
    } else {
      navigate('/login?redirect=/checkout');
    }
    handleCloseCart();
  };

  const toggleSort = () => {
    setSortBy(prev => {
      if (prev === 'none') return 'price';
      if (prev === 'price') return 'qty';
      return 'none';
    });
  };

  const sortedItems = React.useMemo(() => {
    let list = [...items];
    
    // Sort
    if (sortBy === 'price') {
      list.sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity));
    } else if (sortBy === 'qty') {
      list.sort((a, b) => b.quantity - a.quantity);
    }
    
    return list;
  }, [items, sortBy]);

  const ClearConfirmModal = () => (
    <AnimatePresence>
      {showClearConfirm && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowClearConfirm(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-[#0d0d0d] border border-white/10 rounded-[2rem] p-8 w-full max-w-[280px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center"
          >
            <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="text-red-600 w-8 h-8" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3 leading-tight">
              Изчистване на количката?
            </h3>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-8 leading-relaxed">
              Сигурни ли сте, че искате да премахнете всички артикули?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                }}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg active:scale-95 shadow-red-600/20"
              >
                ДА, ИЗЧИСТИ
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95"
              >
                ОТКАЗ
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[130] touch-none"
            onClick={close}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 220, damping: 25 }}
            className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-[#0a0a0a] z-[140] border-l border-white/5 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-20 border-b border-white/5 bg-background/60 backdrop-blur-md shrink-0 shadow-sm relative">
              <h2 className="text-xl uppercase tracking-[0.15em] font-bold text-white flex items-center gap-2">
                КОЛИЧКА
                {items.length > 0 && (
                  <span className="bg-[#ff0000] text-white text-[10px] font-black px-2 py-0.5 rounded-full tracking-widest leading-tight -translate-y-2">
                    {items.length}
                  </span>
                )}
              </h2>
              
              <div className="flex items-center gap-1 -mr-2">
                {items.length > 0 && (
                  <>
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-red-500 transition-colors focus:outline-none"
                      title="Изчисти количката"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className={`w-10 h-10 flex items-center justify-center transition-all ${isFilterOpen ? 'text-red-500 bg-red-600/10 rounded-full' : 'text-zinc-500 hover:text-white'}`}
                      title="Филтриране и подредба"
                    >
                      <ArrowDownWideNarrow size={20} />
                    </button>
                  </>
                )}
                <button
                  onClick={close}
                  className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white transition-colors focus:outline-none"
                  aria-label="Close cart"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
              {/* Sorting Panel */}
              <AnimatePresence>
                {isFilterOpen && items.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    style={{ originY: 0 }}
                    className="absolute inset-x-0 top-0 bg-[#0d0d0d] border-b border-white/5 z-20 px-6 py-8 shadow-xl"
                  >
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block ml-1">Подредба по:</label>
                       <div className="flex gap-4">
                          <button
                            onClick={() => setSortBy('price')}
                            className={`flex-1 h-14 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'price' ? 'bg-red-600 text-white border-red-600 shadow-[0_8px_20px_rgba(220,38,38,0.2)]' : 'bg-black border-white/5 text-zinc-500'}`}
                          >
                             НАЙ-ВИСОКА ЦЕНА
                          </button>
                          <button
                            onClick={() => setSortBy('qty')}
                            className={`flex-1 h-14 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'qty' ? 'bg-red-600 text-white border-red-600 shadow-[0_8px_20px_rgba(220,38,38,0.2)]' : 'bg-black border-white/5 text-zinc-500'}`}
                          >
                             НАЙ-ГОЛЯМ БРОЙ
                          </button>
                       </div>
                       {sortBy !== 'none' && (
                          <button 
                             onClick={() => setSortBy('none')}
                             className="w-full py-3 text-[9px] font-black tracking-widest uppercase text-zinc-500 hover:text-white transition-colors"
                          >
                             ОТМЕНИ ПОДРЕДБАТА
                          </button>
                       )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Items List */}
              <div className={`flex-1 overflow-y-auto px-6 py-6 space-y-4 ${items.length === 0 ? 'flex flex-col items-center justify-center' : ''}`}>
                {items.length === 0 ? (
                  <div className="flex flex-col items-center text-center">
                    <span className="mb-6 opacity-80 inline-block">
                      <svg viewBox="0 0 129.88 129.88" className="w-20 h-20">
                        <defs>
                          <linearGradient id="cart-drawer-gradient" x1="21.08" x2="108.88" y1="90.47" y2="39.78" gradientUnits="userSpaceOnUse">
                            <stop offset="0.02" stopColor="red" />
                            <stop offset="1" stopColor="#9e005d" />
                          </linearGradient>
                        </defs>
                        <g>
                          <path d="M86.37,14.44H43.59a13.65,13.65,0,0,0-11.82,6.82L10.38,58.31a13.67,13.67,0,0,0,0,13.64L31.77,109a13.65,13.65,0,0,0,11.82,6.82H86.37A13.63,13.63,0,0,0,98.18,109l21.4-37a13.67,13.67,0,0,0,0-13.64l-21.4-37A13.63,13.63,0,0,0,86.37,14.44Z" fill="url(#cart-drawer-gradient)" />
                          <path d="M62.32,91.8a5.08,5.08,0,1,1-5.08-5.08A5.08,5.08,0,0,1,62.32,91.8Z" fill="none" stroke="#fff" strokeWidth="4.6" strokeLinejoin="round" />
                          <path d="M82.53,91.8a5.08,5.08,0,1,1-5.08-5.08A5.08,5.08,0,0,1,82.53,91.8Z" fill="none" stroke="#fff" strokeWidth="4.6" strokeLinejoin="round" />
                          <polyline points="34.12 40.87 44.55 40.87 52.15 75.69 48.62 80.81 87.92 80.81" fill="none" stroke="#fff" strokeWidth="4.6" strokeLinejoin="round" strokeLinecap="round" />
                          <polygon points="88.56 68.62 51.62 71.62 46.14 43.87 88.56 43.87 88.56 68.62" fill="none" stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
                          <line x1="55.59" y1="51.36" x2="80.24" y2="51.36" fill="none" stroke="#fff" strokeWidth="4.6" strokeLinejoin="round" strokeLinecap="round" />
                        </g>
                      </svg>
                    </span>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#B0BEC5] mb-8 font-medium">
                      Нямате добавени артикули
                    </p>
                    <button
                      onClick={() => { navigate('/catalog'); close(); }}
                      className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.25em] bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10"
                    >
                      КЪМ КАТАЛОГА
                    </button>
                  </div>
                ) : (
                  sortedItems.map(item => {
                    if (item.isRemoving) {
                      const elapsed = item.removeInitiatedAt ? Date.now() - item.removeInitiatedAt : 0;
                      const remainingTime = Math.max(0, 5000 - elapsed) / 1000;
                      const initialPercentage = (remainingTime / 5) * 100;

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col gap-2 p-4 rounded-xl bg-[#1a0505] border border-[#ff0000]/20 relative overflow-hidden h-[106px] justify-center items-center"
                        >
                           <p className="text-white text-[11px] tracking-widest uppercase font-bold text-center relative z-10 w-full drop-shadow-md">
                              Артикулът е премахнат
                           </p>
                           <button 
                              onClick={() => cancelRemove(item.id)}
                              className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-white text-[10px] uppercase font-black tracking-[0.2em] transition-colors relative z-10 mt-1"
                           >
                              ОТКАЗ
                           </button>
                           <motion.div 
                              initial={{ width: `${initialPercentage}%` }}
                              animate={{ width: "0%" }}
                              transition={{ duration: remainingTime, ease: "linear" }}
                              className="absolute bottom-0 left-0 h-1 bg-[#ff0000]"
                           />
                        </div>
                      );
                    }

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-4 p-4 rounded-xl bg-[#101010] border border-white/5 relative group/item"
                      >
                        <div className="flex gap-4">
                          <Link 
                            to={`/catalog/${item.slug}`} 
                            onClick={() => setIsCartOpen(false)}
                            className="flex gap-4 flex-1 min-w-0"
                          >
                            <img
                              src={item.image || '/placeholder-image.jpg'}
                              alt={item.name}
                              className="w-[72px] h-[72px] rounded-lg object-contain bg-black/40 border border-white/10 shrink-0 p-1 pointer-events-none select-none group-hover/item:border-white/20 transition-colors"
                              draggable={false}
                            />
                            <div className="flex flex-col flex-1 text-sm justify-between min-w-0">
                              <div className="min-w-0">
                                <p className="text-white font-bold truncate tracking-wider text-xs uppercase mb-1 drop-shadow-sm group-hover/item:text-red-500 transition-colors">
                                  {item.name}
                                </p>
                                  <div className="flex items-center gap-1.5 overflow-hidden text-[#B0BEC5]">
                                    {(item.variant || item.selectedSize) && (
                                      <p className="text-[11px] uppercase tracking-wider truncate font-medium">
                                        {[item.variant, item.selectedSize].filter(Boolean).join(' / ')}
                                      </p>
                                    )}
                                  </div>
                              </div>
                            </div>
                          </Link>
                          
                          <button
                            onClick={() => initiateRemove(item.id)}
                            className="text-[#B0BEC5] hover:text-[#ff0000] transition-colors p-1 -mt-1 -mr-1 z-10 shrink-0"
                            title="Премахни"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-lg p-0.5">
                            <button
                              onClick={() => decrease(item.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-white/80 hover:bg-white/10 hover:text-white transition-colors"
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
                              className="w-10 bg-transparent text-center text-[13px] font-black text-white focus:outline-none pointer-events-auto"
                            />
                            <button
                              onClick={() => increase(item.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              +
                            </button>
                          </div>

                          <span className="text-sm text-[#ff0000] font-black whitespace-nowrap drop-shadow-sm tracking-wide">
                              {(item.price * Math.max(1, item.quantity)).toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Summary + Actions */}
            {items.length > 0 && (
              <div className="p-6 border-t border-white/5 bg-gradient-to-t from-black to-[#050505] shrink-0">
                <DiscountProgress subtotal={subtotal} />

                {discountPercentage > 0 && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#B0BEC5] uppercase tracking-[0.2em] font-medium">
                      Сума:
                    </span>
                    <span className="text-sm text-[#B0BEC5] line-through decoration-[#ff0000]/60 font-medium tracking-wider">
                      {subtotal.toFixed(2)} €
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs text-[#B0BEC5] uppercase tracking-[0.2em] font-medium">
                    {discountPercentage > 0 ? 'Общо с отстъпка:' : 'Междинна сума:'}
                  </span>
                  <span className="text-xl text-white font-black tracking-wider drop-shadow-md">
                    {total.toFixed(2)} €
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleCheckout}
                    className="w-full flex items-center justify-center px-4 py-4 md:py-5 text-[11px] font-black uppercase tracking-[0.25em] bg-gradient-to-r from-[#3d0000] to-[#950101] border border-[#ff0000]/30 text-white rounded-xl text-center shadow-[0_4px_20px_rgba(255,0,0,0.25)] hover:from-[#950101] hover:to-[#ff0000] focus:scale-[0.98] active:scale-[0.98] transition-all"
                  >
                    ПОРЪЧАЙ
                  </button>
                </div>
              </div>
            )}
            
            <ClearConfirmModal />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
