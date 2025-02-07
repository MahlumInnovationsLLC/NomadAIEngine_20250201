import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function MaintenanceRequestManager() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const { data: requests = [] } = useQuery({
    queryKey: ['/api/maintenance/requests'],
    enabled: true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Maintenance Requests</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <FontAwesomeIcon icon={['fal', 'plus']} className="h-4 w-4" />
              New Request
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">New Requests</div>
                <div className="text-2xl font-bold">{requests.filter((req: any) => req.status === 'pending').length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Approved</div>
                <div className="text-2xl font-bold text-green-500">{requests.filter((req: any) => req.status === 'approved').length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Rejected</div>
                <div className="text-2xl font-bold text-red-500">{requests.filter((req: any) => req.status === 'rejected').length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Avg. Response Time</div>
                <div className="text-2xl font-bold">4.2h</div>
              </CardContent>
            </Card>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Requestor</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request: any) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">REQ-{request.id}</TableCell>
                  <TableCell>{request.requestor}</TableCell>
                  <TableCell>{request.equipmentName}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{request.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      request.priority === 'high' 
                        ? 'bg-red-500/10 text-red-500'
                        : request.priority === 'medium'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'bg-green-500/10 text-green-500'
                    }>
                      {request.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      request.status === 'approved'
                        ? 'bg-green-500/10 text-green-500'
                        : request.status === 'rejected'
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                    }>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(request.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <FontAwesomeIcon icon={['fal', 'check']} className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FontAwesomeIcon icon={['fal', 'times']} className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FontAwesomeIcon icon={['fal', 'arrow-right']} className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
