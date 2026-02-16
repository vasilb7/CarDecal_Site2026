import React from 'react';
import { motion } from 'framer-motion';
import { Megaphone, X, ExternalLink, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SiteAnnouncementProps {
  text: string;
  buttonText?: string;
  buttonLink?: string;
  buttonType?: 'internal' | 'external';
  customSvg?: string;
  iconColor?: string;
  buttonColor?: string;
  textColor?: string;
  iconSize?: number;
  buttonTextColor?: string;
  bannerColor?: string;
  bannerColor2?: string;
  bannerGradient?: boolean;
  buttonFontSize?: number;
  onClose?: () => void;
}

const SiteAnnouncement: React.FC<SiteAnnouncementProps> = ({ 
  text, 
  buttonText, 
  buttonLink, 
  buttonType = 'internal', 
  customSvg,
  iconColor = '#3b82f6',
  buttonColor = '#3b82f6',
  textColor = '#ffffff',
  iconSize = 14,
  buttonTextColor = '#000000',
  bannerColor = '#09090b',
  bannerColor2 = '#09090b',
  bannerGradient = false,
  buttonFontSize = 9,
  onClose 
}) => {
  if (!text) return null;

  const isInternal = buttonType === 'internal';
  
  // Detect if customSvg is a URL or SVG code
  const isImageUrl = customSvg?.startsWith('http') || customSvg?.startsWith('/') || (customSvg && !customSvg.trim().startsWith('<svg'));

  const backgroundStyle = bannerGradient 
    ? { background: `linear-gradient(90deg, ${bannerColor}, ${bannerColor2})` }
    : { backgroundColor: bannerColor };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="backdrop-blur-2xl border-b border-white/5 relative z-[150] overflow-hidden"
      style={backgroundStyle}
    >
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div 
            className="rounded-full shrink-0 flex items-center justify-center overflow-hidden"
            style={{ 
              backgroundColor: iconColor,
              width: `${iconSize + 12}px`,
              height: `${iconSize + 12}px`
            }}
          >
            {customSvg ? (
              isImageUrl ? (
                <img 
                  src={customSvg} 
                  alt="" 
                  style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                  className="object-contain"
                />
              ) : (
                <div 
                  style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                  className="flex items-center justify-center [&>svg]:w-full [&>svg]:h-full text-black"
                  dangerouslySetInnerHTML={{ __html: customSvg }}
                />
              )
            ) : (
              <Megaphone style={{ width: `${iconSize}px`, height: `${iconSize}px` }} className="text-black" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p 
              className="text-[11px] sm:text-xs font-bold uppercase tracking-widest truncate"
              style={{ color: textColor }}
            >
              {text}
            </p>
            
            {buttonText && buttonLink && (
              <>
                {isInternal ? (
                  <Link 
                    to={buttonLink}
                    className="flex items-center gap-1.5 px-3 py-1 font-black uppercase tracking-tighter hover:brightness-110 transition-all group shrink-0"
                    style={{ 
                      backgroundColor: buttonColor, 
                      color: buttonTextColor,
                      fontSize: `${buttonFontSize}px`
                    }}
                  >
                    {buttonText}
                    <ChevronRight size={buttonFontSize + 1} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ) : (
                  <a 
                    href={buttonLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 font-black uppercase tracking-tighter hover:brightness-110 transition-all group shrink-0"
                    style={{ 
                      backgroundColor: buttonColor, 
                      color: buttonTextColor,
                      fontSize: `${buttonFontSize}px`
                    }}
                  >
                    {buttonText}
                    <ExternalLink size={buttonFontSize + 1} className="group-hover:scale-110 transition-transform" />
                  </a>
                )}
              </>
            )}
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-white/30 hover:text-white p-1 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default SiteAnnouncement;
