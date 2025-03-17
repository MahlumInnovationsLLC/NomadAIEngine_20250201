import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface MorningStandupViewProps {
  date: Date;
}

export function MorningStandupView({ date }: MorningStandupViewProps) {
  const [standupDialogOpen, setStandupDialogOpen] = useState(false);
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);
  const [bottleneckDialogOpen, setBottleneckDialogOpen] = useState(false);

  const { data: standupData } = useQuery({
    queryKey: ['/api/manufacturing/standup', format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await fetch(`/api/manufacturing/standup?date=${format(date, 'yyyy-MM-dd')}`);
      if (!response.ok) throw new Error('Failed to fetch standup data');
      return response.json();
    },
    enabled: false, // Temporarily disabled until API implemented
  });

  // Sample production targets for display
  const productionTargets = [
    { id: "pt1", line: "Assembly Line 1", target: 120, priority: "high" },
    { id: "pt2", line: "Assembly Line 2", target: 85, priority: "medium" },
    { id: "pt3", line: "Fabrication Line 1", target: 65, priority: "medium" },
    { id: "pt4", line: "Machining Line 1", target: 50, priority: "low" },
  ];

  // Sample bottlenecks for display  
  const bottlenecks = [
    { id: "b1", area: "Assembly Line 1 - Station 3", issue: "Tool malfunction", status: "resolved", assignee: "John Smith" },
    { id: "b2", area: "Material Supply - Aluminum Components", issue: "Inventory shortage", status: "in progress", assignee: "Maria Garcia" },
    { id: "b3", area: "QC Station", issue: "Staffing shortage", status: "open", assignee: "Unassigned" },
  ];

  // Sample quality issues for display
  const qualityIssues = [
    { id: "q1", item: "Connector assembly", issue: "Improper fitment", priority: "high", status: "investigating" },
    { id: "q2", item: "Control panel", issue: "Screen calibration", priority: "medium", status: "resolved" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Morning Production Standup</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setStandupDialogOpen(true)}>
          <FontAwesomeIcon icon="clipboard-list" className="mr-2 h-4 w-4" />
          Update Standup Notes
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Production Targets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Production Targets</h3>
              <Button variant="ghost" size="sm" onClick={() => setPriorityDialogOpen(true)}>
                <FontAwesomeIcon icon="pen" className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2">
              {productionTargets.map((target) => (
                <div key={target.id} className="flex items-center justify-between bg-muted p-2 rounded">
                  <div className="flex items-center">
                    <Badge 
                      className={
                        target.priority === "high" 
                          ? "bg-red-500 mr-2" 
                          : target.priority === "medium" 
                            ? "bg-amber-500 mr-2" 
                            : "bg-blue-500 mr-2"
                      }
                    >
                      {target.priority}
                    </Badge>
                    <span>{target.line}</span>
                  </div>
                  <span className="font-medium">{target.target} units</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottlenecks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Current Bottlenecks</h3>
              <Button variant="ghost" size="sm" onClick={() => setBottleneckDialogOpen(true)}>
                <FontAwesomeIcon icon="pen" className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2">
              {bottlenecks.map((bottleneck) => (
                <div key={bottleneck.id} className="bg-muted p-2 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{bottleneck.area}</span>
                    <Badge 
                      className={
                        bottleneck.status === "open" 
                          ? "bg-red-500" 
                          : bottleneck.status === "in progress" 
                            ? "bg-amber-500" 
                            : "bg-green-500"
                      }
                    >
                      {bottleneck.status}
                    </Badge>
                  </div>
                  <p className="text-xs">{bottleneck.issue}</p>
                  <p className="text-xs text-muted-foreground">Assigned: {bottleneck.assignee}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Issues */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Quality Issues</h3>
              <Button variant="ghost" size="sm">
                <FontAwesomeIcon icon="pen" className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2">
              {qualityIssues.map((issue) => (
                <div key={issue.id} className="bg-muted p-2 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{issue.item}</span>
                    <Badge 
                      className={
                        issue.priority === "high" 
                          ? "bg-red-500" 
                          : issue.priority === "medium" 
                            ? "bg-amber-500" 
                            : "bg-blue-500"
                      }
                    >
                      {issue.priority}
                    </Badge>
                  </div>
                  <p className="text-xs">{issue.issue}</p>
                  <p className="text-xs">Status: {issue.status}</p>
                </div>
              ))}
              {qualityIssues.length === 0 && (
                <div className="bg-muted p-2 rounded">
                  <p className="text-center text-sm text-muted-foreground">No quality issues</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Standup Dialog */}
        <Dialog open={standupDialogOpen} onOpenChange={setStandupDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Morning Standup Notes</DialogTitle>
              <DialogDescription>
                Record key discussion points, targets, and issues identified during standup.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input value={format(date, 'MMMM d, yyyy')} disabled />
              </div>
              <div>
                <label className="text-sm font-medium">Standup Leader</label>
                <Input placeholder="Name of the standup leader" />
              </div>
              <div>
                <label className="text-sm font-medium">Key Discussion Points</label>
                <Textarea 
                  placeholder="Enter the main topics discussed during standup..."
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Action Items</label>
                <Textarea 
                  placeholder="List action items and their owners..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStandupDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => setStandupDialogOpen(false)}>Save Notes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Priority Setting Dialog */}
        <Dialog open={priorityDialogOpen} onOpenChange={setPriorityDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Set Production Priorities</DialogTitle>
              <DialogDescription>
                Assign priorities to production lines based on daily demand.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {productionTargets.map((target) => (
                <div key={target.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>{target.line}</span>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="number" 
                      className="w-20" 
                      defaultValue={target.target} 
                    />
                    <select 
                      className="h-9 rounded-md border border-input px-3 py-1 text-sm"
                      defaultValue={target.priority}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPriorityDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => setPriorityDialogOpen(false)}>Save Priorities</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bottleneck Dialog */}
        <Dialog open={bottleneckDialogOpen} onOpenChange={setBottleneckDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Bottlenecks</DialogTitle>
              <DialogDescription>
                Update current bottlenecks and assign resolution owners.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {bottlenecks.map((bottleneck) => (
                <div key={bottleneck.id} className="p-2 bg-muted rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <Input 
                      defaultValue={bottleneck.area} 
                      className="w-full"
                    />
                  </div>
                  <Textarea 
                    defaultValue={bottleneck.issue}
                    rows={2}
                    placeholder="Describe the bottleneck..."
                  />
                  <div className="flex justify-between space-x-2">
                    <Input 
                      defaultValue={bottleneck.assignee}
                      placeholder="Assignee"
                      className="w-full"
                    />
                    <select 
                      className="h-9 rounded-md border border-input px-3 py-1 text-sm"
                      defaultValue={bottleneck.status}
                    >
                      <option value="open">Open</option>
                      <option value="in progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                Add Bottleneck
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBottleneckDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => setBottleneckDialogOpen(false)}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}