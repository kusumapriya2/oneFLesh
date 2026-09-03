// ============================================================
// OneFlesh — Zod Validation Schemas (shared by API + Web)
// ============================================================
import { z } from 'zod';
import { SeekingType, VendorCategory, SessionFormat } from '../constants/enums.js';
import { INDIAN_STATES } from '../constants/enums.js';
// ─── Common ──────────────────────────────────────────────────
const phoneRegex = /^[6-9]\d{9}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
// ─── Auth Schemas ─────────────────────────────────────────────
export const RegisterSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .regex(passwordRegex, 'Password must be at least 12 characters with uppercase, lowercase, number, and special character'),
    churchName: z.string().min(2, 'Church name must be at least 2 characters').max(200),
    denomination: z.string().min(2).max(100),
    city: z.string().min(2).max(100),
    state: z.enum(INDIAN_STATES),
    pastorName: z.string().min(2).max(200),
    pastorPhone: z.string().regex(phoneRegex, 'Invalid Indian mobile number'),
    congregationSize: z.number().int().min(1).max(10000).optional(),
    yearEstablished: z.number().int().min(1800).max(2025).optional(),
    doctrinalFlags: z.object({
        affirmsScriptureAlone: z.literal(true, { errorMap: () => ({ message: 'Must affirm Scripture alone' }) }),
        affirmsChristAlone: z.literal(true, { errorMap: () => ({ message: 'Must affirm Christ alone' }) }),
        affirmsFaithAlone: z.literal(true, { errorMap: () => ({ message: 'Must affirm Faith alone' }) }),
        affirmsGraceAlone: z.literal(true, { errorMap: () => ({ message: 'Must affirm Grace alone' }) }),
    }),
});
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
});
export const MfaVerifySchema = z.object({
    tempToken: z.string().min(1),
    code: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/),
});
export const MfaEnableSchema = z.object({
    secret: z.string().min(1),
    code: z.string().length(6).regex(/^\d{6}$/),
});
export const ForgotPasswordSchema = z.object({
    email: z.string().email(),
});
export const ResetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().regex(passwordRegex, 'Password does not meet requirements'),
});
// ─── Church Schemas ───────────────────────────────────────────
export const CreateChurchSchema = z.object({
    name: z.string().min(2).max(200),
    denomination: z.string().min(2).max(100),
    city: z.string().min(2).max(100),
    state: z.enum(INDIAN_STATES),
    pastorName: z.string().min(2).max(200),
    pastorEmail: z.string().email(),
    pastorPhone: z.string().regex(phoneRegex),
    congregationSize: z.number().int().min(1).max(10000).optional(),
    yearEstablished: z.number().int().min(1800).max(2025).optional(),
    doctrinalFlags: z.object({
        affirmsScriptureAlone: z.boolean(),
        affirmsChristAlone: z.boolean(),
        affirmsFaithAlone: z.boolean(),
        affirmsGraceAlone: z.boolean(),
    }),
});
export const UpdateChurchSchema = CreateChurchSchema.partial();
export const RejectChurchSchema = z.object({
    reason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
});
// ─── Profile Schemas ──────────────────────────────────────────
export const EndorsementSchema = z.object({
    endorserName: z.string().min(2).max(200),
    endorserRole: z.string().min(2).max(100),
    endorsementText: z.string().min(20).max(1000),
});
export const CreateProfileSchema = z.object({
    fullName: z.string().min(2).max(200),
    age: z.number().int().min(18).max(60),
    city: z.string().min(2).max(100),
    state: z.enum(INDIAN_STATES),
    education: z.string().max(300).optional(),
    occupation: z.string().max(200).optional(),
    seeking: z.nativeEnum(SeekingType),
    testimony: z.string().min(100, 'Testimony must be at least 100 characters'),
    ministryInvolvement: z.string().max(1000).optional(),
    pastorRecommendation: z.string().min(50, 'Pastor recommendation must be at least 50 characters'),
    endorsements: z.array(EndorsementSchema).min(2, 'At least 2 endorsements required'),
    fatherName: z.string().max(200).optional(),
    yearsInChurch: z.number().int().min(1).max(80).optional(),
});
export const UpdateProfileSchema = CreateProfileSchema.partial();
export const ProfileSearchSchema = z.object({
    state: z.enum(INDIAN_STATES).optional(),
    seeking: z.nativeEnum(SeekingType).optional(),
    ageMin: z.coerce.number().int().min(18).max(60).optional(),
    ageMax: z.coerce.number().int().min(18).max(60).optional(),
    denomination: z.string().optional(),
    q: z.string().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});
