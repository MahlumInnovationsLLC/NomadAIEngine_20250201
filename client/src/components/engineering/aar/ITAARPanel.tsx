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

// Mock data for IT AAR (After Action Reports)
const aarReports = [
  {
    id: "AAR-IT-001",
    projectId: "ITP-012",
    projectName: "ERP System Upgrade",
    reportDate: "2025-01-12",
    category: "Integration Issues",
    severity: "High",
    status: "Resolved",
    description: "Production data migration incomplete during upgrade window, causing partial system functionality during Monday operations.",
    rootCause: "ETL process timeout due to unexpected data volume in legacy transactions table",
    solution: "Optimized ETL queries with better indexing and implemented batch processing approach",
    lessonsLearned: "Always perform full data volume dry-runs prior to production migration and include buffer time for unexpected processing delays.",
    teamMembers: ["Alex Johnson", "Marcus Chen"],
    preventiveMeasures: "Created data migration checklist with performance testing and volume assessment. Updated migration tools to include progress monitoring."
  },
  {
    id: "AAR-IT-002",
    projectId: "ITP-015",
    projectName: "Factory IoT Sensor Network",
    reportDate: "2025-02-05",
    category: "Hardware Compatibility",
    severity: "Medium",
    status: "Resolved",
    description: "20% of installed sensors failed to connect to gateway devices, resulting in data gaps for line monitoring.",
    rootCause: "Firmware incompatibility between sensor batch #45B and gateway devices",
    solution: "Updated firmware on affected sensors and implemented automatic compatibility checking",
    lessonsLearned: "Need better vendor management for firmware versions and compatibility matrix documentation.",
    teamMembers: ["Samantha Lee", "Rachel Kim"],
    preventiveMeasures: "Implemented pre-deployment compatibility testing for all IoT components and created firmware version control system"
  },
  {
    id: "AAR-IT-003",
    projectId: "ITP-018",
    projectName: "Manufacturing Analytics Platform",
    reportDate: "2025-02-28",
    category: "Performance Issues",
    severity: "Medium",
    status: "In Progress",
    description: "Dashboard response times exceeding 10 seconds during peak production hours.",
    rootCause: "Inefficient query design and lack of proper database indexing",
    solution: "Implementing query optimization, adding appropriate indexes, and introducing data pre-aggregation for common reports",
    lessonsLearned: "Performance testing should be conducted under realistic data volumes and concurrent user loads.",
    teamMembers: ["Marcus Chen", "Daniel Garcia"],
    preventiveMeasures: "Added performance benchmarks to acceptance criteria and implementing automated performance regression testing"
  },
  {
    id: "AAR-IT-004",
    projectId: "ITP-020",
    projectName: "Network Infrastructure Upgrade",
    reportDate: "2025-03-15",
    category: "Deployment Process",
    severity: "Critical",
    status: "Resolved",
    description: "4-hour manufacturing network outage during planned 1-hour maintenance window.",
    rootCause: "Configuration backup failure before equipment replacement led to manual reconfiguration needs",
    solution: "Restored from tertiary backup and implemented new configuration management system",
    lessonsLearned: "Multiple backup verification steps needed before any physical network changes.",
    teamMembers: ["Rachel Kim", "Daniel Garcia"],
    preventiveMeasures: "Implemented triple redundant configuration backups with pre-change verification and created detailed rollback procedures"
  },
  {
    id: "AAR-IT-005",
    projectId: "ITP-022",
    projectName: "Cybersecurity Enhancement",
    reportDate: "2025-03-22",
    category: "Security Configuration",
    severity: "High",
    status: "Resolved",
    description: "New firewall rules blocked critical supplier EDI connections for 8 hours.",
    rootCause: "Incomplete documentation of required connection paths for EDI systems",
    solution: "Created exceptions for EDI traffic and documented comprehensive connection map",
    lessonsLearned: "Security implementations need complete application dependency mapping to prevent business disruptions.",
    teamMembers: ["Daniel Garcia", "Alex Johnson"],
    preventiveMeasures: "Developed comprehensive application dependency documentation and implemented graduated security deployment with monitoring periods"
  }
];

// Categories for filtering
const categories = [
  "All Categories",
  "Integration Issues",
  "Hardware Compatibility",
  "Performance Issues",
  "Deployment Process",
  "Security Configuration"
];

export default function ITAARPanel() {
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
                Analysis of previous IT projects to identify lessons learned and process improvements
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
              Document lessons learned and improvement opportunities from completed IT projects
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-id">Project ID</Label>
              <Input id="project-id" placeholder="e.g. ITP-025" />
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
                  <SelectItem value="integration-issues">Integration Issues</SelectItem>
                  <SelectItem value="hardware-compatibility">Hardware Compatibility</SelectItem>
                  <SelectItem value="performance-issues">Performance Issues</SelectItem>
                  <SelectItem value="deployment-process">Deployment Process</SelectItem>
                  <SelectItem value="security-configuration">Security Configuration</SelectItem>
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