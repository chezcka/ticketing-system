import React from 'react';
import './Alert.css';
 
export default function Alert({ type = 'info', message, onClose, duration = 5000 }) {
  const [isVisible, setIsVisible] = React.useState(true);
 
  React.useEffect(() => {
    if (!duration) return;
 
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);
 
    return () => clearTimeout(timer);
  }, [duration, onClose]);
 
  if (!isVisible) return null;
 
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };
 
  return (
    <div className={`alert alert-${type}`}>
      <span className="alert-icon">{icons[type]}</span>
      <span className="alert-message">{message}</span>
      <button 
        className="alert-close"
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
      >
        ✕
      </button>
    </div>
  );
}