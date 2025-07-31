import axios from "axios";
import { NextResponse } from "next/server";

const SHOP = process.env.SHOPIFY_STORE!;
const TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;
const API_VERSION = "2025-07";

export async function GET() {
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
}
