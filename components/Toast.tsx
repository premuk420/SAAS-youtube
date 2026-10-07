'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'info' | 'warning' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastStyles: Record<ToastType, { border: string; dot: string; icon: string }> = {
  success: { border: '#16a34a', dot: '#16a34a', icon: '✓' },
  error:   { border: '#dc2626', dot: '#dc2626', icon: '✕' },
  warning: { border: '#d97706', dot: '#d97706', icon: '!' },
  info:    { border: '#6366f1', dot: '#6366f1', icon: 'i' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
          display: 'flex', flexDirection: 'column', gap: '8px',
          maxWidth: '340px', width: '100%', pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const s = toastStyles[toast.type];
          return (
            <div
              key={toast.id}
              className="animate-slide-in"
              style={{
                pointerEvents: 'auto',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '12px', padding: '10px 14px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderLeft: `3px solid ${s.border}`,
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: s.dot, color: 'white',
                  fontSize: '10px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {s.icon}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {toast.message}
                </span>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px', padding: '0 2px', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
