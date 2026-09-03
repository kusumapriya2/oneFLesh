// ============================================================
// OneFlesh — Login Page (Crimson Velvet + White)
// ============================================================

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LoginSchema, type LoginInput } from '@oneflesh/shared';
import { authApi } from '../../services/api.js';
import { useAuthStore } from '../../stores/authStore.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import type { UserPublic } from '@oneflesh/shared';

const C = {
  dark:        '#2C0F12',
  mid:         '#6B1E23',
  muted:       '#9a6060',
  white:       '#ffffff',
  page:        '#fdf9f7',
  border:      'rgba(107,30,35,0.12)',
  inputBorder: 'rgba(107,30,35,0.18)',
  inputFocus:  'rgba(107,30,35,0.50)',
  inputBorderError: 'rgba(239,68,68,0.60)',
  shadow:      '0 24px 80px rgba(44,15,18,0.12)',
} as const;

interface LoginResponseData {
  user: UserPublic;
  accessToken: string;
  requiresMfa?: boolean;
  tempToken?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (values: LoginInput) => {
    try {
      const { data: res } = await authApi.login(values);
      const payload = res.data as LoginResponseData;

      if (payload.requiresMfa && payload.tempToken) {
        navigate('/mfa', { state: { tempToken: payload.tempToken } });
        return;
      }

      setAuth(payload.user, payload.accessToken);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        err !== null && typeof err === 'object' && 'response' in err &&
        err.response !== null && typeof err.response === 'object' && 'data' in err.response &&
        err.response.data !== null && typeof err.response.data === 'object' && 'error' in err.response.data &&
        err.response.data.error !== null && typeof err.response.data.error === 'object' && 'message' in err.response.data.error
          ? String(err.response.data.error.message)
          : 'Invalid credentials. Please try again.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: C.page }}>
      <div className="w-full max-w-[440px]">
        {/* Card */}
        <div
          className="rounded-2xl px-8 py-10"
          style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.shadow }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <div className="font-display text-[34px] leading-none select-none" style={{ color: C.dark }}>
                One<em className="font-light italic">Flesh</em>
              </div>
            </Link>
            <p className="font-body text-[10px] tracking-[0.18em] uppercase mt-2" style={{ color: C.muted }}>
              Reformed Church Matrimonial
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-7">
            <div className="flex-1 h-px" style={{ background: C.border }} />
            <span className="font-body text-[10px] tracking-[0.12em] uppercase whitespace-nowrap" style={{ color: 'rgba(154,96,96,0.60)' }}>
              Sign in to your account
            </span>
            <div className="flex-1 h-px" style={{ background: C.border }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="pastor@church.in"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-medium tracking-[0.07em] uppercase" style={{ color: C.mid }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] transition-colors"
                  style={{ color: C.muted }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.mid; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="w-full px-3 py-2.5 font-body text-[13px] rounded-[5px] outline-none transition-colors duration-200"
                style={{
                  background: C.white,
                  border: `1px solid ${errors.password ? C.inputBorderError : C.inputBorder}`,
                  color: C.dark,
                }}
                {...register('password')}
                onFocus={(e) => { e.currentTarget.style.borderColor = errors.password ? C.inputBorderError : C.inputFocus; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = errors.password ? C.inputBorderError : C.inputBorder; }}
              />
              {errors.password && (
                <p className="text-red-600 text-[11px] mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" variant="primary" fullWidth loading={isSubmitting} className="mt-1">
              Sign In
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center font-body text-[12px] mt-6" style={{ color: C.muted }}>
            Don't have an account?{' '}
            <Link
              to="/register-church"
              className="font-medium transition-colors"
              style={{ color: C.mid }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.dark; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.mid; }}
            >
              Register your church
            </Link>
          </p>
        </div>

        {/* Bottom caption */}
        <p className="text-center font-body text-[10px] tracking-[0.08em] mt-5" style={{ color: 'rgba(154,96,96,0.45)' }}>
          Access restricted to pastors of verified Reformed churches
        </p>
      </div>
    </div>
  );
}
