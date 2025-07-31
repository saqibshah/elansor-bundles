// app/api/discounts/route.ts
import { bundleSchema } from "@/app/validationSchema";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const SHOP = process.env.SHOPIFY_STORE!;
const TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;
const API_VERSION = "2025-07";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const validation = bundleSchema.safeParse(body);

  if (!validation.success)
    return NextResponse.json(z.treeifyError(validation.error), { status: 400 });

  const buyGids = `gid://shopify/Product/${body.buyProduct.value}`;
  const getGids = `gid://shopify/Product/${body.getProduct.value}`;
  const decimalOff = body.percentOff / 100;

  const mutation = `
    mutation discountAutomaticBxgyCreate(
      $automaticBxgyDiscount: DiscountAutomaticBxgyInput!
    ) {
      discountAutomaticBxgyCreate(
        automaticBxgyDiscount: $automaticBxgyDiscount
      ) {
        automaticDiscountNode { id }
        userErrors { field message }
      }
    }
  `;
  const variables = {
    automaticBxgyDiscount: {
      title: body.title,
      startsAt: new Date().toISOString(),
      customerBuys: {
        items: { products: { productsToAdd: buyGids } },
        value: { quantity: "1" },
      },
      customerGets: {
        items: { products: { productsToAdd: getGids } },
        value: {
          discountOnQuantity: {
            quantity: "1",
            effect: { percentage: decimalOff },
          },
        },
      },
      combinesWith: {
        orderDiscounts: true,
        productDiscounts: true,
        shippingDiscounts: true,
      },
    },
  };

  const response = await axios.post(
    `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`,
    { query: mutation, variables },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
    }
  );

  // Axios parses JSON automatically:
  const gqlJson = response.data;

  if (gqlJson.errors) {
    console.error("GraphQL Errors:", gqlJson.errors);
    return NextResponse.json({ error: gqlJson.errors }, { status: 500 });
  }

  const createResult = gqlJson.data.discountAutomaticBxgyCreate;
  if (createResult.userErrors.length) {
    console.error("UserErrors:", createResult.userErrors);
    return NextResponse.json(
      { error: createResult.userErrors },
      { status: 400 }
    );
  }

  const discountGid: string = createResult.automaticDiscountNode.id;

  const metafieldValue = {
    discountGid,
    title: body.title,
    percentOff: body.percentOff,
    getVariantId: body.getProduct.variantID,
    getProduct: body.getProduct.value,
    heading: body.heading,
    description: body.description,
  };

  const productId = body.buyProduct.value;
  const mfPayload = {
    metafield: {
      namespace: "bxgy",
      key: "discounts",
      type: "json",
      value: JSON.stringify(metafieldValue),
    },
  };

  const metafieldResponse = await axios.post(
    `https://${SHOP}/admin/api/${API_VERSION}/products/${productId}/metafields.json`,
    mfPayload,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
    }
  );

  const metafieldResponseJson = metafieldResponse.data;

  if (metafieldResponseJson.errors) {
    console.error("Metafield Errors:", metafieldResponseJson.errors);
    return NextResponse.json(
      { error: metafieldResponseJson.errors },
      { status: 500 }
    );
  }

  return NextResponse.json(`Discount ${body.title} and metafield created`, {
    status: 201,
  });
}
