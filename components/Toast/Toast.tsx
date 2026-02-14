import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 4000, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Добавяме клас за изходна анимация, след нея премахваме
      if (ref.current) {
        ref.current.classList.add('removing');
        setTimeout(() => onClose(id), 200);
      } else {
        onClose(id);
      }
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = () => {
    if (ref.current) {
      ref.current.classList.add('removing');
      setTimeout(() => onClose(id), 200);
    } else {
      onClose(id);
    }
  };

  const Icon = iconMap[type];

  return (
    <div ref={ref} className={`toast-item ${type}`}>
      <div className="toast-content">
        <div className="toast-icon-wrapper">
          <Icon className={`toast-icon ${type}`} size={20} />
        </div>
        <div className="toast-message">{message}</div>
        <button className="toast-close" onClick={handleClose}>
          <X size={16} />
        </button>
      </div>
      <div className="toast-timeline">
        <div
          className={`toast-progress ${type}`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
};

// Контейнерът се рендерира чрез React Portal директно в body,
// за да не се влияе от transform/overflow на родителски елементи.
function getPortalRoot(): HTMLElement {
  let el = document.getElementById('toast-portal-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-portal-root';
    document.body.appendChild(el);
  }
  return el;
}

export const ToastContainer: React.FC<{
  toasts: { id: string; message: string; type: string; duration?: number }[];
  removeToast: (id: string) => void;
}> = ({ toasts, removeToast }) => {
  return createPortal(
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type as any}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </>,
    getPortalRoot()
  );
};
