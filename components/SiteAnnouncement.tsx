
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X } from 'lucide-react';

interface SiteAnnouncementProps {
  text: string;
  onClose?: () => void;
}

const SiteAnnouncement: React.FC<SiteAnnouncementProps> = ({ text, onClose }) => {
  if (!text) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-zinc-900/90 backdrop-blur-xl border-b border-white/5 relative z-[150] overflow-hidden"
    >
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="bg-white/20 p-1.5 rounded-full shrink-0">
            <Megaphone className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate">
            {text}
          </p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default SiteAnnouncement;
