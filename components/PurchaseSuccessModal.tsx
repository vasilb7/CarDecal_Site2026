import React from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  open: boolean;
  planName: string; // e.g. "BOOK"
  priceLabel?: string; // e.g. "149€"
  onDashboard: () => void;
  onInvoice: () => void;
};

export function PurchaseSuccessModal({
  open,
  planName,
  priceLabel,
  onDashboard,
  onInvoice,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Card */}
          <motion.div
            className="relative w-[min(520px,92vw)] rounded-[32px] border border-white/10 bg-zinc-900/50 shadow-2xl backdrop-blur-md overflow-hidden"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            {/* Shine */}
            <motion.div
              className="pointer-events-none absolute inset-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                className="absolute -left-1/2 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                initial={{ x: "-40%", rotate: 25 }}
                animate={{ x: "240%" }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
              />
            </motion.div>

            <div className="relative px-8 py-10">
              {/* Icon & Title */}
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                    Payment confirmed
                  </p>
                  <h2 className="text-3xl font-serif text-white">
                    Access Activated
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <span className="font-bold text-white uppercase tracking-wider">{planName}</span>
                    {priceLabel && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-white/80">{priceLabel}</span>
                      </>
                    )}
                  </div>
                </div>

                <CheckDraw />
              </div>

              {/* Next steps */}
              <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.03] p-6 space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-white/40">
                  Immediate Privileges:
                </p>
                <div className="grid grid-cols-1 gap-3">
                    {[
                        "Board access is now live",
                        "Priority Booking Manager assigned",
                        "Commercial usage rights unlocked",
                        "Invoice available in your dashboard"
                    ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-white/70">
                            <div className="w-1 h-1 rounded-full bg-white/30" />
                            {step}
                        </div>
                    ))}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-10 flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={onDashboard}
                  className="w-full rounded-2xl bg-white px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-black hover:bg-zinc-200 transition-colors shadow-xl"
                >
                  Go to Dashboard
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={onInvoice}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-colors"
                >
                  View Invoice
                </motion.button>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 opacity-30">
                <div className="h-px flex-1 bg-white/20" />
                <p className="text-[8px] font-black uppercase tracking-[0.2em]">
                   Secure Agency Division
                </p>
                <div className="h-px flex-1 bg-white/20" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CheckDraw() {
  return (
    <motion.svg
      width="64"
      height="64"
      viewBox="0 0 56 56"
      className="shrink-0"
    >
      <motion.circle
        cx="28"
        cy="28"
        r="24"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      <motion.path
        d="M18 29.2 25 36l14-16"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut", delay: 0.4 }}
      />
    </motion.svg>
  );
}
