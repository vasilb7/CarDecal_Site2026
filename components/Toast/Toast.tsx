import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle2, 
    AlertCircle, 
    AlertTriangle, 
    Info, 
    X 
} from 'lucide-react';
import './Toast.css';

interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

const icons = {
  success: <CheckCircle2 className="toast-icon success" size={20} />,
  error: <AlertCircle className="toast-icon error" size={20} />,
  warning: <AlertTriangle className="toast-icon warning" size={20} />,
  info: <Info className="toast-icon info" size={20} />,
};

const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 4000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <motion.div
      layout
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        // Dismiss on swipe up or down (threshold 50px)
        if (Math.abs(info.offset.y) > 50) {
          onClose(id);
        }
      }}
      initial={{ opacity: 0, y: 15, scale: 0.95, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, y: 0, scale: 1, height: 'auto', marginTop: 12 }}
      exit={{ opacity: 0, scale: 0.95, height: 0, marginTop: 0, transition: { duration: 0.2 } }}
      className="toast-wrapper"
      style={{ cursor: 'grab' }}
      whileTap={{ cursor: 'grabbing' }}
    >
      <div className={`toast-item ${type}`}>
        <div className="toast-content">
          <div className="toast-icon-wrapper">
            {icons[type]}
          </div>
          <div className="toast-message">{message}</div>
          <button className="toast-close" onClick={() => onClose(id)}>
            <X size={16} />
          </button>
        </div>
        
        {/* Timeline / Progress Bar */}
        <div className="toast-timeline">
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ width: 0 }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className={`toast-progress ${type}`}
          />
        </div>
      </div>
    </motion.div>
  );
};

export const ToastContainer: React.FC<{ toasts: any[], removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((toast) => (
          <Toast 
            key={toast.id} 
            {...toast} 
            onClose={removeToast} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
