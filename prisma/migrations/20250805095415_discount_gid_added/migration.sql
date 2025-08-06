/*
  Warnings:

  - Added the required column `discountGid` to the `Discount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Discount" ADD COLUMN     "discountGid" VARCHAR(255) NOT NULL;
