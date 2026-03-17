import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const UnbanNotification: React.FC = () => {
  const { user, profile, isBanned } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show only if authenticated, not banned, and has an unban reason
    if (user && profile && !isBanned && profile.unban_reason) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [user, profile, isBanned]);

  const handleDismiss = async () => {
    setShow(false);
    if (profile?.id) {
      try {
        await supabase.from('profiles').update({ unban_reason: null }).eq('id', profile.id);
      } catch (err) {
        console.error('Failed to clear unban reason', err);
      }
    }
  };

  if (!show || !profile?.unban_reason) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed bottom-6 left-4 right-4 md:left-auto md:right-10 md:bottom-10 z-[100] max-w-sm mx-auto md:mx-0 w-[calc(100%-32px)] md:w-full bg-emerald-950/95 border border-emerald-500/30 backdrop-blur-xl shadow-2xl rounded-2xl p-5"
      >
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-emerald-500/50 hover:text-emerald-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="pr-4">
            <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-1.5">
              Акаунтът е възстановен!
            </h3>
            <p className="text-emerald-100/80 text-sm leading-relaxed mb-4">
              {profile.unban_reason}
            </p>
            <button
              onClick={handleDismiss}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
            >
              Разбрах
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UnbanNotification;
