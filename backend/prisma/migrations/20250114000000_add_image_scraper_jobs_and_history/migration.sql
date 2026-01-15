-- CreateEnum
CREATE TYPE "ImageScraperJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "image_scraper_jobs" (
    "id" TEXT NOT NULL,
    "status" "ImageScraperJobStatus" NOT NULL DEFAULT 'PENDING',
    "totalProducts" INTEGER NOT NULL DEFAULT 0,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "successful" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "brandId" TEXT,
    "categoryId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorLog" JSONB,
    "results" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "image_scraper_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_image_history" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "source" TEXT,
    "replacedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replacedBy" TEXT,

    CONSTRAINT "product_image_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "image_scraper_jobs_status_idx" ON "image_scraper_jobs"("status");

-- CreateIndex
CREATE INDEX "image_scraper_jobs_createdAt_idx" ON "image_scraper_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "image_scraper_jobs_createdBy_idx" ON "image_scraper_jobs"("createdBy");

-- CreateIndex
CREATE INDEX "product_image_history_productId_idx" ON "product_image_history"("productId");

-- CreateIndex
CREATE INDEX "product_image_history_replacedAt_idx" ON "product_image_history"("replacedAt");

-- AddForeignKey
ALTER TABLE "product_image_history" ADD CONSTRAINT "product_image_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
