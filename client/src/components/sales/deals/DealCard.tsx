import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  faPhone
} from "@fortawesome/free-solid-svg-icons";
import { AIInsightsDashboard } from "../insights/AIInsightsDashboard";

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
  onEdit: (id: number) => void;
}

export function DealCard({ deal, onEdit }: DealCardProps) {
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
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Deal History</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {deal.history?.map((entry, i) => (
                        <div key={i} className="border-l-2 border-primary pl-4 pb-4">
                          <p className="text-sm text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString()}
                          </p>
                          <p className="font-medium">{entry.action}</p>
                          <p className="text-sm">{entry.user}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
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
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Communications Log</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faEnvelope} className="text-primary" />
                      <div>
                        <p className="font-medium">Last Email</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(deal.lastContact).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faPhone} className="text-primary" />
                      <div>
                        <p className="font-medium">Last Call</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(deal.lastContact).toLocaleDateString()}
                        </p>
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
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Deal Documents</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p>Shared Documents: {deal.metrics?.documentsShared || 0}</p>
                    {/* Add document list and upload functionality */}
                  </div>
                </DialogContent>
              </Dialog>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => onEdit(deal.id)}>
                    <FontAwesomeIcon icon={faGears} className="mr-2" />
                    Manage
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Manage Deal Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}