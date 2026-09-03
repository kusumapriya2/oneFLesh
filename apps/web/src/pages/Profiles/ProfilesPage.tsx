// ============================================================
// OneFlesh — Profiles Listing Page (Crimson Velvet + White)
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Sparkles } from 'lucide-react';
import type { Profile, PaginatedResponse } from '@oneflesh/shared';
// PaginatedResponse used in queryFn type annotation below
import { INDIAN_STATES } from '@oneflesh/shared';
import { profilesApi, alliancesApi } from '../../services/api.js';
import { ProfileCard } from '../../components/profiles/ProfileCard.js';
import { ProfileModal } from '../../components/profiles/ProfileModal.js';
import { PageWrapper } from '../../components/layout/PageWrapper.js';
import { Button } from '../../components/ui/Button.js';
import { useAuthStore } from '../../stores/authStore.js';

const C = {
  page:        '#fdf9f7',
  dark:        '#2C0F12',
  mid:         '#6B1E23',
  accent:      '#fed7b8',
  body:        '#4a1a1e',
  muted:       '#9a6060',
  white:       '#ffffff',
  border:      'rgba(107,30,35,0.12)',
  borderMid:   'rgba(107,30,35,0.22)',
  shadow:      '0 2px 12px rgba(44,15,18,0.07)',
  inputBg:     '#ffffff',
  inputBorder: 'rgba(107,30,35,0.18)',
  inputFocus:  'rgba(107,30,35,0.50)',
} as const;

// ─── Filter state ─────────────────────────────────────────────
interface ProfileFilters {
  q: string;
  seeking: string;
  state: string;
}

const INITIAL_FILTERS: ProfileFilters = { q: '', seeking: '', state: '' };

// ─── AI Smart Match Banner ─────────────────────────────────────
function AIBanner({ onGetMatches }: { onGetMatches: () => void }) {
  return (
    <div
      className="rounded-[10px] px-6 py-4 flex items-center justify-between gap-4 mb-6"
      style={{
        background: '#2C0F12',
        border: '1px solid rgba(254,215,184,0.15)',
        boxShadow: C.shadow,
      }}
    >
      <div className="flex items-center gap-3">
        <Sparkles style={{ color: '#fed7b8', width: 18, height: 18, flexShrink: 0 }} />
        <p className="font-body font-light text-[13px]" style={{ color: '#ffffff' }}>
          <span style={{ color: '#ffffff', fontWeight: 300 }}>✦ AI Smart Match Available</span>
          {' — '}Let our AI rank the best-compatible profiles for your candidate
        </p>
      </div>
      <Button variant="primary" size="sm" className="flex-shrink-0" onClick={onGetMatches}>
        Get AI Matches
      </Button>
    </div>
  );
}

// ─── Search Bar ────────────────────────────────────────────────
interface SearchBarProps {
  draft: ProfileFilters;
  onChange: (f: ProfileFilters) => void;
  onSearch: () => void;
}

