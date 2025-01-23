import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faMagicWandSparkles, faFilter, faChartPie, faSort, faSearch } from "@fortawesome/free-solid-svg-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CreateSegmentDialog } from "./CreateSegmentDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustomerSegment {
  id: number;
  name: string;
  description: string;
  totalCustomers: number;
  confidenceScore: number;
  isActive: boolean;
  aiGenerated: boolean;
  criteria?: {
    type: string;
    condition: string;
    value: string;
  }[];
}

export function CustomerSegmentation() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"totalCustomers" | "confidenceScore" | "name">("totalCustomers");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch customer segments
  const { data: segments = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/marketing/segments'] as const,
  });

  // Generate AI segments mutation
  const generateSegments = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      try {
        const response = await fetch('/api/marketing/segments/generate', {
          method: 'POST',
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
        description: "AI has successfully generated new customer segments.",
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
      return modifier * (Number(a[sortBy]) - Number(b[sortBy]));
    });

  function SegmentCard({ segment }: { segment: CustomerSegment }) {
    return (
      <Card>
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
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>AI Confidence Score</span>
              <span className="font-medium">
                {(segment.confidenceScore * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={segment.confidenceScore * 100} />
          </div>
          {segment.criteria && (
            <div className="mt-4 space-y-2">
              <Label className="text-sm font-medium">Segment Criteria:</Label>
              <div className="space-y-1">
                {segment.criteria.map((criterion, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    {criterion.type} {criterion.condition} {criterion.value}
                  </div>
                ))}
              </div>
            </div>
          )}
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
            onClick={() => generateSegments.mutate()}
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
    </div>
  );
}