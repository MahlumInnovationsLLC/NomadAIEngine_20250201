import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data for Electrical AAR (After Action Reports)
const aarReports = [
  {
    id: "AAR-E-001",
    projectId: "E-012",
    projectName: "Line 2 Power Distribution Upgrade",
    reportDate: "2025-01-15",
    category: "Installation Issues",
    severity: "Medium",
    status: "Resolved",
    description: "Power distribution panel installation delayed by 3 days due to incorrect mounting hardware.",
    rootCause: "Hardware specifications mismatch between design drawings and actual panel dimensions",
    solution: "Expedited custom mounting brackets and revised installation procedure",
    lessonsLearned: "Verify physical dimensions of all equipment against design specifications before scheduling installation.",
    teamMembers: ["Sarah Johnson", "David Lee"],
    preventiveMeasures: "Added pre-installation verification step to standard procedure and updated procurement checklist"
  },
  {
    id: "AAR-E-002",
    projectId: "E-015",
    projectName: "Backup Generator System",
    reportDate: "2025-02-03",
    category: "Equipment Malfunction",
    severity: "High",
    status: "Resolved",
    description: "Automatic transfer switch failed to engage during system testing, preventing generator from taking load.",
    rootCause: "Control circuit logic error in ATS firmware version 3.2.1",
    solution: "Upgraded firmware to version 3.3.0 which contained fix for the timing issue",
    lessonsLearned: "Critical systems require comprehensive testing with simulated power loss scenarios.",
    teamMembers: ["Michael Chen", "Jessica Williams"],
    preventiveMeasures: "Created weekly automated testing protocol for all backup power systems and implemented comprehensive firmware validation process"
  },
  {
    id: "AAR-E-003",
    projectId: "E-018",
    projectName: "Factory Lighting Retrofit",
    reportDate: "2025-02-22",
    category: "Compatibility Issues",
    severity: "Low",
    status: "Resolved",
    description: "LED fixtures caused radio frequency interference with wireless equipment controllers.",
    rootCause: "Power supplies in LED fixtures generated EMI outside of expected frequency range",
    solution: "Installed EMI filters on all fixtures and repositioned critical wireless receivers",
    lessonsLearned: "Electrical retrofits need comprehensive EMI testing with all adjacent systems prior to full deployment.",
    teamMembers: ["Jessica Williams", "Alex Rodriguez"],
    preventiveMeasures: "Added EMI compatibility testing to lighting retrofit procedure and created interference map of sensitive equipment areas"
  },
  {
    id: "AAR-E-004",
    projectId: "E-020",
    projectName: "Control System Upgrade",
    reportDate: "2025-03-10",
    category: "Integration Issues",
    severity: "High",
    status: "In Progress",
    description: "New PLC integration causing intermittent communication failures with existing SCADA system.",
    rootCause: "Protocol timing mismatch between new PLC and legacy SCADA interface",
    solution: "Implementing protocol gateway with buffering capability to resolve timing issues",
    lessonsLearned: "Legacy systems integration requires detailed protocol analysis beyond standard compatibility charts.",
    teamMembers: ["David Lee", "Michael Chen"],
    preventiveMeasures: "Developing comprehensive protocol testing tool for future integration projects and documenting all legacy timing requirements"
  },
  {
    id: "AAR-E-005",
    projectId: "E-023",
    projectName: "Substation Maintenance",
    reportDate: "2025-03-17",
    category: "Safety Procedure",
    severity: "Critical",
    status: "Resolved",
    description: "Lock-out/tag-out procedure violation resulted in near-miss incident during maintenance.",
    rootCause: "Procedural steps performed out of sequence, compromising isolation verification",
    solution: "Immediate staff retraining and implementation of two-person verification for all LOTO procedures",
    lessonsLearned: "Safety procedures must include verification steps that cannot be circumvented under time pressure.",
    teamMembers: ["Sarah Johnson", "Alex Rodriguez"],
    preventiveMeasures: "Redesigned LOTO procedure with mandatory verification checkpoints and implemented digital LOTO tracking system"
  }
];

