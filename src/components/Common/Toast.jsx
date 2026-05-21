import React, { useEffect, useState } from 'react';
import './Toast.css';
 
export default function Toast({ 
  type = 'info', 
  message = '', 
  duration = 4000, 
  onClose 
}) {
  const [isVisible, setIsVisible] = useState(true);
 
  useEffect(() => {
    if (!message) return;
 
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);
 
    return () => clearTimeout(timer);
  }, [duration, message, onClose]);
 
  if (!isVisible || !message) return null;
 
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };
 
  return (
    <div className={`toast toast-${type}`} role="alert">
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      <button 
        className="toast-close" 
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}