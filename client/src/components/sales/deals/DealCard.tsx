import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBuilding,
  faDollarSign,
  faChartLine,
  faCalendar,
  faUserTie,
  faIndustry,
  faCheckCircle,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";

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
  };
  onEdit: (id: number) => void;
}

export function DealCard({ deal, onEdit }: DealCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getStageVariant = (stage: string) => {
    switch (stage) {
      case "Closed Won": return "success";
      case "Proposal Sent": return "warning";
      case "Contract Review": return "default";
      default: return "secondary";
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
          <Progress 
            value={deal.score} 
            className="h-2"
            indicatorClassName={getScoreColor(deal.score)}
          />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Next Steps</h4>
          <p className="text-sm text-muted-foreground">{deal.nextSteps}</p>
        </div>

        <div className="flex justify-between items-center pt-2">
          <Badge variant="outline">
            {deal.engagement} Engagement
          </Badge>
          <Button size="sm" onClick={() => onEdit(deal.id)}>
            Manage Deal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