// Categories for filtering
const categories = [
  "All Categories",
  "Installation Issues",
  "Equipment Malfunction",
  "Compatibility Issues",
  "Integration Issues",
  "Safety Procedure"
];

export default function ElectricalAARPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Filter reports based on search term and category
  const filteredReports = aarReports.filter(report => {
    const matchesSearch = 
      report.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "All Categories" || report.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleViewDetails = (report: any) => {
    setSelectedReport(report);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>After Action Reports (AAR)</CardTitle>
              <CardDescription>
                Analysis of previous electrical engineering projects to identify lessons learned and process improvements
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
              New AAR Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by project name, ID or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report ID</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.id}</TableCell>
                  <TableCell>{report.projectName}</TableCell>
                  <TableCell>{report.category}</TableCell>
                  <TableCell>
                    <Badge variant={
                      report.severity === "Critical" ? "destructive" :
                      report.severity === "High" ? "destructive" :
                      report.severity === "Medium" ? "default" :
                      "outline"
                    }>
                      {report.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      report.status === "Resolved" ? "outline" : 
                      report.status === "In Progress" ? "secondary" : "default"
                    }>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.reportDate}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleViewDetails(report)}>
                      <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create New AAR Report Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New After Action Report</DialogTitle>
            <DialogDescription>
              Document lessons learned and improvement opportunities from completed electrical projects
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-id">Project ID</Label>
              <Input id="project-id" placeholder="e.g. E-025" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input id="project-name" placeholder="Project name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="installation-issues">Installation Issues</SelectItem>
                  <SelectItem value="equipment-malfunction">Equipment Malfunction</SelectItem>
                  <SelectItem value="compatibility-issues">Compatibility Issues</SelectItem>
                  <SelectItem value="integration-issues">Integration Issues</SelectItem>
                  <SelectItem value="safety-procedure">Safety Procedure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Issue Description</Label>
              <Textarea id="description" placeholder="Describe what happened..." className="min-h-[80px]" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="root-cause">Root Cause Analysis</Label>
              <Textarea id="root-cause" placeholder="Identify the underlying causes..." className="min-h-[80px]" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="solution">Solution Implemented</Label>
              <Textarea id="solution" placeholder="What was done to resolve the issue..." className="min-h-[80px]" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="lessons">Lessons Learned</Label>
              <Textarea id="lessons" placeholder="What can we learn from this..." className="min-h-[80px]" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="preventive">Preventive Measures</Label>
              <Textarea id="preventive" placeholder="How to prevent similar issues in the future..." className="min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsCreateDialogOpen(false)}>Save Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AAR Details Dialog */}
      {selectedReport && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedReport.id}: {selectedReport.projectName}</DialogTitle>
              <DialogDescription>
                Reported on {selectedReport.reportDate}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    selectedReport.severity === "Critical" ? "destructive" :
                    selectedReport.severity === "High" ? "destructive" :
                    selectedReport.severity === "Medium" ? "default" :
                    "outline"
                  }>
                    {selectedReport.severity} Severity
                  </Badge>
                  <Badge>{selectedReport.category}</Badge>
                </div>
                <Badge variant={
                  selectedReport.status === "Resolved" ? "outline" : 
                  selectedReport.status === "In Progress" ? "secondary" : "default"
                }>
                  {selectedReport.status}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Team Members</h4>
                  <p>{selectedReport.teamMembers.join(", ")}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Issue Description</h4>
                  <p>{selectedReport.description}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Root Cause</h4>
                  <p>{selectedReport.rootCause}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Solution</h4>
                  <p>{selectedReport.solution}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Lessons Learned</h4>
                  <p>{selectedReport.lessonsLearned}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Preventive Measures</h4>
                  <p>{selectedReport.preventiveMeasures}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
              <Button variant="outline">
                <FontAwesomeIcon icon="print" className="mr-2 h-4 w-4" />
                Print Report
              </Button>
              <Button>
                <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                Edit Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}