// ============================================================
// OneFlesh — Counselling Programme Page (Crimson Velvet + White)
// ============================================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Clock, Plus } from 'lucide-react';
import type { CounsellingSession, PaginatedResponse } from '@oneflesh/shared';
import {
  COUNSELLING_SESSIONS,
  CreateCounsellingSchema,
  SessionFormat,
  type CreateCounsellingInput,
} from '@oneflesh/shared';
import { counsellingApi } from '../../services/api.js';
import { PageWrapper } from '../../components/layout/PageWrapper.js';
import { Button } from '../../components/ui/Button.js';
import { Input, Select } from '../../components/ui/Input.js';
import { Modal } from '../../components/ui/Modal.js';
import { Pill } from '../../components/ui/Badge.js';

const C = {
  dark:    '#2C0F12',
  mid:     '#6B1E23',
  accent:  '#fed7b8',
  muted:   '#9a6060',
  white:   '#ffffff',
  border:  'rgba(107,30,35,0.12)',
  shadow:  '0 2px 10px rgba(44,15,18,0.07)',
} as const;

// ─── Module Card ──────────────────────────────────────────────
interface SessionModuleCardProps {
  session: (typeof COUNSELLING_SESSIONS)[number];
}

function SessionModuleCard({ session }: SessionModuleCardProps) {
  return (
    <div
      className="rounded-[12px] p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1"
      style={{
        background: '#3F070B',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#52090E'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#3F070B'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
    >
      {/* Session number circle */}
      <div
        className="w-9 h-9 rounded-full text-[15px] font-light flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.10)', color: '#ffffff' }}
      >
        {session.session}
      </div>

      {/* Topic */}
      <h3 className="font-display text-[18px] font-light leading-tight" style={{ color: '#ffffff' }}>
        {session.topic}
      </h3>

      {/* Duration badge */}
      <div className="flex items-center gap-1.5">
        <Clock size={12} style={{ color: 'rgba(255,255,255,0.40)' }} />
        <span
          className="text-[11px] font-light px-2 py-0.5 rounded-[10px]"
          style={{ color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          {session.duration}
        </span>
      </div>

      {/* Scripture */}
      <div className="flex items-start gap-2 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <BookOpen size={12} style={{ color: 'rgba(255,255,255,0.40)', flexShrink: 0, marginTop: 2 }} />
        <span className="text-[11px] font-light italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)' }}>
          {session.scripture}
        </span>
      </div>
    </div>
  );
}

// ─── Register Couple Form ──────────────────────────────────────
const RegisterFormSchema = CreateCounsellingSchema.omit({ allianceId: true }).extend({
  allianceId: CreateCounsellingSchema.shape.allianceId.optional(),
});

type RegisterFormValues = CreateCounsellingInput & { allianceId?: string };

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function RegisterModal({ open, onClose, onSuccess }: RegisterModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: { format: SessionFormat.IN_PERSON },
  });

  const mutation = useMutation({
    mutationFn: (data: RegisterFormValues) => counsellingApi.register(data),
    onSuccess: () => { reset(); onSuccess(); },
  });

  const handleClose = () => { reset(); onClose(); };

  const formatOptions = [
    { value: SessionFormat.IN_PERSON, label: 'In-Person' },
    { value: SessionFormat.VIDEO_CALL, label: 'Video Call' },
    { value: SessionFormat.PHONE_CALL, label: 'Phone Call' },
  ];

  return (
    <Modal open={open} onClose={handleClose} title="Register Couple for Counselling" maxWidth="max-w-[580px]">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} noValidate className="px-6 pb-6 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
          <Input label="Groom Name *" placeholder="e.g. Samuel George" error={errors.groomName?.message} {...register('groomName')} />
          <Input label="Groom's Church *" placeholder="e.g. Grace Reformed Church" error={errors.groomChurch?.message} {...register('groomChurch')} />
          <Input label="Bride Name *" placeholder="e.g. Priya Thomas" error={errors.brideName?.message} {...register('brideName')} />
          <Input label="Bride's Church *" placeholder="e.g. Calvary Reformed Church" error={errors.brideChurch?.message} {...register('brideChurch')} />
          <Input label="Counsellor Name *" placeholder="e.g. Pastor John Abraham" error={errors.counsellorName?.message} {...register('counsellorName')} />
          <Input label="First Session Date" type="datetime-local" error={errors.sessionDate?.message} {...register('sessionDate')} />
        </div>
        <Select label="Format *" options={formatOptions} error={errors.format?.message} {...register('format')} />
        <Input label="Alliance ID (optional)" placeholder="UUID — leave blank if not linked" error={errors.allianceId?.message} {...register('allianceId')} />

        {mutation.isError && (
          <p className="text-red-600 text-[12px] mb-3">Something went wrong. Please try again.</p>
        )}

        <div className="flex gap-3 mt-2">
          <Button type="submit" variant="primary" size="md" className="flex-1" loading={mutation.isPending}>
            Register Couple
          </Button>
          <Button type="button" variant="ghost" size="md" onClick={handleClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Active Sessions List ─────────────────────────────────────
function ActiveSessions() {
  const { data, isLoading } = useQuery({
    queryKey: ['counselling', 'active'],
    queryFn: () => counsellingApi.list({ status: 'SCHEDULED' }).then((r) => r.data as { data: PaginatedResponse<CounsellingSession> }),
  });

  const sessions = (data?.data?.items as CounsellingSession[]) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3 mt-8">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="h-[70px] rounded-[8px] animate-pulse"
            style={{ background: 'rgba(107,30,35,0.07)', border: `1px solid rgba(107,30,35,0.10)` }}
          />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <p className="text-[13px] italic text-center py-6" style={{ color: C.muted }}>
        No active counselling sessions.
      </p>
    );
  }

  return (
    <div className="space-y-3 mt-6">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="rounded-[8px] px-4 py-3 flex items-center justify-between gap-4"
          style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.shadow }}
        >
          <div>
            <p className="text-[14px] font-medium" style={{ color: C.dark }}>
              {session.groomName} &amp; {session.brideName}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
              {session.groomChurch} · {session.brideChurch}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-center">
              <div
                className="w-7 h-7 rounded-full text-[11px] font-semibold flex items-center justify-center mx-auto"
                style={{ background: '#2C0F12', color: '#fed7b8' }}
              >
                {session.sessionNumber}
              </div>
              <span className="text-[9px] tracking-[0.04em]" style={{ color: C.muted }}>SESSION</span>
            </div>

            <Pill variant={session.status === 'COMPLETED' ? 'completed' : session.status === 'CANCELLED' ? 'dissolved' : 'active'}>
              {session.status}
            </Pill>

            {session.sessionDate && (
              <span className="text-[11px]" style={{ color: C.muted }}>
                {new Date(session.sessionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function CounsellingPage() {
  const queryClient = useQueryClient();
  const [showRegister, setShowRegister] = useState(false);

  return (
    <PageWrapper>
      {/* Hero section — white background */}
      <div className="relative overflow-hidden" style={{ background: '#fdf9f7' }}>
        <div className="relative max-w-[1080px] mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <div className="text-[11px] font-light tracking-[0.14em] uppercase mb-3" style={{ color: 'rgba(44,15,18,0.45)' }}>
              OneFlesh Matrimonial
            </div>
            <h1
              className="font-display text-[clamp(28px,4.5vw,52px)] font-light leading-[1.18] mb-4"
              style={{ color: '#2C0F12' }}
            >
              Pre-Marital Counselling
              <br />
              <em className="font-light italic" style={{ color: '#6B1E23' }}>Programme</em>
            </h1>
            <p className="text-[14px] font-light max-w-[520px] mx-auto leading-relaxed mb-7" style={{ color: 'rgba(44,15,18,0.55)' }}>
              A structured 6-session programme grounded in Scripture, designed to prepare
              covenant couples for a God-honouring marriage.
            </p>
            <Button variant="primary" size="lg" onClick={() => setShowRegister(true)}>
              <Plus size={15} />
              Register Couple for Counselling
            </Button>
          </div>

          {/* Module cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COUNSELLING_SESSIONS.map((session) => (
              <SessionModuleCard key={session.session} session={session} />
            ))}
          </div>
        </div>
      </div>

      {/* Scripture quote block */}
      <div
        className="py-10 px-6"
        style={{ background: '#2C0F12', borderTop: '1px solid rgba(254,215,184,0.08)' }}
      >
        <div className="max-w-[680px] mx-auto text-center">
          <div className="text-[22px] mb-2" style={{ color: 'rgba(254,215,184,0.40)' }}>&ldquo;</div>
          <p
            className="font-display text-[clamp(16px,2.2vw,22px)] font-light italic leading-relaxed"
            style={{ color: '#fed7b8' }}
          >
            Therefore a man shall leave his father and his mother and hold fast to his wife,
            and they shall become one flesh.
          </p>
          <p className="text-[12px] tracking-[0.1em] uppercase mt-3" style={{ color: 'rgba(254,215,184,0.45)' }}>
            Genesis 2:24 · ESV
          </p>
        </div>
      </div>

      {/* Active sessions section */}
      <div className="max-w-[1080px] mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-[24px] font-normal" style={{ color: C.dark }}>
            Active Counselling Sessions
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setShowRegister(true)}>
            <Plus size={13} />
            New Session
          </Button>
        </div>
        <p className="text-[13px] mb-4" style={{ color: C.muted }}>
          Couples currently enrolled in the pre-marital counselling programme.
        </p>
        <ActiveSessions />
      </div>

      <RegisterModal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onSuccess={() => {
          setShowRegister(false);
          queryClient.invalidateQueries({ queryKey: ['counselling'] });
        }}
      />
    </PageWrapper>
  );
}
