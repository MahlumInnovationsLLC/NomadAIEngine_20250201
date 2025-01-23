import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";

interface MessageConsistencyProps {
  activeChannels: string[];
}

type ConsistencyMetric = {
  channel: string;
  score: number;
  suggestions: string[];
};

const mockMetrics: ConsistencyMetric[] = [
  {
    channel: "email",
    score: 92,
    suggestions: [
      "Consider using more action-oriented CTAs",
      "Ensure brand voice matches social content"
    ]
  },
  {
    channel: "social",
    score: 85,
    suggestions: [
      "Align hashtag strategy across platforms",
      "Maintain consistent visual branding"
    ]
  },
  {
    channel: "push",
    score: 78,
    suggestions: [
      "Keep notification style consistent",
      "Use similar tone as other channels"
    ]
  }
];

export function MessageConsistency({ activeChannels }: MessageConsistencyProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Consistency Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <AlertDescription>
            AI-powered analysis of message consistency across your active channels. Higher scores indicate better alignment with your brand voice and campaign objectives.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {mockMetrics
            .filter(metric => activeChannels.includes(metric.channel))
            .map(metric => (
              <div key={metric.channel} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={['fal' as IconPrefix, 
                        metric.channel === "email" ? "envelope" :
                        metric.channel === "social" ? "share-nodes" :
                        "bell" as IconName
                      ]}
                      className="h-4 w-4"
                    />
                    <span className="font-medium">{metric.channel.charAt(0).toUpperCase() + metric.channel.slice(1)}</span>
                  </div>
                  <span className="text-sm font-medium">{metric.score}%</span>
                </div>
                <Progress value={metric.score} />
                <div className="bg-muted rounded-lg p-4 mt-2">
                  <h4 className="text-sm font-medium mb-2">Suggestions:</h4>
                  <ul className="text-sm space-y-1">
                    {metric.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={['fal' as IconPrefix, 'lightbulb' as IconName]}
                          className="h-4 w-4 text-yellow-500"
                        />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
