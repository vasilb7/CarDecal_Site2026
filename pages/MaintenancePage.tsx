import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Clock, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { settingsService } from '../lib/settingsService';

const MaintenancePage: React.FC = () => {
  const [message, setMessage] = useState('');
  const [endTime, setEndTime] = useState<string | null>(null);
  const [perks, setPerks] = useState<string[]>([]);
  const [updateText, setUpdateText] = useState('');
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [msg, end, perksData, updateTxt] = await Promise.all([
        settingsService.getMaintenanceMessage(),
        settingsService.getMaintenanceEndTime(),
        settingsService.getMaintenancePerks(),
        settingsService.getMaintenanceUpdatesText()
      ]);
      if (msg) setMessage(msg);
      if (end) setEndTime(end);
      if (perksData) {
        setPerks(perksData.split('\n').filter(p => p.trim() !== ''));
      }
      if (updateTxt) setUpdateText(updateTxt);
    };
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel('maintenance_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings'
        },
        (payload) => {
          const newData = payload.new as { key: string; value: any };
          if (newData && newData.key) {
            if (newData.key === 'maintenance_message') setMessage(newData.value);
            if (newData.key === 'maintenance_end_time') setEndTime(newData.value);
            if (newData.key === 'maintenance_perks') {
              setPerks((newData.value as string).split('\n').filter(p => p.trim() !== ''));
            }
            if (newData.key === 'maintenance_updates_text') setUpdateText(newData.value);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!endTime) {
      setTimeLeft(null);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(endTime).getTime();
      const distance = target - now;

      if (distance < 0) {
        setTimeLeft(null);
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-[#000000] flex flex-col items-center justify-start p-6 text-center overflow-y-auto custom-scrollbar"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Background Animated Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#C9A227]/5 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#C9A227]/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-20" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full pt-12 pb-24"
      >
        {/* Gear Icon */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 sm:w-28 h-28 border border-dashed border-gold-accent/20 rounded-full flex items-center justify-center p-4"
            >
              <div className="w-full h-full border border-gold-accent/40 rounded-full flex items-center justify-center">
                <Settings className="w-10 h-10 sm:w-14 h-14 text-gold-accent" />
              </div>
            </motion.div>
            <div className="absolute inset-0 bg-gold-accent/20 blur-[40px] rounded-full animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif text-white mb-8 tracking-tighter uppercase leading-[0.9]">
          MAINTENANCE <span className="text-gold-accent block">IN PROGRESS</span>
        </h1>
        
        {/* Main Message */}
        <p className="text-white/40 text-xs sm:text-sm md:text-base uppercase tracking-[0.3em] font-medium mb-16 max-w-xl mx-auto leading-relaxed border-x border-white/10 px-8 italic">
          {message}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start text-left">
          
          {/* Countdown Section */}
          <div className="space-y-8 bg-white/[0.02] border border-white/5 p-8 sm:p-12 backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-8">
              <Clock className="w-4 h-4 text-gold-accent" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Projected Return</h3>
            </div>

            {timeLeft ? (
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Days', value: timeLeft.d },
                  { label: 'Hrs', value: timeLeft.h },
                  { label: 'Min', value: timeLeft.m },
                  { label: 'Sec', value: timeLeft.s }
                ].map((unit, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-3xl sm:text-4xl font-serif text-white tabular-nums leading-none">
                      {String(unit.value).padStart(2, '0')}
                    </span>
                    <span className="text-[7px] sm:text-[8px] uppercase tracking-[0.2em] text-gold-accent/50 mt-3 font-black">
                      {unit.label}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-gold-accent/5 border border-gold-accent/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold-accent animate-ping" />
                  <span className="text-[10px] uppercase tracking-widest text-gold-accent font-black">Optimization Live</span>
                </div>
                <p className="text-[9px] text-white/20 uppercase tracking-widest mt-4">Calculated time remaining...</p>
              </div>
            )}
            
            <div className="pt-8 border-t border-white/5 space-y-4">
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/30 font-bold block mb-4">Connect with us:</span>
              <div className="flex gap-4">
                {[
                  { 
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    ), 
                    label: 'Instagram', 
                    color: 'hover:text-[#E1306C]' 
                  },
                  { 
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4l11.733 16h4.67L6.6 4H4z"></path>
                        <path d="M20 5l-7.775 10.643 6.643 8.357H5.21l6.643-8.357L4 5h16z" opacity="0.5"></path>
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor" stroke="none"></path>
                      </svg>
                    ), 
                    label: 'X', 
                    color: 'hover:text-white' 
                  },
                  { 
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"></path>
                      </svg>
                    ), 
                    label: 'Reddit', 
                    color: 'hover:text-[#FF4500]' 
                  }
                ].map((social, i) => (
                  <button key={i} className={`flex items-center gap-2 text-white/20 transition-all ${social.color}`}>
                    {social.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {perks.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-[1px] flex-1 bg-gold-accent/20" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-accent">What's Coming</h3>
                <div className="h-[1px] flex-1 bg-gold-accent/20" />
              </div>

              <div className="space-y-6">
                {perks.map((perk, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    key={i} 
                    className="flex items-start gap-4 group"
                  >
                    <div className="relative">
                       <div className="w-5 h-5 rounded-full border border-gold-accent/30 flex items-center justify-center bg-gold-accent/5 group-hover:bg-gold-accent/20 group-hover:border-gold-accent/60 transition-all duration-300">
                         <Plus className="w-3 h-3 text-gold-accent" />
                       </div>
                       <div className="absolute inset-0 bg-gold-accent/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-white group-hover:text-gold-accent transition-colors leading-tight">{perk}</h4>
                      <div className="h-0.5 w-0 group-hover:w-full bg-gold-accent/30 transition-all duration-500 mt-1" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

      </motion.div>

    </div>
  );
};

export default MaintenancePage;
