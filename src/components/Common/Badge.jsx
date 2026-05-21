import React from 'react';
 
export default function Badge({ type, children }) {
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    purple: '#8b5cf6',
    gray: '#6b7280',
  };
 
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '12px',
        background: colors[type] || colors.gray,
        color: 'white',
        fontSize: '12px',
        fontWeight: '600',
      }}
    >
      {children}
    </span>
  );
}