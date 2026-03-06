import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useToast } from "../components/Toast/ToastProvider";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Announcement, AnnouncementTag, AnnouncementTitle } from "../components/ui/announcement";
import SEO from "../components/SEO";

const MaintenancePage: React.FC = () => {
  const { showToast } = useToast();
  const { settings, serverTimeOffset } = useSiteSettings();
  
  const [timeLeft, setTimeLeft] = useState<{
    d: number;
    h: number;
    m: number;
    s: number;
  } | null>(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(false);

  // Use values from context
  const title = settings.maintenance_title;
  const message = settings.maintenance_message;
  const endTime = settings.maintenance_end_time;
  const bgUrl = settings.maintenance_bg_url;
  const bgUrlMobile = settings.maintenance_bg_url_mobile;
  const logoUrl = settings.maintenance_logo_url;

  let parsedFeatures: string[] = [];
  try {
    const arr = JSON.parse(settings.maintenance_features || '[]');
    if (Array.isArray(arr)) parsedFeatures = arr;
  } catch (e) {}

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast("Моля, въведете вашия имейл.", "error");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("Моля, въведете валиден имейл адрес.", "error");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      showToast("Тази услуга е все още в разработка. Ще бъде достъпна скоро!", "info");
      setEmail("");
      setIsLoading(false);
      
      // Blur any active input to close mobile keyboard
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 800);
  };

  useEffect(() => {
    // Detect mobile keyboard close effect properly
    if (typeof window !== 'undefined' && window.visualViewport) {
      let isKeyboardOpen = false;

      const handleViewportResize = () => {
        const currentHeight = window.visualViewport?.height || window.innerHeight;
        const screenHeight = window.innerHeight;
        
        if (currentHeight < screenHeight * 0.8) {
          // Keyboard is fully open
          isKeyboardOpen = true;
        } else if (currentHeight > screenHeight * 0.9 && isKeyboardOpen) {
          // Keyboard was open, now closed
          isKeyboardOpen = false;
          if (
            document.activeElement instanceof HTMLInputElement ||
            document.activeElement instanceof HTMLTextAreaElement ||
            document.activeElement instanceof HTMLButtonElement
          ) {
            document.activeElement.blur();
          }
        }
      };

      window.visualViewport.addEventListener('resize', handleViewportResize);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportResize);
      };
    }
  }, []);

  useEffect(() => {
    if (!endTime) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const now = Date.now() + serverTimeOffset;
      const target = new Date(endTime).getTime();
      const distance = target - now;
      
      if (distance < 0) {
        setTimeLeft(null);
        return false;
      }
      
      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000)
      });
      return true;
    };

    calculateTimeLeft();
    const timer = setInterval(() => {
      const isActive = calculateTimeLeft();
      if (!isActive) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div className="fixed inset-0 z-[99999] bg-[#000] overflow-y-auto">
      <SEO title="Профилактика" />
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <picture>
          <source media="(max-width: 768px)" srcSet={bgUrlMobile || bgUrl} />
          <img
            key={bgUrl}
            src={bgUrl}
            alt="Maintenance"
            className="w-full h-full object-cover opacity-60 pointer-events-none select-none"
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
          />
        </picture>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 min-h-[100dvh] container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-full flex flex-col lg:grid lg:grid-cols-[1fr,1px,1fr] gap-10 lg:gap-0 lg:items-center">
          {/* Mobile Only: Brand & Status (Top) */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex lg:hidden flex-col items-center text-center w-full order-1"
          >
            <div className="w-40 sm:w-48 mb-6 overflow-hidden">
              <img
                key={logoUrl}
                src={logoUrl}
                alt="Logo"
                className="w-full h-auto object-contain brightness-0 invert pointer-events-none select-none"
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
            <h1 className="text-4xl sm:text-5xl font-sans font-black text-white mb-4 tracking-tight uppercase leading-none break-words whitespace-pre-wrap">
              {title}
            </h1>
            <p className="max-w-md text-white/80 text-sm leading-relaxed font-light mb-2">
              {message ||
                "Нашият сайт е в процес на профилактика. Очаквайте ни скоро с новия ни страхотен сайт."}
            </p>
          </motion.div>

          {/* Left Side: Features (Mobile) / Brand & Status & Features (Desktop) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center lg:items-end lg:pr-16 xl:pr-20 text-center lg:text-right w-full order-3 lg:order-1"
          >
            {/* Desktop Only: Brand & Status */}
            <div className="hidden lg:flex flex-col lg:items-end w-full">
            <div className="w-40 sm:w-48 lg:w-64 mb-6 lg:mb-10 overflow-hidden">
              <img
                key={logoUrl}
                src={logoUrl}
                alt="Logo"
                className="w-full h-auto object-contain brightness-0 invert pointer-events-none select-none"
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-sans font-black text-white mb-4 lg:mb-6 tracking-tight uppercase leading-none break-words whitespace-pre-wrap">
              {title}
            </h1>
            <p className="max-w-md text-white/80 text-sm lg:text-base leading-relaxed font-light">
              {message ||
                "Нашият сайт е в процес на профилактика. Очаквайте ни скоро с новия ни страхотен сайт."}
            </p>
            </div>

          </motion.div>

          {/* Vertical Divider */}
          <div className="hidden lg:block w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent self-stretch order-none lg:order-2" />

          {/* Right Side: Interaction & Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center lg:items-start lg:pl-16 xl:pl-20 text-center lg:text-left w-full mt-4 lg:mt-0 order-2 lg:order-3"
          >
            <span className="text-white/60 text-xs lg:text-sm uppercase tracking-[0.2em] mb-4 lg:mb-6">
              Профилактиката приключва след:
            </span>

            {/* Countdown Grid */}
            <div className="flex gap-3 sm:gap-4 mb-8 lg:mb-12">
              {[
                { label: 'Дни', val: timeLeft?.d ?? 0 },
                { label: 'Часа', val: timeLeft?.h ?? 0 },
                { label: 'Минути', val: timeLeft?.m ?? 0 },
                { label: 'Секунди', val: timeLeft?.s ?? 0 }
              ].map((unit, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 border border-white/20 rounded-xl flex items-center justify-center mb-2 backdrop-blur-xl bg-white/5 shadow-2xl relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      {timeLeft ? (
                        <motion.span 
                          key="value"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tabular-nums relative z-10"
                        >
                          {String(unit.val).padStart(2, '0')}
                        </motion.span>
                      ) : (
                        <motion.div 
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="w-6 sm:w-8 h-1 bg-white/20 rounded-full animate-pulse"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="text-[10px] uppercase text-white/40 tracking-widest font-medium">{unit.label}</span>
                </div>
              ))}
            </div>

            {/* Newsletter */}
            <div className="w-full max-w-md mb-10 lg:mb-12">
              <p className="text-white/60 text-[10px] sm:text-xs lg:text-sm mb-3 lg:mb-4 uppercase tracking-wider">
                Абонирайте се за ексклузивни оферти
              </p>
              <form onSubmit={handleNotify} className="flex flex-col sm:flex-row w-full gap-2 sm:gap-0">
                <input 
                  type="email" 
                  name="subscribe_email"
                  autoComplete="off"
                  placeholder="Вашият имейл адрес"
                  className="flex-1 w-full bg-white px-4 py-3 text-black text-sm outline-none rounded-sm sm:rounded-r-none transition-all focus:bg-white/90"
                  value={email}
                  disabled={isLoading}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={(e) => {
                    setIsFeaturesExpanded(false);
                    const target = e.target;
                    setTimeout(() => {
                      try {
                        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      } catch (err) {}
                    }, 450); // Increased slightly to ensure keyboard is fully deployed
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                />
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="bg-black/80 hover:bg-black w-full sm:w-auto text-white px-6 py-3 text-[10px] sm:text-xs justify-center uppercase font-bold tracking-widest border border-white/20 transition-all rounded-sm sm:rounded-l-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Изчакайте...
                    </>
                  ) : 'Извести ме'}
                </button>
              </form>
            </div>

            {/* Expandable Features */}
            {parsedFeatures.length > 0 && (
              <div className="w-full max-w-md flex flex-col items-center lg:items-start mt-2 mb-6 lg:mb-10">
                <Announcement 
                  onClick={() => setIsFeaturesExpanded(!isFeaturesExpanded)}
                  className="w-full select-none active:scale-[0.98]"
                >
                  <AnnouncementTag>Новости</AnnouncementTag>
                  <AnnouncementTitle className="flex-1 justify-center lg:justify-start relative pr-6">
                    Вижте какво сме подготвили
                    <span className="absolute right-0 top-1/2 -translate-y-1/2">
                      {isFeaturesExpanded ? <ChevronUp size={16} className="text-white/60" /> : <ChevronDown size={16} className="text-white/60" />}
                    </span>
                  </AnnouncementTitle>
                </Announcement>

                <AnimatePresence>
                  {isFeaturesExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full overflow-hidden"
                    >
                      <div className="pt-4 pb-2 space-y-3">
                        {parsedFeatures.map((f, i) => (
                          <div key={i} className="flex items-center gap-3 bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-xl hover:bg-[#111] transition-all">
                            <div className="shrink-0 w-6 h-6 rounded-full bg-red-600/20 border border-red-500/50 flex items-center justify-center">
                              <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-white text-[13px] font-semibold leading-snug text-left flex-1" style={{ letterSpacing: '0.01em' }}>
                              {f}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Socials */}
            <div className="flex flex-col lg:items-start items-center relative mb-4">
              <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-4">
                Свържете се с нас
              </span>
              <div className="flex gap-4">
                {[
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>,
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>,
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.412.558.217.957.477 1.376.896.419.419.679.818.896 1.376.163.422.358 1.057.412 2.227.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.249 1.805-.412 2.227-.217.558-.477.957-.896 1.376-.419.419-.818.679-1.376.896-.422.163-1.057.358-2.227.412-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.805-.249-2.227-.412-.558-.217-.957-.477-1.376-.896-.419-.419-.679-.818-.896-1.376-.163-.422-.358-1.057-.412-2.227-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.054-1.17.249-1.805.412-2.227.217-.558.477-.957.896-1.376.419-.419.818-.679 1.376-.896.422-.163 1.057-.358 2.227-.412 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.277.057-2.15.26-2.914.557-.79.306-1.459.717-2.126 1.384-.667.667-1.078 1.336-1.384 2.126-.297.764-.5 1.637-.557 2.914-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.057 1.277.26 2.15.557 2.914.306.79.717 1.459 1.384 2.126.667.667 1.336 1.078 2.126 1.384.764.297 1.637.5 2.914.557 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.277-.057 2.15-.26 2.914-.557.79-.306 1.459-.717 2.126-1.384.667-.667 1.078-1.336 1.384-2.126.297-.764.5-1.637.557-2.914.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.057-1.277-.26-2.15-.557-2.914-.306-.79-.717-1.459-1.384-2.126-.667-.667-1.336-1.078-2.126-1.384-.764-.297-1.637-.5-2.914-.557-1.28-.058-1.688-.072-4.947-.072zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>,
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" /></svg>,
                ].map((icon, i) => (
                  <button
                    key={i}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/10"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
