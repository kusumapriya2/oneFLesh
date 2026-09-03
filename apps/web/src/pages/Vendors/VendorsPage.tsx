// ============================================================
// OneFlesh — Vendors Page (Crimson Velvet + White)
// ============================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { vendorsApi } from '../../services/api.js';
import { VendorCategory, VENDOR_CATEGORY_LABELS } from '@oneflesh/shared';
import type { Vendor } from '@oneflesh/shared';
import { PageWrapper } from '../../components/layout/PageWrapper.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';

const C = {
  dark:    '#2C0F12',
  mid:     '#6B1E23',
  accent:  '#fed7b8',
  muted:   '#9a6060',
  mutedFaint: 'rgba(154,96,96,0.55)',
  white:   '#ffffff',
  border:  'rgba(107,30,35,0.12)',
  borderMid: 'rgba(107,30,35,0.22)',
  skeleton: 'rgba(107,30,35,0.07)',
  shadow:  '0 2px 10px rgba(44,15,18,0.07)',
} as const;

// ─── Category tab configuration ───────────────────────────
interface CategoryTab { id: string; label: string; }

const CATEGORY_TABS: CategoryTab[] = [
  { id: 'ALL', label: 'All' },
  { id: VendorCategory.TAILORS, label: 'Tailors' },
  { id: VendorCategory.CAKES, label: 'Cakes' },
  { id: VendorCategory.PHOTOGRAPHY, label: 'Photography' },
  { id: VendorCategory.CATERING, label: 'Catering' },
  { id: VendorCategory.CARS, label: 'Cars' },
  { id: VendorCategory.DECOR, label: 'Decor' },
  { id: VendorCategory.VENUES, label: 'Venues' },
  { id: VendorCategory.MUSIC, label: 'Music' },
  { id: VendorCategory.INVITATIONS, label: 'Invitations' },
  { id: VendorCategory.OTHER, label: 'Other' },
];

const FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&q=80';

// ─── Vendor Card ───────────────────────────────────────────
interface VendorCardProps {
  vendor: Vendor;
  onContact: (id: string) => void;
  isContacting: boolean;
}

const VendorCard: React.FC<VendorCardProps> = ({ vendor, onContact, isContacting }) => {
  const thumb = vendor.photoUrl ?? FALLBACK_THUMB;
  const categoryLabel = VENDOR_CATEGORY_LABELS[vendor.category] ?? vendor.category;

  return (
    <div
      className="flex rounded-[10px] overflow-hidden transition-all duration-200"
      style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.shadow }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = C.borderMid; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; }}
    >
      {/* Thumbnail */}
      <div className="w-[110px] flex-shrink-0 self-stretch" style={{ minHeight: '110px', background: 'rgba(107,30,35,0.05)' }}>
        <img
          src={thumb}
          alt={vendor.businessName}
          loading="lazy"
          className="w-full h-full object-cover"
          style={{ display: 'block', minHeight: '110px' }}
          onError={(e) => { e.currentTarget.src = FALLBACK_THUMB; }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 py-[14px] px-[16px] min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <span className="font-display text-[17px] leading-tight" style={{ color: C.dark }}>
            {vendor.businessName}
          </span>
          {vendor.verified && (
            <Badge variant="verified" className="flex-shrink-0 mt-0.5">✓ Church Verified</Badge>
          )}
        </div>

        <div className="text-[12px] mt-0.5" style={{ color: C.muted }}>
          {vendor.city}, {vendor.state}
          {vendor.church && (
            <span className="ml-2 text-[11px]" style={{ color: C.mutedFaint }}>
              · {vendor.church.name}
            </span>
          )}
        </div>

        <div className="text-[11px] font-light uppercase tracking-[0.06em] mt-1" style={{ color: 'rgba(107,30,35,0.45)' }}>
          {categoryLabel}
        </div>

        <p className="text-[12px] leading-relaxed mt-1.5 line-clamp-2" style={{ color: C.muted }}>
          {vendor.description}
        </p>
      </div>

      {/* Price + action */}
      <div
        className="flex-shrink-0 py-[14px] px-[16px] flex flex-col justify-between items-end"
        style={{ minWidth: '140px', borderLeft: `1px solid ${C.border}` }}
      >
        <div className="text-right">
          {vendor.priceFrom ? (
            <>
              <div className="text-[10px] uppercase tracking-[0.06em]" style={{ color: C.muted }}>Starting from</div>
              <div className="font-display text-[18px] mt-0.5" style={{ color: C.dark }}>₹{vendor.priceFrom}</div>
              {vendor.priceType && (
                <div className="text-[10px]" style={{ color: C.mutedFaint }}>{vendor.priceType}</div>
              )}
            </>
          ) : (
            <div className="text-[11px] italic" style={{ color: C.muted }}>Price on request</div>
          )}
        </div>

        <Button variant="outline" size="sm" loading={isContacting} onClick={() => onContact(vendor.id)} className="mt-3">
          Contact
        </Button>
      </div>
    </div>
  );
};

