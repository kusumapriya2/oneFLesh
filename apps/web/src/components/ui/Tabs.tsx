// ============================================================
// OneFlesh — Tabs Component (Crimson Velvet + White)
// ============================================================

import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  children?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab, onChange, children }) => {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);

  const handleChange = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  return (
    <div>
      <div
        className="flex gap-0.5 mb-6 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(107,30,35,0.12)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            className="whitespace-nowrap px-4 py-2.5 font-body text-[12px] tracking-[0.04em] cursor-pointer border-b-2 -mb-px transition-all duration-150"
            style={
              active === tab.id
                ? { color: '#2C0F12', borderBottomColor: '#6B1E23', fontWeight: 600 }
                : { color: '#9a6060', borderBottomColor: 'transparent' }
            }
            onMouseEnter={(e) => {
              if (active !== tab.id) e.currentTarget.style.color = '#6B1E23';
            }}
            onMouseLeave={(e) => {
              if (active !== tab.id) e.currentTarget.style.color = '#9a6060';
            }}
          >
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span
                className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: 'rgba(107,30,35,0.10)',
                  color: '#6B1E23',
                  border: '1px solid rgba(107,30,35,0.20)',
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
};

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
}

export const TabPanel: React.FC<TabPanelProps> = ({ id, activeTab, children }) => {
  if (id !== activeTab) return null;
  return <div className="animate-[fadeIn_0.22s_ease]">{children}</div>;
};
