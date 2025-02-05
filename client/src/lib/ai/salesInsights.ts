import { DealInsight, EmailAnalysis, SalesRecommendations } from "./types";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

interface DealInsight {
  score: number;
  confidence: number;
  recommendations: string[];
  nextBestActions: string[];
  riskFactors: string[];
}

export async function analyzeDealPotential(dealData: any): Promise<DealInsight> {
  try {
    const response = await fetch('/api/ai/analyze-deal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dealData)
    });

    if (!response.ok) {
      throw new Error('Failed to analyze deal');
    }

    return await response.json();
  } catch (error) {
    console.error("Error analyzing deal:", error);
    throw error;
  }
}

export interface EmailAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  suggestions: string[];
}

export async function analyzeEmailSentiment(emailContent: string): Promise<EmailAnalysis> {
  try {
    if (!process.env.VITE_OPENAI_API_KEY) {
      throw new Error("The OPENAI_API_KEY environment variable is missing");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Analyze the sentiment of this email content and provide suggestions for improvement. Return results in JSON format with sentiment (positive/neutral/negative), score (0-1), and array of suggestions."
        },
        {
          role: "user",
          content: emailContent
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    return JSON.parse(content) as EmailAnalysis;
  } catch (error) {
    console.error("Error analyzing email sentiment:", error);
    throw error;
  }
}

export interface SalesRecommendations {
  recommendations: string[];
  priorityActions: string[];
  opportunities: string[];
}

export async function getSalesRecommendations(salesData: any): Promise<SalesRecommendations> {
  try {
    const response = await fetch('/api/ai/sales-recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(salesData)
    });

    if (!response.ok) {
      throw new Error('Failed to get sales recommendations');
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting sales recommendations:", error);
    throw error;
  }
}