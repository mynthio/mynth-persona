"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  createdAt: Date;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export default function TransactionHistory({
  transactions,
}: TransactionHistoryProps) {
  const columns = [
    { name: "TYPE", uid: "type" },
    { name: "AMOUNT", uid: "amount" },
    { name: "BALANCE AFTER", uid: "balanceAfter" },
    { name: "DATE", uid: "date" },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "purchase":
        return "success";
      case "spend":
        return "danger";
      default:
        return "default";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "purchase":
        return "Purchase";
      case "spend":
        return "Spent";
      default:
        return type;
    }
  };

  const renderCell = (
    transaction: Transaction,
    columnKey: React.Key
  ): React.ReactNode => {
    switch (columnKey) {
      case "type":
        return (
          <Chip color={getTypeColor(transaction.type)} variant="flat" size="sm">
            {getTypeLabel(transaction.type)}
          </Chip>
        );
      case "amount":
        return (
          <span
            className={
              transaction.amount > 0 ? "text-green-600" : "text-red-600"
            }
          >
            {transaction.amount > 0 ? "+" : ""}
            {transaction.amount}
          </span>
        );
      case "balanceAfter":
        return String(transaction.balanceAfter);
      case "date":
        return new Date(transaction.createdAt).toLocaleDateString();
      default:
        return "";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="p-6">
        <h2 className="text-xl font-semibold">Transaction History</h2>
      </CardHeader>
      <CardBody className="pt-0">
        <Table shadow="none" aria-label="Token transactions">
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid} align="start">
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={transactions}
            emptyContent="No transactions yet. Your token activity will appear here."
          >
            {(transaction) => (
              <TableRow key={transaction.id}>
                {(columnKey) => (
                  <TableCell>{renderCell(transaction, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
