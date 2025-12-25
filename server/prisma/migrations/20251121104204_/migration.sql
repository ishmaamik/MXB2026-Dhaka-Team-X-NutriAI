-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('AVAILABLE', 'CLAIMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "FoodListing" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "listerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "pickupLocation" TEXT,
    "availableUntil" TIMESTAMP(3),
    "status" "ListingStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FoodListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharingLog" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "claimerId" TEXT,
    "claimerName" TEXT,
    "claimedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "quantityClaimed" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'CLAIMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SharingLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodListing_inventoryItemId_key" ON "FoodListing"("inventoryItemId");

-- AddForeignKey
ALTER TABLE "FoodListing" ADD CONSTRAINT "FoodListing_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodListing" ADD CONSTRAINT "FoodListing_listerId_fkey" FOREIGN KEY ("listerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharingLog" ADD CONSTRAINT "SharingLog_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "FoodListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharingLog" ADD CONSTRAINT "SharingLog_claimerId_fkey" FOREIGN KEY ("claimerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
