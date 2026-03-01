import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { ToastContainer } from './Toast.tsx';
import { useUI } from '../../context/UIContext';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { isCartOpen } = useUI();

  // Clear toasts when cart is opened
  useEffect(() => {
    if (isCartOpen) {
      setToasts([]);
    }
  }, [isCartOpen]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts((prev) => {
      // Prevent spamming the exact same message
      const isDuplicate = prev.some(t => t.message === message);
      if (isDuplicate) return prev;

      const isMobile = window.innerWidth <= 768;
      const limit = isMobile ? 1 : 2;
      
      const newToasts = [...prev, { id, message, type, duration }];
      
      if (newToasts.length > limit) {
        return newToasts.slice(newToasts.length - limit);
      }
      return newToasts;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};
