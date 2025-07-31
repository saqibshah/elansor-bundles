import { z } from "zod";

const ProductOption = z.object(
  {
    value: z.number(),
    label: z.string(),
    variantID: z.number(),
  },
  "Select a product"
);

export const bundleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  heading: z.string().min(1, "Heading is required"),
  description: z.string().min(1, "Description is required"),
  percentOff: z.number("Enter percentage").int().positive(),
  buyProduct: ProductOption,
  getProduct: ProductOption,
});
