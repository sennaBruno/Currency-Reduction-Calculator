-- AlterTable
ALTER TABLE "Calculation" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Calculation_userId_idx" ON "Calculation"("userId");
