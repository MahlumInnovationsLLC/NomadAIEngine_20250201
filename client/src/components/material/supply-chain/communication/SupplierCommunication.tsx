import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { NewCommunicationDialog } from "./NewCommunicationDialog";
import { DocumentPreview } from "./DocumentPreview";
import type { SupplierCommunicationHistory } from "@/types/material";
import { useSocket } from "@/hooks/use-socket";
import { useToast } from "@/hooks/use-toast";

interface SupplierCommunicationProps {
  supplierId: string;
}

type CommunicationType = 'message' | 'meeting' | 'document' | null;
type CommunicationTab = 'messages' | 'documents' | 'meetings';

export function SupplierCommunication({ supplierId }: SupplierCommunicationProps) {
  const [selectedTab, setSelectedTab] = useState<CommunicationTab>('messages');
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [newCommunicationType, setNewCommunicationType] = useState<CommunicationType>(null);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    filename: string;
    fileType: string;
  } | null>(null);

  const { toast } = useToast();

  const { data: communications = [], refetch, isError } = useQuery<SupplierCommunicationHistory[]>({
    queryKey: ['/api/material/supplier-communications', supplierId],
    enabled: !!supplierId,
  });

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('supplier-communication', (data: { supplierId: string }) => {
      if (data.supplierId === supplierId) {
        refetch();
      }
    });

    return () => {
      socket.off('supplier-communication');
    };
  }, [socket, supplierId, refetch]);

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error",
        description: "Failed to load communications. Please try again later.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = (
      comm.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.sender.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesPriority = priorityFilter === 'all' || comm.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const handlePreviewFile = (attachment: NonNullable<SupplierCommunicationHistory['attachments']>[0]) => {
    setPreviewFile({
      url: attachment.url,
      filename: attachment.name,
      fileType: attachment.type,
    });
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'image':
        return ["fas", "image"];
      case 'pdf':
        return ["fas", "file-pdf"];
      case 'document':
        return ["fas", "file-lines"];
      case 'message':
        return ["fas", "envelope"];
      case 'meeting':
        return ["fas", "video"];
      default:
        return ["fas", "file"];
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Communication History</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setNewCommunicationType('message')}
            >
              <FontAwesomeIcon icon={["fas", "envelope"]} className="h-4 w-4" />
              Send Message
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setNewCommunicationType('meeting')}
            >
              <FontAwesomeIcon icon={["fas", "video"]} className="h-4 w-4" />
              Schedule Meeting
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setNewCommunicationType('document')}
            >
              <FontAwesomeIcon icon={["fas", "file-upload"]} className="h-4 w-4" />
              Upload Document
            </Button>
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <Input
              placeholder="Search communications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as CommunicationTab)}>
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
                {filteredCommunications
                  .filter(comm => comm.type === 'message' || comm.type === 'email')
                  .map((comm) => (
                    <TableRow key={comm.id}>
                      <TableCell>{new Date(comm.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {comm.type === 'message' ? 'Direct Message' : 'Email'}
                        </Badge>
                      </TableCell>
                      <TableCell>{comm.title}</TableCell>
                      <TableCell>{`${comm.sender.name} (${comm.sender.role})`}</TableCell>
                      <TableCell>
                        <Badge className={
                          comm.status === 'read' ? 'bg-green-500' :
                          comm.status === 'unread' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }>
                          {comm.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon={["fas", "eye"]} className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon={["fas", "reply"]} className="h-4 w-4" />
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
                {filteredCommunications
                  .filter(comm => comm.type === 'document')
                  .map((comm) => (
                    <TableRow key={comm.id}>
                      <TableCell>{new Date(comm.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {comm.metadata?.documentType || 'General'}
                        </Badge>
                      </TableCell>
                      <TableCell>{comm.title}</TableCell>
                      <TableCell>{`${comm.sender.name} (${comm.sender.role})`}</TableCell>
                      <TableCell>
                        <Badge className={
                          comm.status === 'read' ? 'bg-green-500' :
                          comm.status === 'unread' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }>
                          {comm.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {comm.attachments?.map((attachment, index) => (
                            <Button 
                              key={index} 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handlePreviewFile(attachment)}
                            >
                              <FontAwesomeIcon 
                                icon={renderIcon(attachment.type)} 
                                className="h-4 w-4" 
                              />
                            </Button>
                          ))}
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
                {filteredCommunications
                  .filter(comm => comm.type === 'meeting')
                  .map((comm) => (
                    <TableRow key={comm.id}>
                      <TableCell>
                        {comm.metadata?.meetingTime ? new Date(comm.metadata.meetingTime).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Meeting</Badge>
                      </TableCell>
                      <TableCell>{comm.title}</TableCell>
                      <TableCell>
                        {comm.metadata?.meetingAttendees?.length || comm.recipients.length} participants
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          comm.status === 'read' ? 'bg-green-500' :
                          comm.status === 'unread' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }>
                          {comm.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon={["fas", "video"]} className="h-4 w-4" />
                          </Button>
                          {comm.attachments && comm.attachments.length > 0 && (
                            <Button variant="ghost" size="sm">
                              <FontAwesomeIcon icon={["fas", "file-lines"]} className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>

      <NewCommunicationDialog
        supplierId={supplierId}
        type={newCommunicationType || 'message'}
        open={!!newCommunicationType}
        onOpenChange={(open) => !open && setNewCommunicationType(null)}
      />

      {previewFile && (
        <DocumentPreview
          {...previewFile}
          open={!!previewFile}
          onOpenChange={(open) => !open && setPreviewFile(null)}
        />
      )}
    </Card>
  );
}