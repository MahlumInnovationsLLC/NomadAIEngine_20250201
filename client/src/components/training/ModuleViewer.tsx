import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { LectureViewer } from "./LectureViewer";
import { QuizCard } from "./QuizCard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ModuleContent {
  id: string;
  title: string;
  description: string;
  prerequisites: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  sections: Array<{
    id: string;
    title: string;
    content: Array<{
      id: string;
      title: string;
      content: string;
      type: 'text' | 'diagram' | 'code' | 'video';
      mediaUrl?: string;
      order: number;
    }>;
    order: number;
  }>;
  assessment: {
    quizzes: Array<{
      id: string;
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>;
    handsonLabs: Array<{
      id: string;
      title: string;
      description: string;
      tasks: Array<{
        id: string;
        description: string;
        verificationCriteria: string;
      }>;
    }>;
  };
}

interface Note {
  id: string;
  content: string;
  sectionId: string;
  createdAt: string;
}

interface ModuleViewerProps {
  moduleId: string;
  onComplete: () => void;
}

export function ModuleViewer({ moduleId, onComplete }: ModuleViewerProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'labs' | 'assessment' | 'notes'>('content');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScores, setQuizScores] = useState<Record<string, boolean>>({});
  const [currentNote, setCurrentNote] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: moduleContent } = useQuery<ModuleContent>({
    queryKey: [`/api/training/modules/${moduleId}`],
  });

  const { data: notes } = useQuery<Note[]>({
    queryKey: [`/api/training/modules/${moduleId}/notes`],
  });

  const hasPrerequisites = moduleContent?.prerequisites.every(p => p.completed) ?? true;

  const saveNoteMutation = useMutation({
    mutationFn: async (note: { content: string; sectionId: string }) => {
      const response = await fetch(`/api/training/modules/${moduleId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
      if (!response.ok) throw new Error('Failed to save note');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Note saved",
        description: "Your note has been saved successfully.",
      });
      setCurrentNote("");
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const response = await fetch(`/api/training/modules/${moduleId}/sections/${sectionId}/bookmark`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to bookmark section');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Section bookmarked",
        description: "You can find this section in your bookmarks.",
      });
    },
  });

  const handleSaveNote = () => {
    if (!selectedSectionId || !currentNote.trim()) return;
    saveNoteMutation.mutate({ content: currentNote, sectionId: selectedSectionId });
  };

  const handleBookmarkSection = (sectionId: string) => {
    bookmarkMutation.mutate(sectionId);
  };

  const completeSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const response = await fetch(`/api/training/modules/${moduleId}/sections/${sectionId}/complete`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to mark section as complete');
      return response.json();
    },
  });

  const handleQuizAnswer = (correct: boolean) => {
    if (!moduleContent) return;

    const currentQuiz = moduleContent.assessment.quizzes[currentQuizIndex];
    setQuizScores(prev => ({ ...prev, [currentQuiz.id]: correct }));

    setTimeout(() => {
      if (currentQuizIndex < moduleContent.assessment.quizzes.length - 1) {
        setCurrentQuizIndex(curr => curr + 1);
      } else if (Object.values(quizScores).every(score => score)) {
        onComplete();
      }
    }, 1500);
  };


  if (!moduleContent) return null;

  if (!hasPrerequisites) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Prerequisites Required</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Please complete the following modules first:</p>
            <ul className="list-disc list-inside">
              {moduleContent.prerequisites.map(prereq => (
                <li key={prereq.id} className={prereq.completed ? "text-green-500" : "text-red-500"}>
                  {prereq.title} {prereq.completed && "✓"}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuiz = moduleContent.assessment.quizzes[currentQuizIndex];
  const quizProgress = ((currentQuizIndex + 1) / moduleContent.assessment.quizzes.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{moduleContent.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList>
            <TabsTrigger value="content">
              <FontAwesomeIcon icon="book" className="h-4 w-4 mr-2" />
              Learning Content
            </TabsTrigger>
            <TabsTrigger value="labs">
              <FontAwesomeIcon icon="microscope" className="h-4 w-4 mr-2" />
              Hands-on Labs
            </TabsTrigger>
            <TabsTrigger value="assessment">
              <FontAwesomeIcon icon="brain" className="h-4 w-4 mr-2" />
              Assessment
            </TabsTrigger>
            <TabsTrigger value="notes">
              <FontAwesomeIcon icon="note-sticky" className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-4">
            <LectureViewer
              moduleId={moduleId}
              sections={moduleContent.sections}
              onComplete={(sectionId) => {
                setSelectedSectionId(sectionId);
                completeSectionMutation.mutate(sectionId);
              }}
              onBookmark={handleBookmarkSection}
              onNext={() => setActiveTab('labs')}
            />
          </TabsContent>

          <TabsContent value="labs" className="mt-4">
            <div className="space-y-6">
              {moduleContent.assessment.handsonLabs.map((lab) => (
                <Card key={lab.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{lab.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{lab.description}</p>
                    <div className="space-y-4">
                      {lab.tasks.map((task, index) => (
                        <div key={task.id} className="flex items-start gap-4">
                          <Badge variant="outline">{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{task.description}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Verification: {task.verificationCriteria}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab('assessment')}>
                  Proceed to Assessment
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assessment" className="mt-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Question {currentQuizIndex + 1} of {moduleContent.assessment.quizzes.length}
                </h3>
                <Badge variant="outline">
                  Progress: {Math.round((currentQuizIndex + 1) / moduleContent.assessment.quizzes.length * 100)}%
                </Badge>
              </div>

              {moduleContent.assessment.quizzes[currentQuizIndex] && (
                <QuizCard
                  question={moduleContent.assessment.quizzes[currentQuizIndex]}
                  onAnswer={(correct) => {
                    setQuizScores(prev => ({
                      ...prev,
                      [moduleContent.assessment.quizzes[currentQuizIndex].id]: correct
                    }));
                    setTimeout(() => {
                      if (currentQuizIndex < moduleContent.assessment.quizzes.length - 1) {
                        setCurrentQuizIndex(curr => curr + 1);
                      } else if (Object.values(quizScores).every(score => score)) {
                        onComplete();
                      }
                    }, 1500);
                  }}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Take Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Write your notes here..."
                      value={currentNote}
                      onChange={(e) => setCurrentNote(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button
                      onClick={handleSaveNote}
                      disabled={!selectedSectionId || !currentNote.trim()}
                    >
                      Save Note
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="font-medium">Your Notes</h3>
                {notes?.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="pt-4">
                      <p className="whitespace-pre-wrap">{note.content}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}