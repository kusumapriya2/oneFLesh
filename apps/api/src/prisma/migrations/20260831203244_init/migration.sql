-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'CHURCH_ADMIN', 'PASTOR', 'VENDOR', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "ChurchStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('PENDING', 'APPROVED', 'PAUSED', 'DELETED');

-- CreateEnum
CREATE TYPE "SeekingType" AS ENUM ('BRIDE', 'GROOM');

-- CreateEnum
CREATE TYPE "AllianceStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DISSOLVED');

-- CreateEnum
CREATE TYPE "VendorCategory" AS ENUM ('TAILORS', 'CAKES', 'PHOTOGRAPHY', 'CATERING', 'CARS', 'DECOR', 'VENUES', 'MUSIC', 'INVITATIONS', 'OTHER');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SessionFormat" AS ENUM ('IN_PERSON', 'VIDEO_CALL', 'PHONE_CALL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INTEREST', 'ALLIANCE_UPDATE', 'ALLIANCE_DISSOLVED', 'PROFILE_APPROVED', 'PROFILE_REJECTED', 'CHURCH_APPROVED', 'CHURCH_REJECTED', 'COUNSELLING_REMINDER', 'SESSION_SCHEDULED', 'SESSION_COMPLETED', 'VENDOR_CONTACT', 'VENDOR_APPROVED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'REGISTER', 'PASSWORD_RESET', 'MFA_ENABLED', 'PROFILE_CREATE', 'PROFILE_UPDATE', 'PROFILE_DELETE', 'PROFILE_APPROVE', 'ALLIANCE_CREATE', 'ALLIANCE_ADVANCE', 'ALLIANCE_DISSOLVE', 'CHURCH_APPROVE', 'CHURCH_REJECT', 'VENDOR_VERIFY');

