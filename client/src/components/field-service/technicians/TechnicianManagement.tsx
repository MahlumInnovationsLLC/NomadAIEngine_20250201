
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import type { Technician } from "@/types/field-service";

export function TechnicianManagement() {
  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ['/api/field-service/technicians'],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Field Technicians</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable data={technicians} columns={[
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'specialization', header: 'Specialization' },
          { accessorKey: 'assignments.length', header: 'Active Assignments' }
        ]} />
      </CardContent>
    </Card>
  );
}
