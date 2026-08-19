-- DropForeignKey
ALTER TABLE "AssetReturn" DROP CONSTRAINT "AssetReturn_assetId_fkey";

-- DropForeignKey
ALTER TABLE "BorrowRequest" DROP CONSTRAINT "BorrowRequest_assetId_fkey";

-- DropForeignKey
ALTER TABLE "BorrowRequest" DROP CONSTRAINT "BorrowRequest_borrowerId_fkey";

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "SystemSetting" ALTER COLUMN "contactEmail" SET DEFAULT 'info@tif.ac.th';

-- AddForeignKey
ALTER TABLE "BorrowRequest" ADD CONSTRAINT "BorrowRequest_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowRequest" ADD CONSTRAINT "BorrowRequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetReturn" ADD CONSTRAINT "AssetReturn_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

