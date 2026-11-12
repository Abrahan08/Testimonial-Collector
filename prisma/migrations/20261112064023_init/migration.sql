-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('free', 'pro');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('light', 'dark', 'sunset', 'ocean');

-- CreateEnum
CREATE TYPE "EmbedStyle" AS ENUM ('masonry', 'carousel');

-- CreateEnum
CREATE TYPE "EmbedSource" AS ENUM ('wall_of_love', 'all_visible');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'free',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "password" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Space" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "ask" TEXT NOT NULL,
    "collectRating" BOOLEAN NOT NULL DEFAULT true,
    "theme" "Theme" NOT NULL DEFAULT 'light',
    "fields" JSONB NOT NULL DEFAULT '[{"key":"name","enabled":true,"required":true},{"key":"email","enabled":true,"required":true},{"key":"company","enabled":false,"required":false},{"key":"socialLink","enabled":false,"required":false},{"key":"photo","enabled":false,"required":false}]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "text" VARCHAR(1000) NOT NULL,
    "rating" INTEGER,
    "company" TEXT,
    "socialLink" TEXT,
    "photoUrl" TEXT,
    "consentToShare" BOOLEAN NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isWallOfLove" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbedConfig" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "style" "EmbedStyle" NOT NULL DEFAULT 'masonry',
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "animation" BOOLEAN NOT NULL DEFAULT true,
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "source" "EmbedSource" NOT NULL DEFAULT 'all_visible',

    CONSTRAINT "EmbedConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "Space_slug_key" ON "Space"("slug");

-- CreateIndex
CREATE INDEX "Space_ownerId_createdAt_idx" ON "Space"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "Testimonial_spaceId_createdAt_idx" ON "Testimonial"("spaceId", "createdAt");

-- CreateIndex
CREATE INDEX "Testimonial_spaceId_isHidden_consentToShare_idx" ON "Testimonial"("spaceId", "isHidden", "consentToShare");

-- CreateIndex
CREATE INDEX "Testimonial_spaceId_isWallOfLove_idx" ON "Testimonial"("spaceId", "isWallOfLove");

-- CreateIndex
CREATE UNIQUE INDEX "EmbedConfig_spaceId_key" ON "EmbedConfig"("spaceId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbedConfig" ADD CONSTRAINT "EmbedConfig_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint (manual): rating is NULL or 1-5
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_rating_check" CHECK ("rating" IS NULL OR ("rating" >= 1 AND "rating" <= 5));
