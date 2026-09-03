// ============================================================
// OneFlesh — All Platform Enums
// ============================================================
export var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["CHURCH_ADMIN"] = "CHURCH_ADMIN";
    UserRole["PASTOR"] = "PASTOR";
    UserRole["VENDOR"] = "VENDOR";
    UserRole["READ_ONLY"] = "READ_ONLY";
})(UserRole || (UserRole = {}));
export var ChurchStatus;
(function (ChurchStatus) {
    ChurchStatus["PENDING"] = "PENDING";
    ChurchStatus["APPROVED"] = "APPROVED";
    ChurchStatus["REJECTED"] = "REJECTED";
    ChurchStatus["SUSPENDED"] = "SUSPENDED";
})(ChurchStatus || (ChurchStatus = {}));
export var ProfileStatus;
(function (ProfileStatus) {
    ProfileStatus["PENDING"] = "PENDING";
    ProfileStatus["APPROVED"] = "APPROVED";
    ProfileStatus["PAUSED"] = "PAUSED";
    ProfileStatus["DELETED"] = "DELETED";
})(ProfileStatus || (ProfileStatus = {}));
export var SeekingType;
(function (SeekingType) {
    SeekingType["BRIDE"] = "BRIDE";
    SeekingType["GROOM"] = "GROOM";
})(SeekingType || (SeekingType = {}));
export var AllianceStatus;
(function (AllianceStatus) {
    AllianceStatus["ACTIVE"] = "ACTIVE";
    AllianceStatus["COMPLETED"] = "COMPLETED";
    AllianceStatus["DISSOLVED"] = "DISSOLVED";
})(AllianceStatus || (AllianceStatus = {}));
export var AllianceStage;
(function (AllianceStage) {
    AllianceStage[AllianceStage["INTEREST"] = 1] = "INTEREST";
    AllianceStage[AllianceStage["EVALUATION"] = 2] = "EVALUATION";
    AllianceStage[AllianceStage["FAMILIES_INTRODUCED"] = 3] = "FAMILIES_INTRODUCED";
    AllianceStage[AllianceStage["COUNSELLING"] = 4] = "COUNSELLING";
    AllianceStage[AllianceStage["COMPLETED"] = 5] = "COMPLETED";
})(AllianceStage || (AllianceStage = {}));
export var VendorCategory;
(function (VendorCategory) {
    VendorCategory["TAILORS"] = "TAILORS";
    VendorCategory["CAKES"] = "CAKES";
    VendorCategory["PHOTOGRAPHY"] = "PHOTOGRAPHY";
    VendorCategory["CATERING"] = "CATERING";
    VendorCategory["CARS"] = "CARS";
    VendorCategory["DECOR"] = "DECOR";
    VendorCategory["VENUES"] = "VENUES";
    VendorCategory["MUSIC"] = "MUSIC";
    VendorCategory["INVITATIONS"] = "INVITATIONS";
    VendorCategory["OTHER"] = "OTHER";
})(VendorCategory || (VendorCategory = {}));
export var VendorStatus;
(function (VendorStatus) {
    VendorStatus["PENDING"] = "PENDING";
    VendorStatus["APPROVED"] = "APPROVED";
    VendorStatus["REJECTED"] = "REJECTED";
    VendorStatus["SUSPENDED"] = "SUSPENDED";
})(VendorStatus || (VendorStatus = {}));
export var SessionStatus;
(function (SessionStatus) {
    SessionStatus["SCHEDULED"] = "SCHEDULED";
    SessionStatus["COMPLETED"] = "COMPLETED";
    SessionStatus["CANCELLED"] = "CANCELLED";
})(SessionStatus || (SessionStatus = {}));
export var SessionFormat;
(function (SessionFormat) {
    SessionFormat["IN_PERSON"] = "IN_PERSON";
    SessionFormat["VIDEO_CALL"] = "VIDEO_CALL";
    SessionFormat["PHONE_CALL"] = "PHONE_CALL";
})(SessionFormat || (SessionFormat = {}));
export var NotificationType;
(function (NotificationType) {
    // ── Alliance ──────────────────────────────────────────────
    NotificationType["INTEREST"] = "INTEREST";
    NotificationType["ALLIANCE_UPDATE"] = "ALLIANCE_UPDATE";
    NotificationType["ALLIANCE_DISSOLVED"] = "ALLIANCE_DISSOLVED";
    // ── Profile ───────────────────────────────────────────────
    NotificationType["PROFILE_APPROVED"] = "PROFILE_APPROVED";
    NotificationType["PROFILE_REJECTED"] = "PROFILE_REJECTED";
    // ── Church ────────────────────────────────────────────────
    NotificationType["CHURCH_APPROVED"] = "CHURCH_APPROVED";
    NotificationType["CHURCH_REJECTED"] = "CHURCH_REJECTED";
    // ── Counselling ───────────────────────────────────────────
    NotificationType["COUNSELLING_REMINDER"] = "COUNSELLING_REMINDER";
    NotificationType["SESSION_SCHEDULED"] = "SESSION_SCHEDULED";
    NotificationType["SESSION_COMPLETED"] = "SESSION_COMPLETED";
    // ── Vendor ────────────────────────────────────────────────
    NotificationType["VENDOR_CONTACT"] = "VENDOR_CONTACT";
    NotificationType["VENDOR_APPROVED"] = "VENDOR_APPROVED";
    // ── System ────────────────────────────────────────────────
    NotificationType["SYSTEM"] = "SYSTEM";
})(NotificationType || (NotificationType = {}));
export var AuditAction;
(function (AuditAction) {
    AuditAction["LOGIN"] = "LOGIN";
    AuditAction["LOGOUT"] = "LOGOUT";
    AuditAction["REGISTER"] = "REGISTER";
    AuditAction["PASSWORD_RESET"] = "PASSWORD_RESET";
    AuditAction["MFA_ENABLED"] = "MFA_ENABLED";
    AuditAction["PROFILE_CREATE"] = "PROFILE_CREATE";
    AuditAction["PROFILE_UPDATE"] = "PROFILE_UPDATE";
    AuditAction["PROFILE_DELETE"] = "PROFILE_DELETE";
    AuditAction["PROFILE_APPROVE"] = "PROFILE_APPROVE";
    AuditAction["ALLIANCE_CREATE"] = "ALLIANCE_CREATE";
    AuditAction["ALLIANCE_ADVANCE"] = "ALLIANCE_ADVANCE";
    AuditAction["ALLIANCE_DISSOLVE"] = "ALLIANCE_DISSOLVE";
    AuditAction["CHURCH_APPROVE"] = "CHURCH_APPROVE";
    AuditAction["CHURCH_REJECT"] = "CHURCH_REJECT";
    AuditAction["VENDOR_VERIFY"] = "VENDOR_VERIFY";
})(AuditAction || (AuditAction = {}));
export var AIFeature;
(function (AIFeature) {
    AIFeature["MATCH_SCORING"] = "MATCH_SCORING";
    AIFeature["LETTER_DRAFTING"] = "LETTER_DRAFTING";
    AIFeature["COUNSELLING_QUESTIONS"] = "COUNSELLING_QUESTIONS";
    AIFeature["ALLIANCE_SUMMARY"] = "ALLIANCE_SUMMARY";
    AIFeature["CHAT"] = "CHAT";
})(AIFeature || (AIFeature = {}));
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
];
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
];
export const ALLIANCE_STAGE_LABELS = {
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
];
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
};
export const VENDOR_CATEGORY_LABELS = {
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
//# sourceMappingURL=enums.js.map