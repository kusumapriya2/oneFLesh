// ============================================================
// OneFlesh — Register Church Page (Crimson Velvet + White)
// ============================================================

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  RegisterSchema,
  type RegisterInput,
  DENOMINATIONS,
  INDIAN_STATES,
} from '@oneflesh/shared';
import { churchesApi } from '../../services/api.js';
import { Input, Select } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';

const C = {
  dark:        '#2C0F12',
  mid:         '#6B1E23',
  muted:       '#9a6060',
  white:       '#ffffff',
  page:        '#fdf9f7',
  border:      'rgba(107,30,35,0.12)',
  borderMid:   'rgba(107,30,35,0.22)' as string,
  shadow:      '0 24px 80px rgba(44,15,18,0.12)',
} as const;

const DENOMINATION_OPTIONS = DENOMINATIONS.map((d) => ({ value: d, label: d }));
const STATE_OPTIONS = INDIAN_STATES.map((s) => ({ value: s, label: s }));

// ─── Section divider ───────────────────────────────────────
const SectionDivider: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center gap-3 mb-5 mt-2">
    <div className="flex-1 h-px" style={{ background: C.border }} />
    <span className="font-display text-[18px] whitespace-nowrap font-normal" style={{ color: C.mid }}>
      {title}
    </span>
    <div className="flex-1 h-px" style={{ background: C.border }} />
  </div>
);

