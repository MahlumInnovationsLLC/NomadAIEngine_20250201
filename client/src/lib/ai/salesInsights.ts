import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI();

interface DealInsight {
  score: number;
  confidence: number;
  recommendations: string[];
  nextBestActions: string[];
  riskFactors: string[];
}

export async function analyzeDealPotential(dealData: any): Promise<DealInsight> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert sales analyst. Analyze the deal data and provide insights including score, confidence, recommendations, next best actions, and risk factors. Return the analysis in JSON format."
        },
        {
          role: "user",
          content: JSON.stringify(dealData)
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    return JSON.parse(content) as DealInsight;
  } catch (error) {
    console.error("Error analyzing deal:", error);
    throw new Error("Failed to analyze deal potential");
  }
}

export interface EmailAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  suggestions: string[];
}

export async function analyzeEmailSentiment(emailContent: string): Promise<EmailAnalysis> {
  try {
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
    throw new Error("Failed to analyze email sentiment");
  }
}

export interface SalesRecommendations {
  recommendations: string[];
  priorityActions: string[];
  opportunities: string[];
}

export async function getSalesRecommendations(salesData: any): Promise<SalesRecommendations> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "As a sales strategy expert, analyze the sales data and provide strategic recommendations, priority actions, and potential opportunities. Return in JSON format."
        },
        {
          role: "user",
          content: JSON.stringify(salesData)
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    return JSON.parse(content) as SalesRecommendations;
  } catch (error) {
    console.error("Error getting sales recommendations:", error);
    throw new Error("Failed to generate sales recommendations");
  }
}