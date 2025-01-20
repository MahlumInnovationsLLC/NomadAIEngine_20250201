import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Question {
  text: string;
  type: 'multiple_choice' | 'text';
  options?: string[];
  correctAnswer?: string;
}

interface Module {
  title: string;
  description: string;
  content: string;
  questions: Question[];
  dueDate: string;
}

export function CreateModuleDialog() {
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createModule = useMutation({
    mutationFn: async (module: Module) => {
      const response = await fetch('/api/training/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(module),
      });
      if (!response.ok) throw new Error('Failed to create module');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/training/current']);
      toast({
        title: 'Success',
        description: 'Training module created successfully',
      });
      setOpen(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create training module',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const module: Module = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      content: formData.get('content') as string,
      questions,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    createModule.mutate(module);
  };

  const addQuestion = (type: 'multiple_choice' | 'text') => {
    setQuestions([...questions, {
      text: '',
      type,
      options: type === 'multiple_choice' ? [''] : undefined,
      correctAnswer: '',
    }]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Module</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Training Module</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Module Title</Label>
              <Input id="title" name="title" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" name="content" required className="min-h-[200px]" />
            </div>

            <div className="space-y-4">
              <Label>Questions</Label>
              {questions.map((question, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-2">
                  <Input 
                    value={question.text}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index].text = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    placeholder="Question text"
                  />
                  {question.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {question.options?.map((option, optionIndex) => (
                        <Input
                          key={optionIndex}
                          value={option}
                          onChange={(e) => {
                            const newQuestions = [...questions];
                            if (newQuestions[index].options) {
                              newQuestions[index].options![optionIndex] = e.target.value;
                              setQuestions(newQuestions);
                            }
                          }}
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newQuestions = [...questions];
                          newQuestions[index].options?.push('');
                          setQuestions(newQuestions);
                        }}
                      >
                        Add Option
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addQuestion('text')}
                >
                  Add Text Question
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addQuestion('multiple_choice')}
                >
                  Add Multiple Choice
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Create Training Module
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