// ─── Doctrinal Affirmation Checkbox ───────────────────────
interface AffirmationProps {
  text: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

const AffirmationCheckbox: React.FC<AffirmationProps> = ({ text, checked, onChange, error }) => (
  <div
    className="flex items-start gap-3 px-4 py-3.5 rounded-[8px] transition-colors cursor-pointer"
    style={{
      background: checked ? 'rgba(107,30,35,0.06)' : 'rgba(107,30,35,0.03)',
      border: error
        ? '1px solid rgba(239,68,68,0.5)'
        : checked
        ? `1px solid ${C.borderMid}`
        : `1px solid ${C.border}`,
    }}
    onClick={() => onChange(!checked)}
  >
    <div
      className="flex-shrink-0 w-4 h-4 mt-0.5 rounded flex items-center justify-center transition-all"
      style={{
        background: checked ? '#6B1E23' : 'rgba(107,30,35,0.06)',
        border: checked ? '2px solid #6B1E23' : `2px solid ${C.border}`,
        color: checked ? '#fed7b8' : 'transparent',
      }}
    >
      {checked && (
        <svg viewBox="0 0 12 10" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1,5 4.5,8.5 11,1" />
        </svg>
      )}
    </div>
    <span className="text-[13px] font-light leading-relaxed flex-1" style={{ color: C.dark }}>
      {text}
    </span>
  </div>
);

// ─── Success State ─────────────────────────────────────────
const SuccessState: React.FC = () => (
  <div className="text-center py-10 px-4">
    <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(46, 125, 50, 0.08)' }}>
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>

    <h2 className="font-display text-[26px] mb-2" style={{ color: C.dark }}>Application Submitted</h2>
    <p className="text-[14px] font-light leading-relaxed max-w-[360px] mx-auto" style={{ color: C.muted }}>
      Thank you for registering your church. We'll review your application within{' '}
      <span className="font-medium" style={{ color: C.dark }}>3–5 working days</span> and contact you by email.
    </p>

    <div className="mt-6 rounded-[10px] px-5 py-4 max-w-[360px] mx-auto" style={{ background: 'rgba(107,30,35,0.05)', border: `1px solid ${C.border}` }}>
      <div className="text-[12px] font-light italic" style={{ color: C.muted }}>
        "I will build my church; and the gates of hell shall not prevail against it."
      </div>
      <div className="text-[10px] mt-1.5 text-right" style={{ color: 'rgba(154,96,96,0.60)' }}>Matthew 16:18</div>
    </div>

    <Link
      to="/login"
      className="inline-block mt-7 text-[13px] font-medium transition-colors"
      style={{ color: C.mid }}
      onMouseEnter={(e) => { e.currentTarget.style.color = C.dark; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = C.mid; }}
    >
      Sign in once approved →
    </Link>
  </div>
);

// ─── Page ──────────────────────────────────────────────────
export default function RegisterChurchPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [doctrinal, setDoctrinal] = useState({
    affirmsScriptureAlone: false,
    affirmsChristAlone: false,
    affirmsFaithAlone: false,
    affirmsGraceAlone: false,
  });
  const [doctrinalErrors, setDoctrinalErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      doctrinalFlags: {
        affirmsScriptureAlone: true,
        affirmsChristAlone: true,
        affirmsFaithAlone: true,
        affirmsGraceAlone: true,
      },
    },
  });

  const toggleDoctrinal = (key: keyof typeof doctrinal, value: boolean) => {
    setDoctrinal((prev) => ({ ...prev, [key]: value }));
    if (value) {
      setDoctrinalErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  const validateDoctrinal = (): boolean => {
    const errs: Record<string, string> = {};
    if (!doctrinal.affirmsScriptureAlone) errs['affirmsScriptureAlone'] = 'Required';
    if (!doctrinal.affirmsChristAlone) errs['affirmsChristAlone'] = 'Required';
    if (!doctrinal.affirmsFaithAlone) errs['affirmsFaithAlone'] = 'Required';
    if (!doctrinal.affirmsGraceAlone) errs['affirmsGraceAlone'] = 'Required';
    setDoctrinalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (values: RegisterInput) => {
    if (!validateDoctrinal()) { toast.error('Please affirm all four doctrinal statements.'); return; }

    setIsSubmitting(true);
    try {
      await churchesApi.create({
        name: values.churchName,
        denomination: values.denomination,
        city: values.city,
        state: values.state,
        pastorName: values.pastorName,
        pastorPhone: values.pastorPhone,
        pastorEmail: values.email,
        congregationSize: values.congregationSize,
        yearEstablished: values.yearEstablished,
        doctrinalFlags: {
          affirmsScriptureAlone: doctrinal.affirmsScriptureAlone,
          affirmsChristAlone: doctrinal.affirmsChristAlone,
          affirmsFaithAlone: doctrinal.affirmsFaithAlone,
          affirmsGraceAlone: doctrinal.affirmsGraceAlone,
        },
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const message =
        err !== null && typeof err === 'object' && 'response' in err &&
        err.response !== null && typeof err.response === 'object' && 'data' in err.response &&
        err.response.data !== null && typeof err.response.data === 'object' && 'error' in err.response.data &&
        err.response.data.error !== null && typeof err.response.data.error === 'object' && 'message' in err.response.data.error
          ? String(err.response.data.error.message)
          : 'Submission failed. Please check the form and try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: C.page }}>
      <div className="max-w-[660px] mx-auto">
        {/* Logo */}
        <div className="text-center mb-7">
          <Link to="/" className="inline-block">
            <div className="font-display text-[32px] leading-none" style={{ color: C.dark }}>
              One<em className="font-light italic">Flesh</em>
            </div>
          </Link>
          <p className="font-body text-[11px] tracking-[0.14em] uppercase mt-1.5" style={{ color: C.muted }}>
            Reformed Church Matrimonial
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl px-8 py-10"
          style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.shadow }}
        >
          {submitted ? (
            <SuccessState />
          ) : (
            <>
              <div className="mb-7">
                <h1 className="font-display text-[28px] font-normal leading-tight" style={{ color: C.dark }}>
                  Register Your Church
                </h1>
                <p className="text-[13px] mt-1.5" style={{ color: C.muted }}>
                  Join the OneFlesh network. Verification typically takes 3–5 working days.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <SectionDivider title="Church Details" />

                <Input label="Church Name *" placeholder="e.g. Grace Reformed Church" error={errors.churchName?.message} {...register('churchName')} />
                <Select label="Denomination *" options={DENOMINATION_OPTIONS} placeholder="Select denomination" error={errors.denomination?.message} {...register('denomination')} />

                <div className="grid grid-cols-2 gap-3">
                  <Input label="City *" placeholder="e.g. Chennai" error={errors.city?.message} {...register('city')} />
                  <Select label="State *" options={STATE_OPTIONS} placeholder="Select state" error={errors.state?.message} {...register('state')} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input label="Year Established" type="number" placeholder="e.g. 1998" error={errors.yearEstablished?.message} {...register('yearEstablished', { valueAsNumber: true })} />
                  <Input label="Congregation Size" type="number" placeholder="e.g. 120" error={errors.congregationSize?.message} {...register('congregationSize', { valueAsNumber: true })} />
                </div>

                <SectionDivider title="Pastor Details" />

                <Input label="Pastor Name *" placeholder="Full name" error={errors.pastorName?.message} {...register('pastorName')} />

                <div className="grid grid-cols-2 gap-3">
                  <Input label="Phone * (Indian mobile)" type="tel" placeholder="9876543210" error={errors.pastorPhone?.message} hint="10-digit number without country code" {...register('pastorPhone')} />
                  <Input label="Email *" type="email" placeholder="pastor@church.in" error={errors.email?.message} {...register('email')} />
                </div>

                <Input label="Password *" type="password" placeholder="Min 12 chars, upper + lower + number + special" error={errors.password?.message} hint="At least 12 characters: uppercase, lowercase, number, and special character" {...register('password')} />

                <SectionDivider title="Doctrinal Affirmations" />

                <p className="text-[12px] font-light mb-4" style={{ color: C.muted }}>
                  All four affirmations are required to participate in the OneFlesh network.
                </p>

                <div className="space-y-3">
                  <AffirmationCheckbox
                    text="I affirm that the Holy Scriptures alone are the supreme rule of faith and life (Sola Scriptura)"
                    checked={doctrinal.affirmsScriptureAlone}
                    onChange={(v) => toggleDoctrinal('affirmsScriptureAlone', v)}
                    error={doctrinalErrors['affirmsScriptureAlone']}
                  />
                  <AffirmationCheckbox
                    text="I affirm that salvation is in Christ alone, through His atoning work (Solus Christus)"
                    checked={doctrinal.affirmsChristAlone}
                    onChange={(v) => toggleDoctrinal('affirmsChristAlone', v)}
                    error={doctrinalErrors['affirmsChristAlone']}
                  />
                  <AffirmationCheckbox
                    text="I affirm that we are justified by faith alone, not by works (Sola Fide)"
                    checked={doctrinal.affirmsFaithAlone}
                    onChange={(v) => toggleDoctrinal('affirmsFaithAlone', v)}
                    error={doctrinalErrors['affirmsFaithAlone']}
                  />
                  <AffirmationCheckbox
                    text="I affirm that salvation is entirely by God's grace alone (Sola Gratia)"
                    checked={doctrinal.affirmsGraceAlone}
                    onChange={(v) => toggleDoctrinal('affirmsGraceAlone', v)}
                    error={doctrinalErrors['affirmsGraceAlone']}
                  />
                </div>

                {Object.keys(doctrinalErrors).length > 0 && (
                  <p className="text-red-600 text-[11px] mt-2">
                    All four doctrinal affirmations are required.
                  </p>
                )}

                <div className="mt-5 rounded-[8px] px-4 py-3.5" style={{ background: 'rgba(107,30,35,0.05)', border: `1px solid ${C.border}` }}>
                  <div className="text-[11px] font-light leading-relaxed" style={{ color: C.muted }}>
                    <span className="font-medium" style={{ color: C.mid }}>Note:</span>{' '}
                    These affirmations reflect the Reformed theological commitments of the OneFlesh platform.
                    Churches that do not hold to these distinctives will not be approved.
                  </div>
                </div>

                <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting} className="mt-8">
                  Submit Church Application
                </Button>

                <p className="text-center font-body text-[11px] mt-4" style={{ color: 'rgba(154,96,96,0.55)' }}>
                  Already approved?{' '}
                  <Link to="/login" className="font-medium transition-colors" style={{ color: C.mid }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = C.dark; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = C.mid; }}
                  >
                    Sign in here
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>

        {/* Scripture footer */}
        <p className="text-center font-body text-[10px] tracking-[0.08em] mt-6" style={{ color: 'rgba(154,96,96,0.50)' }}>
          "Therefore a man shall leave his father and his mother and hold fast to his wife, and they shall become one flesh." — Genesis 2:24
        </p>
      </div>
    </div>
  );
}
