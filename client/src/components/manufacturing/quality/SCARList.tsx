import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ChevronDown, ChevronUp, Plus } from "lucide-react";
import MilestoneTimeline from "./MilestoneTimeline";
import { getScarMilestones } from "./utils/milestoneUtils";
import { SCAR } from "@/types/manufacturing/scar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";

// Sample data for demonstration
const sampleSCARs: SCAR[] = [
  {
    id: "scar-001",
    number: "SCAR-001",
    title: "Supplier Delivered Incorrect Parts",
    description: "Parts received from ABC Manufacturing did not meet required specifications",
    status: "draft",
    priority: "high",
    supplierId: "sup-001",
    supplierName: "ABC Manufacturing",
    sourceNcrId: "ncr-123",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    defectDescription: "Parts were 2mm smaller than specified in drawings",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "John Smith"
  },
  {
    id: "scar-002",
    number: "SCAR-002",
    title: "Missing Documentation from Supplier",
    description: "Required certification documents were missing from latest shipment",
    status: "issued",
    priority: "medium",
    supplierId: "sup-002",
    supplierName: "XYZ Components",
    issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    defectDescription: "ISO certification documents were missing from the shipment paperwork",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "Sarah Johnson"
  },
  {
    id: "scar-003",
    number: "SCAR-003",
    title: "Material Quality Issues",
    description: "Material received does not meet hardness requirements",
    status: "supplier_response",
    priority: "critical",
    supplierId: "sup-003",
    supplierName: "Metal Solutions Inc.",
    sourceNcrId: "ncr-145",
    issueDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    responseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    defectDescription: "Material hardness tested at 40 HRC instead of the required 52-55 HRC range",
    supplierResponse: {
      responseText: "We identified an issue with our heat treatment process. We've implemented corrective actions and will resend proper materials",
      respondedBy: "Michael Chen",
      responseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "David Williams"
  },
  {
    id: "scar-004",
    number: "SCAR-004",
    title: "Packaging Damage",
    description: "Products arrived with damaged packaging",
    status: "review",
    priority: "medium",
    supplierId: "sup-004", 
    supplierName: "PackRight Solutions",
    issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    responseDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    defectDescription: "30% of packages showed signs of crushing and poor handling",
    supplierResponse: {
      responseText: "We've reviewed our packaging process and identified several issues. New reinforced packaging has been implemented and staff retrained.",
      respondedBy: "Jennifer Lee",
      responseDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      accepted: false,
      rejectionReason: "Need more details on the new packaging specifications"
    },
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "Robert Taylor"
  },
  {
    id: "scar-005",
    number: "SCAR-005",
    title: "Part Finishing Inconsistency",
    description: "Surface finish of components does not meet quality standards",
    status: "closed",
    priority: "high",
    supplierId: "sup-005",
    supplierName: "Precision Finish Co",
    sourceNcrId: "ncr-187",
    issueDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    responseDate: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
    completionDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    defectDescription: "Surface roughness measured at 3.2 Ra instead of required 1.6 Ra or lower",
    supplierResponse: {
      responseText: "We discovered an issue with our polishing equipment and have replaced the affected machinery. All parts now undergo 100% inspection for surface finish.",
      respondedBy: "Alex Rodriguez",
      responseDate: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
      accepted: true
    },
    createdAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "Emma Wilson"
  }
];

// Status badge color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "bg-gray-200 text-gray-700";
    case "issued":
      return "bg-blue-100 text-blue-700";
    case "supplier_response":
      return "bg-amber-100 text-amber-700";
    case "review":
      return "bg-purple-100 text-purple-700";
    case "closed":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

// Priority badge color mapping
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "low":
      return "bg-blue-100 text-blue-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    case "high":
      return "bg-orange-100 text-orange-700";
    case "critical":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const SCARList = () => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Supplier Corrective Action Requests</CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New SCAR
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: "50px" }}></TableHead>
              <TableHead>SCAR #</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead style={{ width: "80px" }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleSCARs.map((scar) => (
              <React.Fragment key={scar.id}>
                <TableRow className="hover:bg-slate-50 cursor-pointer">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => toggleRow(scar.id)}
                    >
                      {expandedRows[scar.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>{scar.number}</TableCell>
                  <TableCell className="font-medium">{scar.title}</TableCell>
                  <TableCell>{scar.supplierName}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(scar.status)}>
                      {scar.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(scar.priority)}>
                      {scar.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(scar.dueDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={8} className="p-0 border-b">
                    <Collapsible open={expandedRows[scar.id]}>
                      <CollapsibleContent className="px-4 py-3 bg-slate-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2">Description</h4>
                              <p className="text-sm text-slate-600">{scar.description}</p>
                            </div>
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2">Defect Description</h4>
                              <p className="text-sm text-slate-600">{scar.defectDescription}</p>
                            </div>
                            {scar.supplierResponse && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">Supplier Response</h4>
                                <p className="text-sm text-slate-600">
                                  {scar.supplierResponse.responseText}
                                </p>
                                {scar.supplierResponse.respondedBy && (
                                  <p className="text-xs text-slate-500 mt-1">
                                    Responded by: {scar.supplierResponse.respondedBy} on{" "}
                                    {scar.supplierResponse.responseDate &&
                                      format(
                                        new Date(scar.supplierResponse.responseDate),
                                        "MMM d, yyyy"
                                      )}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <div>
                            <MilestoneTimeline 
                              {...getScarMilestones(scar)}
                            />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SCARList;