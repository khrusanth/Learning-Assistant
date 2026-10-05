/**
 * Toast Notification Component
 * Auto-dismisses after 4 seconds.
 */
import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export const Toast = () => {
  const { state, hideToast } = useAppContext();
  const toast = state.toast;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(hideToast, 4000);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  if (!toast) return null;

  const Icon = iconMap[toast.type] || Info;

  return (
    <div className="toast-container">
      <div className="toast" role="alert">
        <div className={`toast-icon ${toast.type}`}>
          <Icon size={20} />
        </div>
        <span className="toast-message">{toast.message}</span>
        <button className="toast-close" onClick={hideToast} aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
