// app/api/discounts/[id]/route.ts
import prisma from "@/lib/prisma";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const SHOP_BASE = `https://${process.env.SHOPIFY_STORE}/admin/api/2025-07`;
const TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;

// Shared Axios instance
const shopify = axios.create({
  baseURL: SHOP_BASE,
  headers: { "X-Shopify-Access-Token": TOKEN },
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbId = parseInt((await params).id);
  const discount = await prisma.discount.findUnique({ where: { id: dbId } });
  if (!discount) {
    return NextResponse.json({ error: "Discount not found" }, { status: 404 });
  }
  const { discountGid: gid, buyProduct: productId } = discount;
  if (!gid) {
    return NextResponse.json({ error: "Missing Shopify GID" }, { status: 400 });
  }

  try {
    // 1) Delete bxgy.discounts metafield (if it exists)
    const {
      data: { metafields },
    } = await shopify.get(`/products/${productId}/metafields.json`);
    const mf = (metafields as any[]).find(
      (m) => m.namespace === "bxgy" && m.key === "discounts"
    );
    if (mf) {
      await shopify.delete(`/products/${productId}/metafields/${mf.id}.json`);
    }

    // 2) Delete the automatic discount via GraphQL
    const mutation = `
      mutation deleteBxgy($id: ID!) {
        discountAutomaticDelete(id: $id) {
          deletedAutomaticDiscountId
          userErrors { field message }
        }
      }
    `;
    const { data: gqlRes } = await shopify.post(
      `/graphql.json`,
      { query: mutation, variables: { id: gid } },
      { headers: { "Content-Type": "application/json" } }
    );
    if (gqlRes.errors) {
      console.error("GraphQL errors:", gqlRes.errors);
      return NextResponse.json({ error: gqlRes.errors }, { status: 500 });
    }
    const { userErrors } = gqlRes.data.discountAutomaticDelete;
    if (userErrors.length) {
      console.error("User errors:", userErrors);
      return NextResponse.json({ error: userErrors }, { status: 400 });
    }

    // 3) Delete from Postgres
    await prisma.discount.delete({ where: { id: dbId } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete flow error:", err.response?.data || err.message);
    return NextResponse.json(
      { error: err.response?.data || err.message },
      { status: 500 }
    );
  }
}
