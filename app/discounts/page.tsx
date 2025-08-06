import prisma from "@/lib/prisma";
import { Button, Table } from "@radix-ui/themes";
import Link from "next/link";
import React from "react";
import DeleteButton from "../components/DeleteButton";

const DiscountPage = async () => {
  const discounts = await prisma.discount.findMany();

  return (
    <div>
      <div className="mb-4">
        <Button>
          <Link href="/discounts/new">New Discount</Link>
        </Button>
      </div>
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Heading</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>PercentOff</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Buy Product</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Get Product</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {discounts.map((discount) => (
            <Table.Row key={discount.id}>
              <Table.Cell>{discount.title}</Table.Cell>
              <Table.Cell>{discount.heading}</Table.Cell>
              <Table.Cell>{discount.percentOff}</Table.Cell>
              <Table.Cell>{discount.buyProduct}</Table.Cell>
              <Table.Cell>{discount.getProduct}</Table.Cell>
              <Table.Cell>
                <DeleteButton id={discount.id} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </div>
  );
};

export default DiscountPage;
