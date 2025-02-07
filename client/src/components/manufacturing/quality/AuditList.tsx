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
              <TableHead>Audit Number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Standard</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Lead Auditor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audits.map((audit) => (
              <TableRow key={audit.id}>
                <TableCell>{audit.auditNumber}</TableCell>
                <TableCell>{audit.type}</TableCell>
                <TableCell>{audit.standard}</TableCell>
                <TableCell>{new Date(audit.scheduledDate).toLocaleDateString()}</TableCell>
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
                <TableCell>{audit.leadAuditor}</TableCell>
              </TableRow>
            ))}
            {audits.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
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