import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import type { SupplierCommunicationHistory } from "@/types/material";

interface SupplierCommunicationProps {
  supplierId: string;
}

export function SupplierCommunication({ supplierId }: SupplierCommunicationProps) {
  const [selectedTab, setSelectedTab] = useState<'messages' | 'documents' | 'meetings'>('messages');

  const { data: communications = [] } = useQuery<SupplierCommunicationHistory[]>({
    queryKey: ['/api/material/supplier-communications', supplierId],
    enabled: !!supplierId,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Communication History</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <FontAwesomeIcon icon="envelope" className="h-4 w-4" />
              Send Message
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <FontAwesomeIcon icon="video" className="h-4 w-4" />
              Schedule Meeting
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as typeof selectedTab)}>
          <TabsList>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communications
                  .filter(comm => comm.type === 'message' || comm.type === 'email')
                  .map((comm) => (
                    <TableRow key={comm.id}>
                      <TableCell>{new Date(comm.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {comm.type === 'message' ? 'Direct Message' : 'Email'}
                        </Badge>
                      </TableCell>
                      <TableCell>{comm.subject}</TableCell>
                      <TableCell>{comm.contact.name}</TableCell>
                      <TableCell>
                        <Badge className={
                          comm.status === 'replied' ? 'bg-green-500' :
                          comm.status === 'pending' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }>
                          {comm.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="reply" className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="documents">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Shared By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communications
                  .filter(comm => comm.type === 'document')
                  .map((comm) => (
                    <TableRow key={comm.id}>
                      <TableCell>{new Date(comm.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {comm.documentType}
                        </Badge>
                      </TableCell>
                      <TableCell>{comm.subject}</TableCell>
                      <TableCell>{comm.contact.name}</TableCell>
                      <TableCell>
                        <Badge className={
                          comm.status === 'signed' ? 'bg-green-500' :
                          comm.status === 'pending' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }>
                          {comm.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="download" className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="signature" className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="meetings">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Attendees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communications
                  .filter(comm => comm.type === 'meeting')
                  .map((comm) => (
                    <TableRow key={comm.id}>
                      <TableCell>
                        {new Date(comm.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {comm.meetingType || 'Virtual'}
                        </Badge>
                      </TableCell>
                      <TableCell>{comm.subject}</TableCell>
                      <TableCell>
                        {comm.attendees?.length || 0} participants
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          comm.status === 'completed' ? 'bg-green-500' :
                          comm.status === 'scheduled' ? 'bg-blue-500' :
                          comm.status === 'cancelled' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }>
                          {comm.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="video" className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="file-lines" className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
