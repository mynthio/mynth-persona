"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import dayjs from "dayjs";

interface Transaction {
  id: string;
  type: string;
  status: "pending" | "completed" | "failed" | "expired";
  amount: number;
  balanceAfter: number;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const columns = [
    "DATE",
    "TYPE",
    "STATUS",
    "AMOUNT",
    "BALANCE AFTER",
    "UPDATED",
  ] as const;

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

  const getStatusVariant = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return "default" as const;
      case "failed":
      case "expired":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const getStatusLabel = (status: Transaction["status"]) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      case "expired":
        return "Expired";
      default:
        return status;
    }
  };

  const renderRow = (transaction: Transaction) => (
    <TableRow key={transaction.id} className="border-b border-border/50">
      <TableCell className="py-4 px-6">
        <div className="text-sm text-foreground">
          {dayjs(transaction.createdAt).format("MMM D, YYYY")}
        </div>
        <div className="text-xs text-muted-foreground">
          {dayjs(transaction.createdAt).format("HH:mm")}
        </div>
      </TableCell>
      <TableCell className="py-4 px-6">
        <Badge variant="secondary" className="text-xs">
          {getTypeLabel(transaction.type)}
        </Badge>
      </TableCell>
      <TableCell className="py-4 px-6">
        <Badge
          variant={getStatusVariant(transaction.status)}
          className="text-xs"
        >
          {getStatusLabel(transaction.status)}
        </Badge>
      </TableCell>
      <TableCell className="py-4 px-6 text-right">
        <span
          className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}
        >
          {transaction.amount > 0 ? "+" : ""}
          {transaction.amount}
        </span>
      </TableCell>
      <TableCell className="py-4 px-6 text-right">
        <span className="text-foreground font-medium">
          {transaction.balanceAfter}
        </span>
      </TableCell>
      <TableCell className="py-4 px-6">
        <div className="text-sm text-foreground">
          {dayjs(transaction.updatedAt).format("MMM D, YYYY")}
        </div>
        <div className="text-xs text-muted-foreground">
          {dayjs(transaction.updatedAt).format("HH:mm")}
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <Card className="w-full">
      <CardHeader className="p-6">
        <CardTitle className="text-xl">Transaction History</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Table aria-label="Spark transactions">
          <TableHeader>
            <TableRow className="border-b border-border">
              {columns.map((name) => (
                <TableHead
                  key={name}
                  className={
                    name === "DATE"
                      ? "font-medium text-foreground py-4 px-6"
                      : name === "BALANCE AFTER" || name === "AMOUNT"
                      ? "font-medium text-foreground py-4 px-6 text-right"
                      : "font-medium text-foreground py-4 px-6"
                  }
                >
                  {name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No transactions yet. Your spark activity will appear here.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map(renderRow)
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
