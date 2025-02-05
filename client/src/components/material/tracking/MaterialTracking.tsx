import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import type { InventoryTransaction, Material } from "@/types/material";

interface MaterialTrackingProps {
  selectedWarehouse: string | null;
}

export function MaterialTracking({ selectedWarehouse }: MaterialTrackingProps) {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');

  const { data: transactions = [] } = useQuery<InventoryTransaction[]>({
    queryKey: ['/api/material/transactions', selectedWarehouse, dateRange],
    enabled: true,
  });

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ['/api/material/inventory'],
    enabled: true,
  });

  const getTransactionTypeBadge = (type: string) => {
    const colors = {
      receipt: "bg-green-500",
      issue: "bg-blue-500",
      transfer: "bg-yellow-500",
      adjustment: "bg-purple-500",
      cycle_count: "bg-gray-500"
    };
    return <Badge className={colors[type as keyof typeof colors]}>{type}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Material Tracking</h2>
        <div className="flex gap-2">
          <Button
            variant={dateRange === 'today' ? 'default' : 'outline'}
            onClick={() => setDateRange('today')}
          >
            Today
          </Button>
          <Button
            variant={dateRange === 'week' ? 'default' : 'outline'}
            onClick={() => setDateRange('week')}
          >
            This Week
          </Button>
          <Button
            variant={dateRange === 'month' ? 'default' : 'outline'}
            onClick={() => setDateRange('month')}
          >
            This Month
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Items In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.filter(t => t.type === 'transfer').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Quality Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.filter(t => t.type === 'receipt' && t.qualityCheck?.passed === undefined).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Material Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Batch/Serial</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Quality Check</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => {
                const material = materials.find(m => m.id === transaction.materialId);
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{material?.name || transaction.materialId}</TableCell>
                    <TableCell>{getTransactionTypeBadge(transaction.type)}</TableCell>
                    <TableCell>{transaction.quantity}</TableCell>
                    <TableCell>
                      {transaction.batchNumber || transaction.serialNumber ? (
                        <div className="flex flex-col">
                          {transaction.batchNumber && <span>Batch: {transaction.batchNumber}</span>}
                          {transaction.serialNumber && <span>Serial: {transaction.serialNumber}</span>}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{transaction.fromWarehouseId || "-"}</TableCell>
                    <TableCell>{transaction.toWarehouseId || "-"}</TableCell>
                    <TableCell>
                      {transaction.qualityCheck ? (
                        <Badge className={transaction.qualityCheck.passed ? "bg-green-500" : "bg-red-500"}>
                          {transaction.qualityCheck.passed ? "Passed" : "Failed"}
                        </Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{transaction.reference}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}