import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { QualityInspection } from "@/types/manufacturing";

export default function QualityInspectionList() {
  const { data: inspections } = useQuery<QualityInspection[]>({
    queryKey: ["/api/manufacturing/quality/inspections"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'in-progress':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Quality Inspections</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage quality inspection tasks
          </p>
        </div>
        <Button>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          New Inspection
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Production Line</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections?.map((inspection) => (
                <TableRow key={inspection.id}>
                  <TableCell className="font-medium capitalize">
                    {inspection.type.replace('-', ' ')}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(inspection.status)}`}>
                      {inspection.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{inspection.assignedTo}</TableCell>
                  <TableCell>{formatDate(inspection.dueDate)}</TableCell>
                  <TableCell>{inspection.productionLine}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
