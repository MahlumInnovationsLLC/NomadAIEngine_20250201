import { z } from "zod";

export const quizQuestionSchema = z.object({
  id: z.number(),
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
  explanation: z.string().optional(),
});

export const moduleContentSchema = z.object({
  id: z.number(),
  type: z.enum(['text', 'video', 'quiz']),
  title: z.string(),
  content: z.string(),
  quiz: z.array(quizQuestionSchema).optional(),
  order: z.number(),
});

export const learningModuleSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  prerequisites: z.array(z.number()),
  content: z.array(moduleContentSchema),
  progress: z.number(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  dueDate: z.string(),
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type ModuleContent = z.infer<typeof moduleContentSchema>;
export type LearningModule = z.infer<typeof learningModuleSchema>;
