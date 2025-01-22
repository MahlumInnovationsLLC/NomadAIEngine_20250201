export type ChatMode = 'chat' | 'web-search';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  citations?: string[];  // For web search results from Perplexity
  mode?: ChatMode;      // To track which mode generated this message
}

export interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  citations?: string[];
}