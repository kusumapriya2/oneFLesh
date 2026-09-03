import type { UserRole, ChurchStatus, ProfileStatus, SeekingType, AllianceStatus, VendorCategory, VendorStatus, SessionStatus, SessionFormat, NotificationType, AuditAction, AIFeature } from '../constants/enums.js';
export interface User {
    id: string;
    email: string;
    role: UserRole;
    churchId: string | null;
    mfaEnabled: boolean;
    mfaSecret: string | null;
    failedLoginAttempts: number;
    lockedUntil: Date | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserPublic extends Omit<User, 'mfaSecret'> {
}
export interface Church {
    id: string;
    name: string;
    denomination: string;
    city: string;
    state: string;
    pastorName: string;
    pastorEmail: string;
    pastorPhone: string;
    congregationSize: number | null;
    yearEstablished: number | null;
    doctrinalFlags: DoctrinalFlags;
    status: ChurchStatus;
    createdAt: Date;
    updatedAt: Date;
}
export interface DoctrinalFlags {
    affirmsScriptureAlone: boolean;
    affirmsChristAlone: boolean;
    affirmsFaithAlone: boolean;
    affirmsGraceAlone: boolean;
}
export interface Profile {
    id: string;
    churchId: string;
    pastorId: string;
    fullName: string;
    age: number;
    city: string;
    state: string;
    education: string | null;
    occupation: string | null;
    seeking: SeekingType;
    testimony: string;
    ministryInvolvement: string | null;
    pastorRecommendation: string;
    endorsements: Endorsement[];
    photoUrl: string | null;
    fatherName: string | null;
    status: ProfileStatus;
    yearsInChurch: number | null;
    createdAt: Date;
    updatedAt: Date;
    church?: Church;
    pastor?: UserPublic;
}
export interface Endorsement {
    endorserName: string;
    endorserRole: string;
    endorsementText: string;
}
export interface Alliance {
    id: string;
    profile1Id: string;
    profile2Id: string;
    church1Id: string;
    church2Id: string;
    stage: number;
    status: AllianceStatus;
    openedAt: Date;
    dissolvedAt: Date | null;
    dissolvedReason: string | null;
    notes: AllianceNote[];
    createdAt: Date;
    updatedAt: Date;
    profile1?: Profile;
    profile2?: Profile;
    church1?: Church;
    church2?: Church;
}
export interface AllianceNote {
    id: string;
    allianceId: string;
    authorId: string;
    content: string;
    createdAt: Date;
    author?: UserPublic;
}
export interface CounsellingSession {
    id: string;
    allianceId: string;
    groomName: string;
    brideName: string;
    groomChurch: string;
    brideChurch: string;
    counsellorName: string;
    sessionNumber: number;
    sessionDate: Date | null;
    format: SessionFormat;
    status: SessionStatus;
    completedAt: Date | null;
    notes: string | null;
    createdAt: Date;
    alliance?: Alliance;
}
export interface Vendor {
    id: string;
    churchId: string | null;
    ownerUserId: string | null;
    businessName: string;
    category: VendorCategory;
    location: string;
    city: string;
    state: string;
    description: string;
    priceFrom: string | null;
    priceType: string | null;
    photoUrl: string | null;
    ownerName: string;
    phone: string;
    email: string;
    website: string | null;
    verified: boolean;
    featured: boolean;
    status: VendorStatus;
    createdAt: Date;
    updatedAt: Date;
    church?: Church;
}
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    read: boolean;
    relatedEntityType: string | null;
    relatedEntityId: string | null;
    createdAt: Date;
}
export interface ShortlistedProfile {
    id: string;
    pastorId: string;
    profileId: string;
    createdAt: Date;
    profile?: Profile;
}
export interface AuditLog {
    id: string;
    userId: string | null;
    action: AuditAction;
    entityType: string | null;
    entityId: string | null;
    metadata: Record<string, unknown>;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
}
export interface AIInteraction {
    id: string;
    userId: string;
    prompt: string;
    response: string;
    tokensUsed: number;
    feature: AIFeature;
    createdAt: Date;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: PaginationMeta;
}
export interface ApiError {
    code: string;
    message: string;
    field?: string;
    details?: unknown;
}
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface PaginatedResponse<T> {
    items: T[];
    meta: PaginationMeta;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    churchId: string | null;
    iat?: number;
    exp?: number;
}
export interface MfaSetupResponse {
    secret: string;
    qrCodeDataUrl: string;
    backupCodes: string[];
}
export interface PastorDashboardStats {
    activeProfiles: number;
    alliancesInProgress: number;
    pendingInterests: number;
    upcomingCounsellingSessions: number;
}
export interface AdminDashboardStats {
    totalChurches: number;
    totalProfiles: number;
    totalAlliances: number;
    totalVendors: number;
    monthlyActivePastors: number;
    pendingChurchApplications: number;
    pendingVendorApplications: number;
    aiQueriesThisMonth: number;
    aiTokenSpend: number;
}
export interface AIMatchResult {
    profileId: string;
    profile: Profile;
    score: number;
    breakdown: {
        denomination: number;
        age: number;
        ministry: number;
        endorsements: number;
        location: number;
    };
    reason: string;
}
export interface AILetterRequest {
    fromPastorName: string;
    fromChurchName: string;
    toPastorName: string;
    toChurchName: string;
    candidateName: string;
    targetCandidateName: string;
}
export interface AIChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
//# sourceMappingURL=index.d.ts.map