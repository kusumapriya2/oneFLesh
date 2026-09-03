// ============================================================
// OneFlesh — Button Component (dark theme)
// ============================================================

import React from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

// Shared crimson velvet pill base — dark crimson bg, clean white thin text
const VELVET =
  'text-white bg-[#2C0F12] border border-[rgba(255,255,255,0.10)] ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_18px_rgba(44,15,18,0.55)] ' +
  'hover:bg-[#3d1015] hover:border-[rgba(255,255,255,0.18)] ' +
  'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_26px_rgba(44,15,18,0.65)] ' +
  'hover:-translate-y-0.5 active:translate-y-0';

const variantClasses: Record<Variant, string> = {
  primary: VELVET,
  outline:  VELVET,
  ghost:    VELVET,
  dark:     VELVET,
  // Keep danger visually distinct (destructive action)
  danger:
    'bg-[#3d0808] text-red-300 border border-red-800/55 ' +
    'hover:bg-[#4d0a0a] hover:border-red-700/70 hover:-translate-y-0.5 ' +
    'shadow-[inset_0_1px_0_rgba(255,100,100,0.08),0_2px_10px_rgba(80,0,0,0.40)]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-1.5 text-xs',
  md: 'px-9 py-3 text-sm',
  lg: 'px-10 py-3.5 text-sm',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2',
        'font-body font-light tracking-widest uppercase',
        'rounded-full transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};