// ─── Skeleton ──────────────────────────────────────────────
const VendorSkeleton: React.FC = () => (
  <div
    className="flex rounded-[10px] overflow-hidden animate-pulse"
    style={{ background: C.white, border: `1px solid ${C.border}` }}
  >
    <div className="w-[100px] flex-shrink-0" style={{ background: C.skeleton }} />
    <div className="flex-1 py-3.5 px-4 space-y-2">
      <div className="h-4 rounded w-2/3" style={{ background: C.skeleton }} />
      <div className="h-3 rounded w-1/3" style={{ background: C.skeleton }} />
      <div className="h-3 rounded w-full" style={{ background: C.skeleton }} />
      <div className="h-3 rounded w-4/5" style={{ background: C.skeleton }} />
    </div>
    <div className="w-[140px] flex-shrink-0 py-3.5 px-4 space-y-2" style={{ borderLeft: `1px solid ${C.border}` }}>
      <div className="h-3 rounded w-full" style={{ background: C.skeleton }} />
      <div className="h-5 rounded w-2/3" style={{ background: C.skeleton }} />
    </div>
  </div>
);

// ─── Page ──────────────────────────────────────────────────
export default function VendorsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [contactingId, setContactingId] = useState<string | null>(null);

  const queryParams = activeCategory === 'ALL' ? {} : { category: activeCategory };

  const { data, isLoading, error } = useQuery({
    queryKey: ['vendors', activeCategory],
    queryFn: () => vendorsApi.list({ ...queryParams, limit: 50 }),
  });

  const contactMutation = useMutation({
    mutationFn: (id: string) => vendorsApi.contact(id),
    onSuccess: () => { toast.success('Contact request sent'); setContactingId(null); },
    onError: () => { toast.error('Failed to send contact request.'); setContactingId(null); },
  });

  const handleContact = (id: string) => {
    setContactingId(id);
    contactMutation.mutate(id);
    void queryClient.invalidateQueries({ queryKey: ['vendors'] });
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const vendors = (data?.data?.data as Vendor[]) ?? [];

  return (
    <PageWrapper>
      <div className="max-w-[860px] mx-auto px-5 py-10">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-[clamp(28px,4vw,40px)] font-normal leading-tight" style={{ color: C.dark }}>
              Christian Vendors,{' '}
              <em className="font-light italic" style={{ color: C.mid }}>Trusted Community</em>
            </h1>
            <p className="text-[13px] mt-1.5" style={{ color: C.muted }}>
              Find church-verified vendors for your wedding celebration
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/vendors/add')} className="flex-shrink-0 mt-1">
            List Your Business →
          </Button>
        </div>

        {/* Category tabs */}
        <div className="overflow-x-auto -mx-5 px-5 mb-7">
          <div className="flex gap-0 min-w-max" style={{ borderBottom: `1px solid ${C.border}` }}>
            {CATEGORY_TABS.map((tab) => {
              const active = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className="px-4 py-2 text-[13px] font-body whitespace-nowrap transition-all duration-150 outline-none"
                  style={{
                    color: active ? C.dark : C.muted,
                    borderBottom: active ? `2px solid ${C.mid}` : '2px solid transparent',
                    fontWeight: active ? 600 : 400,
                    marginBottom: '-1px',
                    background: 'transparent',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vendor list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <VendorSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-[14px]" style={{ color: C.muted }}>Failed to load vendors. Please try again.</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-[48px] mb-4">🏪</div>
            <p className="font-display text-[22px] mb-2" style={{ color: C.dark }}>No vendors found</p>
            <p className="text-[13px] mb-5" style={{ color: C.muted }}>Be the first to list your business!</p>
            <button
              onClick={() => navigate('/vendors/add')}
              className="text-[13px] font-medium transition-colors"
              style={{ color: C.mid }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.dark; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.mid; }}
            >
              List your business →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {vendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onContact={handleContact}
                isContacting={contactingId === vendor.id}
              />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
