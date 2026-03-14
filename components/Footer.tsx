import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

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

  let topBgClass = "bg-background";
  const path = location.pathname;

  if (path === '/') {
    topBgClass = "bg-red-600";
  } else if (path.startsWith('/catalog')) {
    topBgClass = "bg-[#0F0F0F]";
  } else if (path === '/profile' || path === '/cart' || path === '/contact' || path === '/privacy' || path === '/terms' || path === '/delivery') {
    topBgClass = "bg-[#0a0a0a]";
  } else if (path === '/custom-orders') {
    topBgClass = "bg-[#080808]";
  } else if (path === '/promos') {
    topBgClass = "bg-[#280905]";
  }

  return (
    <footer className={`${topBgClass} pt-0 pb-0 w-full relative z-10 overflow-hidden -mt-1`}>
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
        <div className="
          bg-[#1b1c18] relative w-full overflow-hidden
          rounded-[1.7rem] sm:rounded-[2.2rem] lg:rounded-[3.5rem]
          min-h-[500px] sm:min-h-0 sm:aspect-[4/3] lg:aspect-[21/9] flex flex-col items-center justify-center
        ">

          {/* ── LOGO — Independent Container ── */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-[8%] sm:top-[10%] lg:top-[8%] left-0 right-0 flex justify-center pointer-events-none z-20"
          >
            <img 
              src="/LOGO.webp" 
              alt="CarDecal Logo" 
              className="h-12 sm:h-20 lg:h-28 w-auto object-contain"
            />
          </motion.div>

          {/* ── HUGE CENTER TEXT — Independent Container ── */}
          <div className="absolute top-[28%] sm:top-[25%] lg:top-[30%]
            left-0 right-0 flex flex-col items-center pointer-events-none z-10 w-full scale-[0.9] xs:scale-100">
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

          {/* ── MENUS — bottom section ── */}
          <div className="relative w-full z-40 px-6 sm:px-12 lg:px-24 xl:px-40 pb-12 sm:pb-8 lg:pb-12 mt-auto sm:mt-0 sm:absolute sm:bottom-[15%]
            flex flex-row justify-between items-start gap-8">

            {/* Страници */}
            <div className="flex flex-col items-start text-left flex-1">
              <span className="text-[10px] sm:text-[10px] lg:text-[12px]
                text-white/40 font-black tracking-[0.2em] mb-6 sm:mb-4">
                СТРАНИЦИ
              </span>
              <div className="flex flex-col gap-4 sm:gap-[0.8vw] lg:gap-[1vw] items-start">
                <RollingLink to="/catalog"  className="text-lg sm:text-[2.2vw] lg:text-[1.8vw] xl:text-[1.5vw] font-black uppercase text-white leading-none inline-block">КАТАЛОГ</RollingLink>
                <RollingLink to="/promos"   className="text-lg sm:text-[2.2vw] lg:text-[1.8vw] xl:text-[1.5vw] font-black uppercase text-white leading-none inline-block">ПРОМОЦИИ</RollingLink>
                <RollingLink to="/about"    className="text-lg sm:text-[2.2vw] lg:text-[1.8vw] xl:text-[1.5vw] font-black uppercase text-white leading-none inline-block">ЗА НАС</RollingLink>
                <RollingLink to="/custom-orders" className="text-lg sm:text-[2.2vw] lg:text-[1.8vw] xl:text-[1.5vw] font-black uppercase text-white leading-none inline-block">ПОРЪЧКИ</RollingLink>
                <RollingLink to="/contact"  className="text-lg sm:text-[2.2vw] lg:text-[1.8vw] xl:text-[1.5vw] font-black uppercase text-white leading-none inline-block">КОНТАКТИ</RollingLink>
              </div>
            </div>

            {/* Социални */}
            <div className="flex flex-col items-end text-right flex-1">
              <span className="text-[10px] sm:text-[10px] lg:text-[12px]
                text-white/40 font-black tracking-[0.2em] mb-6 sm:mb-4">
                ПОСЛЕДВАЙ НИ
              </span>
              <div className="flex flex-col gap-4 sm:gap-[0.8vw] lg:gap-[1vw] items-end">
                <RollingLink href="https://www.tiktok.com/@cardecal4?_r=1&_t=ZN-94RmUa0RCeE" target="_blank" rel="noopener noreferrer" className="text-lg sm:text-[2.2vw] lg:text-[1.8vw] xl:text-[1.5vw] font-black uppercase text-white leading-none inline-block">TIKTOK</RollingLink>
                <RollingLink href="https://www.instagram.com/cardecal1?igsh=eWd3b3FpdXN0NXRp" target="_blank" rel="noopener noreferrer" className="text-lg sm:text-[2.2vw] lg:text-[1.8vw] xl:text-[1.5vw] font-black uppercase text-white leading-none inline-block">INSTAGRAM</RollingLink>
                <RollingLink href="https://youtube.com/@cardecal?si=NT1sZsww7fp8cKIR" target="_blank" rel="noopener noreferrer" className="text-lg sm:text-[2.2vw] lg:text-[1.8vw] xl:text-[1.5vw] font-black uppercase text-white leading-none inline-block">YOUTUBE</RollingLink>
                <RollingLink href="https://www.facebook.com/share/18yePjATNr/" target="_blank" rel="noopener noreferrer" className="text-lg sm:text-[2.2vw] lg:text-[1.8vw] xl:text-[1.5vw] font-black uppercase text-white leading-none inline-block">FACEBOOK</RollingLink>
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
                hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
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
