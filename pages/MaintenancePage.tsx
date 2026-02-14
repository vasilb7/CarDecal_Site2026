import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Clock, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { settingsService } from '../lib/settingsService';

const MaintenancePage: React.FC = () => {
  const [message, setMessage] = useState('');
  const [endTime, setEndTime] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [msg, end] = await Promise.all([
        settingsService.getMaintenanceMessage(),
        settingsService.getMaintenanceEndTime()
      ]);
      if (msg) setMessage(msg);
      if (end) setEndTime(end);

    };
    fetchData();

    const channel = supabase
      .channel('maintenance_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (payload) => {
        const newData = payload.new as { key: string; value: any };
        if (newData?.key === 'maintenance_message') setMessage(newData.value);
        if (newData?.key === 'maintenance_end_time') setEndTime(newData.value);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!endTime) return;
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
    <div className="fixed inset-0 z-[99999] bg-[#000] flex items-center justify-center overflow-hidden">
      {/* Background with subtle overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/Site_Pics/Maintance/Maintace.png" 
          alt="Maintenance" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 container mx-auto px-6 h-full flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr,1px,1fr] gap-12 lg:gap-0 items-center">
          
          {/* Left Side: Brand & Status */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center lg:items-end lg:pr-20 text-center lg:text-right"
          >
            <div className="w-48 lg:w-64 mb-10 overflow-hidden">
              <img 
                src="/Site_Pics/Homepage/logo.png" 
                alt="Logo" 
                className="w-full h-auto object-contain brightness-0 invert" 
              />
            </div>
            <h1 className="text-5xl lg:text-7xl font-sans font-black text-white mb-6 tracking-tight uppercase leading-none">
              COMING <br className="hidden lg:block" /> SOON!
            </h1>
            <p className="max-w-md text-white/80 text-sm lg:text-base leading-relaxed font-light">
              {message || "Our Website is under Maintenance. We'll be here soon with our new awesome site."}
            </p>
          </motion.div>

          {/* Vertical Divider */}
          <div className="hidden lg:block h-96 w-[1px] bg-white/20 self-center" />

          {/* Right Side: Interaction & Info */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center lg:items-start lg:pl-20 text-center lg:text-left"
          >
            <span className="text-white/60 text-xs lg:text-sm uppercase tracking-[0.2em] mb-6">
              The maintenance will end on
            </span>

            {/* Countdown Grid */}
            <div className="flex gap-4 mb-12">
              {[
                { label: 'Days', val: timeLeft?.d || 0 },
                { label: 'Hours', val: timeLeft?.h || 0 },
                { label: 'Minutes', val: timeLeft?.m || 0 },
                { label: 'Seconds', val: timeLeft?.s || 0 }
              ].map((unit, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 border border-white/30 rounded-lg flex items-center justify-center mb-2 backdrop-blur-md">
                    <span className="text-2xl lg:text-3xl font-bold text-white tabular-nums">
                      {String(unit.val).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase text-white/40 tracking-widest">{unit.label}</span>
                </div>
              ))}
            </div>

            {/* Newsletter */}
            <div className="w-full max-w-md mb-12">
              <p className="text-white/60 text-xs lg:text-sm mb-4 uppercase tracking-wider">
                Get mail for exclusive offers in your inbox
              </p>
              <div className="flex w-full">
                <input 
                  type="email" 
                  placeholder="Your email address"
                  className="flex-1 bg-white px-4 py-3 text-black text-sm outline-none rounded-l-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="bg-black/80 hover:bg-black text-white px-6 py-3 text-xs uppercase font-bold tracking-widest border border-white/20 transition-all rounded-r-sm">
                  Notify me
                </button>
              </div>
            </div>

            {/* Socials */}
            <div className="flex flex-col lg:items-start items-center">
              <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-4">Connect with us</span>
              <div className="flex gap-4">
                {[
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>,
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>,
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.412.558.217.957.477 1.376.896.419.419.679.818.896 1.376.163.422.358 1.057.412 2.227.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.249 1.805-.412 2.227-.217.558-.477.957-.896 1.376-.419.419-.818.679-1.376.896-.422.163-1.057.358-2.227.412-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.805-.249-2.227-.412-.558-.217-.957-.477-1.376-.896-.419-.419-.679-.818-.896-1.376-.163-.422-.358-1.057-.412-2.227-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.054-1.17.249-1.805.412-2.227.217-.558.477-.957.896-1.376.419-.419.818-.679 1.376-.896.422-.163 1.057-.358 2.227-.412 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.277.057-2.15.26-2.914.557-.79.306-1.459.717-2.126 1.384-.667.667-1.078 1.336-1.384 2.126-.297.764-.5 1.637-.557 2.914-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.057 1.277.26 2.15.557 2.914.306.79.717 1.459 1.384 2.126.667.667 1.336 1.078 2.126 1.384.764.297 1.637.5 2.914.557 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.277-.057 2.15-.26 2.914-.557.79-.306 1.459-.717 2.126-1.384.667-.667 1.078-1.336 1.384-2.126.297-.764.5-1.637.557-2.914.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.057-1.277-.26-2.15-.557-2.914-.306-.79-.717-1.459-1.384-2.126-.667-.667-1.336-1.078-2.126-1.384-.764-.297-1.637-.5-2.914-.557-1.28-.058-1.688-.072-4.947-.072zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                ].map((icon, i) => (
                  <button key={i} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/10">
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
