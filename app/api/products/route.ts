// app/api/products/route.ts
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const SHOP = process.env.SHOPIFY_STORE!;
const TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;
const API_VERSION = "2025-07";

export async function GET(_req: NextRequest) {
  // Fetch products including their variants
  const url = `https://${SHOP}/admin/api/${API_VERSION}/products.json?limit=250&fields=id,title,handle,images,variants`;

  try {
    const response = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": TOKEN,
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(response.data.products);
  } catch (error) {
    console.error("Failed fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }

  const res = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": TOKEN,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    console.error("Failed fetching products:", await res.text());
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }

  const json = await res.json();
  const products = (json.products as any[]).map((p) => {
    // Grab the first variant (assumes at least one)
    const firstVariant = p.variants[0];
    const variantId = firstVariant.id;

    return {
      gid: `gid://shopify/Product/${p.id}`,
      variantId, // Numeric ID, useful if you need it
      title: p.title, // Product title
      handle: p.handle, // Product handle
      image: p.images?.[0]?.src || null, // Primary image
      productId: p.id,
    };
  });

  return NextResponse.json(res);
  // return NextResponse.json({ products });
}
