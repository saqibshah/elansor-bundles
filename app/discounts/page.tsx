import { prisma } from "@/lib/prisma";
import { Button, Table } from "@radix-ui/themes";
import Link from "next/link";
import DeleteButton from "../components/DeleteButton";

const DiscountPage = async () => {
  const discounts = await prisma.discount.findMany();

  return (
    <div className="space-y-4">
      <div>
        <Button>
          <Link href="/discounts/new">New Discount</Link>
        </Button>
      </div>

      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Heading</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Percent Off</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Buy Product</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Get Product</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {discounts.map(
            ({ id, title, heading, percentOff, buyProduct, getProduct }) => (
              <Table.Row key={id}>
                <Table.Cell>{title}</Table.Cell>
                <Table.Cell>{heading}</Table.Cell>
                <Table.Cell>{percentOff}%</Table.Cell>
                <Table.Cell>{buyProduct}</Table.Cell>
                <Table.Cell>{getProduct}</Table.Cell>
                <Table.Cell>
                  <DeleteButton id={id} />
                </Table.Cell>
              </Table.Row>
            )
          )}
        </Table.Body>
      </Table.Root>
    </div>
  );
};

export const dynamic = "force-dynamic";

export default DiscountPage;
