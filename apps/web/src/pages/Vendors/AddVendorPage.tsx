// ============================================================
// OneFlesh — Add Vendor Page (Crimson Velvet + White)
// ============================================================

import React, { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CreateVendorSchema,
  type CreateVendorInput,
  VendorCategory,
  VENDOR_CATEGORY_LABELS,
  INDIAN_STATES,
} from '@oneflesh/shared';
import { vendorsApi } from '../../services/api.js';
import { Input, Select, Textarea } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { PageWrapper } from '../../components/layout/PageWrapper.js';

const C = {
  dark:        '#2C0F12',
  mid:         '#6B1E23',
  muted:       '#9a6060',
  white:       '#ffffff',
  border:      'rgba(107,30,35,0.12)',
  borderMid:   'rgba(107,30,35,0.22)',
  inputBorder: 'rgba(107,30,35,0.18)',
  inputFocus:  'rgba(107,30,35,0.50)',
  shadow:      '0 4px 20px rgba(44,15,18,0.09)',
} as const;

const CATEGORY_OPTIONS = Object.values(VendorCategory).map((cat) => ({
  value: cat,
  label: VENDOR_CATEGORY_LABELS[cat],
}));

const STATE_OPTIONS = INDIAN_STATES.map((s) => ({ value: s, label: s }));

const PRICE_TYPE_OPTIONS = [
  { value: 'Per service', label: 'Per service' },
  { value: 'Per person', label: 'Per person' },
  { value: 'Per day', label: 'Per day' },
  { value: 'Per hour', label: 'Per hour' },
  { value: 'Per event', label: 'Per event' },
  { value: 'Per package', label: 'Per package' },
];

type FormValues = CreateVendorInput;

// ─── Section divider ─────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px" style={{ background: C.border }} />
      <span className="font-display text-[15px] whitespace-nowrap" style={{ color: C.mid }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: C.border }} />
    </div>
  );
}

