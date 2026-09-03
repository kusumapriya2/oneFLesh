// ============================================================
// OneFlesh — Footer
// ============================================================

import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-crimson-deep px-9 pt-12 pb-7 mt-[72px]">
      <div className="max-w-[1080px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10">
          {/* Brand */}
          <div>
            <div className="font-display text-[20px] text-gold-light mb-3">
              One<em className="font-light italic">Flesh</em>
            </div>
            <p className="text-[13px] text-white/75 leading-relaxed font-light">
              A pastor-led matrimonial platform for Reformed churches in India. Building covenant
              marriages rooted in faith.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-[11px] font-semibold tracking-[0.13em] uppercase text-gold-light mb-4">
              Platform
            </h4>
            {[
              { label: 'Browse Profiles', to: '/profiles' },
              { label: 'Wedding Services', to: '/vendors' },
              { label: 'Counselling', to: '/counselling' },
              { label: 'Dashboard', to: '/dashboard' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block text-[13px] text-white/75 mb-2 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Churches */}
          <div>
            <h4 className="text-[11px] font-semibold tracking-[0.13em] uppercase text-gold-light mb-4">
              Churches
            </h4>
            {[
              { label: 'Register Church', to: '/register-church' },
              { label: 'Add Profile', to: '/profiles/add' },
              { label: 'Guidelines', to: '/guidelines' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block text-[13px] text-white/75 mb-2 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] font-semibold tracking-[0.13em] uppercase text-gold-light mb-4">
              Contact
            </h4>
            <p className="text-[13px] text-white/75 mb-2">contact@oneflesh.in</p>
            <p className="text-[13px] text-white/75 mb-3">+91 98765 43210</p>
            <Link to="/privacy" className="block text-[13px] text-white/75 hover:text-white transition-colors mb-2">
              Privacy Policy
            </Link>
            <Link to="/terms" className="block text-[13px] text-white/75 hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>

        <div className="border-t border-gold/20 mt-10 pt-5 text-center text-[12px] text-white/55">
          © {new Date().getFullYear()} OneFlesh · Built for Reformed churches across India · All alliances pastoral-approved
        </div>
      </div>
    </footer>
  );
};
