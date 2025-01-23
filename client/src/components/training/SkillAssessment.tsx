import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

interface Skill {
  id: number;
  name: string;
  description: string;
  category: string;
  level: number;
}

interface SkillGap {
  skill: Skill;
  required: number;
  current: number;
  gap: number;
  importance: 'critical' | 'important' | 'nice_to_have';
}

interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  skillId: number;
  difficulty: number;
}

export function SkillAssessment() {
  const [activeSkillId, setActiveSkillId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<{
    questionId: string;
    answer: number;
    responseTime: number;
  }>>([]);

  // Fetch skills and assessment data
  const { data: skillGaps } = useQuery<{
    skillGaps: SkillGap[];
    recommendedModules: any[];
    currentRole: any;
  }>({
    queryKey: ['/api/skills/assessment/current-user'],
  });

  // Start assessment mutation
  const startAssessment = useMutation({
    mutationFn: async (skillId: number) => {
      const response = await fetch(`/api/skills/assessment/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId }),
      });
      if (!response.ok) throw new Error('Failed to start assessment');
      return response.json();
    },
  });

  // Submit assessment mutation
  const submitAssessment = useMutation({
    mutationFn: async (data: {
      skillId: number;
      answers: typeof answers;
    }) => {
      const response = await fetch('/api/skills/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to submit assessment');
      return response.json();
    },
  });

  const handleStartAssessment = async (skillId: number) => {
    try {
      await startAssessment.mutateAsync(skillId);
      setActiveSkillId(skillId);
      setCurrentQuestionIndex(0);
      setAnswers([]);
    } catch (error) {
      console.error('Failed to start assessment:', error);
    }
  };

  const handleAnswerSubmit = (answer: number, startTime: number) => {
    if (!activeSkillId) return;

    const responseTime = Date.now() - startTime;
    setAnswers([...answers, {
      questionId: `q-${currentQuestionIndex}`,
      answer,
      responseTime,
    }]);

    if (currentQuestionIndex < 4) { // Assuming 5 questions per assessment
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      submitAssessment.mutate({
        skillId: activeSkillId,
        answers,
      });
      setActiveSkillId(null);
      setCurrentQuestionIndex(0);
    }
  };

  if (!skillGaps) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon="fa-brain" className="h-5 w-5" />
            Skill Gap Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="gaps" className="space-y-4">
            <TabsList>
              <TabsTrigger value="gaps">
                <FontAwesomeIcon icon="fa-chart-bar" className="h-4 w-4 mr-2" />
                Skill Gaps
              </TabsTrigger>
              <TabsTrigger value="recommendations">
                <FontAwesomeIcon icon="fa-lightbulb" className="h-4 w-4 mr-2" />
                Recommendations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gaps">
              <div className="space-y-4">
                {skillGaps.skillGaps.map((gap) => (
                  <Card key={gap.skill.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                          <h3 className="font-medium">{gap.skill.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {gap.skill.description}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleStartAssessment(gap.skill.id)}
                          disabled={activeSkillId !== null}
                        >
                          Start Assessment
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Current Level: {gap.current}</span>
                          <span>Required Level: {gap.required}</span>
                        </div>
                        <Progress
                          value={(gap.current / gap.required) * 100}
                          className="h-2"
                        />
                        <p className="text-sm text-muted-foreground">
                          Gap: {gap.gap} levels ({gap.importance})
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recommendations">
              <div className="space-y-4">
                {skillGaps.recommendedModules.map((module) => (
                  <Card key={module.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium">{module.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {module.description}
                          </p>
                        </div>
                        <Button variant="outline">Start Module</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {activeSkillId && (
        <Card>
          <CardHeader>
            <CardTitle>Skill Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Question {currentQuestionIndex + 1} of 5</span>
                <span>Time: 2:00</span>
              </div>

              {/* Placeholder for assessment questions */}
              <div className="p-6 border rounded-lg">
                <h3 className="text-lg font-medium mb-4">
                  Sample Question {currentQuestionIndex + 1}
                </h3>
                <div className="space-y-2">
                  {['A', 'B', 'C', 'D'].map((option, index) => (
                    <Button
                      key={option}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleAnswerSubmit(index, Date.now())}
                    >
                      {option}. Option {option}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}