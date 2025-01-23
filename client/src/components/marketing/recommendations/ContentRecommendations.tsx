import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

type ContentRecommendation = {
  id: string;
  title: string;
  type: "subject_line" | "body" | "cta" | "visual";
  score: number;
  explanation: string;
  tags: string[];
};

// Mock recommendations - Replace with actual API data
const mockRecommendations: ContentRecommendation[] = [
  {
    id: "1",
    title: "Limited Time Offer: 24-Hour Flash Sale",
    type: "subject_line",
    score: 92,
    explanation: "High urgency subject lines have shown 35% better open rates with your audience",
    tags: ["urgency", "promotion", "time-sensitive"]
  },
  {
    id: "2",
    title: "Showcase product benefits through customer stories",
    type: "body",
    score: 88,
    explanation: "Testimonial-based content receives 40% more engagement",
    tags: ["social-proof", "storytelling", "customer-focused"]
  },
  {
    id: "3",
    title: "Shop Now with One-Click Checkout",
    type: "cta",
    score: 85,
    explanation: "Direct CTAs with convenience messaging improve conversion by 25%",
    tags: ["action", "convenience", "conversion-focused"]
  }
];

export function ContentRecommendations() {
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);

  const getTypeIcon = (type: ContentRecommendation["type"]): IconName => {
    switch (type) {
      case "subject_line":
        return "envelope";
      case "body":
        return "file-lines";
      case "cta":
        return "bullseye";
      case "visual":
        return "image";
      default:
        return "circle";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Content Recommendations</h2>
        <Button variant="outline">
          <FontAwesomeIcon
            icon={['fal' as IconPrefix, 'rotate' as IconName]}
            className="mr-2 h-4 w-4"
          />
          Refresh Suggestions
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          AI-powered recommendations based on your audience behavior, industry trends, and past campaign performance.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {mockRecommendations.map((rec) => (
          <Card
            key={rec.id}
            className={`cursor-pointer transition-colors ${
              selectedRecommendation === rec.id ? "border-primary" : ""
            }`}
            onClick={() => setSelectedRecommendation(rec.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-md font-medium flex items-center gap-2">
                <FontAwesomeIcon
                  icon={['fal' as IconPrefix, getTypeIcon(rec.type)]}
                  className="h-4 w-4"
                />
                {rec.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{rec.score}%</span>
                <Progress value={rec.score} className="w-[60px]" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{rec.explanation}</p>
              <div className="flex flex-wrap gap-2">
                {rec.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
