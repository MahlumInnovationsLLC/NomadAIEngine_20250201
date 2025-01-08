import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface LectureContent {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'diagram' | 'code' | 'video';
  mediaUrl?: string;
  order: number;
}

interface Section {
  id: string;
  title: string;
  content: LectureContent[];
  order: number;
}

interface LectureViewerProps {
  moduleId: string;
  sections: Section[];
  onComplete: (sectionId: string) => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function LectureViewer({ moduleId, sections, onComplete, onNext, onPrevious }: LectureViewerProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);

  const currentSection = sections[currentSectionIndex];
  const currentContent = currentSection?.content[currentContentIndex];
  const isLastContent = currentContentIndex === currentSection?.content.length - 1;
  const isLastSection = currentSectionIndex === sections.length - 1;

  const handleNext = () => {
    if (isLastContent) {
      if (!isLastSection) {
        setCurrentSectionIndex(currentSectionIndex + 1);
        setCurrentContentIndex(0);
      } else {
        onComplete(currentSection.id);
        onNext?.();
      }
    } else {
      setCurrentContentIndex(currentContentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentContentIndex === 0) {
      if (currentSectionIndex > 0) {
        setCurrentSectionIndex(currentSectionIndex - 1);
        setCurrentContentIndex(sections[currentSectionIndex - 1].content.length - 1);
      } else {
        onPrevious?.();
      }
    } else {
      setCurrentContentIndex(currentContentIndex - 1);
    }
  };

  if (!currentSection || !currentContent) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="outline" className="mb-2">
              Section {currentSectionIndex + 1} of {sections.length}
            </Badge>
            <CardTitle>{currentSection.title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{currentContent.title}</h3>
            
            {currentContent.type === 'text' && (
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: currentContent.content }} />
            )}
            
            {currentContent.type === 'diagram' && currentContent.mediaUrl && (
              <div className="flex justify-center">
                <img 
                  src={currentContent.mediaUrl} 
                  alt={currentContent.title}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            )}
            
            {currentContent.type === 'code' && (
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                <code>{currentContent.content}</code>
              </pre>
            )}
            
            {currentContent.type === 'video' && currentContent.mediaUrl && (
              <div className="aspect-video">
                <iframe
                  src={currentContent.mediaUrl}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSectionIndex === 0 && currentContentIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <Button onClick={handleNext}>
            {isLastContent && isLastSection ? 'Complete Section' : 'Next'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
