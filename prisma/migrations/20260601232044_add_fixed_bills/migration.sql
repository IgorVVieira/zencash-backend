-- CreateTable
CREATE TABLE "fixed_bills" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category_id" UUID,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "recurrence" TEXT NOT NULL,
    "due_day" INTEGER NOT NULL,
    "due_month" INTEGER,
    "match_keywords" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "fixed_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_bill_occurrences" (
    "id" UUID NOT NULL,
    "fixed_bill_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "transaction_id" UUID,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_amount" DOUBLE PRECISION,
    "reference_month" INTEGER NOT NULL,
    "reference_year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "fixed_bill_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fixed_bill_user_id_index" ON "fixed_bills"("user_id");

-- CreateIndex
CREATE INDEX "fixed_bill_occurrence_bill_id_index" ON "fixed_bill_occurrences"("fixed_bill_id");

-- CreateIndex
CREATE INDEX "fixed_bill_occurrence_user_id_index" ON "fixed_bill_occurrences"("user_id");

-- AddForeignKey
ALTER TABLE "fixed_bills" ADD CONSTRAINT "fixed_bills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_bills" ADD CONSTRAINT "fixed_bills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_bill_occurrences" ADD CONSTRAINT "fixed_bill_occurrences_fixed_bill_id_fkey" FOREIGN KEY ("fixed_bill_id") REFERENCES "fixed_bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_bill_occurrences" ADD CONSTRAINT "fixed_bill_occurrences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_bill_occurrences" ADD CONSTRAINT "fixed_bill_occurrences_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
