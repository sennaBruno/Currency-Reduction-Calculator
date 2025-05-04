-- CreateTable
CREATE TABLE "Calculation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "initialAmount" DOUBLE PRECISION NOT NULL,
    "finalAmount" DOUBLE PRECISION NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'BRL',
    "title" TEXT,

    CONSTRAINT "Calculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalculationStep" (
    "id" TEXT NOT NULL,
    "calculationId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "calculationDetails" TEXT NOT NULL,
    "resultIntermediate" DOUBLE PRECISION NOT NULL,
    "resultRunningTotal" DOUBLE PRECISION NOT NULL,
    "explanation" TEXT,
    "stepType" TEXT NOT NULL,

    CONSTRAINT "CalculationStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalculationStep_calculationId_idx" ON "CalculationStep"("calculationId");

-- AddForeignKey
ALTER TABLE "CalculationStep" ADD CONSTRAINT "CalculationStep_calculationId_fkey" FOREIGN KEY ("calculationId") REFERENCES "Calculation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
