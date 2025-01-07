import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, FileText, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HelpBubble } from "@/components/ui/HelpBubble";

interface SearchResult {
  document_id: number;
  document_title: string;
  section_text: string;
  similarity: number;
}

export default function SearchInterface() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const { data: results, refetch, isLoading } = useQuery<SearchResult[]>({
    queryKey: ['/api/search', searchQuery],
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

  return (
    <div className="space-y-6">
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
        <Button onClick={handleSearch} disabled={isLoading}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {results && results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">{result.document_title}</h3>
                      <HelpBubble 
                        content={`This result has a ${(result.similarity * 100).toFixed(1)}% similarity match to your query`}
                        side="right"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {result.section_text.length > 200
                        ? result.section_text.slice(0, 200) + '...'
                        : result.section_text}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    <ArrowRight className="h-4 w-4" />
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