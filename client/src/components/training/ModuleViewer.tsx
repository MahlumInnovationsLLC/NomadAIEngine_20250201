import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { LectureViewer } from "./LectureViewer";
import { QuizCard } from "./QuizCard";
import { useQuery, useMutation } from "@tanstack/react-query";

interface ModuleContent {
  id: string;
  title: string;
  description: string;
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

interface ModuleViewerProps {
  moduleId: string;
  onComplete: () => void;
}

export function ModuleViewer({ moduleId, onComplete }: ModuleViewerProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'labs' | 'assessment'>('content');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScores, setQuizScores] = useState<Record<string, boolean>>({});

  const { data: moduleContent } = useQuery<ModuleContent>({
    queryKey: [`/api/training/modules/${moduleId}`],
  });

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

    // Wait a bit before moving to next question
    setTimeout(() => {
      if (currentQuizIndex < moduleContent.assessment.quizzes.length - 1) {
        setCurrentQuizIndex(curr => curr + 1);
      } else {
        const allCorrect = Object.values(quizScores).every(score => score);
        if (allCorrect) {
          onComplete();
        }
      }
    }, 2000);
  };

  if (!moduleContent) return null;

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
          </TabsList>

          <TabsContent value="content" className="mt-4">
            <LectureViewer
              moduleId={moduleId}
              sections={moduleContent.sections}
              onComplete={(sectionId) => completeSectionMutation.mutate(sectionId)}
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
                <Badge variant="outline">Progress: {Math.round(quizProgress)}%</Badge>
              </div>

              {currentQuiz && (
                <QuizCard
                  question={currentQuiz}
                  onAnswer={handleQuizAnswer}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}