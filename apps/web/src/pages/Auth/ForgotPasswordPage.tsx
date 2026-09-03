// ============================================================
// OneFlesh — Forgot Password Page (Crimson Velvet + White)
// ============================================================

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@oneflesh/shared';
import { authApi } from '../../services/api.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';

const C = {
  dark:   '#2C0F12',
  mid:    '#6B1E23',
  muted:  '#9a6060',
  white:  '#ffffff',
  page:   '#fdf9f7',
  border: 'rgba(107,30,35,0.12)',
  shadow: '0 24px 80px rgba(44,15,18,0.12)',
} as const;

const iconBg: React.CSSProperties = {
  background: 'rgba(107,30,35,0.08)',
  border: '1px solid rgba(107,30,35,0.18)',
};

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    try {
      await authApi.forgotPassword(values.email);
      setSubmittedEmail(values.email);
      setSent(true);
    } catch {
      setSubmittedEmail(values.email);
      setSent(true);
      toast.success('If that email exists, a reset link has been sent.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: C.page }}>
      <div className="w-full max-w-[440px]">
        <div
          className="rounded-2xl px-8 py-10"
          style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.shadow }}
        >
          {/* Logo */}
          <div className="text-center mb-7">
            <Link to="/">
              <div className="font-display text-[34px] leading-none select-none" style={{ color: C.dark }}>
                One<em className="font-light italic">Flesh</em>
              </div>
            </Link>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={iconBg}>
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#6B1E23" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
              </div>

              <h1 className="font-display text-[26px] mb-2" style={{ color: C.dark }}>Check your email</h1>
              <p className="font-body text-[13px] leading-relaxed mb-1" style={{ color: C.muted }}>
                We've sent a password reset link to
              </p>
              <p className="font-body text-[13px] font-semibold mb-6" style={{ color: C.dark }}>
                {submittedEmail}
              </p>
              <p className="font-body text-[12px] leading-relaxed mb-7" style={{ color: 'rgba(154,96,96,0.70)' }}>
                The link will expire in 1 hour. If you don't see the email, please check your spam folder.
              </p>

              <Link to="/login">
                <Button variant="primary" fullWidth>Back to Login</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={iconBg}>
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#6B1E23" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                    />
                  </svg>
                </div>
              </div>

              <h1 className="font-display text-[24px] text-center mb-1" style={{ color: C.dark }}>
                Forgot your password?
              </h1>
              <p className="font-body text-[13px] text-center mb-7" style={{ color: C.muted }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  placeholder="pastor@church.in"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Button type="submit" variant="primary" fullWidth loading={isSubmitting} className="mt-2">
                  Send Reset Link
                </Button>
              </form>

              <p className="text-center font-body text-[12px] mt-5">
                <Link
                  to="/login"
                  className="font-medium transition-colors"
                  style={{ color: C.mid }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.dark; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.mid; }}
                >
                  ← Back to Login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
