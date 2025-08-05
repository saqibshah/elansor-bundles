-- CreateTable
CREATE TABLE "public"."Discount" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "heading" TEXT NOT NULL,
    "percentOff" INTEGER NOT NULL,
    "buyProduct" INTEGER NOT NULL,
    "getProduct" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);
