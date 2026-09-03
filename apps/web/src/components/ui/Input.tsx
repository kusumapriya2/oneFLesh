// ============================================================
// OneFlesh — Input & Form Components (Crimson Velvet + White)
// ============================================================

import React, { forwardRef } from 'react';

const C = {
  label: '#6B1E23',
  inputBg: '#ffffff',
  inputBorder: 'rgba(107,30,35,0.18)',
  inputBorderFocus: 'rgba(107,30,35,0.55)',
  inputBorderError: 'rgba(239,68,68,0.60)',
  inputText: '#2C0F12',
  inputPlaceholder: '#c8a4a6',
  errorText: '#dc2626',
  hintText: '#9a6060',
} as const;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, style, onFocus, onBlur, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const borderColor = error ? C.inputBorderError : C.inputBorder;

    return (
      <div className="mb-3">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-medium tracking-[0.07em] uppercase mb-1.5"
            style={{ color: C.label }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full px-3 py-2.5 font-body text-[13px]',
            'rounded-[5px] outline-none',
            'transition-colors duration-200',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            background: C.inputBg,
            border: `1px solid ${borderColor}`,
            color: C.inputText,
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? C.inputBorderError : C.inputBorderFocus;
            onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? C.inputBorderError : C.inputBorder;
            onBlur?.(e);
          }}
          {...props}
        />
        {error && <p className="text-[11px] mt-1" style={{ color: C.errorText }}>{error}</p>}
        {hint && !error && <p className="text-[11px] mt-1" style={{ color: C.hintText }}>{hint}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, style, onFocus, onBlur, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const borderColor = error ? C.inputBorderError : C.inputBorder;

    return (
      <div className="mb-3">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-medium tracking-[0.07em] uppercase mb-1.5"
            style={{ color: C.label }}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={[
            'w-full px-3 py-2.5 font-body text-[13px]',
            'rounded-[5px] outline-none cursor-pointer',
            'transition-colors duration-200',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            background: C.inputBg,
            border: `1px solid ${borderColor}`,
            color: C.inputText,
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? C.inputBorderError : C.inputBorderFocus;
            onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? C.inputBorderError : C.inputBorder;
            onBlur?.(e);
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ background: '#ffffff', color: '#2C0F12' }}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-[11px] mt-1" style={{ color: C.errorText }}>{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, style, onFocus, onBlur, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const borderColor = error ? C.inputBorderError : C.inputBorder;

    return (
      <div className="mb-3">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-medium tracking-[0.07em] uppercase mb-1.5"
            style={{ color: C.label }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={[
            'w-full px-3 py-2.5 font-body text-[13px]',
            'rounded-[5px] outline-none resize-vertical min-h-[84px]',
            'transition-colors duration-200',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            background: C.inputBg,
            border: `1px solid ${borderColor}`,
            color: C.inputText,
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? C.inputBorderError : C.inputBorderFocus;
            onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? C.inputBorderError : C.inputBorder;
            onBlur?.(e);
          }}
          {...props}
        />
        {error && <p className="text-[11px] mt-1" style={{ color: C.errorText }}>{error}</p>}
        {hint && !error && <p className="text-[11px] mt-1" style={{ color: C.hintText }}>{hint}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
