import React, { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface RollingLinkProps {
  to?: string;
  href?: string;
  className?: string;
  children: string;
}

const RollingLink: React.FC<RollingLinkProps> = ({ to, href, className, children }) => {
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

  if (to) return <Link to={to}>{content}</Link>;
  return <a href={href || "#"}>{content}</a>;
};

const Footer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    containerRef.current.style.setProperty('--mouse-x', `${x}px`);
    containerRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  let topBgClass = "bg-background";
  const path = location.pathname;

  if (path === '/') {
    topBgClass = "bg-red-600";
  } else if (path.startsWith('/catalog')) {
    topBgClass = "bg-[#0F0F0F]";
  } else if (path === '/profile' || path === '/cart') {
    topBgClass = "bg-[#0a0a0a]";
  } else if (path === '/book-now') {
    topBgClass = "bg-[#080808]";
  }

  return (
    <footer className={`${topBgClass} pt-8 sm:pt-12 lg:pt-20 pb-0 w-full relative z-10`}>
      {/* ── OUTER RED WRAP ── */}
      <div className="bg-[#ff0000] rounded-t-[2rem] sm:rounded-t-[2.5rem] lg:rounded-t-[4rem] px-2 pt-2 sm:px-3 sm:pt-3 lg:px-4 lg:pt-4 flex flex-col relative w-full overflow-hidden pb-6">

        {/* ── INNER DARK BOX ── */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="
          bg-[#1b1c18] relative w-full overflow-hidden
          rounded-[1.7rem] sm:rounded-[2.2rem] lg:rounded-[3.5rem]
          min-h-[500px] sm:min-h-0 sm:aspect-[4/3] lg:aspect-[21/9] flex flex-col items-center justify-start
          cursor-crosshair
        ">

          {/* ── HUGE CENTER TEXT ── */}
          <div className="pt-8 sm:pt-0 sm:absolute sm:top-[10%] lg:top-[14%]
            left-0 right-0 flex flex-col items-center pointer-events-none z-10 w-full relative scale-[0.9] xs:scale-100">
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

          {/* Car Image Area */}
          <div className="absolute
            bottom-[32%] sm:bottom-[10%] lg:bottom-[-10%] xl:bottom-[-25%]
            left-1/2 -translate-x-1/2 z-20 pointer-events-none
            w-[100%] sm:w-[95%] lg:w-[68%] xl:w-[88%]">
            <img
              src="/Footer/2026.png"
              alt="Car"
              className="w-full h-auto object-contain drop-shadow-[0_-5px_60px_rgba(0,0,0,0.9)] origin-bottom"
            />
          </div>

          {/* ── RED LIQUID MASK — появява се под курсора ── */}
          <div
            className="absolute inset-0 z-30 pointer-events-none transition-opacity duration-700 ease-out"
            style={{
              opacity: isHovered ? 1 : 0,
              WebkitMaskImage: 'radial-gradient(circle 350px at var(--mouse-x, 50%) var(--mouse-y, 50%), black 15%, transparent 100%)',
              maskImage: 'radial-gradient(circle 350px at var(--mouse-x, 50%) var(--mouse-y, 50%), black 15%, transparent 100%)',
            }}
          >
            <div className="absolute
              bottom-[32%] sm:bottom-[10%] lg:bottom-[-10%] xl:bottom-[-25%]
              left-1/2 -translate-x-1/2 pointer-events-none
              w-[100%] sm:w-[95%] lg:w-[68%] xl:w-[88%] mix-blend-screen">
              <img
                src="/Footer/2026red.png"
                alt="Car Red"
                className="w-full h-auto object-contain drop-shadow-[0_0_80px_rgba(255,0,0,0.4)] origin-bottom"
              />
            </div>
          </div>

          {/* ── MENUS — bottom section ── */}
          <div className="relative mt-auto sm:mt-0 sm:absolute
            sm:bottom-[5%] lg:bottom-[7%] xl:bottom-[9%]
            left-0 right-0 z-40
            px-6 sm:px-8 lg:px-14 xl:px-24 mb-16 sm:mb-0
            flex flex-row justify-between sm:justify-between items-start sm:items-end gap-4">

            {/* Страници */}
            <div className="flex flex-col items-start text-left">
              <span className="text-[9px] sm:text-[9px] lg:text-[11px]
                text-white/40 font-black tracking-[0.2em] mb-4 sm:mb-2 lg:mb-4">
                СТРАНИЦИ
              </span>
              <div className="flex flex-col gap-3 sm:gap-[0.7vw] lg:gap-[0.8vw] items-start">
                <RollingLink to="/catalog"  className="text-[0.95rem] sm:text-[2.8vw] lg:text-[2vw] xl:text-[1.7vw] font-black uppercase text-white leading-none inline-block">КАТАЛОГ</RollingLink>
                <RollingLink to="/about"    className="text-[0.95rem] sm:text-[2.8vw] lg:text-[2vw] xl:text-[1.7vw] font-black uppercase text-white leading-none inline-block">ЗА НАС</RollingLink>
                <RollingLink to="/book-now" className="text-[0.95rem] sm:text-[2.8vw] lg:text-[2vw] xl:text-[1.7vw] font-black uppercase text-white leading-none inline-block">ПОРЪЧКИ</RollingLink>
                <RollingLink to="/contact"  className="text-[0.95rem] sm:text-[2.8vw] lg:text-[2vw] xl:text-[1.7vw] font-black uppercase text-white leading-none inline-block">КОНТАКТИ</RollingLink>
              </div>
            </div>

            {/* ИНФОРМАЦИЯ */}
            <div className="hidden md:flex flex-col items-start text-left">
              <span className="text-[9px] sm:text-[9px] lg:text-[11px]
                text-white/40 font-black tracking-[0.2em] mb-4 sm:mb-2 lg:mb-4">
                ИНФОРМАЦИЯ
              </span>
              <div className="flex flex-col gap-3 sm:gap-[0.7vw] lg:gap-[0.8vw] items-start">
                <RollingLink to="/privacy" className="text-[0.95rem] sm:text-[2.8vw] lg:text-[2vw] xl:text-[1.7vw] font-black uppercase text-white leading-none inline-block">ПОВЕРИТЕЛНОСТ</RollingLink>
                <RollingLink to="/terms"   className="text-[0.95rem] sm:text-[2.8vw] lg:text-[2vw] xl:text-[1.7vw] font-black uppercase text-white leading-none inline-block">ОБЩИ УСЛОВИЯ</RollingLink>
                <RollingLink to="/legal"   className="text-[0.95rem] sm:text-[2.8vw] lg:text-[2vw] xl:text-[1.7vw] font-black uppercase text-white leading-none inline-block">ДОСТАВКА</RollingLink>
              </div>
            </div>

            {/* Социални */}
            <div className="flex flex-col items-end text-right">
              <span className="text-[9px] sm:text-[9px] lg:text-[11px]
                text-white/40 font-black tracking-[0.2em] mb-4 sm:mb-2 lg:mb-4">
                ПОСЛЕДВАЙ НИ
              </span>
              <div className="flex flex-col gap-3 sm:gap-[0.7vw] lg:gap-[0.8vw] items-end">
                <RollingLink href="#" className="text-[0.95rem] sm:text-[2.8vw] lg:text-[2vw] xl:text-[1.7vw] font-black uppercase text-white leading-none inline-block">TIKTOK</RollingLink>
                <RollingLink href="#" className="text-[0.95rem] sm:text-[2.8vw] lg:text-[2vw] xl:text-[1.7vw] font-black uppercase text-white leading-none inline-block">INSTAGRAM</RollingLink>
                <RollingLink href="#" className="text-[0.95rem] sm:text-[2.8vw] lg:text-[2vw] xl:text-[1.7vw] font-black uppercase text-white leading-none inline-block">YOUTUBE</RollingLink>
                <RollingLink href="#" className="text-[0.95rem] sm:text-[2.8vw] lg:text-[2vw] xl:text-[1.7vw] font-black uppercase text-white leading-none inline-block">FACEBOOK</RollingLink>
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

          <span className="text-[8px] sm:text-[9px] lg:text-[11px]
            font-black tracking-widest uppercase text-black/80 text-center px-4 mt-1 sm:mt-0">
            © {new Date().getFullYear()} CAR DECAL. ВСИЧКИ ПРАВА ЗАПАЗЕНИ
          </span>

        </div>

      </div>
    </footer>
  );
};

export default Footer;
