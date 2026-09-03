export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    CHURCH_ADMIN = "CHURCH_ADMIN",
    PASTOR = "PASTOR",
    VENDOR = "VENDOR",
    READ_ONLY = "READ_ONLY"
}
export declare enum ChurchStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    SUSPENDED = "SUSPENDED"
}
export declare enum ProfileStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    PAUSED = "PAUSED",
    DELETED = "DELETED"
}
export declare enum SeekingType {
    BRIDE = "BRIDE",
    GROOM = "GROOM"
}
export declare enum AllianceStatus {
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    DISSOLVED = "DISSOLVED"
}
export declare enum AllianceStage {
    INTEREST = 1,
    EVALUATION = 2,
    FAMILIES_INTRODUCED = 3,
    COUNSELLING = 4,
    COMPLETED = 5
}
export declare enum VendorCategory {
    TAILORS = "TAILORS",
    CAKES = "CAKES",
    PHOTOGRAPHY = "PHOTOGRAPHY",
    CATERING = "CATERING",
    CARS = "CARS",
    DECOR = "DECOR",
    VENUES = "VENUES",
    MUSIC = "MUSIC",
    INVITATIONS = "INVITATIONS",
    OTHER = "OTHER"
}
export declare enum VendorStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    SUSPENDED = "SUSPENDED"
}
export declare enum SessionStatus {
    SCHEDULED = "SCHEDULED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum SessionFormat {
    IN_PERSON = "IN_PERSON",
    VIDEO_CALL = "VIDEO_CALL",
    PHONE_CALL = "PHONE_CALL"
}
export declare enum NotificationType {
    INTEREST = "INTEREST",// New alliance interest received
    ALLIANCE_UPDATE = "ALLIANCE_UPDATE",// Alliance advanced to new stage
    ALLIANCE_DISSOLVED = "ALLIANCE_DISSOLVED",// Alliance was dissolved
    PROFILE_APPROVED = "PROFILE_APPROVED",// Profile approved by admin
    PROFILE_REJECTED = "PROFILE_REJECTED",// Profile rejected by admin
    CHURCH_APPROVED = "CHURCH_APPROVED",// Church registration approved
    CHURCH_REJECTED = "CHURCH_REJECTED",// Church application rejected
    COUNSELLING_REMINDER = "COUNSELLING_REMINDER",// Upcoming session reminder
    SESSION_SCHEDULED = "SESSION_SCHEDULED",// Counselling sessions registered
    SESSION_COMPLETED = "SESSION_COMPLETED",// A session was completed
    VENDOR_CONTACT = "VENDOR_CONTACT",// Pastor requested vendor contact
    VENDOR_APPROVED = "VENDOR_APPROVED",// Vendor listing approved
    SYSTEM = "SYSTEM"
}
export declare enum AuditAction {
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    REGISTER = "REGISTER",
    PASSWORD_RESET = "PASSWORD_RESET",
    MFA_ENABLED = "MFA_ENABLED",
    PROFILE_CREATE = "PROFILE_CREATE",
    PROFILE_UPDATE = "PROFILE_UPDATE",
    PROFILE_DELETE = "PROFILE_DELETE",
    PROFILE_APPROVE = "PROFILE_APPROVE",
    ALLIANCE_CREATE = "ALLIANCE_CREATE",
    ALLIANCE_ADVANCE = "ALLIANCE_ADVANCE",
    ALLIANCE_DISSOLVE = "ALLIANCE_DISSOLVE",
    CHURCH_APPROVE = "CHURCH_APPROVE",
    CHURCH_REJECT = "CHURCH_REJECT",
    VENDOR_VERIFY = "VENDOR_VERIFY"
}
export declare enum AIFeature {
    MATCH_SCORING = "MATCH_SCORING",
    LETTER_DRAFTING = "LETTER_DRAFTING",
    COUNSELLING_QUESTIONS = "COUNSELLING_QUESTIONS",
    ALLIANCE_SUMMARY = "ALLIANCE_SUMMARY",
    CHAT = "CHAT"
}
export declare const INDIAN_STATES: readonly ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"];
export type IndianState = (typeof INDIAN_STATES)[number];
export declare const DENOMINATIONS: readonly ["Reformed Presbyterian", "Presbyterian", "Reformed Baptist", "Reformed Evangelical", "Sovereign Grace", "Calvary Reformed", "Covenant Reformed", "Independent Reformed", "Other Reformed"];
export type Denomination = (typeof DENOMINATIONS)[number];
export declare const ALLIANCE_STAGE_LABELS: Record<number, string>;
export declare const COUNSELLING_SESSIONS: readonly [{
    readonly session: 1;
    readonly topic: "The Covenant Design — What is marriage?";
    readonly duration: "90 min";
    readonly scripture: "Genesis 2:24, Ephesians 5:22–33";
}, {
    readonly session: 2;
    readonly topic: "Roles & Servant Leadership";
    readonly duration: "90 min";
    readonly scripture: "Ephesians 5:25, 1 Peter 3:1–7";
}, {
    readonly session: 3;
    readonly topic: "Communication & Conflict Resolution";
    readonly duration: "2 hours";
    readonly scripture: "James 1:19, Ephesians 4:26, Proverbs 15:1";
}, {
    readonly session: 4;
    readonly topic: "Finances, Stewardship & Household";
    readonly duration: "90 min";
    readonly scripture: "Proverbs 22:7, Malachi 3:10, Luke 16:10";
}, {
    readonly session: 5;
    readonly topic: "Family, In-Laws & Boundaries";
    readonly duration: "90 min";
    readonly scripture: "Genesis 2:24, Exodus 20:12, Ruth 1:16";
}, {
    readonly session: 6;
    readonly topic: "Prayer, Spiritual Life & Kingdom Vision";
    readonly duration: "90 min";
    readonly scripture: "Colossians 3:16, Joshua 24:15, Acts 2:42";
}];
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
};
export declare const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string>;
//# sourceMappingURL=enums.d.ts.map