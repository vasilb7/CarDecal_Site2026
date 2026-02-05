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
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      className={`toast-item ${type}`}
    >
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
    </motion.div>
  );
};

export const ToastContainer: React.FC<{ toasts: any[], removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      <AnimatePresence>
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
