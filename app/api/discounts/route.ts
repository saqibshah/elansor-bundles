// app/api/discounts/route.ts
import { bundleSchema } from "@/app/validationSchema";
import { prisma } from "@/lib/prisma";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const SHOP_BASE = `https://${process.env.SHOPIFY_STORE}/admin/api/2025-07`;
const TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;

// one Shopify client for REST & GraphQL
const shopify = axios.create({
  baseURL: SHOP_BASE,
  headers: { "X-Shopify-Access-Token": TOKEN },
});

export async function GET() {
  const discounts = await prisma.discount.findMany();
  return NextResponse.json(discounts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = bundleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(z.treeifyError(parsed.error), { status: 400 });
  }
  const { title, percentOff, buyProduct, getProduct, heading, description } =
    parsed.data;

  // --- 1) Create Shopify automatic BXGY discount ---
  const buyGid = `gid://shopify/Product/${buyProduct.value}`;
  const getGid = `gid://shopify/Product/${getProduct.value}`;
  const mutation = /* GraphQL */ `
    mutation createBxgy($discount: DiscountAutomaticBxgyInput!) {
      discountAutomaticBxgyCreate(automaticBxgyDiscount: $discount) {
        automaticDiscountNode {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const { data: gqlRes } = await shopify.post("/graphql.json", {
    query: mutation,
    variables: {
      discount: {
        title,
        startsAt: new Date().toISOString(),
        customerBuys: {
          items: { products: { productsToAdd: [buyGid] } },
          value: { quantity: "1" },
        },
        customerGets: {
          items: { products: { productsToAdd: [getGid] } },
          value: {
            discountOnQuantity: {
              quantity: "1",
              effect: { percentage: percentOff / 100 },
            },
          },
        },
        combinesWith: {
          orderDiscounts: true,
          productDiscounts: true,
          shippingDiscounts: true,
        },
      },
    },
  });
  if (gqlRes.errors) {
    console.error("GraphQL Errors:", gqlRes.errors);
    return NextResponse.json({ error: gqlRes.errors }, { status: 500 });
  }
  const { userErrors, automaticDiscountNode } =
    gqlRes.data.discountAutomaticBxgyCreate;
  if (userErrors.length) {
    console.error("User Errors:", userErrors);
    return NextResponse.json({ error: userErrors }, { status: 400 });
  }
  const discountGid = automaticDiscountNode.id;

  // --- 2) Persist in Postgres ---
  await prisma.discount.create({
    data: {
      discountGid,
      title,
      heading,
      description,
      percentOff,
      buyProduct: buyProduct.value.toString(),
      getProduct: getProduct.value.toString(),
    },
  });

  // --- 3) Add JSON metafield to the buy-product ---
  const mfValue = {
    discountGid,
    title,
    percentOff,
    heading,
    description,
    getVariantId: getProduct.variantID,
    getProduct: getProduct.value,
  };
  try {
    await shopify.post(
      `/products/${buyProduct.value}/metafields.json`,
      {
        metafield: {
          namespace: "bxgy",
          key: "discounts",
          type: "json",
          value: JSON.stringify(mfValue),
        },
      },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      // Shopify or network error
      const message = error.response?.data || error.message;
      console.error("Shopify error:", message);
      return NextResponse.json(
        { error: message },
        { status: error.response?.status || 500 }
      );
    }
    // Other errors (validation, Prisma, etc.)
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, discountGid }, { status: 201 });
}
