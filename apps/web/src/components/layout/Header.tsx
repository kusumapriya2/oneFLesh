// ============================================================
// OneFlesh — Header / Navigation
// ============================================================

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Menu, X, LogOut, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore.js';
import { useNotificationStore } from '../../stores/notificationStore.js';
import { authApi } from '../../services/api.js';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Profiles', path: '/profiles' },
  { label: 'Services', path: '/vendors' },
  { label: 'Counselling', path: '/counselling' },
  { label: 'Dashboard', path: '/dashboard' },
];

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, clearAuth } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // continue regardless
    }
    clearAuth();
    toast.success('Logged out successfully');
    void navigate('/login');
  };

  return (
    <header className="bg-crimson-deep sticky top-0 z-[200] border-b border-gold/22 h-[62px] flex items-center px-9 justify-between">
      {/* Logo */}
      <Link
        to="/"
        className="font-display text-[21px] font-semibold text-gold-light tracking-[0.03em] hover:text-gold transition-colors"
      >
        One<em className="font-light not-italic italic">Flesh</em>
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden md:flex gap-0.5">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={[
              'text-[12px] font-normal tracking-[0.07em] uppercase px-3 py-1.5 rounded cursor-pointer transition-all duration-200',
              location.pathname === link.path
                ? 'text-white bg-gold/15 font-semibold'
                : 'text-white/80 hover:text-white hover:bg-gold/10',
            ].join(' ')}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            {/* Notifications */}
            <Link to="/notifications" className="relative text-white/80 hover:text-white transition-colors">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-crimson-deep text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center text-gold-light hover:bg-gold/30 transition-colors"
              >
                <span className="text-sm font-semibold">P</span>
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 rounded-lg min-w-[160px] py-1"
                  style={{
                    background: '#ffffff',
                    border: '1px solid rgba(107,30,35,0.15)',
                    boxShadow: '0 8px 32px rgba(44,15,18,0.14)',
                  }}
                >
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-[13px] transition-colors"
                    style={{ color: '#2C0F12' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(107,30,35,0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings size={14} />
                    Settings
                  </Link>
                  <button
                    onClick={() => void handleLogout()}
                    className="w-full flex items-center gap-2 px-4 py-2 text-[13px] transition-colors"
                    style={{ color: '#6B1E23', fontWeight: 500 }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(107,30,35,0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-white/80 text-[12px] hover:text-white transition-colors tracking-[0.07em] uppercase"
            >
              Login
            </Link>
            <Link
              to="/register-church"
              className="text-[10px] font-light tracking-widest uppercase px-5 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: '#2C0F12', color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 3px 12px rgba(44,15,18,0.50)',
              }}
            >
              Register Church
            </Link>
          </>
        )}

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-white/80 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="absolute top-[62px] left-0 right-0 bg-crimson-deep border-t border-gold/20 md:hidden py-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="block px-6 py-2.5 text-[13px] text-white/80 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
