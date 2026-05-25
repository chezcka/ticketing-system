import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Common/Toast';
 
const ToastContext = createContext();
 
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
 
  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    
    // ✅ Replace previous toasts - only show one at a time
    setToasts([{ id, message, type, duration }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
 
    return id;
  }, []);
 
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
 
  const success = (message) => addToast(message, 'success', 4000);
  const error = (message) => addToast(message, 'error', 5000);
  const warning = (message) => addToast(message, 'warning', 4000);
  const info = (message) => addToast(message, 'info', 4000);
 
  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
 
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};