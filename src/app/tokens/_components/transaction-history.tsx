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
  const columns = ["DATE", "TYPE", "AMOUNT", "BALANCE AFTER"] as const;

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

  const renderRow = (transaction: Transaction) => (
    <TableRow key={transaction.id} className="border-b border-border/50">
      <TableCell className="py-4 px-6">
        <div className="text-sm text-foreground">
          {new Date(transaction.createdAt).toLocaleDateString()}
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(transaction.createdAt).toLocaleTimeString()}
        </div>
      </TableCell>
      <TableCell className="py-4 px-6">
        <Badge variant="secondary" className="text-xs">
          {getTypeLabel(transaction.type)}
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
    </TableRow>
  );

  return (
    <Card className="w-full">
      <CardHeader className="p-6">
        <CardTitle className="text-xl">Transaction History</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Table aria-label="Token transactions">
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
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  No transactions yet. Your token activity will appear here.
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
