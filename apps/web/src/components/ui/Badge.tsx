// ============================================================
// OneFlesh — Badge & Pill Components (dark theme)
// ============================================================

import React from 'react';

type BadgeVariant = 'gold' | 'crimson' | 'green' | 'pending' | 'verified';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  gold:     'bg-[#fed7b8] text-[#2C0F12]',
  crimson:  'bg-[rgba(107,30,35,0.10)] text-[#6B1E23] border border-[rgba(107,30,35,0.22)]',
  green:    'bg-green-50 text-green-700 border border-green-200',
  pending:  'bg-[rgba(201,168,76,0.15)] text-[#8a6a00]',
  verified: 'bg-green-50 text-green-700 border border-green-200',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'gold', children, className = '' }) => {
  return (
    <span
      className={[
        'inline-block px-2.5 py-0.5 rounded-[10px] text-[10px] font-semibold tracking-[0.06em] uppercase',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
};

type PillVariant = 'active' | 'completed' | 'dissolved' | 'pending' | 'confirmed';

interface PillProps {
  variant?: PillVariant;
  children: React.ReactNode;
  className?: string;
}

const pillVariantClasses: Record<PillVariant, string> = {
  active:    'bg-[rgba(107,30,35,0.10)] text-[#6B1E23] border border-[rgba(107,30,35,0.20)]',
  completed: 'bg-green-50 text-green-700 border border-green-200',
  dissolved: 'bg-red-50 text-red-600 border border-red-200',
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed: 'bg-green-50 text-green-700 border border-green-200',
};

export const Pill: React.FC<PillProps> = ({ variant = 'active', children, className = '' }) => {
  return (
    <span
      className={[
        'inline-block px-2.5 py-0.5 rounded-[10px] text-[10px] tracking-[0.04em]',
        pillVariantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
};
