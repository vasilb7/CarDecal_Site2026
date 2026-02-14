import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, ChevronRight, X, Trophy } from "lucide-react";

const PhotoshootBanner: React.FC = () => {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  const handleAction = () => {
    navigate(`/${lang || "bg"}/blog`);
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="relative pattern-photoshoot border-b border-gold-accent/20 overflow-hidden z-[110]"
    >
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 relative z-10">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="relative shrink-0 hidden xs:block">
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-gold-accent" />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1"
            >
              <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gold-accent fill-gold-accent" />
            </motion.div>
          </div>
          <span className="text-white font-bold text-[10px] sm:text-sm md:text-base uppercase tracking-wider sm:tracking-[0.2em] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
            {t("photoshoot.promo_text")}
          </span>
          <Trophy className="w-4 h-4 text-gold-accent fill-gold-accent shrink-0 hidden xs:block" />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={handleAction}
            className="bg-gold-accent text-black px-3 sm:px-4 py-1.5 rounded-sm text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center gap-1 group whitespace-nowrap"
          >
            <span className="hidden xs:inline">{t("photoshoot.view")}</span>
            <span className="xs:hidden">ОЩЕ</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="text-white/50 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PhotoshootBanner;
