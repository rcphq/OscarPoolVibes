-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "tiedWinnerId" TEXT;

-- AlterTable
ALTER TABLE "CategoryResult" ADD COLUMN     "tiedWinnerId" TEXT;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_tiedWinnerId_fkey" FOREIGN KEY ("tiedWinnerId") REFERENCES "Nominee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryResult" ADD CONSTRAINT "CategoryResult_tiedWinnerId_fkey" FOREIGN KEY ("tiedWinnerId") REFERENCES "Nominee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
