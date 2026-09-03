// ============================================================
// OneFlesh — Profile Detail Modal (Crimson Velvet + White)
// ============================================================

import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import type { Profile, Endorsement } from '@oneflesh/shared';

const C = {
  dark:   '#2C0F12',
  mid:    '#6B1E23',
  muted:  '#9a6060',
} as const;

interface ProfileModalProps {
  profile: Profile | null;
  open: boolean;
  onClose: () => void;
  onExpressInterest?: (profileId: string) => void;
  onShortlist?: (profileId: string) => void;
}

const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80';

export const ProfileModal = ({
  profile,
  open,
  onClose,
  onExpressInterest,
  onShortlist,
}: ProfileModalProps) => {
  if (!profile) return null;

  const photo = profile.photoUrl ?? FALLBACK_PHOTO;
  const endorsements = Array.isArray(profile.endorsements) ? (profile.endorsements as Endorsement[]) : [];

  return (
    <Modal open={open} onClose={onClose}>
      {/* Photo hero */}
      <div className="h-[250px] relative overflow-hidden">
        <img src={photo} alt={profile.fullName} className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(44,15,18,0.88)]" />
        <div className="absolute bottom-4 left-5 right-5">
          <div className="font-display text-[26px] font-normal" style={{ color: '#fed7b8' }}>{profile.fullName}</div>
          <div className="text-[13px] mt-1" style={{ color: 'rgba(254,215,184,0.70)' }}>
            {profile.age} yrs · {profile.city}, {profile.state} ·{' '}
            {profile.seeking === 'BRIDE' ? 'Seeking Bride' : 'Seeking Groom'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <p className="text-[10px] font-medium tracking-[0.08em] uppercase mb-1.5" style={{ color: C.mid }}>
          Church
        </p>
        <p className="text-[14px] font-medium mb-4" style={{ color: C.dark }}>
          {profile.church?.name ?? '—'}
        </p>

        {profile.education && (
          <>
            <p className="text-[10px] font-medium tracking-[0.08em] uppercase mb-1.5" style={{ color: C.mid }}>
              Education & Occupation
            </p>
            <p className="text-[13px] mb-4" style={{ color: C.muted }}>
              {profile.education} · {profile.occupation ?? '—'}
            </p>
          </>
        )}

        <p className="text-[10px] font-medium tracking-[0.08em] uppercase mb-1.5" style={{ color: C.mid }}>
          Pastoral Recommendation
        </p>
        <p className="text-[13px] italic font-light leading-relaxed mb-4" style={{ color: C.muted }}>
          &ldquo;{profile.pastorRecommendation}&rdquo;
        </p>

        {profile.ministryInvolvement && (
          <>
            <p className="text-[10px] font-medium tracking-[0.08em] uppercase mb-1.5" style={{ color: C.mid }}>
              Ministry Involvement
            </p>
            <p className="text-[13px] font-light leading-relaxed mb-4" style={{ color: C.muted }}>
              {profile.ministryInvolvement}
            </p>
          </>
        )}

        {endorsements.length > 0 && (
          <>
            <p className="text-[10px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: C.mid }}>
              Congregation Endorsements
            </p>
            <div className="space-y-2 mb-4">
              {endorsements.map((e, i) => (
                <div key={i} className="text-[12px] font-light" style={{ color: C.muted }}>
                  <span className="font-medium" style={{ color: C.mid }}>
                    {e.endorserName} ({e.endorserRole}):
                  </span>{' '}
                  &ldquo;{e.endorsementText}&rdquo;
                </div>
              ))}
              <div className="text-[11px] mt-1" style={{ color: C.mid }}>{endorsements.length} total endorsements</div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 px-6 pb-5">
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={() => { onExpressInterest?.(profile.id); onClose(); }}
        >
          Express Interest
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => { onShortlist?.(profile.id); onClose(); }}
        >
          Shortlist
        </Button>
      </div>
    </Modal>
  );
};
