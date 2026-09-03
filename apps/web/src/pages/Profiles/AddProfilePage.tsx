// ============================================================
// OneFlesh — Add Profile Multi-Step Form Page (Crimson Velvet + White)
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Check, ChevronLeft, Upload, X } from 'lucide-react';
import { z } from 'zod';
import type { CreateProfileInput } from '@oneflesh/shared';
import { CreateProfileSchema, INDIAN_STATES, SeekingType } from '@oneflesh/shared';
import { profilesApi } from '../../services/api.js';
import { PageWrapper } from '../../components/layout/PageWrapper.js';
import { Button } from '../../components/ui/Button.js';
import { Input, Select, Textarea } from '../../components/ui/Input.js';

const C = {
  dark:        '#2C0F12',
  mid:         '#6B1E23',
  muted:       '#9a6060',
  white:       '#ffffff',
  border:      'rgba(107,30,35,0.12)',
  borderMid:   'rgba(107,30,35,0.22)',
  inputBorder: 'rgba(107,30,35,0.18)',
  inputFocus:  'rgba(107,30,35,0.50)',
  inputBorderError: 'rgba(239,68,68,0.60)',
  shadow:      '0 4px 20px rgba(44,15,18,0.09)',
} as const;

// ─── Step schemas ─────────────────────────────────────────────
const Step1Schema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  age: z.coerce.number().int().min(18, 'Must be at least 18').max(60, 'Must be at most 60'),
  city: z.string().min(2, 'City required'),
  state: z.enum(INDIAN_STATES, { errorMap: () => ({ message: 'Select a state' }) }),
  education: z.string().max(300).optional(),
  occupation: z.string().max(200).optional(),
  seeking: z.nativeEnum(SeekingType, { errorMap: () => ({ message: 'Select seeking type' }) }),
  yearsInChurch: z.coerce.number().int().min(1).max(80).optional().or(z.literal('')),
});

const Step2Schema = z.object({
  testimony: z.string().min(100, 'Testimony must be at least 100 characters'),
  ministryInvolvement: z.string().max(1000).optional(),
  pastorRecommendation: z.string().min(50, 'Pastoral recommendation must be at least 50 characters'),
});

const Step3Schema = z.object({
  fatherName: z.string().max(200).optional(),
  motherName: z.string().max(200).optional(),
  siblings: z.coerce.number().int().min(0).max(20).optional().or(z.literal('')),
  familyBackground: z.string().max(2000).optional(),
});

const EndorsementItemSchema = z.object({
  endorserName: z.string().min(2, 'Name required'),
  endorserRole: z.string().min(2, 'Role required'),
  endorsementText: z.string().min(20, 'Endorsement must be at least 20 characters'),
});

const Step4Schema = z.object({
  endorsements: z.array(EndorsementItemSchema).min(2, 'At least 2 endorsements are required'),
});

type FormValues = z.infer<typeof Step1Schema> &
  z.infer<typeof Step2Schema> &
  z.infer<typeof Step3Schema> &
  z.infer<typeof Step4Schema> & { photoFile?: FileList | null };

