import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCheckCircle, 
  faClock, 
  faSpinner,
  faTimeline,
  faTrophy
} from "@fortawesome/free-solid-svg-icons";
import { formatDistanceToNow } from "date-fns";

interface Goal {
  id: string;
  type: string;
  specificGoal: string;
  target: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  timeline: number;
  status: "completed" | "in_progress" | "upcoming";
  progress: number;
}

interface GoalCenterProps {
  memberId: string;
  pastGoals: Goal[];
  currentGoals: Goal[];
}

export function GoalCenter({ memberId, pastGoals, currentGoals }: GoalCenterProps) {
  const getStatusIcon = (status: Goal["status"]) => {
    switch (status) {
      case "completed":
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
      case "in_progress":
        return <FontAwesomeIcon icon={faSpinner} className="text-blue-500" />;
      case "upcoming":
        return <FontAwesomeIcon icon={faClock} className="text-yellow-500" />;
    }
  };

  const getTimelineLabel = (goal: Goal) => {
    const start = new Date(goal.startDate);
    const end = new Date(goal.endDate);
    const now = new Date();

    if (goal.status === "completed") {
      return `Completed ${formatDistanceToNow(end, { addSuffix: true })}`;
    }

    if (now < start) {
      return `Starts ${formatDistanceToNow(start, { addSuffix: true })}`;
    }

    return `${formatDistanceToNow(end, { addSuffix: true })}`;
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Goal Center</CardTitle>
          <FontAwesomeIcon icon={faTrophy} className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Current Goals Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Current Goals</h3>
            {currentGoals.length > 0 ? (
              <div className="space-y-4">
                {currentGoals.map((goal) => (
                  <div key={goal.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(goal.status)}
                        <span className="font-medium">{goal.specificGoal}</span>
                      </div>
                      <Badge variant="outline">{goal.type}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Progress: {goal.currentValue} / {goal.target}</span>
                        <span>{getTimelineLabel(goal)}</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No current goals. Set a new goal to get started!</p>
            )}
          </div>

          {/* Timeline Visualization */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <FontAwesomeIcon icon={faTimeline} className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Goal Timeline</h3>
            </div>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-8 pl-8">
                {[...currentGoals, ...pastGoals]
                  .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                  .map((goal) => (
                    <div key={goal.id} className="relative">
                      <div className="absolute -left-[31px] p-1 bg-background border rounded-full">
                        {getStatusIcon(goal.status)}
                      </div>
                      <div className="bg-accent/10 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{goal.specificGoal}</p>
                            <p className="text-sm text-muted-foreground">{goal.type}</p>
                          </div>
                          <Badge variant={goal.status === "completed" ? "default" : "secondary"}>
                            {goal.status === "completed" ? "Achieved" : `${goal.progress}%`}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getTimelineLabel(goal)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Past Goals Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Past Goals</h3>
            {pastGoals.length > 0 ? (
              <div className="grid gap-4">
                {pastGoals.map((goal) => (
                  <div key={goal.id} className="border rounded-lg p-4 opacity-75">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                        <span className="font-medium">{goal.specificGoal}</span>
                      </div>
                      <Badge variant="outline">{goal.type}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Achieved {goal.target} {getTimelineLabel(goal)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No past goals yet.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
