import { z } from 'zod';
import { SeekingType, VendorCategory, SessionFormat } from '../constants/enums.js';
export declare const RegisterSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    churchName: z.ZodString;
    denomination: z.ZodString;
    city: z.ZodString;
    state: z.ZodEnum<["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"]>;
    pastorName: z.ZodString;
    pastorPhone: z.ZodString;
    congregationSize: z.ZodOptional<z.ZodNumber>;
    yearEstablished: z.ZodOptional<z.ZodNumber>;
    doctrinalFlags: z.ZodObject<{
        affirmsScriptureAlone: z.ZodLiteral<true>;
        affirmsChristAlone: z.ZodLiteral<true>;
        affirmsFaithAlone: z.ZodLiteral<true>;
        affirmsGraceAlone: z.ZodLiteral<true>;
    }, "strip", z.ZodTypeAny, {
        affirmsScriptureAlone: true;
        affirmsChristAlone: true;
        affirmsFaithAlone: true;
        affirmsGraceAlone: true;
    }, {
        affirmsScriptureAlone: true;
        affirmsChristAlone: true;
        affirmsFaithAlone: true;
        affirmsGraceAlone: true;
    }>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    churchName: string;
    denomination: string;
    city: string;
    state: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry";
    pastorName: string;
    pastorPhone: string;
    doctrinalFlags: {
        affirmsScriptureAlone: true;
        affirmsChristAlone: true;
        affirmsFaithAlone: true;
        affirmsGraceAlone: true;
    };
    congregationSize?: number | undefined;
    yearEstablished?: number | undefined;
}, {
    email: string;
    password: string;
    churchName: string;
    denomination: string;
    city: string;
    state: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry";
    pastorName: string;
    pastorPhone: string;
    doctrinalFlags: {
        affirmsScriptureAlone: true;
        affirmsChristAlone: true;
        affirmsFaithAlone: true;
        affirmsGraceAlone: true;
    };
    congregationSize?: number | undefined;
    yearEstablished?: number | undefined;
}>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginInput = z.infer<typeof LoginSchema>;
export declare const MfaVerifySchema: z.ZodObject<{
    tempToken: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    tempToken: string;
}, {
    code: string;
    tempToken: string;
}>;
export type MfaVerifyInput = z.infer<typeof MfaVerifySchema>;
export declare const MfaEnableSchema: z.ZodObject<{
    secret: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    secret: string;
}, {
    code: string;
    secret: string;
}>;
export type MfaEnableInput = z.infer<typeof MfaEnableSchema>;
export declare const ForgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export declare const ResetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export declare const CreateChurchSchema: z.ZodObject<{
    name: z.ZodString;
    denomination: z.ZodString;
    city: z.ZodString;
    state: z.ZodEnum<["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"]>;
    pastorName: z.ZodString;
    pastorEmail: z.ZodString;
    pastorPhone: z.ZodString;
    congregationSize: z.ZodOptional<z.ZodNumber>;
    yearEstablished: z.ZodOptional<z.ZodNumber>;
    doctrinalFlags: z.ZodObject<{
        affirmsScriptureAlone: z.ZodBoolean;
        affirmsChristAlone: z.ZodBoolean;
        affirmsFaithAlone: z.ZodBoolean;
        affirmsGraceAlone: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        affirmsScriptureAlone: boolean;
        affirmsChristAlone: boolean;
        affirmsFaithAlone: boolean;
        affirmsGraceAlone: boolean;
    }, {
        affirmsScriptureAlone: boolean;
        affirmsChristAlone: boolean;
        affirmsFaithAlone: boolean;
        affirmsGraceAlone: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    denomination: string;
    city: string;
    state: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry";
    pastorName: string;
    pastorPhone: string;
    doctrinalFlags: {
        affirmsScriptureAlone: boolean;
        affirmsChristAlone: boolean;
        affirmsFaithAlone: boolean;
        affirmsGraceAlone: boolean;
    };
    name: string;
    pastorEmail: string;
    congregationSize?: number | undefined;
    yearEstablished?: number | undefined;
}, {
    denomination: string;
    city: string;
    state: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry";
    pastorName: string;
    pastorPhone: string;
    doctrinalFlags: {
        affirmsScriptureAlone: boolean;
        affirmsChristAlone: boolean;
        affirmsFaithAlone: boolean;
        affirmsGraceAlone: boolean;
    };
    name: string;
    pastorEmail: string;
    congregationSize?: number | undefined;
    yearEstablished?: number | undefined;
}>;
export type CreateChurchInput = z.infer<typeof CreateChurchSchema>;
export declare const UpdateChurchSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    denomination: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodEnum<["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"]>>;
    pastorName: z.ZodOptional<z.ZodString>;
    pastorEmail: z.ZodOptional<z.ZodString>;
    pastorPhone: z.ZodOptional<z.ZodString>;
    congregationSize: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    yearEstablished: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    doctrinalFlags: z.ZodOptional<z.ZodObject<{
        affirmsScriptureAlone: z.ZodBoolean;
        affirmsChristAlone: z.ZodBoolean;
        affirmsFaithAlone: z.ZodBoolean;
        affirmsGraceAlone: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        affirmsScriptureAlone: boolean;
        affirmsChristAlone: boolean;
        affirmsFaithAlone: boolean;
        affirmsGraceAlone: boolean;
    }, {
        affirmsScriptureAlone: boolean;
        affirmsChristAlone: boolean;
        affirmsFaithAlone: boolean;
        affirmsGraceAlone: boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    denomination?: string | undefined;
    city?: string | undefined;
    state?: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry" | undefined;
    pastorName?: string | undefined;
    pastorPhone?: string | undefined;
    congregationSize?: number | undefined;
    yearEstablished?: number | undefined;
    doctrinalFlags?: {
        affirmsScriptureAlone: boolean;
        affirmsChristAlone: boolean;
        affirmsFaithAlone: boolean;
        affirmsGraceAlone: boolean;
    } | undefined;
    name?: string | undefined;
    pastorEmail?: string | undefined;
}, {
    denomination?: string | undefined;
    city?: string | undefined;
    state?: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry" | undefined;
    pastorName?: string | undefined;
    pastorPhone?: string | undefined;
    congregationSize?: number | undefined;
    yearEstablished?: number | undefined;
    doctrinalFlags?: {
        affirmsScriptureAlone: boolean;
        affirmsChristAlone: boolean;
        affirmsFaithAlone: boolean;
        affirmsGraceAlone: boolean;
    } | undefined;
    name?: string | undefined;
    pastorEmail?: string | undefined;
}>;
export type UpdateChurchInput = z.infer<typeof UpdateChurchSchema>;
export declare const RejectChurchSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export type RejectChurchInput = z.infer<typeof RejectChurchSchema>;
export declare const EndorsementSchema: z.ZodObject<{
    endorserName: z.ZodString;
    endorserRole: z.ZodString;
    endorsementText: z.ZodString;
}, "strip", z.ZodTypeAny, {
    endorserName: string;
    endorserRole: string;
    endorsementText: string;
}, {
    endorserName: string;
    endorserRole: string;
    endorsementText: string;
}>;
export declare const CreateProfileSchema: z.ZodObject<{
    fullName: z.ZodString;
    age: z.ZodNumber;
    city: z.ZodString;
    state: z.ZodEnum<["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"]>;
    education: z.ZodOptional<z.ZodString>;
    occupation: z.ZodOptional<z.ZodString>;
    seeking: z.ZodNativeEnum<typeof SeekingType>;
    testimony: z.ZodString;
    ministryInvolvement: z.ZodOptional<z.ZodString>;
    pastorRecommendation: z.ZodString;
    endorsements: z.ZodArray<z.ZodObject<{
        endorserName: z.ZodString;
        endorserRole: z.ZodString;
        endorsementText: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        endorserName: string;
        endorserRole: string;
        endorsementText: string;
    }, {
        endorserName: string;
        endorserRole: string;
        endorsementText: string;
    }>, "many">;
    fatherName: z.ZodOptional<z.ZodString>;
    yearsInChurch: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    city: string;
    state: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry";
    fullName: string;
    age: number;
    seeking: SeekingType;
    testimony: string;
    pastorRecommendation: string;
    endorsements: {
        endorserName: string;
        endorserRole: string;
        endorsementText: string;
    }[];
    education?: string | undefined;
    occupation?: string | undefined;
    ministryInvolvement?: string | undefined;
    fatherName?: string | undefined;
    yearsInChurch?: number | undefined;
}, {
    city: string;
    state: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry";
    fullName: string;
    age: number;
    seeking: SeekingType;
    testimony: string;
    pastorRecommendation: string;
    endorsements: {
        endorserName: string;
        endorserRole: string;
        endorsementText: string;
    }[];
    education?: string | undefined;
    occupation?: string | undefined;
    ministryInvolvement?: string | undefined;
    fatherName?: string | undefined;
    yearsInChurch?: number | undefined;
}>;
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
export declare const UpdateProfileSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    age: z.ZodOptional<z.ZodNumber>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodEnum<["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"]>>;
    education: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    occupation: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    seeking: z.ZodOptional<z.ZodNativeEnum<typeof SeekingType>>;
    testimony: z.ZodOptional<z.ZodString>;
    ministryInvolvement: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    pastorRecommendation: z.ZodOptional<z.ZodString>;
    endorsements: z.ZodOptional<z.ZodArray<z.ZodObject<{
        endorserName: z.ZodString;
        endorserRole: z.ZodString;
        endorsementText: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        endorserName: string;
        endorserRole: string;
        endorsementText: string;
    }, {
        endorserName: string;
        endorserRole: string;
        endorsementText: string;
    }>, "many">>;
    fatherName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    yearsInChurch: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    city?: string | undefined;
    state?: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry" | undefined;
    fullName?: string | undefined;
    age?: number | undefined;
    education?: string | undefined;
    occupation?: string | undefined;
    seeking?: SeekingType | undefined;
    testimony?: string | undefined;
    ministryInvolvement?: string | undefined;
    pastorRecommendation?: string | undefined;
    endorsements?: {
        endorserName: string;
        endorserRole: string;
        endorsementText: string;
    }[] | undefined;
    fatherName?: string | undefined;
    yearsInChurch?: number | undefined;
}, {
    city?: string | undefined;
    state?: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry" | undefined;
    fullName?: string | undefined;
    age?: number | undefined;
    education?: string | undefined;
    occupation?: string | undefined;
    seeking?: SeekingType | undefined;
    testimony?: string | undefined;
    ministryInvolvement?: string | undefined;
    pastorRecommendation?: string | undefined;
    endorsements?: {
        endorserName: string;
        endorserRole: string;
        endorsementText: string;
    }[] | undefined;
    fatherName?: string | undefined;
    yearsInChurch?: number | undefined;
}>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export declare const ProfileSearchSchema: z.ZodObject<{
    state: z.ZodOptional<z.ZodEnum<["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"]>>;
    seeking: z.ZodOptional<z.ZodNativeEnum<typeof SeekingType>>;
    ageMin: z.ZodOptional<z.ZodNumber>;
    ageMax: z.ZodOptional<z.ZodNumber>;
    denomination: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    denomination?: string | undefined;
    state?: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry" | undefined;
    seeking?: SeekingType | undefined;
    ageMin?: number | undefined;
    ageMax?: number | undefined;
    q?: string | undefined;
}, {
    denomination?: string | undefined;
    state?: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry" | undefined;
    seeking?: SeekingType | undefined;
    ageMin?: number | undefined;
    ageMax?: number | undefined;
    q?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type ProfileSearchInput = z.infer<typeof ProfileSearchSchema>;
export declare const CreateAllianceSchema: z.ZodObject<{
    profile1Id: z.ZodString;
    profile2Id: z.ZodString;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    profile1Id: string;
    profile2Id: string;
    note?: string | undefined;
}, {
    profile1Id: string;
    profile2Id: string;
    note?: string | undefined;
}>;
export type CreateAllianceInput = z.infer<typeof CreateAllianceSchema>;
export declare const AdvanceAllianceSchema: z.ZodObject<{
    note: z.ZodString;
}, "strip", z.ZodTypeAny, {
    note: string;
}, {
    note: string;
}>;
export type AdvanceAllianceInput = z.infer<typeof AdvanceAllianceSchema>;
export declare const DissolveAllianceSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const AddAllianceNoteSchema: z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
}, {
    content: string;
}>;
export type AddAllianceNoteInput = z.infer<typeof AddAllianceNoteSchema>;
export declare const CreateCounsellingSchema: z.ZodObject<{
    allianceId: z.ZodString;
    groomName: z.ZodString;
    brideName: z.ZodString;
    groomChurch: z.ZodString;
    brideChurch: z.ZodString;
    counsellorName: z.ZodString;
    sessionDate: z.ZodOptional<z.ZodString>;
    format: z.ZodDefault<z.ZodNativeEnum<typeof SessionFormat>>;
}, "strip", z.ZodTypeAny, {
    format: SessionFormat;
    allianceId: string;
    groomName: string;
    brideName: string;
    groomChurch: string;
    brideChurch: string;
    counsellorName: string;
    sessionDate?: string | undefined;
}, {
    allianceId: string;
    groomName: string;
    brideName: string;
    groomChurch: string;
    brideChurch: string;
    counsellorName: string;
    format?: SessionFormat | undefined;
    sessionDate?: string | undefined;
}>;
export type CreateCounsellingInput = z.infer<typeof CreateCounsellingSchema>;
export declare const CompleteSessionSchema: z.ZodObject<{
    notes: z.ZodOptional<z.ZodString>;
    completedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
    completedAt?: string | undefined;
}, {
    notes?: string | undefined;
    completedAt?: string | undefined;
}>;
export type CompleteSessionInput = z.infer<typeof CompleteSessionSchema>;
export declare const CreateVendorSchema: z.ZodObject<{
    businessName: z.ZodString;
    category: z.ZodNativeEnum<typeof VendorCategory>;
    location: z.ZodString;
    city: z.ZodString;
    state: z.ZodEnum<["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"]>;
    description: z.ZodString;
    priceFrom: z.ZodOptional<z.ZodString>;
    priceType: z.ZodOptional<z.ZodString>;
    ownerName: z.ZodString;
    phone: z.ZodString;
    email: z.ZodString;
    website: z.ZodOptional<z.ZodString>;
    churchId: z.ZodOptional<z.ZodString>;
    pastorVerifierName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    city: string;
    state: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry";
    businessName: string;
    category: VendorCategory;
    location: string;
    description: string;
    ownerName: string;
    phone: string;
    churchId?: string | undefined;
    priceFrom?: string | undefined;
    priceType?: string | undefined;
    website?: string | undefined;
    pastorVerifierName?: string | undefined;
}, {
    email: string;
    city: string;
    state: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry";
    businessName: string;
    category: VendorCategory;
    location: string;
    description: string;
    ownerName: string;
    phone: string;
    churchId?: string | undefined;
    priceFrom?: string | undefined;
    priceType?: string | undefined;
    website?: string | undefined;
    pastorVerifierName?: string | undefined;
}>;
export type CreateVendorInput = z.infer<typeof CreateVendorSchema>;
export declare const UpdateVendorSchema: z.ZodObject<{
    businessName: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodNativeEnum<typeof VendorCategory>>;
    location: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodEnum<["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"]>>;
    description: z.ZodOptional<z.ZodString>;
    priceFrom: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    priceType: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    ownerName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    churchId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    pastorVerifierName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    churchId?: string | undefined;
    city?: string | undefined;
    state?: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry" | undefined;
    businessName?: string | undefined;
    category?: VendorCategory | undefined;
    location?: string | undefined;
    description?: string | undefined;
    priceFrom?: string | undefined;
    priceType?: string | undefined;
    ownerName?: string | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    pastorVerifierName?: string | undefined;
}, {
    email?: string | undefined;
    churchId?: string | undefined;
    city?: string | undefined;
    state?: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry" | undefined;
    businessName?: string | undefined;
    category?: VendorCategory | undefined;
    location?: string | undefined;
    description?: string | undefined;
    priceFrom?: string | undefined;
    priceType?: string | undefined;
    ownerName?: string | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    pastorVerifierName?: string | undefined;
}>;
export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema>;
export declare const VendorSearchSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodNativeEnum<typeof VendorCategory>>;
    state: z.ZodOptional<z.ZodEnum<["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"]>>;
    verified: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
    featured: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
    q: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    state?: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry" | undefined;
    q?: string | undefined;
    category?: VendorCategory | undefined;
    verified?: boolean | undefined;
    featured?: boolean | undefined;
}, {
    state?: "Andhra Pradesh" | "Arunachal Pradesh" | "Assam" | "Bihar" | "Chhattisgarh" | "Goa" | "Gujarat" | "Haryana" | "Himachal Pradesh" | "Jharkhand" | "Karnataka" | "Kerala" | "Madhya Pradesh" | "Maharashtra" | "Manipur" | "Meghalaya" | "Mizoram" | "Nagaland" | "Odisha" | "Punjab" | "Rajasthan" | "Sikkim" | "Tamil Nadu" | "Telangana" | "Tripura" | "Uttar Pradesh" | "Uttarakhand" | "West Bengal" | "Andaman and Nicobar Islands" | "Chandigarh" | "Dadra and Nagar Haveli and Daman and Diu" | "Delhi" | "Jammu and Kashmir" | "Ladakh" | "Lakshadweep" | "Puducherry" | undefined;
    q?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    category?: VendorCategory | undefined;
    verified?: string | undefined;
    featured?: string | undefined;
}>;
export type VendorSearchInput = z.infer<typeof VendorSearchSchema>;
export declare const AIMatchSchema: z.ZodObject<{
    profileId: z.ZodString;
    topN: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    profileId: string;
    topN: number;
}, {
    profileId: string;
    topN?: number | undefined;
}>;
export type AIMatchInput = z.infer<typeof AIMatchSchema>;
export declare const AILetterSchema: z.ZodObject<{
    allianceId: z.ZodOptional<z.ZodString>;
    fromPastorName: z.ZodString;
    fromChurchName: z.ZodString;
    toPastorName: z.ZodString;
    toChurchName: z.ZodString;
    candidateName: z.ZodString;
    targetCandidateName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fromPastorName: string;
    fromChurchName: string;
    toPastorName: string;
    toChurchName: string;
    candidateName: string;
    targetCandidateName: string;
    allianceId?: string | undefined;
}, {
    fromPastorName: string;
    fromChurchName: string;
    toPastorName: string;
    toChurchName: string;
    candidateName: string;
    targetCandidateName: string;
    allianceId?: string | undefined;
}>;
export type AILetterInput = z.infer<typeof AILetterSchema>;
export declare const AICounsellingQuestionsSchema: z.ZodObject<{
    sessionNumber: z.ZodNumber;
    allianceId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sessionNumber: number;
    allianceId?: string | undefined;
}, {
    sessionNumber: number;
    allianceId?: string | undefined;
}>;
export type AICounsellingQuestionsInput = z.infer<typeof AICounsellingQuestionsSchema>;
export declare const AIAllianceSummarySchema: z.ZodObject<{
    allianceId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    allianceId: string;
}, {
    allianceId: string;
}>;
export type AIAllianceSummaryInput = z.infer<typeof AIAllianceSummarySchema>;
export declare const AIChatSchema: z.ZodObject<{
    message: z.ZodString;
    history: z.ZodDefault<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        role: "user" | "assistant";
        content: string;
    }, {
        role: "user" | "assistant";
        content: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    message: string;
    history: {
        role: "user" | "assistant";
        content: string;
    }[];
}, {
    message: string;
    history?: {
        role: "user" | "assistant";
        content: string;
    }[] | undefined;
}>;
export type AIChatInput = z.infer<typeof AIChatSchema>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
//# sourceMappingURL=index.d.ts.map