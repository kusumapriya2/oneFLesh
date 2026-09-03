// ============================================================
// OneFlesh — Modal Component (dark theme)
// ============================================================

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  title?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  maxWidth = 'max-w-[580px]',
  title,
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center px-4 pt-9 pb-6 overflow-y-auto bg-black/70"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative ${maxWidth} w-full rounded-[13px] animate-[fadeIn_0.26s_ease] overflow-hidden`}
        style={{
          background: '#ffffff',
          border: '1px solid rgba(107,30,35,0.14)',
          boxShadow: '0 20px 80px rgba(44,15,18,0.18)',
        }}
      >
        {title && (
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid rgba(107,30,35,0.10)' }}
          >
            <h2 className="font-display text-xl font-medium" style={{ color: '#2C0F12' }}>{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ color: '#9a6060' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(107,30,35,0.07)'; e.currentTarget.style.color = '#2C0F12'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9a6060'; }}
            >
              <X size={18} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ background: 'rgba(107,30,35,0.08)', color: '#6B1E23' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(107,30,35,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(107,30,35,0.08)'; }}
          >
            <X size={16} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
};
