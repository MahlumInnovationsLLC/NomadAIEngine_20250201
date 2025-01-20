import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";
import { HelpBubble } from "@/components/ui/HelpBubble";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import * as React from "react";

interface SearchResult {
  document_id: number;
  document_title: string;
  section_text: string;
  similarity: number;
  document_type: string;
  last_modified: string;
}

interface SearchFilters {
  documentType: string;
  dateRange: string;
  minSimilarity: number;
}

export default function SearchInterface() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    documentType: 'all',
    dateRange: 'all',
    minSimilarity: 0.5,
  });
  const { toast } = useToast();

  const { data: results, refetch, isLoading } = useQuery<SearchResult[]>({
    queryKey: ['/api/search', searchQuery, filters],
    enabled: false,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }

    refetch();
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return "bg-green-500";
    if (similarity >= 0.6) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <HelpBubble 
              content={
                <div className="space-y-2">
                  <p>Our AI-powered semantic search understands the meaning behind your query.</p>
                  <p>It can find relevant content even if the exact words don't match.</p>
                </div>
              }
              side="top"
            >
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full"
              />
            </HelpBubble>
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <FontAwesomeIcon icon="filter" className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button onClick={handleSearch} disabled={isLoading}>
            <FontAwesomeIcon icon="search" className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Type</label>
                <Select
                  value={filters.documentType}
                  onValueChange={(value) => setFilters({ ...filters, documentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="manual">Manuals</SelectItem>
                    <SelectItem value="policy">Policies</SelectItem>
                    <SelectItem value="report">Reports</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="day">Last 24 Hours</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Similarity Score</label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[filters.minSimilarity]}
                  onValueChange={([value]) => setFilters({ ...filters, minSimilarity: value })}
                  min={0}
                  max={1}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-sm w-12 text-right">
                  {(filters.minSimilarity * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {results && results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FontAwesomeIcon icon="file-text" className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">{result.document_title}</h3>
                      <Badge 
                        variant="secondary"
                        className="ml-2"
                      >
                        {result.document_type}
                      </Badge>
                      <Badge 
                        className={`${getSimilarityColor(result.similarity)} text-white`}
                      >
                        {(result.similarity * 100).toFixed(0)}% Match
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {result.section_text.length > 200
                        ? result.section_text.slice(0, 200) + '...'
                        : result.section_text}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <FontAwesomeIcon icon="calendar" className="h-3 w-3" />
                      <span>
                        Modified: {new Date(result.last_modified).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    <FontAwesomeIcon icon="arrow-right" className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : results && results.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No results found for your search query.
        </p>
      ) : null}
    </div>
  );
}