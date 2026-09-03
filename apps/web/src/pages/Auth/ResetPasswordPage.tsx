// ============================================================
// OneFlesh — Reset Password Page (Crimson Velvet + White)
// ============================================================

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
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

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

const ResetPasswordFormSchema = z
  .object({
    password: z.string().regex(passwordRegex,
      'Password must be at least 12 characters with uppercase, lowercase, number, and special character (@$!%*?&)'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormInput = z.infer<typeof ResetPasswordFormSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(ResetPasswordFormSchema),
  });

  const onSubmit = async (values: ResetPasswordFormInput) => {
    if (!token) {
      toast.error('Reset link is invalid or has expired. Please request a new one.');
      return;
    }
    try {
      await authApi.resetPassword({ token, password: values.password });
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: unknown) {
      const message =
        err !== null && typeof err === 'object' && 'response' in err &&
        err.response !== null && typeof err.response === 'object' && 'data' in err.response &&
        err.response.data !== null && typeof err.response.data === 'object' && 'error' in err.response.data &&
        err.response.data.error !== null && typeof err.response.data.error === 'object' && 'message' in err.response.data.error
          ? String(err.response.data.error.message)
          : 'This reset link is invalid or has expired. Please request a new one.';
      toast.error(message);
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

          {!token ? (
            /* ── Invalid token ── */
            <div className="text-center">
              <div className="flex justify-center mb-5">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={iconBg}>
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#6B1E23" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="font-display text-[24px] mb-2" style={{ color: C.dark }}>Invalid Link</h1>
              <p className="font-body text-[13px] mb-6" style={{ color: C.muted }}>
                This reset link is invalid or has expired.
              </p>
              <Link to="/forgot-password">
                <Button variant="primary" fullWidth>Request New Link</Button>
              </Link>
            </div>

          ) : isSubmitSuccessful ? (
            /* ── Success ── */
            <div className="text-center">
              <div className="flex justify-center mb-5">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(46,125,50,0.08)', border: '1px solid rgba(46,125,50,0.25)' }}
                >
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#2e7d32" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h1 className="font-display text-[24px] mb-2" style={{ color: C.dark }}>Password Reset</h1>
              <p className="font-body text-[13px] mb-6" style={{ color: C.muted }}>
                Your password has been successfully updated. Redirecting you to login…
              </p>
              <Link to="/login">
                <Button variant="primary" fullWidth>Go to Login</Button>
              </Link>
            </div>

          ) : (
            /* ── Form ── */
            <>
              <div className="flex justify-center mb-5">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={iconBg}>
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#6B1E23" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
              </div>

              <h1 className="font-display text-[24px] text-center mb-1" style={{ color: C.dark }}>
                Set new password
              </h1>
              <p className="font-body text-[13px] text-center mb-7" style={{ color: C.muted }}>
                Choose a strong password for your account.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Input
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min 12 chars, mixed case + symbol"
                  error={errors.password?.message}
                  hint="At least 12 characters · uppercase · lowercase · number · special character"
                  {...register('password')}
                />

                <Input
                  label="Confirm new password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />

                {/* Password policy box */}
                <div className="rounded-lg px-3 py-2.5 mb-5"
                  style={{ background: 'rgba(107,30,35,0.05)', border: `1px solid ${C.border}` }}
                >
                  <p className="font-body text-[11px] leading-relaxed" style={{ color: C.muted }}>
                    <span className="font-semibold" style={{ color: C.mid }}>Requirements:</span>{' '}
                    12+ chars · uppercase &amp; lowercase · one number · one special char (@$!%*?&amp;)
                  </p>
                </div>

                <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
                  Reset Password
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
