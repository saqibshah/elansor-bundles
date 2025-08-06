"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Callout,
  Grid,
  Heading,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Select from "react-select";
import z from "zod";
import ErrorMessage from "../../components/ErrorMessage";
import Skeleton from "../../components/Skeleton";
import Spinner from "../../components/Spinner";
import { Product } from "../../types/product";
import { bundleSchema } from "../../validationSchema";
import { useRouter } from "next/navigation";

type BundleFormData = z.infer<typeof bundleSchema>;

const NewDiscountsPage = () => {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BundleFormData>({
    resolver: zodResolver(bundleSchema),
  });

  const {
    data: products,
    error: productError,
    isLoading,
  } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => axios.get("/api/products").then((res) => res.data),
    staleTime: 60 * 1000, //60s
    retry: 3,
  });

  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = handleSubmit(async (data) => {
    console.log(data);

    try {
      setSubmitting(true);
      setError("");
      const response = await axios.post("/api/discounts", data);
      router.push("/discounts");
      router.refresh();
    } catch (error) {
      const err = error as AxiosError<{
        error: { message?: string; userErrors?: { message: string }[] };
      }>;
      console.log(err);

      const userErrors = err.response?.data?.error;
      if (userErrors && Array.isArray(userErrors)) {
        const message = userErrors.map((e) => e.message).join(" | ");
        setError(message);
      } else {
        setError("Something went wrong");
      }
    }
    setSubmitting(false);
  });

  return (
    <div className="max-w-3xl mx-auto">
      <Heading mb="6">Add New Discount</Heading>
      {error && (
        <Callout.Root color="red" className="mb-5">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      <form className="space-y-4" onSubmit={onSubmit}>
        <Grid gap="5" columns="1fr 3fr">
          <Text size="2">Title</Text>
          <Box>
            <TextField.Root
              defaultValue="big1-31off"
              placeholder="Title"
              {...register("title")}
            />
            <ErrorMessage>{errors.title?.message}</ErrorMessage>
          </Box>
        </Grid>

        <Grid gap="5" columns="1fr 3fr">
          <Text size="2">Heading</Text>
          <Box>
            <TextField.Root
              defaultValue="Add 1 more & get 35% off + free shipping"
              placeholder="Heading"
              {...register("heading")}
            />
            <ErrorMessage>{errors.heading?.message}</ErrorMessage>
          </Box>
        </Grid>

        <Grid gap="5" columns="1fr 3fr">
          <Text size="2">Description</Text>
          <Box>
            <TextArea placeholder="Description" {...register("description")} />
            <ErrorMessage>{errors.description?.message}</ErrorMessage>
          </Box>
        </Grid>

        <Grid gap="5" columns="1fr 3fr">
          <Text size="2">Percentage Off</Text>
          <Box>
            <TextField.Root
              defaultValue="31"
              placeholder="Percentage Off"
              {...register("percentOff", {
                valueAsNumber: true,
                min: { value: 0, message: "Enter a percentage" },
              })}
            />
            <ErrorMessage>{errors.percentOff?.message}</ErrorMessage>
          </Box>
        </Grid>

        {!productError &&
          (isLoading ? (
            <Grid gap="5" columns="1fr 3fr">
              <Text size="2">Buy Product</Text>
              <Box>
                <Skeleton height={34} />
              </Box>
            </Grid>
          ) : (
            <Grid gap="5" columns="1fr 3fr">
              <Text size="2">Buy Product</Text>
              <Box>
                <Controller
                  name="buyProduct"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      placeholder="Search & select Buy items"
                      options={products?.map((product) => ({
                        value: product.id,
                        label: product.title,
                        variantID: product.variants[0].id,
                      }))}
                      isClearable
                      value={field.value} // required for controlled components
                      onChange={(option) => field.onChange(option)} // make sure it gets full object
                      className="text-sm"
                    />
                  )}
                />
                <ErrorMessage>{errors.buyProduct?.message}</ErrorMessage>
              </Box>
            </Grid>
          ))}

        {!productError &&
          (isLoading ? (
            <Grid gap="5" columns="1fr 3fr">
              <Text size="2">Get Product</Text>
              <Box>
                <Skeleton height={34} />
              </Box>
            </Grid>
          ) : (
            <Grid gap="5" columns="1fr 3fr">
              <Text size="2">Get Product</Text>
              <Box>
                <Controller
                  name="getProduct"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      placeholder="Search & select Get items"
                      options={products?.map((product) => ({
                        value: product.id,
                        label: product.title,
                        variantID: product.variants[0].id,
                      }))}
                      isClearable
                      value={field.value} // required for controlled components
                      onChange={(option) => field.onChange(option)} // make sure it gets full object
                      className="text-sm"
                    />
                  )}
                />
                <ErrorMessage>{errors.getProduct?.message}</ErrorMessage>
              </Box>
            </Grid>
          ))}

        <Button disabled={isSubmitting}>
          {" "}
          Add New Discount {isSubmitting && <Spinner />}
        </Button>
      </form>
    </div>
  );
};

export default NewDiscountsPage;