// ─── Step Indicator ───────────────────────────────────────────
function StepIndicator({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="flex items-start justify-center gap-0 mb-10">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[13px] font-semibold"
                style={
                  done
                    ? { background: '#2C0F12', borderColor: '#2C0F12', color: '#fed7b8' }
                    : active
                    ? { background: '#6B1E23', borderColor: '#6B1E23', color: '#fed7b8' }
                    : { background: 'rgba(107,30,35,0.06)', borderColor: 'rgba(107,30,35,0.18)', color: C.muted }
                }
              >
                {done ? <Check size={14} /> : step}
              </div>
              <span
                className="text-[10px] mt-1.5 tracking-[0.04em] text-center w-[70px]"
                style={{ color: active ? C.dark : C.muted, fontWeight: active ? 600 : 400 }}
              >
                {labels[i]}
              </span>
            </div>
            {i < total - 1 && (
              <div
                className="h-0.5 flex-1 mt-4 mx-1"
                style={{ background: step < current ? '#6B1E23' : C.border }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Step 1 — Personal Info ───────────────────────────────────
function Step1({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  const { register, formState: { errors } } = form;

  const stateOptions = (INDIAN_STATES as unknown as readonly string[]).map((s) => ({ value: s, label: s }));

  return (
    <div>
      <h2 className="font-display text-[22px] mb-5" style={{ color: C.dark }}>Personal Information</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
        <Input label="Full Name *" placeholder="e.g. Samuel George" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Age *" type="number" placeholder="25" error={errors.age?.message} {...register('age')} />
        <Input label="City *" placeholder="e.g. Chennai" error={errors.city?.message} {...register('city')} />
        <Select label="State *" placeholder="Select state" options={stateOptions} error={errors.state?.message} {...register('state')} />
        <Input label="Education" placeholder="e.g. B.Tech Computer Science" error={errors.education?.message} {...register('education')} />
        <Input label="Occupation" placeholder="e.g. Software Engineer" error={errors.occupation?.message} {...register('occupation')} />
        <Select
          label="Seeking *"
          placeholder="Select"
          options={[
            { value: SeekingType.BRIDE, label: 'Seeking Bride' },
            { value: SeekingType.GROOM, label: 'Seeking Groom' },
          ]}
          error={errors.seeking?.message}
          {...register('seeking')}
        />
        <Input label="Years in Church" type="number" placeholder="e.g. 8" error={errors.yearsInChurch?.message} {...register('yearsInChurch')} />
      </div>
    </div>
  );
}

// ─── Step 2 — Church & Faith ──────────────────────────────────
function Step2({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  const { register, watch, formState: { errors } } = form;

  const testimony = watch('testimony') ?? '';
  const recommendation = watch('pastorRecommendation') ?? '';
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  };

  return (
    <div>
      <h2 className="font-display text-[22px] mb-5" style={{ color: C.dark }}>Church &amp; Faith</h2>

      <div className="mb-3">
        <label className="block text-[11px] font-medium tracking-[0.07em] uppercase mb-1.5" style={{ color: C.mid }}>
          Testimony * ({testimony.length}/100+ chars)
        </label>
        <textarea
          placeholder="Share your personal testimony and faith journey (minimum 100 characters)…"
          className="w-full px-3 py-2.5 font-body text-[13px] rounded-[5px] outline-none resize-vertical min-h-[120px] transition-colors duration-200"
          style={{
            background: C.white,
            border: `1px solid ${errors.testimony ? C.inputBorderError : C.inputBorder}`,
            color: C.dark,
          }}
          {...register('testimony')}
          onFocus={(e) => { if (!errors.testimony) e.currentTarget.style.borderColor = C.inputFocus; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = errors.testimony ? C.inputBorderError : C.inputBorder; }}
        />
        {errors.testimony && <p className="text-red-600 text-[11px] mt-1">{errors.testimony.message}</p>}
      </div>

      <Textarea label="Ministry Involvement" placeholder="e.g. Worship team, Sunday school teacher, youth leader…" error={errors.ministryInvolvement?.message} {...register('ministryInvolvement')} />

      <div className="mb-3">
        <label className="block text-[11px] font-medium tracking-[0.07em] uppercase mb-1.5" style={{ color: C.mid }}>
          Pastor Recommendation * ({recommendation.length}/50+ chars)
        </label>
        <textarea
          placeholder="Pastoral recommendation (minimum 50 characters)…"
          className="w-full px-3 py-2.5 font-body text-[13px] rounded-[5px] outline-none resize-vertical min-h-[84px] transition-colors duration-200"
          style={{
            background: C.white,
            border: `1px solid ${errors.pastorRecommendation ? C.inputBorderError : C.inputBorder}`,
            color: C.dark,
          }}
          {...register('pastorRecommendation')}
          onFocus={(e) => { if (!errors.pastorRecommendation) e.currentTarget.style.borderColor = C.inputFocus; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = errors.pastorRecommendation ? C.inputBorderError : C.inputBorder; }}
        />
        {errors.pastorRecommendation && <p className="text-red-600 text-[11px] mt-1">{errors.pastorRecommendation.message}</p>}
      </div>

      {/* Photo upload */}
      <div className="mb-3">
        <label className="block text-[11px] font-medium tracking-[0.07em] uppercase mb-1.5" style={{ color: C.mid }}>
          Profile Photo
        </label>
        <div className="flex items-center gap-4">
          {photoPreview ? (
            <div className="relative w-[80px] h-[80px] rounded-full overflow-hidden flex-shrink-0" style={{ border: `2px solid ${C.border}` }}>
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotoPreview(null)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: '#2C0F12', color: '#fed7b8' }}
              >
                <X size={10} />
              </button>
            </div>
          ) : (
            <div
              className="w-[80px] h-[80px] rounded-full flex items-center justify-center flex-shrink-0"
              style={{ border: `2px dashed ${C.inputBorder}`, background: 'rgba(107,30,35,0.04)', color: C.muted }}
            >
              <Upload size={20} />
            </div>
          )}
          <label
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold tracking-widest uppercase rounded-sm transition-colors"
            style={{ color: C.mid, border: `1px solid ${C.border}` }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLLabelElement).style.borderColor = C.mid; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLLabelElement).style.borderColor = C.border; }}
          >
            <Upload size={12} />
            Choose Photo
            <input type="file" accept="image/*" className="hidden" {...register('photoFile')} onChange={handlePhotoChange} />
          </label>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3 — Family Background ───────────────────────────────
function Step3({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  const { register, formState: { errors } } = form;

  return (
    <div>
      <h2 className="font-display text-[22px] mb-5" style={{ color: C.dark }}>Family Background</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
        <Input label="Father's Name" placeholder="e.g. George Thomas" {...register('fatherName')} />
        <Input label="Mother's Name" placeholder="e.g. Mary George" {...register('motherName')} />
        <Input label="Number of Siblings" type="number" placeholder="0" error={errors.siblings?.message} {...register('siblings')} />
      </div>
      <Textarea label="Family Background" placeholder="Describe the family background, values, and upbringing…" className="min-h-[120px]" {...register('familyBackground')} />
    </div>
  );
}

// ─── Step 4 — Endorsements ────────────────────────────────────
function Step4({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  const { register, control, formState: { errors } } = form;
  const { fields } = useFieldArray({ control, name: 'endorsements' });
  const endorsementErrors = errors.endorsements;

  return (
    <div>
      <h2 className="font-display text-[22px] mb-1" style={{ color: C.dark }}>Endorsements</h2>
      <p className="text-[12px] mb-6" style={{ color: C.muted }}>
        At least 2 endorsements are required. Provide details for congregation members who can vouch for this candidate.
      </p>

      {endorsementErrors && !Array.isArray(endorsementErrors) && (
        <p className="text-red-600 text-[12px] mb-4">
          {(endorsementErrors as { message?: string }).message}
        </p>
      )}

      {fields.map((field, idx) => {
        const required = idx < 2;
        const fieldErrors = Array.isArray(endorsementErrors) ? endorsementErrors[idx] : undefined;

        return (
          <div
            key={field.id}
            className="rounded-[8px] p-4 mb-4"
            style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(44,15,18,0.05)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-6 h-6 rounded-full text-[11px] font-semibold flex items-center justify-center"
                style={{ background: '#2C0F12', color: '#fed7b8' }}
              >
                {idx + 1}
              </div>
              <span className="text-[12px] font-medium tracking-[0.06em] uppercase" style={{ color: C.mid }}>
                Endorsement {idx + 1} {required && '*'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
              <Input
                label={`Endorser Name${required ? ' *' : ''}`}
                placeholder="e.g. Elder Joseph Paul"
                error={fieldErrors?.endorserName?.message}
                {...register(`endorsements.${idx}.endorserName`)}
              />
              <Input
                label={`Role${required ? ' *' : ''}`}
                placeholder="e.g. Elder, Deacon, Congregation Member"
                error={fieldErrors?.endorserRole?.message}
                {...register(`endorsements.${idx}.endorserRole`)}
              />
            </div>
            <div className="mb-3">
              <label className="block text-[11px] font-medium tracking-[0.07em] uppercase mb-1.5" style={{ color: C.mid }}>
                Endorsement Text{required ? ' *' : ''}
              </label>
              <textarea
                placeholder="Endorsement statement (minimum 20 characters)…"
                className="w-full px-3 py-2.5 font-body text-[13px] rounded-[5px] outline-none resize-vertical min-h-[72px] transition-colors duration-200"
                style={{
                  background: C.white,
                  border: `1px solid ${fieldErrors?.endorsementText ? C.inputBorderError : C.inputBorder}`,
                  color: C.dark,
                }}
                {...register(`endorsements.${idx}.endorsementText`)}
                onFocus={(e) => { if (!fieldErrors?.endorsementText) e.currentTarget.style.borderColor = C.inputFocus; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = fieldErrors?.endorsementText ? C.inputBorderError : C.inputBorder; }}
              />
              {fieldErrors?.endorsementText && (
                <p className="text-red-600 text-[11px] mt-1">{fieldErrors.endorsementText.message}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
const STEP_LABELS = ['Personal', 'Church & Faith', 'Family', 'Endorsements'];
const TOTAL_STEPS = 4;
const STEP_VALIDATORS = [Step1Schema, Step2Schema, Step3Schema, Step4Schema];
const STEP_FIELDS: Array<Array<keyof FormValues>> = [
  ['fullName', 'age', 'city', 'state', 'education', 'occupation', 'seeking', 'yearsInChurch'],
  ['testimony', 'ministryInvolvement', 'pastorRecommendation'],
  ['fatherName', 'motherName', 'siblings', 'familyBackground'],
  ['endorsements'],
];

export default function AddProfilePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateProfileSchema.extend({
      motherName: z.string().max(200).optional(),
      siblings: z.coerce.number().int().min(0).max(20).optional().or(z.literal('')),
      familyBackground: z.string().max(2000).optional(),
      photoFile: z.any().optional(),
    }) as z.ZodType<FormValues>),
    defaultValues: {
      fullName: '', age: undefined, city: '', state: undefined,
      education: '', occupation: '', seeking: undefined, yearsInChurch: undefined,
      testimony: '', ministryInvolvement: '', pastorRecommendation: '',
      fatherName: '', motherName: '', siblings: undefined, familyBackground: '',
      endorsements: [
        { endorserName: '', endorserRole: '', endorsementText: '' },
        { endorserName: '', endorserRole: '', endorsementText: '' },
        { endorserName: '', endorserRole: '', endorsementText: '' },
      ],
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateProfileInput) => profilesApi.create(data),
    onSuccess: () => navigate('/profiles'),
  });

  const validateStep = async (): Promise<boolean> => {
    const values = form.getValues();
    const validator = STEP_VALIDATORS[step - 1];
    if (!validator) return true;
    const result = await validator.safeParseAsync(values);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        form.setError(path as Parameters<typeof form.setError>[0], { message: issue.message });
      });
      return false;
    }
    STEP_FIELDS[step - 1]?.forEach((key) => form.clearErrors(key));
    return true;
  };

  const handleNext = async () => {
    const valid = await validateStep();
    if (valid && step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const handleBack = () => { if (step > 1) setStep((s) => s - 1); };

  const handleSubmit = form.handleSubmit(async (values) => {
    const valid = await validateStep();
    if (!valid) return;

    const payload: CreateProfileInput = {
      fullName: values.fullName,
      age: Number(values.age),
      city: values.city,
      state: values.state,
      education: values.education || undefined,
      occupation: values.occupation || undefined,
      seeking: values.seeking,
      testimony: values.testimony,
      ministryInvolvement: values.ministryInvolvement || undefined,
      pastorRecommendation: values.pastorRecommendation,
      fatherName: values.fatherName || undefined,
      yearsInChurch: values.yearsInChurch ? Number(values.yearsInChurch) : undefined,
      endorsements: values.endorsements.filter(
        (e) => e.endorserName.trim() && e.endorserRole.trim() && e.endorsementText.trim(),
      ),
    };

    mutation.mutate(payload);
  });

  return (
    <PageWrapper>
      <div className="max-w-[680px] mx-auto px-6 py-9">
        <button
          type="button"
          onClick={() => navigate('/profiles')}
          className="flex items-center gap-1.5 text-[12px] transition-colors mb-6"
          style={{ color: C.muted }}
          onMouseEnter={(e) => { e.currentTarget.style.color = C.mid; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
        >
          <ChevronLeft size={14} />
          Back to Profiles
        </button>

        <h1 className="font-display text-[30px] font-normal mb-8" style={{ color: C.dark }}>
          Add New Profile
        </h1>

        <StepIndicator current={step} total={TOTAL_STEPS} labels={STEP_LABELS} />

        {/* Form card */}
        <div
          className="rounded-[12px] p-7"
          style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.shadow }}
        >
          <form onSubmit={handleSubmit} noValidate>
            {step === 1 && <Step1 form={form} />}
            {step === 2 && <Step2 form={form} />}
            {step === 3 && <Step3 form={form} />}
            {step === 4 && <Step4 form={form} />}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-5" style={{ borderTop: `1px solid ${C.border}` }}>
              <Button type="button" variant="ghost" size="sm" onClick={handleBack} disabled={step === 1}>
                Back
              </Button>
              {step < TOTAL_STEPS ? (
                <Button type="button" variant="primary" size="sm" onClick={handleNext}>
                  Next Step
                </Button>
              ) : (
                <Button type="submit" variant="primary" size="md" loading={mutation.isPending}>
                  Submit Profile
                </Button>
              )}
            </div>

            {mutation.isError && (
              <p className="text-red-600 text-[12px] text-center mt-3">
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
