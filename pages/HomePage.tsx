import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Truck } from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useAuth } from "../context/AuthContext";
import ProductQuickView from "../components/ProductQuickViewModal";
import { getOptimizedUrl } from "../lib/cloudinary-utils";

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const HomePage: React.FC = () => {
  const { i18n } = useTranslation();
  const {
    getFeaturedProducts,
    loading: productsLoading,
    products,
  } = useProducts();
  const { settings: siteSettings, loading: settingsLoading } =
    useSiteSettings();
  const { user } = useAuth();

  const [displayProducts, setDisplayProducts] = useState<any[]>([]);
  const [individualProjects, setIndividualProjects] = useState<any[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchShowcase = async () => {
      const { data, error } = await supabase
        .from('showcase_projects')
        .select('id,title_bg,image_url,order_index')
        .order('order_index', { ascending: true });
      if (!error && data) {
        setIndividualProjects(data.map(item => ({
          slug: item.id,
          nameBg: item.title_bg || "Индивидуален Дизайн",
          avatar: item.image_url
        })));
      }
    };

    fetchShowcase();

    // Realtime subscription
    let debounceTimer: any;
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'showcase_projects'
        },
        () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(fetchShowcase, 300);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };

  }, []);



  const updateDailyProducts = useCallback(() => {
    if (!products || products.length === 0) return;

    const todayStr = new Date().toDateString();
    const storedData = localStorage.getItem("carDecalDailyPicks");

    let shouldPickNew = true;
    let pickedIds: string[] = [];

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (
          parsed.date === todayStr &&
          parsed.ids &&
          Array.isArray(parsed.ids)
        ) {
          shouldPickNew = false;
          pickedIds = parsed.ids;
        }
      } catch (e) {}
    }

    if (shouldPickNew) {
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 4);
      pickedIds = selected.map((p) => p.slug || p.id);
      localStorage.setItem(
        "carDecalDailyPicks",
        JSON.stringify({
          date: todayStr,
          ids: pickedIds,
        }),
      );
      setDisplayProducts(selected);
    } else {
      const selected = pickedIds
        .map((id) => products.find((p) => (p.slug || p.id) === id))
        .filter(Boolean);
      if (selected.length > 0) {
        // Prevent state update if nothing actually changed to avoid unnecessary re-renders
        setDisplayProducts((prev) => {
          const prevIds = prev.map((p) => p.slug || p.id).join(",");
          const newIds = selected.map((p) => p.slug || p.id).join(",");
          return prevIds === newIds ? prev : selected;
        });
      } else {
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        const newSelected = shuffled.slice(0, 4);
        setDisplayProducts(newSelected);
      }
    }
  }, [products]);

  useEffect(() => {
    updateDailyProducts();
  }, [updateDailyProducts]);

  // Timer logic
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calcTimeLeft = () => {
      const now = new Date();
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );
      const difference = tomorrow.getTime() - now.getTime();

      const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const m = Math.floor((difference / 1000 / 60) % 60);
      const s = Math.floor((difference / 1000) % 60);

      setTimeLeft({ hours: h, minutes: m, seconds: s });

      // Instantly check if midnight passed and update products
      const todayStr = now.toDateString();
      const storedData = localStorage.getItem("carDecalDailyPicks");
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          if (parsed.date !== todayStr) {
            updateDailyProducts(); // triggers refresh instantly
          }
        } catch (e) {}
      }
    };

    calcTimeLeft();
    const timerId = setInterval(calcTimeLeft, 1000);
    return () => clearInterval(timerId);
  }, [updateDailyProducts]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentPremiumIndex, setCurrentPremiumIndex] = useState(0);
  const [mediaLoaded, setMediaLoaded] = useState(false);

  const [isSlideAnimating, setIsSlideAnimating] = useState(false);
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startSlideTimer = useCallback(() => {
    if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    slideTimerRef.current = setInterval(() => {
      if (individualProjects.length === 0) return;
      setCurrentPremiumIndex((prev) => {
        setIsSlideAnimating(true);
        setTimeout(() => setIsSlideAnimating(false), 1000);
        return (prev + 1) % individualProjects.length;
      });
    }, 4500); 
  }, [individualProjects.length]);

  useEffect(() => {
    if (individualProjects.length > 0) {
      startSlideTimer();
    }
    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, [startSlideTimer, individualProjects.length]);

  useEffect(() => {
    if (individualProjects.length > 0 && currentPremiumIndex >= individualProjects.length) {
      setCurrentPremiumIndex(0);
    }
  }, [individualProjects.length, currentPremiumIndex]);


  const handleManualSlide = (index: number) => {
    if (isSlideAnimating || index === currentPremiumIndex) return;
    
    setCurrentPremiumIndex(index);
    setIsSlideAnimating(true);
    setTimeout(() => setIsSlideAnimating(false), 1000);
    
    // Reset timer so it doesn't immediately slide right after click
    startSlideTimer();
  };

  useEffect(() => {
    if (!displayProducts || displayProducts.length === 0) return;
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % displayProducts.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [displayProducts.length]);

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <div className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-black pt-[calc(env(safe-area-inset-top)+theme(spacing.4))] md:pt-0">
        {/* Background Overlay Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] z-10" />
          
          {siteSettings?.hero_media_url && siteSettings.hero_media_type === 'video' ? (
            <video
              key={siteSettings.hero_media_url}
              autoPlay
              muted
              loop
              playsInline
              onLoadedData={() => setMediaLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-1000 ${
                mediaLoaded ? "opacity-30" : "opacity-0"
              }`}
            >
              <source src={siteSettings.hero_media_url} type="video/mp4" />
            </video>
          ) : (
            <img
              key={siteSettings?.hero_media_url || 'default'}
              src={
                siteSettings?.hero_media_url
                  ? siteSettings.hero_media_url
                  : getOptimizedUrl(
                      "https://res.cloudinary.com/die68h4oh/image/upload/v1772385587/Indvidual/Indvidual/Extreme_closeup_macro_photo_of_a_glossy_vinyl_stic_delpmaspu.jpg",
                      { width: 1920 }
                    )
              }
              alt="Hero Background"
              onLoad={() => setMediaLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-1000 ${
                mediaLoaded ? "opacity-30" : "opacity-0"
              }`}
            />
          )}

          {/* Scanline Effect */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none z-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
              backgroundSize: "100% 2px, 3px 100%",
            }}
          />
        </div>

        <div className="container relative z-30 mx-auto px-6 h-full flex flex-col items-center justify-center text-center pt-8 md:pt-24 mt-[-20vh] sm:mt-[-15vh] md:mt-[-10vh] lg:mt-[-15vh]">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="w-full max-w-5xl flex flex-col items-center"
          >
            {/* Main Title - Single Line */}
            <motion.h1
              variants={fadeInUp}
              className="w-full text-center font-black uppercase tracking-[-0.03em] mb-4 drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-row items-center justify-center leading-none"
              style={{ fontSize: "clamp(42px, 13vw, 140px)" }}
            >
              <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">CAR</span>
              <span className="text-red-600 drop-shadow-[0_0_50px_rgba(220,38,38,0.6)]">DECAL</span>
            </motion.h1>

            {/* Subtitles */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center mb-10 sm:mb-12 px-2 w-full"
            >
              <p className="text-white/80 text-sm md:text-xl font-medium tracking-[0.2em] md:tracking-[0.3em] uppercase max-w-2xl mx-auto leading-relaxed drop-shadow-lg text-center font-sans">
                Безкомпромисно качество. <span className="text-white font-bold opacity-100">Уникален стил.</span>
              </p>
            </motion.div>

            {/* Minimal Quality Icons */}
            <motion.div 
              variants={fadeInUp}
              className="flex items-center justify-center gap-x-5 md:gap-x-8 mb-8 md:mb-12 opacity-80"
            >
              <div className="flex items-center gap-2 md:gap-2.5">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728L5.657 5.657" />
                </svg>
                <span className="text-[10px] md:text-[11px] text-white font-bold uppercase tracking-[0.1em] whitespace-nowrap">UV Защита</span>
              </div>
              <div className="flex items-center gap-2 md:gap-2.5">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-[10px] md:text-[11px] text-white font-bold uppercase tracking-[0.1em] whitespace-nowrap">Премиум</span>
              </div>
              <div className="flex items-center gap-2 md:gap-2.5">
                <Truck className="w-4 h-4 md:w-5 md:h-5 text-red-600 shrink-0" />
                <span className="text-[10px] md:text-[11px] text-white font-bold uppercase tracking-[0.1em] whitespace-nowrap">Бърза Доставка</span>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col md:flex-row gap-4 md:gap-6 justify-center items-center w-full max-w-[280px] md:max-w-none mx-auto"
            >
              <Link
                to="/catalog"
                className="group relative flex items-center justify-center w-full md:w-[280px] h-14 bg-red-600 text-white font-black uppercase tracking-[0.2em] text-[12px] md:text-[14px] rounded-lg border border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:bg-red-500 hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all duration-300 active:scale-95"
              >
                Разгледай Каталога
              </Link>

              {user && (
                <Link
                  to="/book-now"
                  className="group relative flex items-center justify-center w-full md:w-[280px] h-14 bg-black/40 backdrop-blur-md text-white/90 font-black uppercase tracking-[0.2em] text-[12px] md:text-[14px] rounded-lg border border-white/20 shadow-[0_5px_20px_rgba(0,0,0,0.5)] hover:bg-white/10 hover:text-white hover:border-white/40 transition-all duration-300 active:scale-95"
                >
                  Индивидуални Поръчки
                </Link>
              )}
            </motion.div>
          </motion.div>
        </div>


        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-20" />
      </div>



      {/* Featured Products */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 md:mb-16 gap-6 md:gap-0 text-center md:text-left">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="w-full flex flex-col items-center md:items-start"
            >
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-3 md:mb-2 text-center md:text-left">
                Избрани за <span className="text-red-600">Деня</span>
              </h2>
              <div className="flex flex-col md:flex-row items-center gap-4 mt-1 w-full text-center md:text-left justify-center md:justify-start">
                <p className="text-text-muted text-xs md:text-sm uppercase tracking-widest leading-relaxed max-w-sm md:max-w-none">
                  Специално подбрани стикери за теб днес
                </p>
                <div className="relative p-[1.5px] rounded-full overflow-hidden group shadow-[0_0_20px_rgba(220,38,38,0.15)] flex shrink-0 bg-white/5">
                  {/* Rotating Border Gradient (Beam Effect) */}
                  <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,rgba(239,68,68,0.2)_50%,#ef4444_90%,#ffffff_99.5%,transparent_100%)] opacity-100" />
                  
                  {/* Inner Dark Background */}
                  <div className="relative z-10 flex items-center gap-2 px-4 py-1.5 md:px-6 md:py-2.5 bg-[#050505] rounded-full w-max shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)]">
                    <svg
                      className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-red-500 text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] mt-0.5 whitespace-nowrap">
                      Оставащо Време:
                    </span>
                    <span className="text-white text-xs md:text-sm font-mono font-black tracking-[0.25em] mt-0.5" style={{ textShadow: "0 0 10px rgba(255,255,255,0.2)" }}>
                      {String(timeLeft.hours).padStart(2, "0")}:
                      {String(timeLeft.minutes).padStart(2, "0")}:
                      {String(timeLeft.seconds).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>


          </div>

          <div className="relative">
            <div
              ref={carouselRef}
              className="flex overflow-x-auto snap-x snap-mandatory gap-5 md:gap-8 pb-12 pt-4 no-scrollbar scroll-smooth"
            >

              {productsLoading ||
              (products.length > 0 && displayProducts.length === 0) ? (
                <div className="min-w-full text-center py-20 text-text-muted uppercase tracking-[0.2em] text-sm">
                  Зареждане...
                </div>
              ) : displayProducts.length > 0 ? (
                displayProducts.map((product, index) => (
                  <motion.div
                    key={product.slug}
                    className="flex-shrink-0 w-[85%] sm:w-[45%] md:w-[30%] lg:w-[23%] snap-center"
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <ProductCard product={product} isPriority={index < 4} />
                  </motion.div>
                ))
              ) : (
                <div className="min-w-full text-center py-20 text-text-muted uppercase tracking-[0.2em] text-sm">
                  Няма налични продукти.
                </div>
              )}
            </div>

            {/* Mobile right swipe indicator */}
            <div className="absolute right-0 top-[40%] -translate-y-1/2 flex items-center justify-end z-20 w-16 h-full pointer-events-none pr-2">
              <button
                onClick={() =>
                  carouselRef.current?.scrollBy({
                    left: 320,
                    behavior: "smooth",
                  })
                }
                className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-red-600/40 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.9)] focus:outline-none pointer-events-auto active:scale-90 transition-all hover:bg-black group/arrow"
              >
                <motion.div
                  animate={{ x: [-2, 5, -2] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.2,
                    ease: "easeInOut",
                  }}
                >
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </motion.div>
              </button>
            </div>
          </div>

          <div className="mt-8 flex justify-center w-full">
            <Link
              to={`/catalog`}
              className="inline-block px-12 py-4 border border-white/20 text-white font-bold text-[13px] uppercase tracking-[0.2em] hover:bg-white/5 hover:border-white/40 transition-all active:scale-95"
            >
              Виж Всички Продукти
            </Link>
          </div>
        </div>
      </section>

      {/* Sticker Showcase Player */}
      <section className="pt-20 pb-4 md:pt-24 md:pb-8 bg-surface relative overflow-hidden">

        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
            Индивидуални <span className="text-red-600">Проекти</span>
          </h2>
          <p className="text-text-muted text-sm uppercase tracking-widest mb-12">
            Създайте собствен дизайн в няколко лесни стъпки
          </p>

          <div className="relative w-full max-w-6xl mx-auto aspect-video md:aspect-auto md:h-[550px] border border-white/10 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.1)] flex items-center justify-center overflow-hidden group">
            <div className="flex w-full h-full items-center justify-center relative bg-black/20">
              <AnimatePresence>
                {individualProjects.length > 0 ? (
                  individualProjects.map((product, idx) => {
                    const isCenter = idx === currentPremiumIndex;
                    if (!isCenter) return null;
                    return (
                      <motion.div
                        key={product.slug}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 flex items-center justify-center z-30"
                      >
                        <img
                          src={getOptimizedUrl(product.avatar, { width: 1200 })}
                          alt={product.nameBg}
                          className="w-full h-full object-cover block"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Manual Navigation Controls - Invisible touch zones */}
            <div className="absolute inset-x-0 inset-y-10 z-30 flex">
              <button 
                onClick={() => handleManualSlide((currentPremiumIndex - 1 + individualProjects.length) % individualProjects.length)}
                className="w-1/4 h-full cursor-w-resize"
                aria-label="Previous project"
              />
              <button 
                onClick={() => handleManualSlide((currentPremiumIndex + 1) % individualProjects.length)}
                className="w-3/4 h-full cursor-e-resize"
                aria-label="Next project"
              />
            </div>

            {/* Indicators */}
            <div className="absolute bottom-6 flex gap-3 z-40">
              {individualProjects.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleManualSlide(idx)}
                  disabled={isSlideAnimating}
                  className={`h-2 rounded-full transition-all duration-500 cursor-pointer hover:bg-white ${idx === currentPremiumIndex ? "w-8 bg-red-600 shadow-[0_0_10px_rgba(230,0,0,0.8)]" : "w-2 bg-white/40"}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>


        </div>
      </section>
      {/* CTA Banner */}
      <div className="w-full bg-surface">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="w-full h-[40px] sm:h-[60px] md:h-[100px] block text-red-600"
        >
          <path fill="currentColor" d="M0,120 C480,0 960,0 1440,120 Z" />
        </svg>
      </div>
      <section className="pt-8 pb-20 md:pt-12 md:pb-24 bg-red-600 text-white text-center -mt-1 relative z-10">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 drop-shadow-[0_5px_15px_rgba(0,0,0,0.4)]">
            Нуждаете Се От Индивидуален Дизайн?
          </h2>
          <p className="max-w-2xl mx-auto text-white/95 font-medium mb-10 uppercase tracking-widest text-xs lg:text-sm drop-shadow-[0_2px_5px_rgba(0,0,0,0.3)]">
            Опишете вашата концепция, прикачете файл с дизайн и посочете
            желаните размери за изработка.
          </p>
          <Link
            to={`/book-now`}
            className="inline-flex items-center gap-2 px-10 sm:px-12 md:px-16 py-4 md:py-5 bg-black text-white font-bold uppercase tracking-widest text-xs md:text-sm shadow-[0_15px_30px_rgba(0,0,0,0.4)] hover:bg-white hover:text-black hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-all duration-300"
          >
            Изпрати Запитване
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
