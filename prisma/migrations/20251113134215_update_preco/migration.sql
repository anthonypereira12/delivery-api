/*
  Warnings:

  - You are about to alter the column `preco_centavos` on the `item` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "item" ALTER COLUMN "preco_centavos" SET DATA TYPE DECIMAL(10,2);
