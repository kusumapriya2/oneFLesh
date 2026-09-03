// ============================================================
// OneFlesh — MFA / Two-Factor Authentication Page (Crimson Velvet + White)
// ============================================================

import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../services/api.js';
import { useAuthStore } from '../../stores/authStore.js';
import { Button } from '../../components/ui/Button.js';
import type { UserPublic } from '@oneflesh/shared';

const C = {
  dark:   '#2C0F12',
  mid:    '#6B1E23',
  muted:  '#9a6060',
  white:  '#ffffff',
  page:   '#fdf9f7',
  border: 'rgba(107,30,35,0.12)',
  shadow: '0 24px 80px rgba(44,15,18,0.12)',
} as const;

interface MfaLocationState {
  tempToken?: string;
}

interface MfaResponseData {
  user: UserPublic;
  accessToken: string;
}

const DIGIT_COUNT = 6;

export default function MFAPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const tempToken = (location.state as MfaLocationState | null)?.tempToken ?? '';

  const [digits, setDigits] = useState<string[]>(Array(DIGIT_COUNT).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(DIGIT_COUNT).fill(null));

  useEffect(() => {
    if (!tempToken) navigate('/login', { replace: true });
  }, [tempToken, navigate]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const submitCode = async (code: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data: res } = await authApi.mfaVerify({ tempToken, code });
      const payload = res.data as MfaResponseData;
      setAuth(payload.user, payload.accessToken);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        err !== null && typeof err === 'object' && 'response' in err &&
        err.response !== null && typeof err.response === 'object' && 'data' in err.response &&
        err.response.data !== null && typeof err.response.data === 'object' && 'error' in err.response.data &&
        err.response.data.error !== null && typeof err.response.data.error === 'object' && 'message' in err.response.data.error
          ? String(err.response.data.error.message)
          : 'Invalid verification code. Please try again.';
      toast.error(message);
      setDigits(Array(DIGIT_COUNT).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < DIGIT_COUNT - 1) inputRefs.current[index + 1]?.focus();
    if (cleaned && next.every((d) => d !== '')) submitCode(next.join(''));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits]; next[index] = ''; setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits]; next[index - 1] = ''; setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < DIGIT_COUNT - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGIT_COUNT);
    if (!pasted) return;
    const next = Array(DIGIT_COUNT).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i] ?? '';
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, DIGIT_COUNT - 1)]?.focus();
    if (pasted.length === DIGIT_COUNT) submitCode(pasted);
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

          {/* Shield icon */}
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(107,30,35,0.08)', border: '1px solid rgba(107,30,35,0.18)' }}
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#6B1E23" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="font-display text-[24px] text-center leading-tight mb-1" style={{ color: C.dark }}>
            Two-Factor Authentication
          </h1>
          <p className="font-body text-[13px] text-center mb-7" style={{ color: C.muted }}>
            Enter the 6-digit code from your authenticator app
          </p>

          {/* OTP inputs */}
          <div className="flex justify-center gap-2.5 mb-7">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                disabled={isSubmitting}
                className="w-11 h-12 text-center font-display text-[22px] font-semibold rounded-lg outline-none transition-all duration-150 disabled:opacity-50"
                style={{
                  background: digit ? 'rgba(107,30,35,0.08)' : C.white,
                  border: digit ? '2px solid rgba(107,30,35,0.50)' : '2px solid rgba(107,30,35,0.18)',
                  color: C.dark,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(107,30,35,0.50)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = digit ? 'rgba(107,30,35,0.50)' : 'rgba(107,30,35,0.18)'; }}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {/* Submit */}
          <Button
            variant="primary"
            fullWidth
            loading={isSubmitting}
            onClick={() => { const code = digits.join(''); if (code.length === DIGIT_COUNT) submitCode(code); }}
            disabled={digits.some((d) => !d) || isSubmitting}
          >
            Verify Code
          </Button>

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
        </div>

        <p className="text-center font-body text-[10px] tracking-[0.08em] mt-5"
          style={{ color: 'rgba(154,96,96,0.45)' }}
        >
          Code expires in 30 seconds. Open your authenticator app to retrieve it.
        </p>
      </div>
    </div>
  );
}
