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

// Mock data for Mechanical AAR (After Action Reports)
const aarReports = [
  {
    id: "AAR-ME-001",
    projectId: "MP-018",
    projectName: "Automated Assembly Line",
    reportDate: "2025-01-08",
    category: "Design Issues",
    severity: "High",
    status: "Resolved",
    description: "Clearance issues between conveyor system and assembly fixtures caused production line stoppages.",
    rootCause: "Insufficient tolerance analysis during design phase and lack of integrated motion studies",
    solution: "Redesigned fixture mounting system with adjustable positioning and increased clearances",
    lessonsLearned: "Need to incorporate full motion simulation studies with realistic tolerances during design phase.",
    teamMembers: ["David Miller", "Richard Taylor"],
    preventiveMeasures: "Added collision detection simulation to design workflow and implemented formal tolerance stack-up analysis"
  },
  {
    id: "AAR-ME-002",
    projectId: "MP-023",
    projectName: "Hydraulic Press Redesign",
    reportDate: "2025-02-15",
    category: "Material Selection",
    severity: "Medium",
    status: "Resolved",
    description: "Premature wear on press guides resulting in alignment issues after 3 months of operation.",
    rootCause: "Selected bearing material unsuitable for high-cycle, high-load application",
    solution: "Replaced with case-hardened steel guides with specialized surface treatment",
    lessonsLearned: "Material selection should consider not just static loads but fatigue and wear characteristics for high-cycle applications.",
    teamMembers: ["Jennifer Smith", "Thomas Anderson"],
    preventiveMeasures: "Developed comprehensive material selection matrix for mechanical components based on load cycles, environment, and maintenance intervals"
  },
  {
    id: "AAR-ME-003",
    projectId: "MP-025",
    projectName: "Cooling System for Electronics",
    reportDate: "2025-03-01",
    category: "Performance Issues",
    severity: "High",
    status: "In Progress",
    description: "Thermal management system unable to maintain operating temperatures under peak load conditions.",
    rootCause: "CFD analysis did not account for actual installation constraints and air flow restrictions",
    solution: "Implementing redesign with additional heat pipes and optimized fan placement",
    lessonsLearned: "Thermal simulations must incorporate realistic boundary conditions including actual installation environment.",
    teamMembers: ["Jennifer Smith", "Angela Thompson"],
    preventiveMeasures: "Updated thermal analysis procedures to include physical mock-up testing and real-world constraint validation"
  },
  {
    id: "AAR-ME-004",
    projectId: "MP-020",
    projectName: "Robotic Arm Gripper",
    reportDate: "2025-03-10",
    category: "Manufacturing Issues",
    severity: "Medium",
    status: "Resolved",
    description: "Inconsistent part quality due to machining process variations.",
    rootCause: "Design features too sensitive to normal manufacturing tolerances",
    solution: "Redesigned critical features with larger acceptable tolerance ranges",
    lessonsLearned: "Design for manufacturability should be prioritized earlier in the design phase with input from manufacturing engineers.",
    teamMembers: ["Richard Taylor", "David Miller"],
    preventiveMeasures: "Implemented DFM review checkpoint before design finalization and added manufacturing engineer to design team"
  },
  {
    id: "AAR-ME-005",
    projectId: "MP-027",
    projectName: "Vibration Isolation System",
    reportDate: "2025-03-22",
    category: "Testing Methodology",
    severity: "Low",
    status: "Resolved",
    description: "Initial prototype passed lab testing but failed in field conditions.",
    rootCause: "Test protocol did not accurately replicate actual environmental conditions",
    solution: "Developed enhanced testing methodology based on field measurements",
    lessonsLearned: "Test conditions must accurately represent the full range of real-world operating environments.",
    teamMembers: ["Angela Thompson", "Thomas Anderson"],
    preventiveMeasures: "Established comprehensive environmental testing protocol with field validation phase"
  }
];

// Categories for filtering
const categories = [
  "All Categories",
  "Design Issues",
  "Material Selection",
  "Performance Issues",
  "Manufacturing Issues",
  "Testing Methodology"
];

export default function MechanicalAARPanel() {
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
                Analysis of previous mechanical engineering projects to identify lessons learned and process improvements
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
              Document lessons learned and improvement opportunities from completed mechanical engineering projects
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-id">Project ID</Label>
              <Input id="project-id" placeholder="e.g. MP-045" />
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
                  <SelectItem value="design-issues">Design Issues</SelectItem>
                  <SelectItem value="material-selection">Material Selection</SelectItem>
                  <SelectItem value="performance-issues">Performance Issues</SelectItem>
                  <SelectItem value="manufacturing-issues">Manufacturing Issues</SelectItem>
                  <SelectItem value="testing-methodology">Testing Methodology</SelectItem>
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