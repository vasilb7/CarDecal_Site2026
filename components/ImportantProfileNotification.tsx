import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const ImportantProfileNotification: React.FC = () => {
  const { user, profile } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show only if there are admin_notes
    if (user && profile && profile.admin_notes) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [user, profile]);

  const handleDismiss = async () => {
    setShow(false);
    if (profile?.id) {
      try {
        // Clear admin_notes from database as it's a one-time message now
        await supabase.from('profiles').update({ admin_notes: null }).eq('id', profile.id);
      } catch (err) {
        console.error('Failed to clear admin notes', err);
      }
    }
  };

  if (!show || !profile?.admin_notes) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed bottom-8 right-4 left-4 md:left-auto md:right-8 z-[100] max-w-sm mx-auto md:mx-0 w-auto bg-[#0d0d0d]/95 border border-red-600/20 backdrop-blur-2xl shadow-2xl rounded-2xl overflow-hidden"
      >
        <div className="h-0.5 w-full bg-red-600" />
        
        <div className="p-5 relative">
            <button 
                onClick={handleDismiss}
                className="absolute top-3 right-3 text-zinc-600 hover:text-white transition-colors"
                title="Dismiss"
            >
                <X size={18} />
            </button>

            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5 text-red-500" />
                </div>
                <div className="pr-4 space-y-3">
                    <div>
                        <h3 className="text-white font-black uppercase tracking-widest text-[11px] mb-0.5 leading-none">
                             CarDecal Team
                        </h3>
                        {/* <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest italic leading-none">CD Security Center</p> */}
                    </div>

                    <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                        {profile.admin_notes}
                    </p>

                    <button
                        onClick={handleDismiss}
                        className="w-full bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-[0.2em] py-2.5 rounded-lg transition-all shadow-lg shadow-red-600/10 flex items-center justify-center gap-2"
                    >
                        Потвърди
                    </button>
                </div>
            </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImportantProfileNotification;

