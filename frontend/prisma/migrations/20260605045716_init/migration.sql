-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AssetStatus" AS ENUM ('AVAILABLE', 'BORROWED', 'MAINTENANCE', 'LOST', 'RETIRED');

-- CreateEnum
CREATE TYPE "public"."BorrowStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'BORROWED', 'RETURNED', 'OVERDUE', 'CANCELLED', 'RETURN_PENDING');

-- CreateEnum
CREATE TYPE "public"."ConditionStatus" AS ENUM ('NORMAL', 'DAMAGED', 'LOST', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'STAFF', 'APPROVER', 'VIEWER');

-- CreateTable
CREATE TABLE "public"."Asset" (
    "id" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "serialNumber" TEXT,
    "description" TEXT,
    "status" "public"."AssetStatus" NOT NULL DEFAULT 'AVAILABLE',
    "currentHolderId" TEXT,
    "imageUrl" TEXT,
    "cloudinaryPublicId" TEXT,
    "qrCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssetReturn" (
    "id" TEXT NOT NULL,
    "borrowRequestId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "condition" "public"."ConditionStatus" NOT NULL,
    "conditionNote" TEXT,
    "imageUrl" TEXT,
    "cloudinaryPublicId" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BorrowRequest" (
    "id" TEXT NOT NULL,
    "requestNo" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "borrowDate" TIMESTAMP(3) NOT NULL,
    "expectedReturnDate" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "public"."BorrowStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "signature" TEXT,

    CONSTRAINT "BorrowRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Employee" (
    "id" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemSetting" (
    "id" TEXT NOT NULL DEFAULT 'default-settings-id',
    "companyNameTh" TEXT NOT NULL DEFAULT 'บริษัท ไทย อินเตอร์ ฟลายอิ้ง จำกัด',
    "companyNameEn" TEXT NOT NULL DEFAULT 'Thai Inter Flying Co., Ltd.',
    "businessType" TEXT NOT NULL DEFAULT 'สถาบันฝึกอบรมการบิน / Aviation Training Academy',
    "contactEmail" TEXT NOT NULL DEFAULT 'info@thaiinterflying.com',
    "maxBorrowDays" INTEGER NOT NULL DEFAULT 7,
    "autoMaintenanceOnDamaged" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'STAFF',
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetCode_key" ON "public"."Asset"("assetCode" ASC);

-- CreateIndex
CREATE INDEX "Asset_currentHolderId_idx" ON "public"."Asset"("currentHolderId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_qrCode_key" ON "public"."Asset"("qrCode" ASC);

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "public"."Asset"("status" ASC);

-- CreateIndex
CREATE INDEX "AssetReturn_assetId_idx" ON "public"."AssetReturn"("assetId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AssetReturn_borrowRequestId_key" ON "public"."AssetReturn"("borrowRequestId" ASC);

-- CreateIndex
CREATE INDEX "AssetReturn_recordedById_idx" ON "public"."AssetReturn"("recordedById" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId" ASC);

-- CreateIndex
CREATE INDEX "BorrowRequest_assetId_idx" ON "public"."BorrowRequest"("assetId" ASC);

-- CreateIndex
CREATE INDEX "BorrowRequest_borrowerId_idx" ON "public"."BorrowRequest"("borrowerId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "BorrowRequest_requestNo_key" ON "public"."BorrowRequest"("requestNo" ASC);

-- CreateIndex
CREATE INDEX "BorrowRequest_status_expectedReturnDate_idx" ON "public"."BorrowRequest"("status" ASC, "expectedReturnDate" ASC);

-- CreateIndex
CREATE INDEX "BorrowRequest_status_idx" ON "public"."BorrowRequest"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "public"."Employee"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "public"."Employee"("employeeCode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "public"."User"("employeeId" ASC);

-- AddForeignKey
ALTER TABLE "public"."Asset" ADD CONSTRAINT "Asset_currentHolderId_fkey" FOREIGN KEY ("currentHolderId") REFERENCES "public"."Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetReturn" ADD CONSTRAINT "AssetReturn_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetReturn" ADD CONSTRAINT "AssetReturn_borrowRequestId_fkey" FOREIGN KEY ("borrowRequestId") REFERENCES "public"."BorrowRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetReturn" ADD CONSTRAINT "AssetReturn_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BorrowRequest" ADD CONSTRAINT "BorrowRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BorrowRequest" ADD CONSTRAINT "BorrowRequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BorrowRequest" ADD CONSTRAINT "BorrowRequest_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "public"."Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

