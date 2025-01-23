import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faMagicWandSparkles, faFilter, faChartPie, faSort, faSearch, faLightbulb, faArrowTrendUp, faTimes, faPercentage, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CreateSegmentDialog } from "./CreateSegmentDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MemberListDialog } from "./MemberListDialog";

interface CustomerSegment {
  id: number;
  name: string;
  description: string;
  totalCustomers: number;
  confidenceScore: number;
  isActive: boolean;
  aiGenerated: boolean;
  expectedGrowth?: number;
  predictedEngagement?: number;
  suggestedActions?: string[];
  insights?: string[];
  criteria?: {
    type: string;
    condition: string;
    value: string;
    confidence?: number;
    impact?: number;
  }[];
}

interface GenerateOptions {
  minConfidence: number;
  includePredictions: boolean;
  maxSegments: number;
  focusAreas: string[];
}

export function CustomerSegmentation() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"totalCustomers" | "confidenceScore" | "name" | "expectedGrowth">("totalCustomers");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showInsights, setShowInsights] = useState<number | null>(null);
  const [generateOptions, setGenerateOptions] = useState<GenerateOptions>({
    minConfidence: 0.7,
    includePredictions: true,
    maxSegments: 5,
    focusAreas: ["behavior", "value", "engagement"],
  });
  const [selectedSegment, setSelectedSegment] = useState<{id: number, name: string} | null>(null);

  // Fetch customer segments
  const { data: segments = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/marketing/segments'] as const,
  });

  // Generate AI segments mutation
  const generateSegments = useMutation({
    mutationFn: async (options: GenerateOptions) => {
      setIsGenerating(true);
      try {
        const response = await fetch('/api/marketing/segments/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
        });
        if (!response.ok) throw new Error('Failed to generate segments');
        return response.json();
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Segments Generated",
        description: "AI has successfully generated new customer segments with insights and predictions.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error Generating Segments",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter and sort segments
  const filteredAndSortedSegments = [...segments]
    .filter((segment: CustomerSegment) =>
      segment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      segment.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: CustomerSegment, b: CustomerSegment) => {
      const modifier = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "name") {
        return modifier * a.name.localeCompare(b.name);
      }
      if (sortBy === "expectedGrowth") {
        return modifier * ((a.expectedGrowth || 0) - (b.expectedGrowth || 0));
      }
      return modifier * (Number(a[sortBy]) - Number(b[sortBy]));
    });

  function SegmentCard({ segment }: { segment: CustomerSegment }) {
    const impact = segment.criteria?.reduce((acc, c) => acc + (c.impact || 0), 0) || 0;
    const avgImpact = impact / (segment.criteria?.length || 1);

    return (
      <Card className="relative hover:shadow-lg transition-shadow">
        {segment.aiGenerated && (
          <div className="absolute top-2 right-2">
            <div className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
              AI Generated
            </div>
          </div>
        )}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={segment.aiGenerated ? faMagicWandSparkles : faFilter}
              className={cn(
                "h-4 w-4",
                segment.aiGenerated ? "text-purple-500" : "text-blue-500"
              )}
            />
            <CardTitle className="text-sm font-medium">{segment.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FontAwesomeIcon icon={faUsers} className="h-4 w-4" />
            {segment.totalCustomers.toLocaleString()}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{segment.description}</p>

          {/* Growth and Engagement Predictions */}
          {segment.expectedGrowth !== undefined && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 bg-green-50 p-2 rounded-lg">
                <FontAwesomeIcon 
                  icon={faArrowTrendUp} 
                  className={cn(
                    "h-4 w-4",
                    segment.expectedGrowth > 0 ? "text-green-500" : "text-red-500"
                  )} 
                />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Expected Growth</span>
                  <span className="text-sm font-medium">
                    {segment.expectedGrowth > 0 ? "+" : ""}
                    {segment.expectedGrowth}%
                  </span>
                </div>
              </div>
              {segment.predictedEngagement !== undefined && (
                <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg">
                  <FontAwesomeIcon icon={faPercentage} className="h-4 w-4 text-blue-500" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Engagement</span>
                    <span className="text-sm font-medium">{segment.predictedEngagement}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>AI Confidence Score</span>
              <span className="font-medium">
                {(segment.confidenceScore * 100).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={segment.confidenceScore * 100} 
              className={cn(
                segment.confidenceScore >= 0.8 ? "bg-green-100" : 
                segment.confidenceScore >= 0.6 ? "bg-yellow-100" : "bg-red-100"
              )}
            />
          </div>

          {/* Segment Criteria with Confidence Levels */}
          {segment.criteria && (
            <div className="mt-4 space-y-2">
              <Label className="text-sm font-medium">Segment Criteria:</Label>
              <div className="space-y-2">
                {segment.criteria.map((criterion, index) => (
                  <div 
                    key={index} 
                    className="text-sm bg-gray-50 p-2 rounded-lg flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <FontAwesomeIcon 
                        icon={criterion.type === 'demographic' ? faUsers : faChartPie} 
                        className="h-3 w-3 text-muted-foreground" 
                      />
                      {criterion.type} {criterion.condition} {criterion.value}
                    </span>
                    {criterion.confidence && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {(criterion.confidence * 100).toFixed(0)}% confidence
                        </span>
                        {criterion.impact && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            {(criterion.impact * 100).toFixed(0)}% impact
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            {segment.insights && segment.insights.length > 0 && (
              <Button
                variant="ghost"
                className="flex-1 gap-2 hover:bg-purple-50"
                onClick={() => setShowInsights(segment.id)}
              >
                <FontAwesomeIcon icon={faLightbulb} className="h-4 w-4 text-yellow-500" />
                View AI Insights
              </Button>
            )}
            <Button
              variant="ghost"
              className="flex-1 gap-2 hover:bg-blue-50"
              onClick={() => setSelectedSegment({ id: segment.id, name: segment.name })}
            >
              <FontAwesomeIcon icon={faUserGroup} className="h-4 w-4 text-blue-500" />
              View Members
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer Segments</h2>
          <p className="text-muted-foreground">
            View and manage AI-powered customer segments for targeted campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <CreateSegmentDialog />
          <Button
            onClick={() => generateSegments.mutate(generateOptions)}
            disabled={isGenerating}
            className="gap-2"
          >
            <FontAwesomeIcon
              icon={faMagicWandSparkles}
              className={cn("h-4 w-4", isGenerating && "animate-spin")}
            />
            {isGenerating ? "Generating..." : "Generate AI Segments"}
          </Button>
        </div>
      </div>

      {/* Generation Options */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Minimum Confidence</Label>
            <Select 
              value={generateOptions.minConfidence.toString()} 
              onValueChange={(value) => setGenerateOptions(prev => ({
                ...prev,
                minConfidence: parseFloat(value)
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.6">60%</SelectItem>
                <SelectItem value="0.7">70%</SelectItem>
                <SelectItem value="0.8">80%</SelectItem>
                <SelectItem value="0.9">90%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Maximum Segments</Label>
            <Select
              value={generateOptions.maxSegments.toString()}
              onValueChange={(value) => setGenerateOptions(prev => ({
                ...prev,
                maxSegments: parseInt(value)
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Segments</SelectItem>
                <SelectItem value="5">5 Segments</SelectItem>
                <SelectItem value="7">7 Segments</SelectItem>
                <SelectItem value="10">10 Segments</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Include Predictions</Label>
            <Select
              value={generateOptions.includePredictions ? "yes" : "no"}
              onValueChange={(value) => setGenerateOptions(prev => ({
                ...prev,
                includePredictions: value === "yes"
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Focus Areas</Label>
            <Select
              value={generateOptions.focusAreas[0]}
              onValueChange={(value) => setGenerateOptions(prev => ({
                ...prev,
                focusAreas: [value, ...prev.focusAreas.slice(1)]
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="behavior">Customer Behavior</SelectItem>
                <SelectItem value="value">Customer Value</SelectItem>
                <SelectItem value="engagement">Engagement Level</SelectItem>
                <SelectItem value="lifecycle">Customer Lifecycle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search segments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="totalCustomers">Customer Count</SelectItem>
              <SelectItem value="confidenceScore">Confidence Score</SelectItem>
              <SelectItem value="expectedGrowth">Expected Growth</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
            className="w-10"
          >
            <FontAwesomeIcon
              icon={faSort}
              className={cn(
                "h-4 w-4 transition-transform",
                sortOrder === "desc" && "rotate-180"
              )}
            />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-[72px]" />
              <CardContent className="h-[120px]" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedSegments.map((segment: CustomerSegment) => (
            <SegmentCard key={segment.id} segment={segment} />
          ))}
        </div>
      )}

      {/* AI Insights Dialog */}
      <AlertDialog open={showInsights !== null} onOpenChange={() => setShowInsights(null)}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => setShowInsights(null)}
            >
              <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
            </Button>
            <AlertDialogTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faLightbulb} className="h-5 w-5 text-yellow-500" />
              AI-Generated Insights
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 mt-4">
              {segments.find((s: CustomerSegment) => s.id === showInsights)?.insights?.map((insight, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FontAwesomeIcon 
                    icon={faLightbulb} 
                    className="h-4 w-4 text-yellow-500 mt-1 shrink-0" 
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{insight}</p>
                    {segments.find((s: CustomerSegment) => s.id === showInsights)?.suggestedActions?.[index] && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Suggested Action: {segments.find((s: CustomerSegment) => s.id === showInsights)?.suggestedActions?.[index]}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 gap-2 hover:bg-blue-50"
                      onClick={() => {
                        const segment = segments.find((s: CustomerSegment) => s.id === showInsights);
                        if (segment) {
                          setSelectedSegment({ id: segment.id, name: segment.name });
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faUserGroup} className="h-3 w-3 text-blue-500" />
                      View Affected Members
                    </Button>
                  </div>
                </div>
              ))}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      {/* Member List Dialog */}
      <MemberListDialog
        open={selectedSegment !== null}
        onClose={() => setSelectedSegment(null)}
        segmentId={selectedSegment?.id ?? null}
        segmentName={selectedSegment?.name ?? ""}
      />
    </div>
  );
}