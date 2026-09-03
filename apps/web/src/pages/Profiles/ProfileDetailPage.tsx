// ============================================================
// OneFlesh — Profile Detail Page (Crimson Velvet + White)
// ============================================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Building2, BookOpen, Heart, Bookmark, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageWrapper } from '../../components/layout/PageWrapper.js';
import { profilesApi, alliancesApi } from '../../services/api.js';
import { useAuthStore } from '../../stores/authStore.js';
import type { Profile, Endorsement } from '@oneflesh/shared';

const C = {
  dark:    '#2C0F12',
  mid:     '#6B1E23',
  accent:  '#fed7b8',
  muted:   '#9a6060',
  body:    '#4a1a1e',
  white:   '#ffffff',
  border:  'rgba(107,30,35,0.12)',
  borderMid: 'rgba(107,30,35,0.22)',
  skeleton: 'rgba(107,30,35,0.08)',
  shadow:  '0 4px 20px rgba(44,15,18,0.09)',
} as const;

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80';

function EndorsementCard({ endorsement }: { endorsement: Endorsement }) {
  return (
    <div className="rounded-lg p-4" style={{ background: C.white, border: `1px solid ${C.border}` }}>
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(107,30,35,0.08)' }}
        >
          <span className="font-semibold text-sm" style={{ color: C.mid }}>
            {endorsement.endorserName?.charAt(0) ?? '?'}
          </span>
        </div>
        <div>
          <div className="font-medium text-[14px]" style={{ color: C.dark }}>{endorsement.endorserName}</div>
          <div className="text-[12px]" style={{ color: C.mid }}>{endorsement.endorserRole}</div>
          {endorsement.endorsementText && (
            <p className="text-[13px] font-light italic mt-1.5 leading-relaxed" style={{ color: C.muted }}>
              "{endorsement.endorsementText}"
            </p>
          )}
        </div>
        <div className="ml-auto flex-shrink-0">
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(107,30,35,0.10)' }}>
            <Check size={11} style={{ color: C.mid }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <PageWrapper>
      <div className="max-w-[860px] mx-auto px-6 py-10 animate-pulse">
        <div className="h-6 w-24 rounded mb-8" style={{ background: C.skeleton }} />
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          <div className="h-[380px] rounded-xl" style={{ background: C.skeleton }} />
          <div className="space-y-4">
            <div className="h-8 rounded w-48" style={{ background: C.skeleton }} />
            <div className="h-4 rounded w-64" style={{ background: C.skeleton }} />
            <div className="h-4 rounded w-56" style={{ background: C.skeleton }} />
            <div className="h-24 rounded mt-4" style={{ background: C.skeleton }} />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [interestSent, setInterestSent] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => profilesApi.get(id!),
    enabled: !!id,
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const profile = data?.data?.data as Profile | undefined;

  const interestMutation = useMutation({
    mutationFn: () => alliancesApi.create({ profile1Id: undefined, profile2Id: id }),
    onSuccess: () => {
      setInterestSent(true);
      toast.success('Interest expressed! The receiving pastor will be notified.');
      void queryClient.invalidateQueries({ queryKey: ['alliances'] });
    },
    onError: () => toast.error('Could not send interest. Please try again.'),
  });

  const shortlistMutation = useMutation({
    mutationFn: () => profilesApi.addShortlist(id!),
    onSuccess: () => { setShortlisted(true); toast.success('Added to shortlist'); },
    onError: () => toast.error('Could not shortlist. Please try again.'),
  });

  if (isLoading) return <Skeleton />;

  if (isError || !profile) {
    return (
      <PageWrapper>
        <div className="max-w-[860px] mx-auto px-6 py-20 text-center">
          <div className="text-[40px] mb-4">😔</div>
          <h2 className="font-display text-[28px] mb-2" style={{ color: C.dark }}>Profile Not Found</h2>
          <p className="mb-6" style={{ color: C.muted }}>
            This profile may have been removed or is no longer available.
          </p>
          <button
            onClick={() => void navigate('/profiles')}
            className="px-7 py-2.5 rounded-full text-[12px] font-light tracking-widest uppercase transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: '#2C0F12', color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 18px rgba(44,15,18,0.50)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#3d1015'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#2C0F12'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
          >
            Browse Profiles
          </button>
        </div>
      </PageWrapper>
    );
  }

  const endorsements = Array.isArray(profile.endorsements) ? (profile.endorsements as Endorsement[]) : [];

  return (
    <PageWrapper>
      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* Back button */}
        <button
          onClick={() => void navigate(-1)}
          className="flex items-center gap-1.5 text-[13px] transition-colors mb-7"
          style={{ color: C.muted }}
          onMouseEnter={(e) => { e.currentTarget.style.color = C.mid; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
        >
          <ArrowLeft size={15} />
          Back to Profiles
        </button>

        {/* Main card */}
        <div className="rounded-xl overflow-hidden" style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>

          {/* Hero area */}
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]">

            {/* Photo */}
            <div className="relative h-[360px] md:h-full min-h-[320px]">
              <img
                src={profile.photoUrl ?? FALLBACK_PHOTO}
                alt={profile.fullName}
                className="w-full h-full object-cover object-top"
              />
              {/* Seeking badge */}
              <div
                className="absolute top-3 right-3 text-[10px] font-semibold tracking-[0.06em] px-2.5 py-1 rounded-[10px] uppercase"
                style={{ background: '#fed7b8', color: '#2C0F12' }}
              >
                {profile.seeking === 'BRIDE' ? 'Seeking Bride' : 'Seeking Groom'}
              </div>
              {/* Status badge */}
              {profile.status === 'APPROVED' && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-green-600/90 text-white text-[10px] font-medium px-2 py-1 rounded-full">
                  <Check size={10} />
                  Pastor Approved
                </div>
              )}
            </div>

            {/* Profile info */}
            <div className="p-7">
              <h1 className="font-display text-[32px] font-normal leading-tight" style={{ color: C.dark }}>
                {profile.fullName}
              </h1>
              <p className="text-[14px] mt-1" style={{ color: C.muted }}>
                {profile.age} years old
              </p>

              {/* Meta chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.city && profile.state && (
                  <span
                    className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full"
                    style={{ color: C.muted, background: 'rgba(107,30,35,0.05)', border: `1px solid ${C.border}` }}
                  >
                    <MapPin size={11} />
                    {profile.city}, {profile.state}
                  </span>
                )}
                {profile.occupation && (
                  <span
                    className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full"
                    style={{ color: C.muted, background: 'rgba(107,30,35,0.05)', border: `1px solid ${C.border}` }}
                  >
                    💼 {profile.occupation}
                  </span>
                )}
                {profile.education && (
                  <span
                    className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full"
                    style={{ color: C.muted, background: 'rgba(107,30,35,0.05)', border: `1px solid ${C.border}` }}
                  >
                    <BookOpen size={11} />
                    {profile.education}
                  </span>
                )}
              </div>

              {/* Church */}
              {profile.church && (
                <div className="mt-4 flex items-start gap-2">
                  <Building2 size={15} style={{ color: C.mid, marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: C.dark }}>{profile.church.name}</div>
                    <div className="text-[12px]" style={{ color: C.muted }}>{profile.church.denomination}</div>
                    {profile.yearsInChurch && (
                      <div className="text-[12px]" style={{ color: C.muted }}>{profile.yearsInChurch} years in congregation</div>
                    )}
                  </div>
                </div>
              )}

              {/* Ministry */}
              {profile.ministryInvolvement && (
                <div className="mt-3">
                  <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: C.mid }}>Ministry</span>
                  <p className="text-[13px] mt-0.5" style={{ color: C.muted }}>{profile.ministryInvolvement}</p>
                </div>
              )}

              {/* Endorsement dots */}
              {endorsements.length > 0 && (
                <div className="flex items-center gap-1.5 mt-4">
                  {endorsements.map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full" style={{ background: C.mid }} />
                  ))}
                  <span className="text-[12px] ml-1" style={{ color: C.muted }}>
                    {endorsements.length} elder endorsement{endorsements.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* CTA buttons */}
              {isAuthenticated && (
                <div className="flex gap-2.5 mt-6">
                  <button
                    onClick={() => interestMutation.mutate()}
                    disabled={interestSent || interestMutation.isPending}
                    className="flex items-center gap-1.5 text-[12px] font-light tracking-widest uppercase px-6 py-2.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                    style={{
                      background: '#2C0F12', color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.10)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 18px rgba(44,15,18,0.50)',
                    }}
                    onMouseEnter={(e) => { if (!interestSent && !interestMutation.isPending) { (e.currentTarget as HTMLButtonElement).style.background = '#3d1015'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.18)'; }}}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2C0F12'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.10)'; }}
                  >
                    <Heart size={14} />
                    {interestSent ? 'Interest Sent' : interestMutation.isPending ? 'Sending…' : 'Express Interest'}
                  </button>
                  <button
                    onClick={() => shortlistMutation.mutate()}
                    disabled={shortlisted || shortlistMutation.isPending}
                    className="flex items-center gap-1.5 text-[12px] font-light tracking-widest uppercase px-6 py-2.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                    style={{
                      background: '#2C0F12', color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.10)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 18px rgba(44,15,18,0.50)',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#3d1015'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.18)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2C0F12'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.10)'; }}
                  >
                    <Bookmark size={14} />
                    {shortlisted ? 'Shortlisted' : 'Shortlist'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Testimony */}
          {profile.testimony && (
            <div className="px-7 py-6" style={{ borderTop: `1px solid ${C.border}` }}>
              <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] mb-3" style={{ color: C.mid }}>
                Personal Testimony
              </h2>
              <blockquote
                className="text-[14px] font-light italic leading-[1.8] pl-4"
                style={{ color: C.muted, borderLeft: `2px solid ${C.mid}` }}
              >
                {profile.testimony}
              </blockquote>
            </div>
          )}

          {/* Pastoral Recommendation */}
          {profile.pastorRecommendation && (
            <div className="px-7 py-6" style={{ borderTop: `1px solid ${C.border}`, background: 'rgba(107,30,35,0.03)' }}>
              <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] mb-3" style={{ color: C.mid }}>
                Pastoral Recommendation
              </h2>
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(107,30,35,0.08)' }}
                >
                  <span style={{ color: C.mid }}>✝</span>
                </div>
                <p className="text-[14px] font-light leading-relaxed" style={{ color: C.muted }}>
                  {profile.pastorRecommendation}
                </p>
              </div>
            </div>
          )}

          {/* Family Background */}
          {profile.fatherName && (
            <div className="px-7 py-6" style={{ borderTop: `1px solid ${C.border}` }}>
              <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] mb-3" style={{ color: C.mid }}>
                Family Background
              </h2>
              <div>
                <div className="text-[11px] uppercase tracking-wide" style={{ color: C.muted }}>Father</div>
                <div className="text-[14px] mt-0.5" style={{ color: C.dark }}>{profile.fatherName}</div>
              </div>
            </div>
          )}

          {/* Endorsements */}
          {endorsements.length > 0 && (
            <div className="px-7 py-6" style={{ borderTop: `1px solid ${C.border}` }}>
              <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] mb-4" style={{ color: C.mid }}>
                Elder Endorsements
              </h2>
              <div className="space-y-3">
                {endorsements.map((e, i) => (
                  <EndorsementCard key={i} endorsement={e} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scripture */}
        <p className="text-center text-[12px] font-light italic mt-8" style={{ color: C.muted }}>
          "He who finds a wife finds a good thing and obtains favour from the LORD." — Proverbs 18:22
        </p>
      </div>
    </PageWrapper>
  );
}
