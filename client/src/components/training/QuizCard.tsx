import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizCardProps {
  question: QuizQuestion;
  onAnswer: (correct: boolean) => void;
}

export function QuizCard({ question, onAnswer }: QuizCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === question.correctAnswer;
    setShowFeedback(true);
    onAnswer(isCorrect);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quiz Question</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-base font-medium">{question.question}</p>
        
        <RadioGroup
          onValueChange={(value) => setSelectedAnswer(parseInt(value))}
          disabled={showFeedback}
        >
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={index.toString()} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>

        {showFeedback && (
          <div className={`p-4 rounded-md ${
            selectedAnswer === question.correctAnswer 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {selectedAnswer === question.correctAnswer ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-700">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-700">Incorrect</span>
                </>
              )}
            </div>
            <p className="text-sm">{question.explanation}</p>
          </div>
        )}

        <Button 
          className="w-full" 
          onClick={handleSubmit}
          disabled={selectedAnswer === null || showFeedback}
        >
          Submit Answer
        </Button>
      </CardContent>
    </Card>
  );
}
