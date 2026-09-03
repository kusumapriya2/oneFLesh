// ============================================================
// OneFlesh — All Platform Enums
// ============================================================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CHURCH_ADMIN = 'CHURCH_ADMIN',
  PASTOR = 'PASTOR',
  VENDOR = 'VENDOR',
  READ_ONLY = 'READ_ONLY',
}

export enum ChurchStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum ProfileStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAUSED = 'PAUSED',
  DELETED = 'DELETED',
}

export enum SeekingType {
  BRIDE = 'BRIDE',
  GROOM = 'GROOM',
}

export enum AllianceStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DISSOLVED = 'DISSOLVED',
}

export enum AllianceStage {
  INTEREST = 1,
  EVALUATION = 2,
  FAMILIES_INTRODUCED = 3,
  COUNSELLING = 4,
  COMPLETED = 5,
}

export enum VendorCategory {
  TAILORS = 'TAILORS',
  CAKES = 'CAKES',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  CATERING = 'CATERING',
  CARS = 'CARS',
  DECOR = 'DECOR',
  VENUES = 'VENUES',
  MUSIC = 'MUSIC',
  INVITATIONS = 'INVITATIONS',
  OTHER = 'OTHER',
}

export enum VendorStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum SessionFormat {
  IN_PERSON = 'IN_PERSON',
  VIDEO_CALL = 'VIDEO_CALL',
  PHONE_CALL = 'PHONE_CALL',
}

export enum NotificationType {
  // ── Alliance ──────────────────────────────────────────────
  INTEREST = 'INTEREST',                         // New alliance interest received
  ALLIANCE_UPDATE = 'ALLIANCE_UPDATE',           // Alliance advanced to new stage
  ALLIANCE_DISSOLVED = 'ALLIANCE_DISSOLVED',     // Alliance was dissolved

  // ── Profile ───────────────────────────────────────────────
  PROFILE_APPROVED = 'PROFILE_APPROVED',         // Profile approved by admin
  PROFILE_REJECTED = 'PROFILE_REJECTED',         // Profile rejected by admin

  // ── Church ────────────────────────────────────────────────
  CHURCH_APPROVED = 'CHURCH_APPROVED',           // Church registration approved
  CHURCH_REJECTED = 'CHURCH_REJECTED',           // Church application rejected

  // ── Counselling ───────────────────────────────────────────
  COUNSELLING_REMINDER = 'COUNSELLING_REMINDER', // Upcoming session reminder
  SESSION_SCHEDULED = 'SESSION_SCHEDULED',       // Counselling sessions registered
  SESSION_COMPLETED = 'SESSION_COMPLETED',       // A session was completed

  // ── Vendor ────────────────────────────────────────────────
  VENDOR_CONTACT = 'VENDOR_CONTACT',             // Pastor requested vendor contact
  VENDOR_APPROVED = 'VENDOR_APPROVED',           // Vendor listing approved

  // ── System ────────────────────────────────────────────────
  SYSTEM = 'SYSTEM',                             // General platform message
}

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MFA_ENABLED = 'MFA_ENABLED',
  PROFILE_CREATE = 'PROFILE_CREATE',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  PROFILE_DELETE = 'PROFILE_DELETE',
  PROFILE_APPROVE = 'PROFILE_APPROVE',
  ALLIANCE_CREATE = 'ALLIANCE_CREATE',
  ALLIANCE_ADVANCE = 'ALLIANCE_ADVANCE',
  ALLIANCE_DISSOLVE = 'ALLIANCE_DISSOLVE',
  CHURCH_APPROVE = 'CHURCH_APPROVE',
  CHURCH_REJECT = 'CHURCH_REJECT',
  VENDOR_VERIFY = 'VENDOR_VERIFY',
}

export enum AIFeature {
  MATCH_SCORING = 'MATCH_SCORING',
  LETTER_DRAFTING = 'LETTER_DRAFTING',
  COUNSELLING_QUESTIONS = 'COUNSELLING_QUESTIONS',
  ALLIANCE_SUMMARY = 'ALLIANCE_SUMMARY',
  CHAT = 'CHAT',
}

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

export const DENOMINATIONS = [
  'Reformed Presbyterian',
  'Presbyterian',
  'Reformed Baptist',
  'Reformed Evangelical',
  'Sovereign Grace',
  'Calvary Reformed',
  'Covenant Reformed',
  'Independent Reformed',
  'Other Reformed',
] as const;

export type Denomination = (typeof DENOMINATIONS)[number];

export const ALLIANCE_STAGE_LABELS: Record<number, string> = {
  1: 'Interest Expressed',
  2: 'Evaluation',
  3: 'Families Introduced',
  4: 'Pre-Marital Counselling',
  5: 'Completed / Engaged',
};

export const COUNSELLING_SESSIONS = [
  {
    session: 1,
    topic: 'The Covenant Design — What is marriage?',
    duration: '90 min',
    scripture: 'Genesis 2:24, Ephesians 5:22–33',
  },
  {
    session: 2,
    topic: 'Roles & Servant Leadership',
    duration: '90 min',
    scripture: 'Ephesians 5:25, 1 Peter 3:1–7',
  },
  {
    session: 3,
    topic: 'Communication & Conflict Resolution',
    duration: '2 hours',
    scripture: 'James 1:19, Ephesians 4:26, Proverbs 15:1',
  },
  {
    session: 4,
    topic: 'Finances, Stewardship & Household',
    duration: '90 min',
    scripture: 'Proverbs 22:7, Malachi 3:10, Luke 16:10',
  },
  {
    session: 5,
    topic: 'Family, In-Laws & Boundaries',
    duration: '90 min',
    scripture: 'Genesis 2:24, Exodus 20:12, Ruth 1:16',
  },
  {
    session: 6,
    topic: 'Prayer, Spiritual Life & Kingdom Vision',
    duration: '90 min',
    scripture: 'Colossians 3:16, Joshua 24:15, Acts 2:42',
  },
] as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  [VendorCategory.TAILORS]: 'Tailors & Bridal Wear',
  [VendorCategory.CAKES]: 'Wedding Cakes',
  [VendorCategory.PHOTOGRAPHY]: 'Photography & Video',
  [VendorCategory.CATERING]: 'Catering & Chefs',
  [VendorCategory.CARS]: 'Car Rentals',
  [VendorCategory.DECOR]: 'Flowers & Stage Decor',
  [VendorCategory.VENUES]: 'Destinations & Resorts',
  [VendorCategory.MUSIC]: 'Music & Entertainment',
  [VendorCategory.INVITATIONS]: 'Invitations & Stationery',
  [VendorCategory.OTHER]: 'Other Services',
};
