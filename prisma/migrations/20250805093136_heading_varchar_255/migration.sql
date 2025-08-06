/*
  Warnings:

  - You are about to alter the column `heading` on the `Discount` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "public"."Discount" ALTER COLUMN "heading" SET DATA TYPE VARCHAR(255);