function SearchBar({ draft, onChange, onSearch }: SearchBarProps) {
  const stateOptions = INDIAN_STATES as unknown as readonly string[];

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="flex flex-wrap gap-3 mb-5">
      {/* Text search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: C.muted }}
        />
        <input
          type="text"
          placeholder="Search by name, city, occupation…"
          value={draft.q}
          onChange={(e) => onChange({ ...draft, q: e.target.value })}
          onKeyDown={handleKey}
          className="w-full pl-9 pr-3 py-2.5 font-body text-[13px] rounded-[5px] outline-none transition-colors"
          style={{
            background: C.inputBg,
            border: `1px solid ${C.inputBorder}`,
            color: C.dark,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.inputFocus; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.inputBorder; }}
        />
      </div>

      {/* Seeking dropdown */}
      <select
        value={draft.seeking}
        onChange={(e) => onChange({ ...draft, seeking: e.target.value })}
        className="px-3 py-2.5 font-body text-[13px] rounded-[5px] outline-none cursor-pointer transition-colors"
        style={{
          background: C.inputBg,
          border: `1px solid ${C.inputBorder}`,
          color: C.dark,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = C.inputFocus; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = C.inputBorder; }}
      >
        <option value="" style={{ background: '#fff', color: C.dark }}>All</option>
        <option value="BRIDE" style={{ background: '#fff', color: C.dark }}>Seeking Bride</option>
        <option value="GROOM" style={{ background: '#fff', color: C.dark }}>Seeking Groom</option>
      </select>

      {/* State dropdown */}
      <select
        value={draft.state}
        onChange={(e) => onChange({ ...draft, state: e.target.value })}
        className="px-3 py-2.5 font-body text-[13px] rounded-[5px] outline-none cursor-pointer transition-colors min-w-[160px]"
        style={{
          background: C.inputBg,
          border: `1px solid ${C.inputBorder}`,
          color: C.dark,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = C.inputFocus; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = C.inputBorder; }}
      >
        <option value="" style={{ background: '#fff', color: C.dark }}>All States</option>
        {stateOptions.map((s) => (
          <option key={s} value={s} style={{ background: '#fff', color: C.dark }}>
            {s}
          </option>
        ))}
      </select>

      <Button variant="primary" size="sm" onClick={onSearch}>
        Search
      </Button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function ProfilesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [draft, setDraft] = useState<ProfileFilters>(INITIAL_FILTERS);
  const [applied, setApplied] = useState<ProfileFilters>(INITIAL_FILTERS);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const queryParams: Record<string, unknown> = {};
  if (applied.q) queryParams['q'] = applied.q;
  if (applied.seeking) queryParams['seeking'] = applied.seeking;
  if (applied.state) queryParams['state'] = applied.state;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['profiles', applied],
    queryFn: () => profilesApi.list(queryParams).then((r) => r.data as { data: PaginatedResponse<Profile>; meta: { total: number } }),
  });

  const profiles = (data?.data?.items as Profile[]) ?? [];
  const total = data?.data?.meta?.total ?? 0;
  const churchCount = new Set(profiles.map((p) => p.churchId)).size;

  const expressInterest = useMutation({
    mutationFn: ({ profile1Id, profile2Id }: { profile1Id: string; profile2Id: string }) =>
      alliancesApi.create({ profile1Id, profile2Id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alliances'] });
    },
  });

  const shortlist = useMutation({
    mutationFn: (profileId: string) => profilesApi.addShortlist(profileId),
  });

  const handleSearch = () => setApplied({ ...draft });

  const handleExpressInterest = (profileId: string) => {
    if (!user) return;
    expressInterest.mutate({ profile1Id: user.id, profile2Id: profileId });
  };

  const handleShortlist = (profileId: string) => {
    shortlist.mutate(profileId);
  };

  return (
    <PageWrapper>
      <div className="max-w-[1080px] mx-auto px-6 py-9">
        {/* Page header */}
        <div className="flex items-center justify-between mb-7">
          <h1 className="font-display text-[32px] font-normal" style={{ color: C.dark }}>
            Active Profiles
          </h1>
          <Button variant="primary" size="sm" onClick={() => navigate('/profiles/add')}>
            <Plus size={14} />
            Add Profile
          </Button>
        </div>

        {/* AI Banner */}
        <AIBanner onGetMatches={() => navigate('/profiles?ai=true')} />

        {/* Search bar */}
        <SearchBar draft={draft} onChange={setDraft} onSearch={handleSearch} />

        {/* Profile count */}
        {!isLoading && (
          <p className="text-[12px] mb-5" style={{ color: C.muted }}>
            Showing{' '}
            <span className="font-medium" style={{ color: C.mid }}>{total}</span> profiles from{' '}
            <span className="font-medium" style={{ color: C.mid }}>{churchCount}</span> churches
          </p>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="rounded-[11px] h-[340px] animate-pulse"
                style={{ background: 'rgba(107,30,35,0.07)', border: `1px solid ${C.border}` }}
              />
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="text-center py-16">
            <p className="text-red-600 text-[14px]">
              Could not load profiles. Please try again.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && profiles.length === 0 && (
          <div className="text-center py-20">
            <div className="font-display text-[48px] mb-4" style={{ color: C.border }}>✦</div>
            <p className="font-display text-[22px] mb-2" style={{ color: C.dark }}>No profiles found</p>
            <p className="text-[13px]" style={{ color: C.muted }}>
              Try adjusting your search filters or add a new profile.
            </p>
          </div>
        )}

        {/* Profile grid */}
        {!isLoading && !isError && profiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onClick={() => setSelectedProfile(profile)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Profile detail modal */}
      <ProfileModal
        profile={selectedProfile}
        open={selectedProfile !== null}
        onClose={() => setSelectedProfile(null)}
        onExpressInterest={handleExpressInterest}
        onShortlist={handleShortlist}
      />
    </PageWrapper>
  );
}
