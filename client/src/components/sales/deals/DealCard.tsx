import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faDollarSign,
  faChartLine,
  faCalendar,
  faUserTie,
  faIndustry,
  faCheckCircle,
  faExclamationTriangle,
  faHistory,
  faComments,
  faFileContract,
  faGears,
  faClock,
  faEnvelope,
  faPhone,
  faFilter,
  faUpload,
  faDownload,
  faTrash,
  faEdit,
  faPlus
} from "@fortawesome/free-solid-svg-icons";
import { AIInsightsDashboard } from "../insights/AIInsightsDashboard";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

interface DealCardProps {
  deal: {
    id: number;
    company: string;
    value: number;
    stage: string;
    probability: number;
    owner: string;
    manufacturingProject: string;
    lastContact: string;
    score: number;
    qualificationStatus: string;
    nextSteps: string;
    engagement: string;
    history?: Array<{
      date: string;
      action: string;
      user: string;
    }>;
    metrics?: {
      daysInStage: number;
      lastActivityDate: string;
      meetingsScheduled: number;
      documentsShared: number;
    };
  };
  onEdit: (id: number, updatedData: any) => void;
}

export function DealCard({ deal, onEdit }: DealCardProps) {
  const [isManaging, setIsManaging] = useState(false);
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      company: deal.company,
      value: deal.value,
      stage: deal.stage,
      probability: deal.probability,
      manufacturingProject: deal.manufacturingProject,
      nextSteps: deal.nextSteps,
      qualificationStatus: deal.qualificationStatus,
    }
  });

  const handleManageSubmit = async (data: any) => {
    try {
      setIsManaging(true);
      await onEdit(deal.id, data);
      toast({
        title: "Deal Updated",
        description: "The deal has been successfully updated.",
      });
      setIsManaging(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update deal. Please try again.",
        variant: "destructive",
      });
      setIsManaging(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getStageVariant = (stage: string): "default" | "secondary" | "outline" => {
    switch (stage) {
      case "Closed Won": return "default";
      case "Proposal Sent": return "secondary";
      default: return "outline";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl flex items-center gap-2">
            <FontAwesomeIcon icon={faBuilding} className="text-primary" />
            {deal.company}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FontAwesomeIcon icon={faUserTie} />
            {deal.owner}
          </div>
        </div>
        <Badge variant={getStageVariant(deal.stage)}>{deal.stage}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faDollarSign} className="text-green-500" />
              <span className="font-medium">${deal.value.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faChartLine} className="text-blue-500" />
              <span>{deal.probability}% probability</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendar} className="text-purple-500" />
              <span>Last Contact: {new Date(deal.lastContact).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faIndustry} className="text-gray-500" />
              <span>{deal.manufacturingProject}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Deal Score</span>
            <span className={`font-bold ${getScoreColor(deal.score)}`}>{deal.score}/100</span>
          </div>
          <Progress value={deal.score} className="h-2" />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Next Steps</h4>
          <p className="text-sm text-muted-foreground">{deal.nextSteps}</p>
        </div>

        {deal.metrics && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Days in Stage</div>
              <div className="font-medium">{deal.metrics.daysInStage} days</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Meetings</div>
              <div className="font-medium">{deal.metrics.meetingsScheduled}</div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <Badge variant="outline">
            {deal.engagement} Engagement
          </Badge>
          <div className="flex gap-2">
            <TooltipProvider>
              <Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 px-2">
                        <FontAwesomeIcon icon={faHistory} className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>View Deal History</TooltipContent>
                </Tooltip>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Deal History</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Input placeholder="Search history..." className="max-w-sm" />
                      <Select defaultValue="all">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Actions</SelectItem>
                          <SelectItem value="stage">Stage Changes</SelectItem>
                          <SelectItem value="communication">Communications</SelectItem>
                          <SelectItem value="document">Documents</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm">
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Add Note
                      </Button>
                    </div>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {deal.history?.map((entry, i) => (
                          <div key={i} className="border-l-2 border-primary pl-4 pb-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(entry.date).toLocaleDateString()}
                                </p>
                                <p className="font-medium">{entry.action}</p>
                                <p className="text-sm">{entry.user}</p>
                              </div>
                              <Button variant="ghost" size="sm">
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 px-2">
                        <FontAwesomeIcon icon={faComments} className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Communications Log</TooltipContent>
                </Tooltip>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Communications Log</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="flex justify-between">
                      <h3 className="text-lg font-medium">Recent Communications</h3>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm">
                          <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                          New Email
                        </Button>
                        <Button variant="outline" size="sm">
                          <FontAwesomeIcon icon={faPhone} className="mr-2" />
                          Log Call
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faEnvelope} className="text-primary" />
                          <div className="flex-1">
                            <p className="font-medium">Last Email</p>
                            <p className="text-sm text-muted-foreground">
                              Sent proposal follow-up
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(deal.lastContact).toLocaleDateString()}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                        </div>
                      </div>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faPhone} className="text-primary" />
                          <div className="flex-1">
                            <p className="font-medium">Last Call</p>
                            <p className="text-sm text-muted-foreground">
                              Technical requirements discussion
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(deal.lastContact).toLocaleDateString()}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 px-2">
                        <FontAwesomeIcon icon={faFileContract} className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Documents</TooltipContent>
                </Tooltip>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Deal Documents</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <p>Shared Documents: {deal.metrics?.documentsShared || 0}</p>
                      <Button>
                        <FontAwesomeIcon icon={faUpload} className="mr-2" />
                        Upload Document
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faFileContract} className="text-primary" />
                            <div>
                              <p className="font-medium">Technical Proposal.pdf</p>
                              <p className="text-sm text-muted-foreground">
                                Uploaded on {new Date().toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <FontAwesomeIcon icon={faDownload} />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500">
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button>
                        <FontAwesomeIcon icon={faGears} className="mr-2" />
                        Manage
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Manage Deal Settings</TooltipContent>
                </Tooltip>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Manage Deal: {deal.company}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(handleManageSubmit)}>
                    <div className="grid gap-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company">Company Name</Label>
                          <Input {...form.register("company")} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="value">Deal Value</Label>
                          <Input
                            type="number"
                            {...form.register("value", { valueAsNumber: true })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="stage">Stage</Label>
                          <Select
                            value={form.watch("stage")}
                            onValueChange={(value) => form.setValue("stage", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Lead">Lead</SelectItem>
                              <SelectItem value="Meeting Scheduled">Meeting Scheduled</SelectItem>
                              <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                              <SelectItem value="Contract Review">Contract Review</SelectItem>
                              <SelectItem value="Closed Won">Closed Won</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="probability">Probability (%)</Label>
                          <Input
                            type="number"
                            {...form.register("probability", { valueAsNumber: true })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manufacturingProject">Manufacturing Project</Label>
                        <Input {...form.register("manufacturingProject")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nextSteps">Next Steps</Label>
                        <Textarea {...form.register("nextSteps")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="qualificationStatus">Qualification Status</Label>
                        <Select
                          value={form.watch("qualificationStatus")}
                          onValueChange={(value) => form.setValue("qualificationStatus", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Highly Qualified">Highly Qualified</SelectItem>
                            <SelectItem value="Qualified">Qualified</SelectItem>
                            <SelectItem value="Partially Qualified">Partially Qualified</SelectItem>
                            <SelectItem value="Unqualified">Unqualified</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => form.reset()}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isManaging}
                        >
                          {isManaging ? "Saving..." : "Save Changes"}
                        </Button>
                      </DialogFooter>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}