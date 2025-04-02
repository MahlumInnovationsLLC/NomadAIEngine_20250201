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

// Mock data for NTC AAR (After Action Reports)
const aarReports = [
  {
    id: "AAR-NTC-001",
    projectId: "NTC-015",
    projectName: "Graphene Composite Development",
    reportDate: "2025-01-05",
    category: "Material Performance",
    severity: "Medium",
    status: "Resolved",
    description: "Material showed unexpected degradation under cyclic loading conditions.",
    rootCause: "Inadequate bonding between graphene layers and polymer matrix at molecular level",
    solution: "Modified binding agent formulation and improved curing process to enhance molecular cross-linking",
    lessonsLearned: "Advanced materials require multi-scale testing from molecular to macro levels to validate performance.",
    teamMembers: ["Dr. Elizabeth Parker", "Dr. Benjamin Harris"],
    preventiveMeasures: "Implemented comprehensive multi-scale testing protocol for all new composite materials"
  },
  {
    id: "AAR-NTC-002",
    projectId: "NTC-018",
    projectName: "AI Defect Detection System",
    reportDate: "2025-02-12",
    category: "Algorithm Performance",
    severity: "High",
    status: "Resolved",
    description: "Model accuracy dropped significantly when deployed to production environment.",
    rootCause: "Training dataset lacked sufficient variability in lighting conditions and part orientations",
    solution: "Created more diverse training dataset and implemented data augmentation techniques",
    lessonsLearned: "AI models require extensive environment-specific data to perform reliably in production settings.",
    teamMembers: ["Dr. Jason Wright", "Dr. Michelle Taylor"],
    preventiveMeasures: "Developed protocol for production environment data collection prior to model training and expanded test suite for environmental variations"
  },
  {
    id: "AAR-NTC-003",
    projectId: "NTC-020",
    projectName: "Selective Laser Sintering Process",
    reportDate: "2025-02-25",
    category: "Process Parameters",
    severity: "Medium",
    status: "In Progress",
    description: "Inconsistent density in parts produced using the optimized laser sintering parameters.",
    rootCause: "Material powder batch variation affecting thermal properties",
    solution: "Implementing adaptive process control with real-time thermal monitoring",
    lessonsLearned: "Additive manufacturing processes need adaptive control systems to account for material variations.",
    teamMembers: ["Dr. Sophia Martinez", "Dr. Elizabeth Parker"],
    preventiveMeasures: "Developing material characterization protocol for each powder batch and integrating real-time feedback control systems"
  },
  {
    id: "AAR-NTC-004",
    projectId: "NTC-022",
    projectName: "Nano-coating Durability Testing",
    reportDate: "2025-03-08",
    category: "Testing Methodology",
    severity: "Low",
    status: "Resolved",
    description: "Accelerated life testing did not accurately predict field durability of nano-coating.",
    rootCause: "Test parameters did not correctly simulate UV exposure combined with moisture cycles",
    solution: "Redesigned test protocol with simultaneous UV and humidity cycling",
    lessonsLearned: "Materials testing needs to combine multiple environmental factors simultaneously rather than sequentially.",
    teamMembers: ["Dr. Benjamin Harris", "Dr. Michelle Taylor"],
    preventiveMeasures: "Updated accelerated life testing standards for all surface treatments and coatings"
  },
  {
    id: "AAR-NTC-005",
    projectId: "NTC-024",
    projectName: "Collaborative Robot Safety System",
    reportDate: "2025-03-20",
    category: "System Integration",
    severity: "Critical",
    status: "Resolved",
    description: "Safety detection system experienced latency issues in specific factory conditions.",
    rootCause: "Sensor fusion algorithm performance degraded under specific RF interference patterns present in the production environment",
    solution: "Redesigned filtering algorithms and added redundant sensor pathways",
    lessonsLearned: "Safety-critical systems must be tested in exact deployment environments with all possible interference sources.",
    teamMembers: ["Dr. Michelle Taylor", "Dr. Jason Wright"],
    preventiveMeasures: "Created comprehensive RF mapping protocol for deployment environments and implemented on-site validation testing"
  }
];

// Categories for filtering
const categories = [
  "All Categories",
  "Material Performance",
  "Algorithm Performance",
  "Process Parameters",
  "Testing Methodology",
  "System Integration"
];

export default function NTCAARPanel() {
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
                Analysis of research challenges and learnings from New Technology Center projects
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
              Document research challenges and learnings from completed NTC projects
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-id">Project ID</Label>
              <Input id="project-id" placeholder="e.g. NTC-030" />
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
                  <SelectItem value="material-performance">Material Performance</SelectItem>
                  <SelectItem value="algorithm-performance">Algorithm Performance</SelectItem>
                  <SelectItem value="process-parameters">Process Parameters</SelectItem>
                  <SelectItem value="testing-methodology">Testing Methodology</SelectItem>
                  <SelectItem value="system-integration">System Integration</SelectItem>
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
                  <h4 className="font-semibold text-sm text-muted-foreground">Research Team</h4>
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