// ─── Alliance Schemas ─────────────────────────────────────────
export const CreateAllianceSchema = z.object({
    profile1Id: z.string().uuid(),
    profile2Id: z.string().uuid(),
    note: z.string().max(1000).optional(),
});
export const AdvanceAllianceSchema = z.object({
    note: z.string().min(5).max(2000),
});
export const DissolveAllianceSchema = z.object({
// No reason required per BRD
});
export const AddAllianceNoteSchema = z.object({
    content: z.string().min(5).max(2000),
});
// ─── Counselling Schemas ──────────────────────────────────────
export const CreateCounsellingSchema = z.object({
    allianceId: z.string().uuid(),
    groomName: z.string().min(2).max(200),
    brideName: z.string().min(2).max(200),
    groomChurch: z.string().min(2).max(200),
    brideChurch: z.string().min(2).max(200),
    counsellorName: z.string().min(2).max(200),
    sessionDate: z.string().datetime().optional(),
    format: z.nativeEnum(SessionFormat).default(SessionFormat.IN_PERSON),
});
export const CompleteSessionSchema = z.object({
    notes: z.string().max(5000).optional(),
    completedAt: z.string().datetime().optional(),
});
// ─── Vendor Schemas ───────────────────────────────────────────
export const CreateVendorSchema = z.object({
    businessName: z.string().min(2).max(200),
    category: z.nativeEnum(VendorCategory),
    location: z.string().min(2).max(200),
    city: z.string().min(2).max(100),
    state: z.enum(INDIAN_STATES),
    description: z.string().min(20).max(2000),
    priceFrom: z.string().max(50).optional(),
    priceType: z.string().max(100).optional(),
    ownerName: z.string().min(2).max(200),
    phone: z.string().regex(phoneRegex),
    email: z.string().email(),
    website: z.string().url().optional(),
    churchId: z.string().uuid().optional(),
    pastorVerifierName: z.string().min(2).max(200).optional(),
});
export const UpdateVendorSchema = CreateVendorSchema.partial();
export const VendorSearchSchema = z.object({
    category: z.nativeEnum(VendorCategory).optional(),
    state: z.enum(INDIAN_STATES).optional(),
    verified: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    featured: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    q: z.string().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});
// ─── AI Schemas ───────────────────────────────────────────────
export const AIMatchSchema = z.object({
    profileId: z.string().uuid(),
    topN: z.number().int().min(1).max(10).default(5),
});
export const AILetterSchema = z.object({
    allianceId: z.string().uuid().optional(),
    fromPastorName: z.string().min(2),
    fromChurchName: z.string().min(2),
    toPastorName: z.string().min(2),
    toChurchName: z.string().min(2),
    candidateName: z.string().min(2),
    targetCandidateName: z.string().min(2),
});
export const AICounsellingQuestionsSchema = z.object({
    sessionNumber: z.number().int().min(1).max(6),
    allianceId: z.string().uuid().optional(),
});
export const AIAllianceSummarySchema = z.object({
    allianceId: z.string().uuid(),
});
export const AIChatSchema = z.object({
    message: z.string().min(1).max(1000),
    history: z
        .array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
    }))
        .max(20)
        .default([]),
});
// ─── Pagination ───────────────────────────────────────────────
export const PaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
//# sourceMappingURL=index.js.map