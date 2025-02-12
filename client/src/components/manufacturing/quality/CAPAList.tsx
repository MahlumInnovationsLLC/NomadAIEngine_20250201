import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faCircleInfo,
  faEdit,
  faEye,
  faEllipsisVertical
} from '@fortawesome/pro-light-svg-icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { CAPA } from "@/types/manufacturing/capa";
import { CAPADialog } from "./dialogs/CAPADialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CAPACategory {
  id: number;
  name: string;
  description: string | null;
  severity: string;
  requires_approval: boolean;
}

type CAPAStatus = CAPA['status'];

// Status groups for filtering
const STATUS_GROUPS = {
  open: ["draft", "open", "in_progress"] as CAPAStatus[],
  review: ["pending_review", "under_investigation", "implementing"] as CAPAStatus[],
  verification: ["pending_verification", "completed", "verified"] as CAPAStatus[],
  closed: ["closed", "cancelled"] as CAPAStatus[]
} as const;

type StatusGroupKey = keyof typeof STATUS_GROUPS;

export default function CAPAList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCAPA, setSelectedCAPA] = useState<CAPA | null>(null);
  const [activeTab, setActiveTab] = useState<StatusGroupKey | "all">("all");

  // Use react-query for data fetching with proper error handling
  const { data: capas = [], isLoading: isLoadingCAPAs, error: capasError, refetch } = useQuery<CAPA[]>({
    queryKey: ['/api/manufacturing/quality/capas'],
    queryFn: async () => {
      console.log('Fetching CAPAs...');
      const response = await fetch('/api/manufacturing/quality/capas');
      if (!response.ok) {
        const errorText = await response.text();
        console.error('CAPA fetch error:', errorText);
        throw new Error(`Failed to fetch CAPAs: ${errorText}`);
      }
      const data = await response.json();
      console.log('Fetched CAPAs:', data);
      return data;
    },
    retry: 3,
    staleTime: 30000,
  });

  const { data: categories = [], isLoading: isLoadingCategories, error: categoriesError } = useQuery<CAPACategory[]>({
    queryKey: ['/api/manufacturing/quality/capa-categories'],
    queryFn: async () => {
      console.log('Fetching CAPA categories...');
      const response = await fetch('/api/manufacturing/quality/capa-categories');
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Categories fetch error:', errorText);
        throw new Error(`Failed to fetch CAPA categories: ${errorText}`);
      }
      const data = await response.json();
      console.log('Fetched categories:', data);
      return data;
    },
    retry: 3,
    staleTime: 30000,
  });

  // Show error states if any queries failed
  if (capasError || categoriesError) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {capasError ? `Failed to load CAPAs: ${capasError instanceof Error ? capasError.message : 'Unknown error'}` : ''}
            {categoriesError ? `Failed to load categories: ${categoriesError instanceof Error ? categoriesError.message : 'Unknown error'}` : ''}
            Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading state while data is being fetched
  if (isLoadingCAPAs || isLoadingCategories) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>Loading CAPAs...</p>
        </div>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: CAPAStatus) => {
    switch (status) {
      case 'draft':
      case 'open':
        return 'secondary';
      case 'in_progress':
      case 'implementing':
        return 'default';
      case 'pending_review':
      case 'under_investigation':
        return 'secondary';
      case 'pending_verification':
        return 'outline';
      case 'completed':
      case 'verified':
        return 'default';
      case 'closed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const filteredCAPAs = capas.filter(capa =>
    activeTab === 'all' ? true : STATUS_GROUPS[activeTab as StatusGroupKey].includes(capa.status)
  );

  const handleDelete = async (capaId: string) => {
    if (!window.confirm('Are you sure you want to delete this CAPA?')) {
      return;
    }

    try {
      const response = await fetch(`/api/manufacturing/quality/capas/${capaId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete CAPA');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/capas'] });

      toast({
        title: "Success",
        description: "CAPA deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting CAPA:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete CAPA",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Corrective and Preventive Actions</h3>
          <p className="text-sm text-muted-foreground">
            Manage and track corrective actions and preventive measures
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
            Create New CAPA
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CAPA List</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as StatusGroupKey | 'all')}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="all">
                All
                <Badge variant="secondary" className="ml-2">
                  {capas.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="open">
                Open
                <Badge variant="secondary" className="ml-2">
                  {capas.filter(capa => STATUS_GROUPS.open.includes(capa.status)).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="review">
                Under Review
                <Badge variant="secondary" className="ml-2">
                  {capas.filter(capa => STATUS_GROUPS.review.includes(capa.status)).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="verification">
                Verification
                <Badge variant="secondary" className="ml-2">
                  {capas.filter(capa => STATUS_GROUPS.verification.includes(capa.status)).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="closed">
                Closed
                <Badge variant="secondary" className="ml-2">
                  {capas.filter(capa => STATUS_GROUPS.closed.includes(capa.status)).length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CAPA #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCAPAs.map((capa) => (
                  <TableRow key={capa.id}>
                    <TableCell className="font-medium">{capa.number}</TableCell>
                    <TableCell>{capa.title}</TableCell>
                    <TableCell className="capitalize">{capa.type}</TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(capa.priority)}>
                        {capa.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(capa.status)}>
                        {capa.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{capa.department}</TableCell>
                    <TableCell>{new Date(capa.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(capa.scheduledReviewDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedCAPA(capa)}>
                            <FontAwesomeIcon icon={faEye} className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedCAPA(capa)}>
                            <FontAwesomeIcon icon={faEdit} className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(capa.id)}
                            className="text-destructive"
                          >
                            <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Tabs>
        </CardContent>
      </Card>

      <CAPADialog
        open={showCreateDialog || !!selectedCAPA}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setSelectedCAPA(null);
        }}
        initialData={selectedCAPA ?? undefined}
        onSuccess={() => {
          toast({
            title: "Success",
            description: selectedCAPA
              ? "CAPA updated successfully"
              : "CAPA created successfully",
          });
          queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/capas'] });
        }}
      />
    </div>
  );
}