import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import ProductCard from "../components/ProductCard";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useAuth } from "../context/AuthContext";
import ProductQuickView from "../components/ProductQuickView";
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

const individualProjects = [
  {
    slug: "ind1",
    nameBg: "Индивидуален Дизайн",
    avatar: "https://res.cloudinary.com/die68h4oh/image/upload/v1772385577/Indvidual/Indvidual/1_1.jpg",
  },
  {
    slug: "ind2",
    nameBg: "Индивидуален Дизайн",
    avatar: "https://res.cloudinary.com/die68h4oh/image/upload/v1772385583/Indvidual/Indvidual/1_2.jpg",
  },
  {
    slug: "ind3",
    nameBg: "Индивидуален Дизайн",
    avatar: "https://res.cloudinary.com/die68h4oh/image/upload/v1772385587/Indvidual/Indvidual/Extreme_closeup_macro_photo_of_a_glossy_vinyl_stic_delpmaspu.jpg",
  },
  {
    slug: "ind4",
    nameBg: "Индивидуален Дизайн",
    avatar: "https://res.cloudinary.com/die68h4oh/image/upload/v1772385604/Indvidual/Indvidual/Large_bold_3d_text_in_the_center_written_in_bulgar_delpmaspu.jpg",
  },
  {
    slug: "ind5",
    nameBg: "Индивидуален Дизайн",
    avatar: "https://res.cloudinary.com/die68h4oh/image/upload/v1772385644/Indvidual/Indvidual/Modern_cartoon_illustration_of_a_stylish_girl_in_s_delpmaspu_1.jpg",
  },
  {
    slug: "ind6",
    nameBg: "Индивидуален Дизайн",
    avatar: "https://res.cloudinary.com/die68h4oh/image/upload/v1772385692/Indvidual/Indvidual/Modern_cartoon_illustration_of_a_stylish_girl_in_s_delpmaspu.jpg",
  },
  {
    slug: "ind7",
    nameBg: "Индивидуален Дизайн",
    avatar: "https://res.cloudinary.com/die68h4oh/image/upload/v1772385726/Indvidual/Indvidual/Ultra_realistic_photo_of_a_silver_laptop_on_a_clea_delpmaspu.jpg",
  },
  {
    slug: "ind8",
    nameBg: "Индивидуален Дизайн",
    avatar: "https://res.cloudinary.com/die68h4oh/image/upload/v1772385757/Indvidual/Indvidual/Ultra_realistic_photo_of_a_single_car_decal_sticke_delpmaspu_1.jpg",
  },
  {
    slug: "ind9",
    nameBg: "Индивидуален Дизайн",
    avatar: "https://res.cloudinary.com/die68h4oh/image/upload/v1772385783/Indvidual/Indvidual/Ultra_realistic_photo_of_a_single_car_decal_sticke_delpmaspu.jpg",
  },
  {
    slug: "ind10",
    nameBg: "Индивидуален Дизайн",
    avatar: "https://res.cloudinary.com/die68h4oh/image/upload/v1772385789/Indvidual/Indvidual/Whisk_396f4f54e4ca271baed4c6be1a59430cdr.jpg",
  },
];

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
  const carouselRef = useRef<HTMLDivElement>(null);

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
      setCurrentPremiumIndex((prev) => {
        setIsSlideAnimating(true);
        setTimeout(() => setIsSlideAnimating(false), 1000);
        return (prev + 1) % individualProjects.length;
      });
    }, 4500); // 4.5s per slide
  }, []);

  useEffect(() => {
    startSlideTimer();
    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, [startSlideTimer]);

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
    <div>
      {/* Static Hero Section */}
      <div className="relative min-h-[100svh] flex items-center justify-center text-center overflow-hidden">
        {/* Background Hero Media */}
        <div className="absolute inset-0 z-0">
          {/* Fallback Premium Background */}
          <div
            className={`absolute inset-0 transition-opacity duration-1000 ${mediaLoaded ? "opacity-0" : "opacity-100"} bg-gradient-to-br from-gray-900 via-black to-[#1a0000]`}
          >
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: mediaLoaded ? 1 : 0 }}
            transition={{ duration: 1.5 }}
            className="w-full h-full"
          >
            {siteSettings.hero_media_type === "video" ? (
              <video
                key={siteSettings.hero_media_url}
                src={siteSettings.hero_media_url}
                autoPlay
                loop
                muted
                playsInline
                onLoadedData={() => setMediaLoaded(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={getOptimizedUrl(siteSettings.hero_media_url, { width: 1920 })}
                alt=""
                onLoad={() => setMediaLoaded(true)}
                className="w-full h-full object-cover"
                decoding="async"
                fetchPriority="high"
              />
            )}
          </motion.div>

          {/* Dark Overlay 1: Soft Black Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/75 z-10" />
          
          {/* Dark Overlay 2: Vignette effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] z-10" />
        </div>

        {/* Hero Content */}
        <div className="container relative z-20 mx-auto px-4 sm:px-6 lg:px-10 max-w-[1100px] flex flex-col items-center justify-center w-full mt-16 sm:mt-0">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="w-full flex flex-col items-center justify-center"
          >
            {/* Title */}
            <motion.h1
              variants={fadeInUp}
              className="w-full text-center font-black uppercase leading-none tracking-tight mb-8 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
              style={{ fontSize: "clamp(3.5rem, 12vw, 10rem)" }}
            >
              <span className="text-white drop-shadow-md">CAR</span>
              <span className="text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                DECAL
              </span>
            </motion.h1>

            {/* Subtitle Badge */}
            <motion.div
              variants={fadeInUp}
              className="w-full max-w-[720px] mx-auto mb-12 flex flex-col items-center justify-center"
            >
              <div className="backdrop-blur-md bg-black/25 border border-white/10 rounded-2xl py-3 px-6 sm:px-10 flex flex-col items-center justify-center shadow-2xl">
                <span className="text-gray-200 text-[11px] sm:text-sm uppercase tracking-[0.25em] sm:tracking-[0.3em] font-bold mb-1.5 text-center">
                  Висококачествени стикери
                </span>
                <span className="text-red-500 font-semibold italic text-sm sm:text-lg tracking-widest text-center lowercase">
                  цени на едро
                </span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-[280px] sm:max-w-none mx-auto"
            >
              <Link
                to={`/catalog`}
                className="group relative flex items-center justify-center w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 bg-red-600 text-white font-bold uppercase tracking-[0.15em] text-[11px] sm:text-sm rounded-xl shadow-[0_4px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_30px_rgba(220,38,38,0.5)] hover:bg-red-500 hover:text-white transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
              >
                Пазарувай сега
              </Link>
              {user && (
                <Link
                  to={`/book-now`}
                  className="group relative flex items-center justify-center w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 bg-black/20 backdrop-blur-sm border border-white/20 text-white font-bold uppercase tracking-[0.15em] text-[11px] sm:text-sm rounded-xl hover:bg-white/10 hover:border-white/40 hover:text-white transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
                >
                  Индивидуални поръчки
                </Link>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Scanline Effect */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
            backgroundSize: "100% 2px, 3px 100%",
          }}
        ></div>
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
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 md:px-4 md:py-2 bg-black/60 border border-red-600/30 rounded-full w-max shadow-[0_5px_15px_rgba(255,0,0,0.1)]">
                  <svg
                    className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-red-500 text-[9px] md:text-[11px] font-black uppercase tracking-widest mt-0.5 whitespace-nowrap">
                    Оставащо Време:
                  </span>
                  <span className="text-white text-xs md:text-sm font-mono font-bold tracking-[0.2em] mt-0.5">
                    {String(timeLeft.hours).padStart(2, "0")}:
                    {String(timeLeft.minutes).padStart(2, "0")}:
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </motion.div>

            <Link
              to={`/catalog`}
              className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-600 hover:text-white transition-colors shrink-0 whitespace-nowrap"
            >
              Виж Всички Продукти <span className="text-lg mb-0.5">→</span>
            </Link>
          </div>

          <div className="relative">
            <div
              ref={carouselRef}
              className="flex md:grid md:grid-cols-4 gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-8 pt-2 -mx-6 px-6 md:mx-0 md:px-0"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                                .flex::-webkit-scrollbar { display: none; }
                            `,
                }}
              />

              {productsLoading ||
              (products.length > 0 && displayProducts.length === 0) ? (
                <div className="col-span-full text-center py-20 text-text-muted uppercase tracking-[0.2em] text-sm w-full">
                  Зареждане...
                </div>
              ) : displayProducts.length > 0 ? (
                displayProducts.map((product, index) => (
                  <motion.div
                    key={product.slug}
                    className="min-w-[75vw] sm:min-w-[300px] md:min-w-0 w-full flex-shrink-0 snap-center md:snap-align-none"
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <ProductCard product={product} isPriority={index < 4} />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-text-muted uppercase tracking-[0.2em] text-sm w-full">
                  Няма налични продукти.
                </div>
              )}
            </div>

            {/* Mobile right swipe indicator */}
            <div className="absolute right-0 sm:right-[-1.5rem] top-[40%] -translate-y-1/2 md:hidden flex items-center justify-end z-10 w-20 h-full pointer-events-none">
              <button
                onClick={() =>
                  carouselRef.current?.scrollBy({
                    left: window.innerWidth * 0.75,
                    behavior: "smooth",
                  })
                }
                className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-md border border-red-600/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.8)] focus:outline-none pointer-events-auto active:scale-95 transition-all hover:bg-black"
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

          <div className="mt-12 text-center md:hidden">
            <Link
              to={`/catalog`}
              className="btn-mobile-full inline-block px-8 py-3 border border-white/20 text-white text-xs uppercase tracking-widest"
            >
              Виж Всички Продукти
            </Link>
          </div>
        </div>
      </section>

      {/* Sticker Showcase Player */}
      <section className="py-24 bg-surface relative overflow-hidden">

        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
            Индивидуални <span className="text-red-600">Проекти</span>
          </h2>
          <p className="text-text-muted text-sm uppercase tracking-widest mb-12">
            Създайте собствен дизайн в няколко лесни стъпки
          </p>

          <div className="relative w-full max-w-6xl mx-auto aspect-video md:aspect-auto md:h-[550px] bg-[#0a0a0a] border border-white/10 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden group">
            <div className="flex w-full h-full items-center justify-center relative">
              {individualProjects.map((product, idx) => {
                const isCenter = idx === currentPremiumIndex;
                return (
                  <div
                    key={product.slug}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isCenter ? "opacity-100 z-30" : "opacity-0 z-10"} flex items-center justify-center`}
                  >
                    <img
                      src={getOptimizedUrl(product.avatar, { width: 1200 })}
                      alt={product.nameBg}
                      className="w-full h-full object-cover block"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  </div>
                );
              })}
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