export default function AddVendorPage() {
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(CreateVendorSchema),
    defaultValues: { category: VendorCategory.PHOTOGRAPHY },
  });

  const watchCategory = watch('category');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const res = await vendorsApi.create(values);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const vendorId = res.data?.data?.id as string | undefined;
      if (photoFile && vendorId) {
        try {
          const form = new FormData();
          form.append('photo', photoFile);
          await vendorsApi.update(vendorId, form);
        } catch { /* Non-critical */ }
      }
      toast.success('Your business has been listed! Pending church verification.');
      navigate('/vendors');
    } catch (err: unknown) {
      const message =
        err !== null && typeof err === 'object' && 'response' in err &&
        err.response !== null && typeof err.response === 'object' && 'data' in err.response &&
        err.response.data !== null && typeof err.response.data === 'object' && 'error' in err.response.data &&
        err.response.data.error !== null && typeof err.response.data.error === 'object' && 'message' in err.response.data.error
          ? String(err.response.data.error.message)
          : 'Failed to submit. Please check the form and try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="py-12 px-4">
        <div className="max-w-[660px] mx-auto">
          {/* Back link */}
          <button
            onClick={() => navigate('/vendors')}
            className="text-[12px] transition-colors mb-6 flex items-center gap-1.5"
            style={{ color: C.muted }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.mid; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
          >
            ← Back to Vendors
          </button>

          {/* Card */}
          <div
            className="rounded-2xl px-8 py-10"
            style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.shadow }}
          >
            {/* Header */}
            <div className="mb-7">
              <h1 className="font-display text-[30px] font-normal leading-tight" style={{ color: C.dark }}>
                List Your Business
              </h1>
              <p className="text-[13px] mt-1.5" style={{ color: C.muted }}>
                Join our church-verified vendor directory. A pastor will review your listing.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <SectionDivider label="Business Details" />

              <Input
                label="Business Name *"
                placeholder="e.g. Grace Bridal Studio"
                error={errors.businessName?.message}
                {...register('businessName')}
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Category *"
                  options={CATEGORY_OPTIONS}
                  placeholder="Select category"
                  error={errors.category?.message}
                  {...register('category')}
                />
                <Input
                  label="Location / Area *"
                  placeholder="e.g. Anna Nagar, Chennai"
                  error={errors.location?.message}
                  {...register('location')}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="City *"
                  placeholder="e.g. Chennai"
                  error={errors.city?.message}
                  {...register('city')}
                />
                <Select
                  label="State *"
                  options={STATE_OPTIONS}
                  placeholder="Select state"
                  error={errors.state?.message}
                  {...register('state')}
                />
              </div>

              <Textarea
                label="Description *"
                placeholder="Describe your services, experience, and why you'd be a great fit for Christian weddings… (min 20 characters)"
                rows={4}
                error={errors.description?.message}
                {...register('description')}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Price From (optional)"
                  placeholder="e.g. 5000"
                  error={errors.priceFrom?.message}
                  {...register('priceFrom')}
                />
                <Select
                  label="Price Type (optional)"
                  options={PRICE_TYPE_OPTIONS}
                  placeholder="Select price type"
                  error={errors.priceType?.message}
                  {...register('priceType')}
                />
              </div>

              <SectionDivider label="Owner Details" />

              <Input
                label="Owner Name *"
                placeholder="Full name"
                error={errors.ownerName?.message}
                {...register('ownerName')}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Phone * (+91 format)"
                  placeholder="9876543210"
                  type="tel"
                  error={errors.phone?.message}
                  hint="10-digit Indian mobile number"
                  {...register('phone')}
                />
                <Input
                  label="Email *"
                  type="email"
                  placeholder="owner@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <Input
                label="Website (optional)"
                type="url"
                placeholder="https://www.yourbusiness.com"
                error={errors.website?.message}
                {...register('website')}
              />

              <SectionDivider label="Church Verification" />

              <p className="text-[12px] font-light mb-4" style={{ color: C.muted }}>
                Church-verified vendors receive a verified badge, increasing trust from families.
                This step is optional but recommended.
              </p>

              <div className="mb-3">
                <label className="block text-[11px] font-medium tracking-[0.07em] uppercase mb-1.5" style={{ color: C.mid }}>
                  Your Church
                </label>
                <input
                  type="text"
                  placeholder="Which church are you a member of?"
                  className="w-full px-3 py-2.5 font-body text-[13px] rounded-[5px] outline-none transition-colors duration-200"
                  style={{ background: C.white, border: `1px solid ${C.inputBorder}`, color: C.dark }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.inputFocus; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.inputBorder; }}
                />
              </div>

              <Input
                label="Pastor Contact Name (for verification)"
                placeholder="Pastor's name who can verify your membership"
                error={errors.pastorVerifierName?.message}
                {...register('pastorVerifierName')}
              />

              <SectionDivider label="Business Photo" />

              <div
                className="rounded-[8px] p-6 text-center cursor-pointer transition-colors"
                style={{ border: `2px dashed ${C.inputBorder}` }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = C.inputFocus; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = C.inputBorder; }}
                onClick={() => photoInputRef.current?.click()}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="mx-auto max-h-[160px] rounded object-contain" />
                ) : (
                  <>
                    <div className="text-[28px] mb-2">📷</div>
                    <div className="text-[13px]" style={{ color: C.muted }}>
                      Click to upload a photo of your business
                    </div>
                    <div className="text-[11px] mt-1" style={{ color: 'rgba(154,96,96,0.55)' }}>
                      JPG, PNG or WEBP · max 5 MB
                    </div>
                  </>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
              {photoFile && (
                <div className="text-[11px] mt-1.5" style={{ color: C.muted }}>
                  Selected: {photoFile.name}
                </div>
              )}

              {/* Category note */}
              {watchCategory && (
                <div
                  className="mt-5 rounded-[8px] px-4 py-3"
                  style={{ background: 'rgba(107,30,35,0.05)', border: `1px solid ${C.border}` }}
                >
                  <div className="text-[11px]" style={{ color: C.muted }}>
                    <span className="font-medium" style={{ color: C.mid }}>
                      {VENDOR_CATEGORY_LABELS[watchCategory as VendorCategory]}
                    </span>{' '}
                    — Listed under this category in the vendor directory.
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <Button type="button" variant="ghost" size="md" onClick={() => navigate('/vendors')} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" loading={submitting} className="flex-[2]">
                  Submit Listing
                </Button>
              </div>

              <p className="text-center text-[11px] mt-4" style={{ color: 'rgba(154,96,96,0.55)' }}>
                Listings are reviewed by our team before being published.
              </p>
            </form>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
