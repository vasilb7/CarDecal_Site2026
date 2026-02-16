import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useMemo } from "react";

/* ─────────────────────────────────────────────────────────
   SIMPLE 404 · NOT FOUND — VB VISION
   Minimalist ordinary 404 page.
   ───────────────────────────────────────────────────────── */

/** Detect language from the current URL path, fallback to 'bg' */
function detectLang(pathname: string): "bg" | "en" {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0]?.toLowerCase();
  if (first === "bg" || first === "en") return first;
  return "bg";
}

const LABELS: Record<"bg" | "en", {
  subtitle: string;
  home: string;
}> = {
  bg: {
    subtitle: "Страницата не е намерена",
    home: "Начало",
  },
  en: {
    subtitle: "Page Not Found",
    home: "Back to Home",
  },
};

export function NotFoundPage() {
  const location = useLocation();
  const lang = useMemo(() => detectLang(location.pathname), [location.pathname]);
  const L = LABELS[lang];

  return (
    <div className="fixed inset-0 z-[9999] bg-[#060607] flex items-center justify-center p-6 overflow-hidden font-sans">
      {/* ── Ambient background ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.06, 0.12, 0.06],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)",
          }}
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.04, 0.08, 0.04],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/4 -right-1/4 w-[60vw] h-[60vw] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center">
        {/* 404 Number */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-[8rem] sm:text-[12rem] font-black leading-none tracking-tighter select-none mb-4"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.1) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-white/30 text-xs sm:text-sm uppercase tracking-[0.6em] font-light mb-12"
        >
          {L.subtitle}
        </motion.p>

        {/* Home button - Only this one */}
        <motion.div
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5, duration: 0.6 }}
           className="w-full max-w-[240px]"
        >
          <Link
            to={`/${lang}`}
            className="flex items-center justify-center gap-3 h-14 bg-white text-[#060607] text-[11px] font-bold uppercase tracking-[0.4em] transition-all duration-300 hover:bg-gold-accent hover:text-black active:scale-[0.97]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            {L.home}
          </Link>
        </motion.div>

        {/* Bottom branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-20 opacity-10 text-[10px] uppercase tracking-[0.8em]"
        >
          VB Vision
        </motion.div>
      </div>
    </div>
  );
}
