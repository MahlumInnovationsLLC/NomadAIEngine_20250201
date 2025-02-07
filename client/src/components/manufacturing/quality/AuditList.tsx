
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { QualityAudit } from "@/types/manufacturing";

interface AuditListProps {
  audits: QualityAudit[];
  type?: 'upcoming' | 'in-progress' | 'completed';
}

export default function AuditList({ audits, type = 'upcoming' }: AuditListProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Standard</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Auditor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audits.map((audit) => (
              <TableRow key={audit.id}>
                <TableCell>{audit.title}</TableCell>
                <TableCell>{audit.standard}</TableCell>
                <TableCell>{new Date(audit.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      audit.status === 'completed' ? 'success' : 
                      audit.status === 'in_progress' ? 'warning' : 
                      'secondary'
                    }
                  >
                    {audit.status}
                  </Badge>
                </TableCell>
                <TableCell>{audit.auditor}</TableCell>
              </TableRow>
            ))}
            {audits.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No {type} audits found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
