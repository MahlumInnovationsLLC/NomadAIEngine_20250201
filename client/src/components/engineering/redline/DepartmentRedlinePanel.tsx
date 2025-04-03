import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRedline, RedlineSubmission } from "./RedlineContext";

interface DepartmentRedlinePanelProps {
  department: "Electrical" | "Mechanical" | "IT" | "NTC";
}

export default function DepartmentRedlinePanel({ department }: DepartmentRedlinePanelProps) {
  const {
    redlineSubmissions,
    findRedlinesByDepartment,
    setSelectedSubmission,
    setIsSubmitDialogOpen,
    setIsViewDialogOpen,
    setIsCommentDialogOpen
  } = useRedline();

  // Get filtered redline submissions for this department
  const departmentRedlines = findRedlinesByDepartment(department);

  // Handler for viewing redline submission
  const handleViewRedline = (submission: RedlineSubmission) => {
    setSelectedSubmission(submission);
    setIsViewDialogOpen(true);
  };

  // Handler for editing redline submission
  const handleEditRedline = (submission: RedlineSubmission) => {
    setSelectedSubmission(submission);
    setIsSubmitDialogOpen(true);
  };

  // Handler for commenting on redline submission
  const handleCommentRedline = (submission: RedlineSubmission) => {
    setSelectedSubmission(submission);
    setIsCommentDialogOpen(true);
  };

  // Status badge variant lookup
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Pending":
        return "secondary";
      case "In Review":
        return "default";
      case "Approved":
        return "success";
      case "Rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Priority badge variant lookup
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "High":
        return "destructive";
      case "Medium":
        return "default";
      case "Low":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{department} Department Redlines</CardTitle>
            <CardDescription>
              Manage redline submissions for {department} engineering
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {departmentRedlines.length === 0 ? (
          <div className="text-center py-6">
            <FontAwesomeIcon icon="clipboard-list" className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-1">No redline submissions</h3>
            <p className="text-sm text-muted-foreground mb-4">
              There are currently no redline submissions for the {department} department.
            </p>
            <Button onClick={() => setIsSubmitDialogOpen(true)}>
              <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
              Create Redline Submission
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departmentRedlines.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.id}</TableCell>
                  <TableCell>{submission.title}</TableCell>
                  <TableCell>{submission.projectNumber}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(submission.status)}>
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityVariant(submission.priority)}>
                      {submission.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{submission.submittedDate}</TableCell>
                  <TableCell>{submission.assignedTo}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewRedline(submission)}>
                          <FontAwesomeIcon icon="eye" className="h-4 w-4 mr-2" />
                          <span>View</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditRedline(submission)}>
                          <FontAwesomeIcon icon="edit" className="h-4 w-4 mr-2" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCommentRedline(submission)}>
                          <FontAwesomeIcon icon="comment" className="h-4 w-4 mr-2" />
                          <span>Comment</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <FontAwesomeIcon icon="trash" className="h-4 w-4 mr-2" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}