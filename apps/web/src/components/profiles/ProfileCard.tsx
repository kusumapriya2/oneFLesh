// ============================================================
// OneFlesh — ProfileCard Component (Crimson Velvet + White)
// ============================================================

import React from 'react';
import type { Profile } from '@oneflesh/shared';

interface ProfileCardProps {
  profile: Profile;
  onClick?: () => void;
  showActions?: boolean;
  onPause?: () => void;
  onEdit?: () => void;
}

// Palette
const C = {
  white:   '#ffffff',
  dark:    '#2C0F12',
  mid:     '#6B1E23',
  accent:  '#fed7b8',
  heading: '#2C0F12',
  body:    '#4a1a1e',
  muted:   '#9a6060',
  border:  'rgba(107,30,35,0.12)',
  shadow:  '0 2px 12px rgba(44,15,18,0.07)',
} as const;

function EndorsementDots({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '999px',
            background: i < count ? C.mid : 'rgba(107,30,35,0.15)',
          }}
        />
      ))}
    </div>
  );
}

const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80';

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onClick,
  showActions = false,
  onPause,
  onEdit,
}) => {
  const photo = profile.photoUrl ?? FALLBACK_PHOTO;
  const churchShort = profile.church?.name.split(' ').slice(0, 2).join(' ') ?? '';
  const endorsementCount = Array.isArray(profile.endorsements)
    ? profile.endorsements.length
    : 0;
  const testimonyPreview = profile.testimony
    ? `${profile.testimony.substring(0, 88)}…`
    : '';

  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: C.shadow,
        transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
      }}
      className="group hover:-translate-y-[2px] hover:shadow-[0_6px_24px_rgba(44,15,18,0.14)] hover:border-[rgba(107,30,35,0.25)]"
      onClick={onClick}
    >
      {/* Photo area */}
      <div className="h-[210px] relative overflow-hidden">
        <img
          src={photo}
          alt={profile.fullName}
          loading="lazy"
          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {/* Gradient overlay — dark crimson at bottom */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 40%, rgba(44,15,18,0.75) 100%)',
          }}
        />
        {/* Seeking badge */}
        <div
          className="absolute top-2.5 right-2.5 text-[10px] font-semibold tracking-[0.06em] px-2.5 py-1 rounded-[10px] uppercase"
          style={{ background: C.accent, color: C.dark }}
        >
          {profile.seeking === 'BRIDE' ? 'Seeking Bride' : 'Seeking Groom'}
        </div>
        {/* Status badge — only shown for non-approved profiles */}
        {profile.status !== 'APPROVED' && (
          <div
            className="absolute top-2.5 left-2.5 text-[9px] font-bold tracking-[0.08em] px-2 py-1 rounded-[6px] uppercase"
            style={{
              background: profile.status === 'PENDING'
                ? 'rgba(234,179,8,0.92)'
                : profile.status === 'PAUSED'
                ? 'rgba(100,116,139,0.92)'
                : 'rgba(239,68,68,0.92)',
              color: '#ffffff',
              backdropFilter: 'blur(2px)',
            }}
          >
            {profile.status === 'PENDING' ? '⏳ Pending Approval' : profile.status}
          </div>
        )}
        {/* Church name */}
        <div
          className="absolute bottom-2.5 left-2.5 text-[11px]"
          style={{ color: 'rgba(255,255,255,0.88)' }}
        >
          ⛪ {churchShort}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div
          className="font-display text-[19px]"
          style={{ color: C.heading, fontWeight: 400, lineHeight: 1.2 }}
        >
          {profile.fullName}
        </div>
        <div className="text-[13px] mt-0.5" style={{ color: C.muted }}>
          {profile.age} yrs · {profile.city} · {profile.state}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {profile.occupation && (
            <span
              className="text-[11px] px-2 py-0.5 rounded-[10px]"
              style={{
                background: 'rgba(107,30,35,0.08)',
                color: C.mid,
                border: `1px solid ${C.border}`,
              }}
            >
              {profile.occupation}
            </span>
          )}
          {profile.yearsInChurch && (
            <span
              className="text-[11px] px-2 py-0.5 rounded-[10px]"
              style={{
                background: 'rgba(107,30,35,0.08)',
                color: C.mid,
                border: `1px solid ${C.border}`,
              }}
            >
              {profile.yearsInChurch}y in church
            </span>
          )}
        </div>

        {/* Testimony preview */}
        {testimonyPreview && (
          <div
            className="text-[12px] italic leading-relaxed mt-2.5 pt-2.5"
            style={{
              color: '#7a4a4e',
              borderTop: `1px solid ${C.border}`,
            }}
          >
            {testimonyPreview}
          </div>
        )}

        {/* Endorsements */}
        <div className="flex items-center gap-1.5 mt-2.5">
          <EndorsementDots count={endorsementCount} />
          <span className="text-[11px]" style={{ color: C.muted }}>
            {endorsementCount} endorsements
          </span>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-1.5 mt-3">
            <button
              className="flex-1 text-[10px] font-light tracking-widest uppercase py-1.5 px-3 rounded-full transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: '#2C0F12',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#ffffff',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 3px 10px rgba(44,15,18,0.45)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3d1015';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2C0F12';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
              }}
              onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            >
              Edit
            </button>
            <button
              className="flex-1 text-[10px] font-light tracking-widest uppercase py-1.5 px-3 rounded-full transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: '#2C0F12',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#ffffff',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 3px 10px rgba(44,15,18,0.45)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3d1015';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2C0F12';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
              }}
              onClick={(e) => { e.stopPropagation(); onPause?.(); }}
            >
              Pause
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
