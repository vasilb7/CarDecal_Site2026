import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Send } from 'lucide-react';

interface RollingLinkProps {
  to?: string;
  href?: string;
  className?: string;
  children: string;
  target?: string;
  rel?: string;
}

const RollingLink: React.FC<RollingLinkProps> = ({ to, href, className, children, target, rel }) => {
  const letters = children.split("");

  const content = (
    <span className={`rolling-link ${className}`}>
      {letters.map((char, i) => (
        <span key={i} className="letter-container" style={{ '--index': i } as React.CSSProperties}>
          <span className="letter letter-top">{char === " " ? "\u00A0" : char}</span>
          <span className="letter letter-bottom">{char === " " ? "\u00A0" : char}</span>
        </span>
      ))}
    </span>
  );

  if (to) return <Link to={to} target={target} rel={rel}>{content}</Link>;
  return <a href={href || "#"} target={target} rel={rel}>{content}</a>;
};

const Footer: React.FC = () => {
  const location = useLocation();

  const path = location.pathname;

  // Determine the background color for the "corners" to match the page theme
  const outerBgClass = useMemo(() => {
    if (path === '/') return "bg-[#dc2626]";
    if (path === '/promos') return "bg-[#6a140b]";
    if (path === '/contact') return "bg-[#5d4a27]";
    if (path === '/custom-orders') return "bg-[#080808]";
    if (path.startsWith('/catalog')) return "bg-[#0F0F0F]";
    return "bg-[#0a0a0a]";
  }, [path]);

  return (
    <footer className={`${outerBgClass} pt-0 pb-0 w-full relative z-10 overflow-hidden -mt-1`}>
      {/* Subtle top transition overlay - lightweight CSS gradient instead of repeated image */}
      <div 
        className="absolute inset-x-0 top-0 h-64 z-0 opacity-[0.03] pointer-events-none"
        style={{ 
          backgroundImage: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 60%)",
        }}
      />
      
      {/* ── OUTER RED WRAP ── */}
      <div className="bg-[#ff0000] rounded-t-[2rem] sm:rounded-t-[2.5rem] lg:rounded-t-[4rem] px-2 pt-2 sm:px-3 sm:pt-3 lg:px-4 lg:pt-4 flex flex-col relative w-full overflow-hidden pb-6">

        {/* ── INNER DARK BOX ── */}
        <div 
          className="
            bg-[#1b1c18] relative w-full overflow-hidden
            rounded-[1.7rem] sm:rounded-[2.2rem] lg:rounded-[3.5rem]
            min-h-[500px] flex flex-col items-center justify-start pt-10 sm:pt-16 lg:pt-24 pb-12
          "
        >

          {/* Star Pattern Overlay - Higher contrast for visual depth */}
          <div 
            className="absolute inset-0 z-0 opacity-[0.07] pointer-events-none"
            style={{ 
              backgroundImage: "url('/star.svg')", 
              backgroundRepeat: "repeat",
              backgroundSize: "120px",
            }}
          />

          {/* ── HUGE CENTER TEXT ── */}
          <div className="relative flex flex-col items-center pointer-events-none z-10 w-full mb-10 sm:mb-16 lg:mb-20 scale-[0.85] xs:scale-100">
            <div className="font-black uppercase tracking-tighter
              drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)] flex flex-col items-center">

              {/* Ред 1 */}
              <div className="flex flex-row items-center gap-[2vw] leading-[0.85] mb-2 sm:mb-[0.5vw]">
                <span className="text-[9.5vw] sm:text-[9.5vw] lg:text-[8.5vw] xl:text-[7.5vw] text-white">ПРЕОТКРИЙ</span>
                <span className="text-[9.5vw] sm:text-[9.5vw] lg:text-[8.5vw] xl:text-[7.5vw] text-[#dc2626]">СТИЛА</span>
              </div>

              {/* Ред 2 */}
              <div className="flex flex-row items-center gap-[2vw] leading-[0.85]">
                <span className="text-[9.5vw] sm:text-[9.5vw] lg:text-[8.5vw] xl:text-[7.5vw] text-white">ЗА</span>
                <span className="text-[9.5vw] sm:text-[9.5vw] lg:text-[8.5vw] xl:text-[7.5vw] text-[#dc2626]">СЕБЕ СИ.</span>
              </div>
            </div>
          </div>

          {/* ── MENUS GRID ── */}
          <div className="relative w-full z-40 px-6 sm:px-12 lg:px-24 xl:px-32 pb-8 mt-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-8 mb-12">
              
              {/* Col 1: Logo & Slogan */}
              <div className="col-span-2 md:col-span-1 flex flex-col items-start gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase leading-none">
                  CAR <span className="text-red-600">DECAL</span>
                </span>
                <span className="text-[10px] sm:text-xs text-white/50 font-bold uppercase tracking-widest leading-relaxed">
                  Висок клас стикери <br /> над 1000+ дизайна
                </span>
              </div>

              {/* Col 2: Страници */}
              <div className="flex flex-col items-start gap-4 sm:gap-6">
                <span className="text-[11px] sm:text-sm text-white font-black tracking-[0.2em] uppercase">МЕНЮ</span>
                <div className="flex flex-col gap-2.5 sm:gap-4">
                  <RollingLink to="/catalog" className="text-sm sm:text-base font-bold uppercase text-white/70 hover:text-white transition-colors">КАТАЛОГ</RollingLink>
                  <RollingLink to="/promos" className="text-sm sm:text-base font-bold uppercase text-white/70 hover:text-white transition-colors">ПРОМОЦИИ</RollingLink>
                  <RollingLink to="/about" className="text-sm sm:text-base font-bold uppercase text-white/70 hover:text-white transition-colors">ЗА НАС</RollingLink>
                </div>
              </div>

              {/* Col 3: Поръчки */}
              <div className="flex flex-col items-start gap-4 sm:gap-6">
                <span className="text-[11px] sm:text-sm text-white font-black tracking-[0.2em] uppercase">ПОРЪЧКИ</span>
                <div className="flex flex-col gap-2.5 sm:gap-4">
                  <RollingLink to="/custom-orders" className="text-sm sm:text-base font-bold uppercase text-white/70 hover:text-white transition-colors">ИНДИВИДУАЛНИ</RollingLink>
                  <RollingLink to="/contact" className="text-sm sm:text-base font-bold uppercase text-white/70 hover:text-white transition-colors">КОНТАКТИ</RollingLink>
                </div>
              </div>

              {/* Col 4: Инфо */}
              <div className="flex flex-col items-start gap-4 sm:gap-6">
                <span className="text-[11px] sm:text-sm text-white font-black tracking-[0.2em] uppercase">ИНФО</span>
                <div className="flex flex-col gap-2.5 sm:gap-4">
                  <RollingLink to="/privacy" className="text-sm sm:text-base font-bold uppercase text-white/70 hover:text-white transition-colors">ПОВЕРИТЕЛНОСТ</RollingLink>
                  <RollingLink to="/terms" className="text-sm sm:text-base font-bold uppercase text-white/70 hover:text-white transition-colors">ОБЩИ УСЛОВИЯ</RollingLink>
                  <RollingLink to="/delivery" className="text-sm sm:text-base font-bold uppercase text-white/70 hover:text-white transition-colors">ДОСТАВКА</RollingLink>
                </div>
              </div>
            </div>

            {/* Horizontal Line Separator */}
            <div className="w-full h-px bg-white/10 mb-8" />

            {/* Social Icons & Secondary Copyright */}
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-4">
                <a href="https://www.facebook.com/share/18yePjATNr/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white transition-all">
                  <Facebook size={18} />
                </a>
                <a href="https://www.instagram.com/cardecal1?igsh=eWd3b3FpdXN0NXRp" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white transition-all">
                  <Instagram size={18} />
                </a>
                <a href="https://youtube.com/@cardecal?si=NT1sZsww7fp8cKIR" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white transition-all">
                  <Youtube size={18} />
                </a>
                <a href="https://www.tiktok.com/@cardecal4?_r=1&_t=ZN-94RmUa0RCeE" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white transition-all">
                  <svg size="18" viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/></svg>
                </a>
              </div>
            </div>
          </div>

        </div>
        {/* ── END INNER DARK BOX ── */}

        {/* ── BOTTOM RED STRIP ── */}
        <div className="relative flex flex-col items-center justify-center w-full z-40 pt-[48px] sm:pt-[36px] lg:pt-[40px] pb-4">

          {/* Overlapping button */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
            hover:-translate-y-[55%] transition-transform duration-300">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center
                px-10 sm:px-12 lg:px-16 py-5 sm:py-3.5 lg:py-4
                bg-black text-white
                text-[12px] sm:text-[10px] lg:text-[12px]
                font-black uppercase tracking-[0.12em] lg:tracking-[0.15em]
                rounded-md whitespace-nowrap
                shadow-[0_5px_20px_rgba(0,0,0,0.7)]
                hover:bg-white hover:text-black
                hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all">
              СВЪРЖИ СЕ С НАС
            </Link>
          </div>

          <div className="flex flex-col items-center gap-1 mt-1 sm:mt-0">
            <span className="text-[10px] sm:text-[10px] lg:text-[12px]
              font-black tracking-[0.2em] uppercase text-black/70 text-center px-4">
              © {new Date().getFullYear()} CARDECAL HQ. ВСИЧКИ ПРАВА ЗАПАЗЕНИ
            </span>
            <div
              className="
                flex flex-col items-center justify-center gap-2 text-center
                sm:flex-row sm:gap-4 sm:justify-center
              "
            >
              <Link
                to="/privacy"
                className="text-[9px] sm:text-[9px] lg:text-[11px] font-bold uppercase tracking-[0.1em] text-black/80 hover:text-black transition-colors"
              >
                Политика за поверителност
              </Link>

              <Link
                to="/terms"
                className="text-[9px] sm:text-[9px] lg:text-[11px] font-bold uppercase tracking-[0.1em] text-black/80 hover:text-black transition-colors"
              >
                Общи условия
              </Link>

              <Link
                to="/delivery"
                className="text-[9px] sm:text-[9px] lg:text-[11px] font-bold uppercase tracking-[0.1em] text-black/80 hover:text-black transition-colors"
              >
                Доставка и връщане
              </Link>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new Event('open-bug-report'));
              }}
              className="text-[9px] sm:text-[9px] lg:text-[11px] font-bold uppercase tracking-[0.1em] text-black/80 hover:text-black transition-colors mt-1"
            >
              Докладвай проблем
            </button>
          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;
