// ============================================================
// OneFlesh — Page Wrapper Layout (dark theme)
// ============================================================

import React from 'react';
import { Header } from './Header.js';
import { Footer } from './Footer.js';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  noFooter?: boolean;
  noHeader?: boolean;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  className = '',
  noFooter = false,
  noHeader = false,
}) => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#fdf9f7' }}>
      {!noHeader && <Header />}
      <main className={`flex-1 ${className}`}>{children}</main>
      {!noFooter && <Footer />}
    </div>
  );
};

// ─── Section helper ───────────────────────────────────────────
interface SectionProps {
  children: React.ReactNode;
  className?: string;
  bg?: 'cream' | 'white' | 'crimson' | 'warm-white' | 'raised';
}

export const Section: React.FC<SectionProps> = ({ children, className = '', bg = 'cream' }) => {
  const bgClasses = {
    cream: 'bg-cream',
    white: 'bg-warm-white',
    crimson: 'bg-crimson-deep',
    'warm-white': 'bg-warm-white',
    raised: 'bg-[#260810]',
  };

  return (
    <section className={`${bgClasses[bg]} py-[68px] px-9 ${className}`}>
      <div className="max-w-[1080px] mx-auto">{children}</div>
    </section>
  );
};

// ─── Section header helper ────────────────────────────────────
interface SectionHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
  light?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  label,
  title,
  subtitle,
  light = false,
}) => {
  return (
    <div className="text-center mb-12">
      {label && (
        <div
          className={`text-[11px] font-medium tracking-[0.14em] uppercase mb-2.5 ${
            light ? 'text-gold-light' : 'text-gold'
          }`}
        >
          {label}
        </div>
      )}
      <h2
        className={`font-display text-[clamp(30px,4vw,46px)] font-normal leading-[1.2] ${
          light ? 'text-gold-light' : 'text-gold-light'
        }`}
        dangerouslySetInnerHTML={{ __html: title }}
      />
      {subtitle && (
        <p className={`text-[14px] font-light leading-[1.7] max-w-[540px] mx-auto mt-3 ${
          light ? 'text-text-muted' : 'text-text-muted'
        }`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