-- CreateEnum
CREATE TYPE "AIFeature" AS ENUM ('MATCH_SCORING', 'LETTER_DRAFTING', 'COUNSELLING_QUESTIONS', 'ALLIANCE_SUMMARY', 'CHAT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PASTOR',
    "churchId" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "mfaBackupCodes" TEXT[],
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "churches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "denomination" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pastorName" TEXT NOT NULL,
    "pastorEmail" TEXT NOT NULL,
    "pastorPhone" TEXT NOT NULL,
    "congregationSize" INTEGER,
    "yearEstablished" INTEGER,
    "doctrinalFlags" JSONB NOT NULL,
    "status" "ChurchStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "churches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "pastorId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "education" TEXT,
    "occupation" TEXT,
    "seeking" "SeekingType" NOT NULL,
    "testimony" TEXT NOT NULL,
    "ministryInvolvement" TEXT,
    "pastorRecommendation" TEXT NOT NULL,
    "endorsements" JSONB NOT NULL,
    "photoUrl" TEXT,
    "fatherName" TEXT,
    "status" "ProfileStatus" NOT NULL DEFAULT 'PENDING',
    "yearsInChurch" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "hardDeleteAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alliances" (
    "id" TEXT NOT NULL,
    "profile1Id" TEXT NOT NULL,
    "profile2Id" TEXT NOT NULL,
    "church1Id" TEXT NOT NULL,
    "church2Id" TEXT NOT NULL,
    "stage" INTEGER NOT NULL DEFAULT 1,
    "status" "AllianceStatus" NOT NULL DEFAULT 'ACTIVE',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dissolvedAt" TIMESTAMP(3),
    "dissolvedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alliances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alliance_notes" (
    "id" TEXT NOT NULL,
    "allianceId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alliance_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counselling_sessions" (
    "id" TEXT NOT NULL,
    "allianceId" TEXT NOT NULL,
    "groomName" TEXT NOT NULL,
    "brideName" TEXT NOT NULL,
    "groomChurch" TEXT NOT NULL,
    "brideChurch" TEXT NOT NULL,
    "counsellorName" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "sessionDate" TIMESTAMP(3),
    "format" "SessionFormat" NOT NULL DEFAULT 'IN_PERSON',
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "counselling_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "churchId" TEXT,
    "ownerUserId" TEXT,
    "businessName" TEXT NOT NULL,
    "category" "VendorCategory" NOT NULL,
    "location" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceFrom" TEXT,
    "priceType" TEXT,
    "photoUrl" TEXT,
    "ownerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "VendorStatus" NOT NULL DEFAULT 'PENDING',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shortlisted_profiles" (
    "id" TEXT NOT NULL,
    "pastorId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shortlisted_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_interactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "feature" "AIFeature" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_churchId_idx" ON "users"("churchId");

-- CreateIndex
CREATE UNIQUE INDEX "churches_pastorEmail_key" ON "churches"("pastorEmail");

-- CreateIndex
CREATE INDEX "churches_status_idx" ON "churches"("status");

-- CreateIndex
CREATE INDEX "churches_state_idx" ON "churches"("state");

-- CreateIndex
CREATE INDEX "profiles_churchId_idx" ON "profiles"("churchId");

-- CreateIndex
CREATE INDEX "profiles_pastorId_idx" ON "profiles"("pastorId");

-- CreateIndex
CREATE INDEX "profiles_status_idx" ON "profiles"("status");

-- CreateIndex
CREATE INDEX "profiles_seeking_idx" ON "profiles"("seeking");

-- CreateIndex
CREATE INDEX "profiles_state_idx" ON "profiles"("state");

-- CreateIndex
CREATE INDEX "profiles_age_idx" ON "profiles"("age");

-- CreateIndex
CREATE INDEX "alliances_profile1Id_idx" ON "alliances"("profile1Id");

-- CreateIndex
CREATE INDEX "alliances_profile2Id_idx" ON "alliances"("profile2Id");

-- CreateIndex
CREATE INDEX "alliances_status_idx" ON "alliances"("status");

-- CreateIndex
CREATE INDEX "alliances_stage_idx" ON "alliances"("stage");

-- CreateIndex
CREATE INDEX "alliance_notes_allianceId_idx" ON "alliance_notes"("allianceId");

-- CreateIndex
CREATE INDEX "counselling_sessions_allianceId_idx" ON "counselling_sessions"("allianceId");

-- CreateIndex
CREATE INDEX "counselling_sessions_status_idx" ON "counselling_sessions"("status");

-- CreateIndex
CREATE INDEX "vendors_category_idx" ON "vendors"("category");

-- CreateIndex
CREATE INDEX "vendors_state_idx" ON "vendors"("state");

-- CreateIndex
CREATE INDEX "vendors_verified_idx" ON "vendors"("verified");

-- CreateIndex
CREATE INDEX "vendors_featured_idx" ON "vendors"("featured");

-- CreateIndex
CREATE INDEX "vendors_status_idx" ON "vendors"("status");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "shortlisted_profiles_pastorId_idx" ON "shortlisted_profiles"("pastorId");

-- CreateIndex
CREATE UNIQUE INDEX "shortlisted_profiles_pastorId_profileId_key" ON "shortlisted_profiles"("pastorId", "profileId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "ai_interactions_userId_idx" ON "ai_interactions"("userId");

-- CreateIndex
CREATE INDEX "ai_interactions_feature_idx" ON "ai_interactions"("feature");

-- CreateIndex
CREATE INDEX "ai_interactions_createdAt_idx" ON "ai_interactions"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_pastorId_fkey" FOREIGN KEY ("pastorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alliances" ADD CONSTRAINT "alliances_profile1Id_fkey" FOREIGN KEY ("profile1Id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alliances" ADD CONSTRAINT "alliances_profile2Id_fkey" FOREIGN KEY ("profile2Id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alliances" ADD CONSTRAINT "alliances_church1Id_fkey" FOREIGN KEY ("church1Id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alliances" ADD CONSTRAINT "alliances_church2Id_fkey" FOREIGN KEY ("church2Id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alliance_notes" ADD CONSTRAINT "alliance_notes_allianceId_fkey" FOREIGN KEY ("allianceId") REFERENCES "alliances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alliance_notes" ADD CONSTRAINT "alliance_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counselling_sessions" ADD CONSTRAINT "counselling_sessions_allianceId_fkey" FOREIGN KEY ("allianceId") REFERENCES "alliances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlisted_profiles" ADD CONSTRAINT "shortlisted_profiles_pastorId_fkey" FOREIGN KEY ("pastorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlisted_profiles" ADD CONSTRAINT "shortlisted_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
