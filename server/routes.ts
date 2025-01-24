import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { CosmosClient, Container } from "@azure/cosmos";
import { ContainerClient } from "@azure/storage-blob";
import multer from "multer";
import { v4 as uuidv4 } from 'uuid';
import supportRouter from "./routes/support";
import { db } from "@db";
import {
  documentWorkflows,
  documentApprovals,
  documentPermissions,
  roles,
  userTraining,
  aiEngineActivity,
  trainingModules,
  notifications,
  userNotifications,
  documents,
  documentCollaborators,
  integrationConfigs,
  marketingEvents,
  workoutLogs,
  workoutSetLogs,
} from "@db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { WebSocketServer, WebSocket } from "ws";
import { generateReport } from "./services/document-generator";
import { listChats } from "./services/azure/cosmos_service";
import { analyzeDocument, checkOpenAIConnection } from "./services/azure/openai_service";
import type { Request, Response } from "express";
import { getStorageMetrics, getRecentActivity } from "./services/azure/blob_service";
import adminRouter from "./routes/admin";
import { sendApprovalRequestEmail } from './services/email';
import { drizzle } from "drizzle-orm/neon-serverless";
import { generateHealthReport } from "./services/health-report-generator";
import { initializeMemberStorage, searchMembers, updateMemberData } from "./services/memberStorage"; // Import updateMemberData

// Types
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

interface PerplexityResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  citations?: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  mode?: 'chat' | 'web-search';
  citations?: string[];
}

interface Equipment {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  yearManufactured: number;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  status: 'active' | 'maintenance' | 'retired';
}

interface EquipmentType {
  id: string;
  manufacturer: string;
  model: string;
  type: string;
}

interface MemberMetrics {
  height: number;
  weight: number;
  bodyFat?: number;
  goals: string[];
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  medicalConditions?: string[];
  preferredWorkoutTypes?: string[];
  workoutHistory?: {
    date: string;
    type: string;
    duration: number;
    intensity: string;
  }[];
}

// Initialize Azure Blob Storage Client with SAS token
const sasUrl = process.env.AZURE_STORAGE_SAS_URL || "https://gymaidata.blob.core.windows.net/documents?sp=racwdli&st=2025-01-09T20:30:31Z&se=2026-01-02T04:30:31Z&spr=https&sv=2022-11-02&sr=c&sig=eCSIm%2B%2FjBLs2DjKlHicKtZGxVWIPihiFoRmld2UbpIE%3D";

if (!sasUrl) {
  throw new Error("Azure Blob Storage SAS URL not found");
}

let containerClient: ContainerClient;
let equipmentContainer: Container;
let equipmentTypeContainer: Container;

// Helper Functions
async function initializeContainers() {
  const { database } = await import("./services/azure/cosmos_service");
  if (!database) {
    throw new Error("Failed to initialize database");
  }
  equipmentContainer = database.container('equipment');
  equipmentTypeContainer = database.container('equipment-types');
}

async function searchWithPerplexity(content: string): Promise<PerplexityResponse> {
  if (!process.env.PERPLEXITY_API_KEY) {
    console.error("Perplexity API key missing");
    throw new Error("Perplexity API key not found in environment variables");
  }

  try {
    console.log("Making request to Perplexity API with content:", content);
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that provides factual answers based on web search results. Be precise and concise."
          },
          {
            role: "user",
            content
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        stream: false
      })
    });

    console.log("Perplexity API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error response:", errorText);
      throw new Error(`Perplexity API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Perplexity API response data:", JSON.stringify(data, null, 2));

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No choices returned from Perplexity API");
    }

    return {
      choices: data.choices,
      citations: data.citations || []
    };
  } catch (error) {
    console.error("Error in searchWithPerplexity:", error);
    throw new Error(`Failed to get web search results: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function trackAIEngineUsage(userId: string, feature: "chat" | "web_search" | "document_analysis" | "equipment_prediction" | "report_generation", durationMinutes: number, metadata?: Record<string, any>) {
  try {
    await db
      .insert(aiEngineActivity)
      .values({
        userId,
        sessionId: uuidv4(),
        feature,
        startTime: new Date(),
        endTime: new Date(Date.now() + durationMinutes * 60000),
        durationMinutes,
        metadata: metadata || {}
      });
  } catch (error) {
    console.warn("Failed to track AI usage:", error);
  }
}

async function getUserTrainingLevel(userId: string) {
  const trainings = await db
    .select()
    .from(userTraining)
    .where(eq(userTraining.userId, userId));

  const completedModules = trainings.filter(t => t.status === 'completed').length;
  return Math.floor(completedModules / 3) + 1;
}

// Equipment Type Operations
async function getEquipmentType(manufacturer: string, model: string): Promise<EquipmentType | null> {
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.manufacturer = @manufacturer AND c.model = @model",
      parameters: [
        { name: "@manufacturer", value: manufacturer },
        { name: "@model", value: model }
      ]
    };

    const { resources } = await equipmentTypeContainer.items.query(querySpec).fetchAll();
    return resources[0] || null;
  } catch (error) {
    console.error("Error fetching equipment type:", error);
    return null;
  }
}

async function createEquipmentType(data: Partial<EquipmentType>): Promise<EquipmentType> {
  const newType: EquipmentType = {
    id: uuidv4(),
    manufacturer: data.manufacturer || '',
    model: data.model || '',
    type: data.type || ''
  };

  const { resource } = await equipmentTypeContainer.items.create(newType);
  if (!resource) {
    throw new Error("Failed to create equipment type");
  }
  return resource;
}

// Equipment Operations
async function getAllEquipment(): Promise<Equipment[]> {
  try {
    const querySpec = {
      query: "SELECT * FROM c"
    };

    const { resources } = await equipmentContainer.items.query(querySpec).fetchAll();
    return resources;
  } catch (error) {
    console.error("Error fetching all equipment:", error);
    return [];
  }
}

async function createEquipment(data: Partial<Equipment>): Promise<Equipment> {
  const newEquipment: Equipment = {
    id: uuidv4(),
    name: data.name || '',
    type: data.type || '',
    manufacturer: data.manufacturer || '',
    model: data.model || '',
    serialNumber: data.serialNumber || '',
    yearManufactured: data.yearManufactured || new Date().getFullYear(),
    lastMaintenanceDate: data.lastMaintenanceDate,
    nextMaintenanceDate: data.nextMaintenanceDate,
    status: data.status || 'active'
  };

  const { resource } = await equipmentContainer.items.create(newEquipment);
  if (!resource) {
    throw new Error("Failed to create equipment");
  }
  return resource;
}

async function updateEquipment(id: string, updates: Partial<Equipment>): Promise<Equipment | null> {
  try {
    const { resource: existingItem } = await equipmentContainer.item(id, id).read();
    const updatedItem = { ...existingItem, ...updates };
    const { resource } = await equipmentContainer.item(id, id).replace(updatedItem);
    return resource;
  } catch (error) {
    console.error("Error updating equipment:", error);
    return null;
  }
}

async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    readableStream.on('data', (data) => {
      chunks.push(data);
    });
    readableStream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer.toString());
    });
    readableStream.on('error', reject);
  });
}

// Add this helper function after streamToString
function cleanJsonResponse(response: string): string {
  // Remove markdown code blocks if present
  let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  return cleaned;
}


// Default member metrics for fallback
const defaultMemberMetrics: MemberMetrics = {
  height: 175, // cm
  weight: 75, // kg
  fitnessLevel: 'intermediate',
  goals: ['strength', 'muscle gain'],
  preferredWorkoutTypes: ['strength training', 'hiit'],
  medicalConditions: []
};

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    console.log("Creating Container Client with SAS token...");
    containerClient = new ContainerClient(sasUrl);
    console.log("Successfully created Container Client");

    // Initialize Azure Blob Storage for member data
    await initializeMemberStorage();
    console.log("Member storage initialized successfully");

    // Configure multer for memory storage
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      }
    });

    // Initialize the HTTP server
    const httpServer = createServer(app);
    const wsServer = setupWebSocketServer(httpServer, app); // Pass app to setupWebSocketServer

    // Add user authentication middleware
    app.use((req: AuthenticatedRequest, res, next) => {
      req.user = { id: '1', username: 'test_user' };
      next();
    });

    // Register API routes with proper prefixes
    app.use('/api/support', supportRouter);
    app.use('/api/admin', adminRouter);


    // Workout Plans endpoints
    app.get("/api/workout-plans/:memberId", async (req, res) => {
      try {
        const { memberId } = req.params;
        console.log(`Fetching workout plan for member ${memberId}`);

        // In a real implementation, fetch from database
        // For now, return a sample workout plan
        const workoutPlan = {
          id: memberId,
          name: "Personalized Strength Program",
          type: "Strength Training",
          difficulty: "intermediate",
          duration: "45 minutes",
          caloriesBurn: 350,
          userProgress: 35,
          exercises: [
            {
              id: "e1",
              name: "Bodyweight Squats",
              type: "strength",
              difficulty: "beginner",
              targetMuscles: ["quadriceps", "hamstrings", "glutes"],
              sets: 3,
              reps: 12,
              restPeriod: "60 seconds",
              formGuidance: [
                "Stand with feet shoulder-width apart",
                "Keep your back straight",
                "Lower your body as if sitting back into a chair",
                "Keep your knees aligned with your toes"
              ],
              commonMistakes: [
                "Letting knees cave inward",
                "Rounding the back",
                "Not going deep enough"
              ]
            }
          ],
          aiInsights: [
            "Form improving steadily on squats",
            "Consider adding more weight to challenge yourself",
            "Recovery metrics indicate readiness for increased intensity"
          ]
        };

        res.json(workoutPlan);
      } catch (error) {
        console.error("Error fetching workout plan:", error);
        res.status(500).json({ error: "Failed to fetch workout plan" });
      }
    });

    app.post("/api/workout-plans/:memberId/generate", async (req, res) => {
      try {
        const { memberId } = req.params;
        console.log(`Generating AI workout plan for member ${memberId}`);

        // 1. Try to fetch member metrics, use default if not found
        let memberMetrics: MemberMetrics = defaultMemberMetrics;
        const memberDataPath = `members/${memberId}/metrics.json`;
        const blockBlobClient = containerClient.getBlockBlobClient(memberDataPath);

        try {
          const downloadResponse = await blockBlobClient.download(0);
          const metrics = await streamToString(downloadResponse.readableStreamBody!);
          memberMetrics = JSON.parse(metrics);
          console.log("Successfully loaded member metrics:", memberMetrics);
        } catch (error) {
          console.log("Using default member metrics due to error:", error);
          // Initialize member metrics in blob storage for future use
          await blockBlobClient.upload(
            JSON.stringify(defaultMemberMetrics, null, 2),
            Buffer.byteLength(JSON.stringify(defaultMemberMetrics))
          );
        }

        // 2. Generate workout plan using Azure OpenAI
        const prompt = `
        Return a JSON object (without markdown formatting) for a personalized workout plan based on the following member profile:
        - Fitness Level: ${memberMetrics.fitnessLevel}
        - Goals: ${memberMetrics.goals.join(', ')}
        - Preferred Workout Types: ${memberMetrics.preferredWorkoutTypes?.join(', ') || 'Any'}
        ${memberMetrics.medicalConditions?.length ? `- Medical Considerations: ${memberMetrics.medicalConditions.join(', ')}` : ''}

        The response should exactly match this structure:
        {
          "id": "generated-[unique-id]",
          "name": "[Descriptive name based on goals]",
          "type": "[Main workout type]",
          "difficulty": "${memberMetrics.fitnessLevel}",
          "duration": "[Duration in minutes]",
          "caloriesBurn": [Estimated calories],
          "userProgress": 0,
          "exercises": [
            {
              "id": "e1",
              "name": "[Exercise name]",
              "type": "strength|cardio|flexibility",
              "difficulty": "${memberMetrics.fitnessLevel}",
              "targetMuscles": ["muscle1", "muscle2"],
              "sets": [number],
              "reps": [number],
              "restPeriod": "[rest in seconds]",
              "formGuidance": ["step1", "step2"],
              "commonMistakes": ["mistake1", "mistake2"]
            }
          ],
          "aiInsights": [
            "[Insight 1 about progression]",
            "[Insight 2 about form]",
            "[Insight 3 about recovery]"
          ]
        }`;

        console.log("Sending prompt to OpenAI:", prompt);
        const completion = await analyzeDocument(prompt);
        console.log("Raw OpenAI response:", completion);

        let workoutPlan;
        try {
          // Clean up the response before parsing
          const cleanedResponse = cleanJsonResponse(completion);
          console.log("Cleaned response:", cleanedResponse);
          workoutPlan = JSON.parse(cleanedResponse);
          console.log("Successfully parsed workout plan:", workoutPlan);
        } catch (error) {
          console.error("Error parsing OpenAI response:", error);
          throw new Error("Failed to generate valid workout plan format");
        }

        // 3. Save the generated plan to Azure Blob Storage
        const planPath = `members/${memberId}/workout-plans/latest.json`;
        const planBlobClient = containerClient.getBlockBlobClient(planPath);
        await planBlobClient.upload(
          JSON.stringify(workoutPlan, null, 2),
          Buffer.byteLength(JSON.stringify(workoutPlan))
        );

        // 4. Return the generated plan
        res.json(workoutPlan);
      } catch (error) {
        console.error("Error generating workout plan:", error);
        res.status(500).json({
          error: "Failed to generate workout plan",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Wearable device endpoints
    app.get("/api/wearable-data/:memberId", async (req, res) => {
      try {
        const { memberId } = req.params;
        console.log(`Fetching wearable data for member ${memberId}`);

        // In a real implementation, fetch from wearable device API
        const wearableData = {
          connected: false,
          lastSync: null,
          provider: null,
          workouts: []
        };

        res.json(wearableData);
      } catch (error) {
        console.error("Error fetching wearable data:", error);
        res.status(500).json({ error: "Failed to fetch wearable data" });
      }
    });

    app.post("/api/wearable-data/:memberId/connect", async (req, res) => {
      try {
        const { memberId } = req.params;
        console.log(`Initiating Apple Health connection for member ${memberId}`);

        // This would typically initiate OAuth flow with Apple Health
        // For now, simulate successful connection
        const connectionData = {
          connected: true,
          provider: 'apple_health',
          lastSync: new Date().toISOString(),
          workouts: [
            {
              date: new Date().toISOString(),
              type: "Strength Training",
              duration: 45,
              calories: 320,
              heartRate: {
                avg: 135,
                max: 165
              }
            }
          ]
        };

        res.json(connectionData);
      } catch (error) {
        console.error("Error connecting wearable device:", error);
        res.status(500).json({ error: "Failed to connect wearable device" });
      }
    });

    app.post("/api/wearable-data/:memberId/sync", async (req, res) => {
      try {
        const { memberId } = req.params;
        console.log(`Syncing wearable data for member ${memberId}`);

        // This would typically fetch latest data from Apple Health
        // For now, return sample sync data
        const syncData = {
          connected: true,
          provider: 'apple_health',
          lastSync: new Date().toISOString(),
          workouts: [
            {
              date: new Date().toISOString(),
              type: "Strength Training",
              duration: 45,
              calories: 320,
              heartRate: {
                avg: 135,
                max: 165
              }
            },
            {
              date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              type: "Running",
              duration: 30,
              calories: 280,
              heartRate: {
                avg: 145,
                max: 175
              },
              distance: 4.2
            }
          ]
        };

        res.json(syncData);
      } catch (error) {
        console.error("Error syncing wearable data:", error);
        res.status(500).json({ error: "Failed to sync wearable data" });
      }
    });

    // Workout logging endpoints
    app.post("/api/workout-logs", async (req, res) => {
      try {
        const { memberId, workoutPlanId } = req.body;
        console.log(`Creating new workout log for member ${memberId}`);

        const [workoutLog] = await db
          .insert(workoutLogs)
          .values({
            memberId: parseInt(memberId),
            workoutPlanId,
            status: 'in_progress',
            startTime: new Date(),
          })
          .returning();

        res.json(workoutLog);
      } catch (error) {
        console.error("Error creating workout log:", error);
        res.status(500).json({ error: "Failed to create workout log" });
      }
    });

    app.post("/api/workout-logs/:logId/sets", async (req, res) => {
      try {
        const { logId } = req.params;
        const { exerciseId, weight, reps, difficultyRating } = req.body;
        console.log(`Logging set for workout ${logId}, exercise ${exerciseId}`);

        // Get the current set number for this exercise
        const existingSets = await db
          .select({ count: sql<number>`count(*)` })
          .from(workoutSetLogs)
          .where(eq(workoutSetLogs.workoutLogId, parseInt(logId)))
          .where(eq(workoutSetLogs.exerciseId, exerciseId));

        const setNumber = (existingSets[0]?.count || 0) + 1;

        const [setLog] = await db
          .insert(workoutSetLogs)
          .values({
            workoutLogId: parseInt(logId),
            exerciseId,
            setNumber,
            weight: weight ? parseFloat(weight.toString()) : null,
            reps,
            difficultyRating,
          })
          .returning();

        res.json(setLog);
      } catch (error) {
        console.error("Error logging set:", error);
        res.status(500).json({ error: "Failed to log set" });
      }
    });

    app.patch("/api/workout-logs/:logId", async (req, res) => {
      try {
        const { logId } = req.params;
        const { status } = req.body;
        console.log(`Updating workout log ${logId} status to ${status}`);

        // Update the workout log
        const [updatedLog] = await db
          .update(workoutLogs)
          .set({
            status,
            endTime: status === 'completed' ? new Date() : undefined,
            updatedAt: new Date(),
          })
          .where(eq(workoutLogs.id, parseInt(logId)))
          .returning();

        if (!updatedLog) {
          return res.status(404).json({ error: "Workout log not found" });
        }

        // If completing the workout, calculate total calories burned
        if (status === 'completed') {
          const setLogs = await db
            .select()
            .from(workoutSetLogs)
            .where(eq(workoutSetLogs.workoutLogId, parseInt(logId)));

          // A simple calorie calculation based on number of sets and reps
          // In a real app, this would be more sophisticated
          const estimatedCalories = setLogs.reduce((total, set) => {
            return total + (set.reps * 5); // Very basic calculation
          }, 0);

          await db
            .update(workoutLogs)
            .set({ totalCaloriesBurned: estimatedCalories })
            .where(eq(workoutLogs.id, parseInt(logId)));

          updatedLog.totalCaloriesBurned = estimatedCalories;
        }

        res.json(updatedLog);
      } catch (error) {
        console.error("Error updating workout log:", error);
        res.status(500).json({ error: "Failed to update workout log" });
      }
    });


    // Add uploads directory for serving generated files
    app.use('/uploads', express.static('uploads'));

    // Messages endpoint
    app.post("/api/messages", async (req, res) => {
      console.log("Received message request:", req.body);
      try {
        const { content, mode = 'chat' } = req.body;

        if (!content) {
          console.log("Missing content in request");
          return res.status(400).json({ error: "Content is required" });
        }

        // Generate user message
        const userMessage: Message = {
          id: uuidv4(),
          role: 'user',
          content,
          createdAt: new Date().toISOString(),
          mode
        };

        let aiResponse: string | undefined;
        let citations: string[] | undefined;

        if (mode === 'web-search') {
          try {
            console.log("Starting web search with content:", content);
            const perplexityResponse = await searchWithPerplexity(content);
            console.log("Web search response received:", perplexityResponse);

            if (perplexityResponse.choices && perplexityResponse.choices.length > 0) {
              aiResponse = perplexityResponse.choices[0]?.message?.content;
              citations = perplexityResponse.citations;
              console.log("Extracted response:", { aiResponse, citations });
            } else {
              throw new Error("No response content received from Perplexity");
            }

            await trackAIEngineUsage(req.user?.id || 'anonymous', 'web_search', 1, { messageLength: content.length });
          } catch (error) {
            console.error("Error in web search mode:", error);
            throw error;
          }
        } else {
          try {
            console.log("Starting chat mode with content:", content);
            aiResponse = await analyzeDocument(content);
            await trackAIEngineUsage(req.user?.id || 'anonymous', 'chat', 0.5, { messageLength: content.length });
          } catch (error) {
            console.error("Error in chat mode:", error);
            throw error;
          }
        }

        // Create AI message
        const aiMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: aiResponse || "I apologize, but I'm having trouble understanding your request. Could you please rephrase it?",
          createdAt: new Date().toISOString(),
          mode,
          citations
        };

        console.log("Returning messages:", [userMessage, aiMessage]);
        res.json([userMessage, aiMessage]);
      } catch (error) {
        console.error("Error processing message:", error);
        res.status(500).json({
          error: "Failed to process message",
          details: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Update online users endpoint
    app.get("/api/users/online-status", (req, res) => {
      const activeUsers = wsServer.getActiveUsers();
      res.json(activeUsers);
    });

    // Equipment Types endpoints
    app.post("/api/equipment-types", async (req, res) => {
      try {
        const type = req.body;
        const existingType = await getEquipmentType(type.manufacturer, type.model);

        if (existingType) {
          return res.json(existingType);
        }

        const newType = await createEquipmentType(type);
        res.json(newType);
      } catch (error) {
        console.error("Error creating equipment type:", error);
        res.status(500).json({ error: "Failed to create equipment type" });
      }
    });

    // Equipment endpoints
    app.get("/api/equipment", async (req, res) => {
      try {
        const equipment = await getAllEquipment();
        res.json(equipment);
      } catch (error) {
        console.error("Error getting equipment:", error);
        res.status(500).json({ error: "Failed to get equipment" });
      }
    });

    app.post("/api/equipment", async (req, res) => {
      try {
        const equipmentData = req.body;
        const newEquipment = await createEquipment(equipmentData);
        res.json(newEquipment);
      } catch (error) {
        console.error("Error creating equipment:", error);
        res.status(500).json({ error: "Failed to create equipment" });
      }
    });

    app.patch("/api/equipment/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;
        const updatedEquipment = await updateEquipment(id, updates);
        if (!updatedEquipment) {
          return res.status(404).json({ error: "Equipment not found" });
        }
        res.json(updatedEquipment);
      } catch (error) {
        console.error("Error updating equipment:", error);
        res.status(500).json({ error: "Failed to update equipment" });
      }
    });

    // Marketing Segments endpoints
    app.post("/api/marketing/segments/generate", async (req: AuthenticatedRequest, res) => {
      try {
        const { minConfidence, includePredictions, maxSegments, focusAreas } = req.body;

        // Validate parameters
        if (!minConfidence || !maxSegments || !focusAreas) {
          return res.status(400).json({ error: "Missing required generation parameters" });
        }

        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate AI-powered segments
        const segments = Array.from({ length: maxSegments }, (_, i) => ({
          id: i + 1,
          name: `AI Generated Segment ${i + 1}`,
          description: `Intelligent customer segment based on ${focusAreas.join(", ")} analysis`,
          totalCustomers: Math.floor(Math.random() * 10000) + 1000,
          confidenceScore: (Math.random() * (1 - minConfidence) + minConfidence).toFixed(2),
          isActive: true,
          aiGenerated: true,
          expectedGrowth: includePredictions ? Math.floor(Math.random() * 40) - 10 : undefined,
          predictedEngagement: includePredictions ? Math.floor(Math.random() * 60) + 20 : undefined,
          insights: [
            "High correlation with seasonal purchasing patterns",
            "Shows strong affinity for premium products",
            "Responds well to email marketing campaigns"
          ],
          criteria: [
            {
              type: "behavioral",
              condition: "greater_than",
              value: "5 purchases/month",
              confidence: 0.85,
              impact: 0.7
            },
            {
              type: "demographic",
              condition: "equals",
              value: "25-34 age group",
              confidence: 0.92,
              impact: 0.8
            }
          ]
        }));

        res.json(segments);
      } catch (error) {
        console.error("Error generating segments:", error);
        res.status(500).json({ error: "Failed to generate segments" });
      }
    });

    app.get("/api/marketing/segments", async (_req, res) => {
      try {
        // For demo purposes, return some sample segments
        const segments = [
          {
            id: 1,
            name: "High-Value Customers",
            description: "Customers with high lifetime value and frequent purchases",
            totalCustomers: 2500,
            confidenceScore: 0.89,
            isActive: true,
            aiGenerated: true,
            expectedGrowth: 15,
            predictedEngagement: 78,
            insights: [
              "Strong correlation with premium product purchases",
              "High response rate to exclusive offers",
              "Significant social media engagement"
            ],
            criteria: [
              {
                type: "transactional",
                condition: "greater_than",
                value: "$1000/month",
                confidence: 0.92,
                impact: 0.85
              }
            ]
          },
          {
            id: 2,
            name: "At-Risk Customers",
            description: "Customers showing declining engagement",
            totalCustomers: 1200,
            confidenceScore: 0.75,
            isActive: true,
            aiGenerated: true,
            expectedGrowth: -5,
            predictedEngagement: 45,
            insights: [
              "Decreasing purchase frequency in last 3 months",
              "Lower email open rates",
              "Increased support tickets"
            ],
            criteria: [
              {
                type: "behavioral",
                condition: "less_than",
                value: "1 purchase/month",
                confidence: 0.78,
                impact: 0.65
              }
            ]
          }
        ];

        res.json(segments);
      } catch (error) {
        console.error("Error fetching segments:", error);
        res.status(500).json({ error: "Failed to fetch segments" });
      }
    });

    app.get("/api/marketing/segments/:segmentId/members", async (req: AuthenticatedRequest, res) => {
      try {
        const { segmentId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        // For demo purposes, generate sample member data
        const totalMembers = Math.floor(Math.random() * 1000) + 100;
        const members = Array.from({ length: Math.min(limit, totalMembers) }, (_, i) => ({
          id: `${segmentId}-${((page - 1) * limit) + i + 1}`,
          name: `Member ${((page - 1) * limit) + i + 1}`,
          email: `member${((page - 1) * limit) + i + 1}@example.com`,
          joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          membershipType: ['Basic', 'Premium', 'Elite'][Math.floor(Math.random() * 3)],
          lastVisit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          visitsThisMonth: Math.floor(Math.random() * 20),
          metrics: {
            attendanceRate: Math.round(Math.random() * 100),
            engagementScore: Math.round(Math.random() * 100),
            lifetimeValue: Math.round(Math.random() * 1000),
          }
        }));

        res.json({
          members,
          pagination: {
            total: totalMembers,
            page,
            limit,
            pages: Math.ceil(totalMembers / limit)
          }
        });
      } catch (error) {
        console.error("Error fetching segment members:", error);
        res.status(500).json({ error: "Failed to fetch segment members" });
      }
    });

    // Add generate detailed report endpoint
    app.post("/api/generate-report", async (req, res) => {
      try {
        const { topic } = req.body;

        if (!topic) {
          return res.status(400).json({ error: "Topic is required" });
        }

        console.log(`Generating report for topic: ${topic}`);
        const filename = await generateReport(topic);

        if (!filename) {
          throw new Error("Failed to generate report");
        }

        // Track AI usage for report generation (assuming it takes about 2 minutes)
        await trackAIEngineUsage(req.user!.id, 'report_generation', 2, { topic });

        res.json({
          success: true,
          filename,
          downloadUrl: `/uploads/${filename}`
        });
      } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({
          error: "Failed to generate report",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });


    // Check Azure OpenAI connection status
    app.get("/api/azure/status", async (req, res) => {
      try {
        console.log("Checking Azure services status...");
        const status = await checkOpenAIConnection();
        res.json(status);
      } catch (error) {
        console.error("Errorchecking Azure OpenAI status:", error);
        res.status(500).json({
          status: "error",
          message: "Failed to check Azure OpenAI status",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Add dashboard metrics endpoint
    app.get("/api/dashboard/stats", async (req, res) => {
      try {
        const [storageMetrics, azureStatus] = await Promise.all([
          getStorageMetrics(),
          checkOpenAIConnection()
        ]);

        const stats = {
          totalDocuments: storageMetrics.totalDocuments,
          totalStorageSize: storageMetrics.totalSize,
          documentTypes: storageMetrics.documentTypes,
          aiServiceStatus: azureStatus.some(s => s.name === "Azure OpenAI" && s.status === "connected"),
          storageStatus: azureStatus.some(s => s.name === "Azure Blob Storage" && s.status === "connected"),
        };

        res.json(stats);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ error: "Failed to fetch dashboard statistics" });
      }
    });

    app.get("/api/dashboard/activity", async (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 10;
        const recentActivity = await getRecentActivity(limit);
        res.json(recentActivity);
      } catch (error) {
        console.error("Error fetching activity:", error);
        res.status(500).json({ error: "Failed to fetch activity" });
      }
    });

    // Dashboard extended stats endpoint
    app.get("/api/dashboard/extended-stats", async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.user) {
          return res.status(401).send("Not authenticated");
        }

        const userId = req.user.id;

        // Get user's training level
        const trainingLevel = await getUserTrainingLevel(userId);

        // Get AI Engine usage statistics for the past 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const aiActivities = await db
          .select({
            date: aiEngineActivity.startTime,
            duration: aiEngineActivity.durationMinutes,
          })
          .from(aiEngineActivity)
          .where(
            and(
              eq(aiEngineActivity.userId, userId),
              gte(aiEngineActivity.startTime, sevenDaysAgo),
              lte(aiEngineActivity.startTime, new Date())
            )
          );

        // Initialize all days in the past week with 0
        const dailyUsage = new Map<string, number>();
        for (let i = 0; i < 7; i++) {
          const date = new Date(sevenDaysAgo);
          date.setDate(date.getDate() + i);
          dailyUsage.set(date.toISOString().split('T')[0], 0);
        }

        // Add actual usage data
        aiActivities.forEach(activity => {
          const day = activity.date.toISOString().split('T')[0];
          const duration = parseFloat(activity.duration?.toString() || "0");
          dailyUsage.set(day, (dailyUsage.get(day) || 0) + duration);
        });

        const extendedStats = {
          collaborators: 5, // Placeholder until user management is implemented
          chatActivity: {
            totalResponses: 0,
            downloadedReports: 0
          },
          trainingLevel,
          incompleteTasks: 0,
          aiEngineUsage: Array.from(dailyUsage.entries()).map(([date, minutes]) => ({
            date,
            minutes: Math.round(minutes * 100) / 100
          })).sort((a, b) => a.date.localeCompare(b.date))
        };

        // Get activity logs to count chat responses and downloaded reports
        try {
          const activityLogs = await getRecentActivity(100); // Get last 100 activities
          for (const activity of activityLogs) {
            if (activity.type === 'download' && activity.documentName.includes('report')) {
              extendedStats.chatActivity.downloadedReports++;
            } else if (activity.type === 'view' && activity.documentName.includes('chat')) {
              extendedStats.chatActivity.totalResponses++;
            }
          }
        } catch (error) {
          console.warn("Error counting activity logs:", error);
          // Continue with default values if activity logs can't be counted
        }

        res.json(extendedStats);
      } catch (error) {
        console.error("Error fetching extended stats:", error);
        res.status(500).json({ error: "Failed to fetch extended statistics" });
      }
    });

    // Chat history endpoint
    app.get("/api/chats", async (req, res) => {
      try {
        const userKey = 'default_user';
        const chats = await listChats(userKey);
        const formattedChats = chats.map(chat => ({
          id: chat.id,
          title: chat.title,
          lastMessageAt: chat.lastMessageAt,
          isArchived: chat.isDeleted || false
        }));
        res.json(formattedChats);
      } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ error: "Failed to fetch chats" });
      }
    });

    // Document browsing endpoints
    app.get("/api/documents/browse", async (req, res) => {
      try {
        console.log("Listing blobs from container:", "documents");
        const path = (req.query.path as string) || "";
        console.log("Browsing path:", path);

        const items = [];
        const listOptions = {
          prefix: path,
          delimiter: '/'
        };

        const blobs = containerClient.listBlobsByHierarchy('/', listOptions);

        console.log("Starting blob enumeration...");
        for await (const item of blobs) {
          console.log("Found item:", item.kind === "prefix" ? "Directory:" : "File:", item.name);

          if (item.kind === "prefix") {
            const folderPath = item.name;
            const folderName = folderPath.split('/').filter(Boolean).pop() || "";

            items.push({
              name: folderName,
              path: folderPath,
              type: "folder"
            });
          } else {
            const blobItem = item;
            const fileName = blobItem.name.split("/").pop() || "";

            if (!fileName.startsWith('.folder')) {
              items.push({
                name: fileName,
                path: blobItem.name,
                type: "file",
                size: blobItem.properties?.contentLength,
                lastModified: blobItem.properties?.lastModified?.toISOString()
              });
            }
          }
        }

        console.log("Found items:", items);
        res.json(items);
      } catch (error) {
        console.error("Error listing blobs:", error);
        res.status(500).json({ error: "Failed to list documents" });
      }
    });

    // Document content endpoints
    app.get("/api/documents/content/:path(*)", async (req: AuthenticatedRequest, res) => {
      try {
        const documentPath = req.params.path;
        console.log("Fetching document content for path:", documentPath);

        const blockBlobClient = containerClient.getBlockBlobClient(documentPath);

        try {
          const downloadResponse = await blockBlobClient.download();
          const properties = await blockBlobClient.getProperties();

          console.log("Document properties:", properties);

          if (!downloadResponse.readableStreamBody) {
            console.error("No content available for document:", documentPath);
            return res.status(404).json({ error: "No content available" });
          }

          // Read the stream into a buffer
          const chunks: Buffer[] = [];
          for await (const chunk of downloadResponse.readableStreamBody) {
            chunks.push(Buffer.from(chunk));
          }
          const content = Buffer.concat(chunks).toString('utf-8');

          console.log("Successfully retrieved document content, size:", content.length);
          console.log("Document metadata:", properties.metadata);

          // Send back the document data
          res.json({
            content,
            version: properties.metadata?.version || '1.0',
            status: properties.metadata?.status || 'draft',
            lastModified: properties.lastModified?.toISOString() || new Date().toISOString(),
          });
        } catch (error: any) {
          console.error("Error downloading document:", error);
          if (error.statusCode === 404) {
            return res.status(404).json({ error: "Document not found" });
          }
          throw error;
        }
      } catch (error) {
        console.error("Error fetching document content:", error);
        res.status(500).json({ error: "Failed to fetch document content" });
      }
    });

    // Document upload endpoint
    app.post("/api/documents/upload", upload.array('files'), async (req: AuthenticatedRequest, res) => {
      try {
        const path = req.body.path || "";
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
          return res.status(400).json({ error: "No files provided" });
        }

        console.log("Uploading files to path:", path);
        console.log("Files to upload:", files.map(f => f.originalname));

        const uploadPromises = files.map(async (file) => {
          const blobName = path ? `${path}${file.originalname}` : file.originalname;
          const blockBlobClient = containerClient.getBlockBlobClient(blobName);
          await blockBlobClient.uploadData(file.buffer);
          return blobName;
        });

        const uploadedFiles = await Promise.all(uploadPromises);
        console.log("Successfully uploaded files:", uploadedFiles);

        res.json({ message: "Files uploaded successfully", files: uploadedFiles });
      } catch (error) {
        console.error("Error uploading files:", error);
        res.status(500).json({
          error: "File upload failed."
        });
      }
    });

    //    // Add workflow endpoint
    app.post("/api/api/documents/workflow", async (req, res) => {
      try {
        const { documentId, type, assigneeId } = req.body;

        if (!documentId || !type || !assigneeId) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Create workflow entry
        const [workflow] = await db
          .insert(documentWorkflows)
          .values({
            documentId: parseInt(documentId),
            status: 'active',
            startedAt: new Date(),
          })
          .returning();

        // Create approval entry
        await db
          .insert(documentApprovals)
          .values({
            documentId: parseInt(documentId),
            version: '1.0', // This should come from the document metadata
            approverUserId: assigneeId,
            status: 'pending',
          });

        // TODO: Send email notification
        // This would integrate with your email service

        res.json({
          message: `Document sent for ${type}`,
          workflowId: workflow.id,
        });
      } catch (error) {
        console.error("Error creating workflow:", error);
        res.status(500).json({ error: "Failed to create workflow" });
      }
    });

    // Add workflow status endpoint
    app.get("/api/documents/workflow/:documentId", async (req, res) => {
      try {
        const documentId = parseInt(req.params.documentId);

        const [latestWorkflow] = await db
          .select({
            status: documentWorkflows.status,
            startedAt: documentWorkflows.startedAt,
            completedAt: documentWorkflows.completedAt,
          })
          .from(documentWorkflows)
          .where(eq(documentWorkflows.documentId, documentId))
          .orderBy(documentWorkflows.startedAt, 'desc')
          .limit(1);

        if (!latestWorkflow) {
          return res.json({
            status: 'draft',
            updatedAt: new Date().toISOString(),
          });
        }

        const [latestApproval] = await db
          .select()
          .from(documentApprovals)
          .where(eq(documentApprovals.documentId, documentId))
          .orderBy(documentApprovals.createdAt, 'desc')
          .limit(1);

        res.json({
          status: latestApproval?.status || 'draft',
          reviewedBy: latestApproval?.approverUserId,
          approvedBy: latestApproval?.status === 'approved' ? latestApproval.approverUserId : undefined,
          updatedAt: latestWorkflow.startedAt.toISOString(),
        });
      } catch (error) {
        console.error("Error fetching workflow status:", error);
        res.status(500).json({ error: "Failed to fetch workflow status" });
      }
    });

    // Add workflow action endpoint (for handling review/approve actions)
    app.post("/api/documents/workflow/:documentId/action", async (req, res) => {
      try {
        const documentId = parseInt(req.params.documentId);
        const { action, userId, comments } = req.body;

        if (!documentId || !action || !userId) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Update approval status
        await db
          .update(documentApprovals)
          .set({
            status: action,
            comments,
            approvedAt: action === 'approved' ? new Date() : undefined,
          })
          .where(eq(documentApprovals.documentId, documentId))
          .where(eq(documentApprovals.approverUserId, userId));

        // If approved, update workflow status
        if (action === 'approved') {
          await db
            .update(documentWorkflows)
            .set({
              status: 'completed',
              completedAt: new Date(),
            })
            .where(eq(documentWorkflows.documentId, documentId));
        }

        res.json({
          message: `Document ${action} successfully`,
        });
      } catch (error) {
        console.error("Error updating workflow status:", error);
        res.status(500).json({ error: "Failed to update workflow status" });
      }
    });

    // Add document permissions endpoints
    app.get("/api/documents/:documentId/permissions", async (req, res) => {
      try {
        const documentId = parseInt(req.params.documentId);

        const permissions = await db
          .select()
          .from(documentPermissions)
          .where(eq(documentPermissions.documentId, documentId));

        // Enhance permissions with detailed access information
        const enhancedPermissions = permissions.map(permission => ({
          id: permission.id,
          roleLevel: permission.roleLevel,
          permissions: {
            view: true, // Base level permission
            edit: permission.roleLevel >= 2,
            review: permission.roleLevel >= 3,
            approve: permission.roleLevel >= 4,
            manage: permission.roleLevel >= 5,
          }
        }));

        res.json(enhancedPermissions);
      } catch (error) {
        console.error("Error fetching document permissions:", error);
        res.status(500).json({ error: "Failed to fetch permissions" });
      }
    });

    app.post("/api/documents/:documentId/permissions", async (req, res) => {
      try {
        const documentId = parseInt(req.params.documentId);
        const { roleLevel } = req.body;

        if (!roleLevel) {
          return res.status(400).json({ error: "Role level is required" });
        }

        // Check if permission already exists
        const [existingPermission] = await db
          .select()
          .from(documentPermissions)
          .where(
            and(
              eq(documentPermissions.documentId, documentId),
              eq(documentPermissions.roleLevel, roleLevel)
            )
          );

        if (existingPermission) {
          return res.status(400).json({ error: "Permission already exists for this role level" });
        }

        // Add new permission
        const [permission] = await db
          .insert(documentPermissions)
          .values({
            documentId,
            roleLevel,
          })
          .returning();

        res.json(permission);
      } catch (error) {
        console.error("Error adding document permission:", error);
        res.status(500).json({ error: "Failed to add permission" });
      }
    });

    app.patch("/api/documents/:documentId/permissions/:permissionId", async (req, res) => {
      try {
        const permissionId = parseInt(req.params.permissionId);
        const updates = req.body;

        // Update permission
        const [updatedPermission] = await db
          .update(documentPermissions)
          .set(updates)
          .where(eq(documentPermissions.id, permissionId))
          .returning();

        res.json(updatedPermission);
      } catch (error) {
        console.error("Error updating document permission:", error);
        res.status(500).json({ error: "Failed to update permission" });
      }
    });

    // Add roles endpoint
    app.get("/api/roles", async (req, res) => {
      try {
        const allRoles = await db
          .select()
          .from(roles)
          .orderBy(roles.level);

        res.json(allRoles);
      } catch (error) {
        console.error("Error fetching roles:", error);
        res.status(500).json({ error: "Failed to fetch roles" });
      }
    });

    // Add training module creation endpoint
    app.post("/api/training/modules", async (req: AuthenticatedRequest, res) => {
      try {
        const { title, description, content, questions } = req.body;

        if (!req.user) {
          return res.status(401).send("Not authenticated");
        }

        // Create the training module
        const [module] = await db
          .insert(trainingModules)
          .values({
            title,
            description,
            content,
            questions,
            createdBy: req.user.id,
            status: 'active',
            createdAt: new Date(),
          })
          .returning();

        // Update the user's training progress
        await db
          .insert(userTraining)
          .values({
            userId: req.user.id,
            moduleId: module.id,
            progress: 0,
            status: 'not_started',
            assignedBy: req.user.id,
          });

        res.json(module);
      } catch (error) {
        console.error("Error creating training module:", error);
        res.status(500).json({ error: "Failed to create module" });
      }
    });

    // Initialize Cosmos DB containers
    initializeContainers().catch(console.error);

    // Add report generation endpoint with proper Azure Blob Storage integration
    app.post("/api/reports/upload", upload.single('file'), async (req: Request, res: Response) => {
      try {
        const file = req.file;
        const { title } = req.body;

        if (!file) {
          return res.status(400).json({ error: "No file provided" });
        }

        console.log("Uploading report to Azure Blob Storage:", title);

        // Generate a unique blob name for the report
        const blobName = `reports/${Date.now()}-${title.toLowerCase().replace(/\s+/g, '-')}.docx`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Upload to Azure Blob Storage
        await blockBlobClient.uploadData(file.buffer, {
          blobHTTPHeaders: {
            blobContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          }
        });

        // Get the download URL (this will be a SAS URL that expires)
        const downloadUrl = `/api/reports/download/${encodeURIComponent(blobName)}`;

        console.log("Report uploaded successfully:", blobName);
        res.json({ downloadUrl });
      } catch (error) {
        console.error("Error uploading report:", error);
        res.status(500).json({ error: "Failed to upload report" });
      }
    });

    // Add download endpoint for reports
    app.get("/api/reports/download/:blobName", async (req: Request, res: Response) => {
      try {
        const blobName = decodeURIComponent(req.params.blobName);
        console.log("Downloading report:", blobName);

        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const downloadResponse = await blockBlobClient.download(0);

        if (!downloadResponse.readableStreamBody) {
          return res.status(404).json({ error: "Report not found" });
        }

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${blobName.split('/').pop()}"`);

        // Pipe the stream to the response
        downloadResponse.readableStreamBody.pipe(res);
      } catch (error) {
        console.error("Error downloading report:", error);
        res.status(500).json({ error: "Failed to download report" });
      }
    });

    // Add notification endpoints
    app.get("/api/notifications", async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const userNotifs = await db.query.userNotifications.findMany({
          where: eq(userNotifications.userId, userId),
          orderBy: [notifications.createdAt],
          include: {
            notification: true
          }
        });


        res.json(userNotifs);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
      }
    });

    app.post("/api/notifications/mark-read", async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const { notificationIds } = req.body;
        if (!Array.isArray(notificationIds)) {
          return res.status(400).json({ error: "Invalid notification IDs" });
        }

        await db.update(userNotifications)
          .set({
            read: true,
            readAt: new Date()
          })
          .where(
            and(
              eq(userNotifications.userId, userId),
              eq(userNotifications.notificationId, notificationIds[0])
            )
          );

        res.json({ message: "Notifications marked as read" });
      } catch (error) {
        console.error("Error marking notifications as read:", error);
        res.status(500).json({ error: "Failed to mark notifications as read" });
      }
    });

    app.get("/api/notifications/unread-count", async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const [result] = await db.select({
          count: notifications.id,
        })
          .from(notifications)
          .innerJoin(
            userNotifications,
            eq(notifications.id, userNotifications.notificationId)
          )
          .where(
            and(
              eq(userNotifications.userId, userId),
              eq(userNotifications.read, false)
            )
          );

        res.json({ count: result?.count || 0 });
      } catch (error) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({ error: "Failed to fetch unread count" });
      }
    });

    // Document submission for review endpoint
    app.post("/api/documents/:documentId/submit-review", async (req: AuthenticatedRequest, res) => {
      try {
        const documentId = parseInt(req.params.documentId);
        const { version } = req.body;
        const userId = req.user?.id;

        if (!documentId || !version || !userId) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Create workflow entry
        const [workflow] = await db
          .insert(documentWorkflows)
          .values({
            documentId,
            status: 'active',
            startedAt: new Date(),
          })
          .returning();

        // Get document approvers
        const approvers = await db
          .select()
          .from(documentCollaborators)
          .where(
            and(
              eq(documentCollaborators.documentId, documentId),
              eq(documentCollaborators.role, 'approver')
            )
          );

        // Get document details
        const [document] = await db
          .select()
          .from(documents)
          .where(eq(documents.id, documentId));

        if (!document) {
          throw new Error("Document not found");
        }

        // Send approval requests to all approvers
        const approvalPromises = approvers.map(async (approver) => {
          // Create approval entry
          const [approval] = await db
            .insert(documentApprovals)
            .values({
              documentId,
              version,
              approverUserId: approver.userId,
              status: 'pending',
            })
            .returning();

          // Generate approval/reject links
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          const approvalLink = `${baseUrl}/api/documents/${documentId}/approve/${approval.id}`;
          const rejectLink = `${baseUrl}/api/documents/${documentId}/reject/${approval.id}`;

          // Send email
          await sendApprovalRequestEmail(approver.userId, {
            documentName: document.title,
            documentLink: `${baseUrl}/documents/${documentId}`,
            requesterName: userId,
            approvalLink,
            rejectLink,
          });
        });

        await Promise.all(approvalPromises);

        // Update document status
        await db
          .update(documents)
          .set({
            status: 'in_review',
            version,
            updatedAt: new Date(),
            updatedBy: userId,
          })
          .where(eq(documents.id, documentId));

        res.json({
          message: "Document submitted for review",
          workflowId: workflow.id,
        });
      } catch (error) {
        console.error("Error submitting document for review:", error);
        res.status(500).json({ error: "Failed to submit document for review" });
      }
    });

    // Document approval endpoint
    app.post("/api/documents/:documentId/approve/:approvalId", async (req: AuthenticatedRequest, res) => {
      try {
        const documentId = parseInt(req.params.documentId);
        const approvalId = parseInt(req.params.approvalId);
        const userId = req.user?.id;

        if (!documentId || !approvalId || !userId) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Update approval status
        await db
          .update(documentApprovals)
          .set({
            status: 'approved',
            approvedAt: new Date(),
          })
          .where(eq(documentApprovals.id, approvalId));

        // Check if all approvers have approved
        const [pendingApprovals] = await db
          .select({ count: sql`count(*)` })
          .from(documentApprovals)
          .where(
            and(
              eq(documentApprovals.documentId, documentId),
              eq(documentApprovals.status, 'pending')
            )
          );

        if (pendingApprovals.count === 0) {
          // All approvers have approved, update document status
          await db
            .update(documents)
            .set({
              status: 'approved',
              updatedAt: new Date(),
              updatedBy: userId,
            })
            .where(eq(documents.id, documentId));

          // Complete the workflow
          await db
            .update(documentWorkflows)
            .set({
              status: 'completed',
              completedAt: new Date(),
            })
            .where(eq(documentWorkflows.documentId, documentId));
        }

        res.json({ message: "Document approved successfully" });
      } catch (error) {
        console.error("Error approving document:", error);
        res.status(500).json({ error: "Failed to approve document" });
      }
    });

    // Document rejection endpoint
    app.post("/api/documents/:documentId/reject/:approvalId", async (req: AuthenticatedRequest, res) => {
      try {
        const documentId = parseInt(req.params.documentId);
        const approvalId = parseInt(req.params.approvalId);
        const userId =req.user?.id;
        const { comments } = req.body;

        if (!documentId || !approvalId || !userId) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Update approval status
        await db
          .update(documentApprovals)
          .set({
            status: 'rejected',
            comments,
            updatedAt: new Date(),
          })
          .where(eq(documentApprovals.id, approvalId));

        // Update document status
        await db
          .update(documents)
          .set({
            status: 'draft',
            updatedAt: new Date(),
            updatedBy: userId,
          })
          .where(eq(documents.id, documentId));

        // Complete the workflow
        await db
          .update(documentWorkflows)
          .set({
            status: 'completed',
            completedAt: new Date(),
          })
          .where(eq(documentWorkflows.documentId, documentId));

        res.json({ message: "Document rejected" });
      } catch (error) {
        console.error("Error rejecting document:", error);
        res.status(500).json({ error: "Failed to reject document" });
      }
    });

    // Add new endpoint to get user's training level
    app.get("/api/training/level", async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.user) {
          return res.status(401).send("Not authenticated");
        }

        const trainingLevel = await getUserTrainingLevel(req.user.id);
        res.json(trainingLevel);
      } catch (error) {
        console.error("Error getting training level:", error);
        res.status(500).json({ error: "Failed to get training level" });
      }
    });

    // Update training progress endpoint
    app.post("/api/training/progress", async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.user) {
          return res.status(401).send("Not authenticated");
        }

        const { moduleId, progress, status } = req.body;

        // Update the training progress
        await db
          .insert(userTraining)
          .values({
            userId: req.user.id,
            moduleId,
            progress,
            status,
            assignedBy: req.user.id,
          })
          .onConflictDoUpdate({
            target: [userTraining.userId, userTraining.moduleId],
            set: {
              progress,
              status,
              completedAt: status === 'completed' ? new Date() : undefined,
            },
          });

        // Broadcast the updated training level
        await wsServer.broadcastTrainingLevel(req.user.id);

        res.json({ message: "Training progress updated successfully" });
      } catch (error) {
        console.error("Error updating training progress:", error);
        res.status(500).json({ error: "Failed to update training progress" });
      }
    });

    // Document content endpoint - updating to handle paths correctly
    app.get("/api/documents/:path*/content", async (req: AuthenticatedRequest, res) => {
      try {
        const documentPath = req.params["path*"];
        console.log("Fetching document content for path:", documentPath);

        const blockBlobClient = containerClient.getBlockBlobClient(documentPath);

        try {
          const downloadResponse = await blockBlobClient.download();
          const properties = await blockBlobClient.getProperties();

          console.log("Document properties:", properties);

          if (!downloadResponse.readableStreamBody) {
            console.error("No content available for document:", documentPath);
            return res.status(404).json({ error: "No content available" });
          }

          // Read the stream into a buffer
          const chunks: Buffer[] = [];
          for await (const chunk of downloadResponse.readableStreamBody) {
            chunks.push(Buffer.from(chunk));
          }
          const content = Buffer.concat(chunks).toString('utf-8');

          console.log("Successfully retrieved document content, size:", content.length);
          console.log("Document metadata:", properties.metadata);

          // Send back the document data
          res.json({
            content,
            version: properties.metadata?.version || '1.0',
            status: properties.metadata?.status || 'draft',
            lastModified: properties.lastModified?.toISOString() || new Date().toISOString(),
          });
        } catch (error: any) {
          console.error("Error downloading document:", error);
          if (error.statusCode === 404) {
            return res.status(404).json({ error: "Document not found" });
          }
          throw error;
        }
      } catch (error) {
        console.error("Error fetching document content:", error);
        res.status(500).json({ error: "Failed to fetch document content" });
      }
    });

    // Update document content endpoint
    app.put("/api/documents/content/:path*", async (req: AuthenticatedRequest, res) => {
      try {
        const documentPath = decodeURIComponent(req.params.path + (req.params[0] || ''));
        const { content, version, status } = req.body;

        if (!content) {
          return res.status(400).json({ error: "Content is required" });
        }

        console.log("Updating document content for:", documentPath);

        const blockBlobClient = containerClient.getBlockBlobClient(documentPath);

        // Add metadata
        const metadata = {
          version: version || '1.0',
          status: status || 'draft',
          lastModified: new Date().toISOString()
        };

        await blockBlobClient.upload(content, content.length, {
          metadata,
          blobHTTPHeaders: {
            blobContentType: "text/html",
          },
        });

        console.log("Successfully updated document content");
        res.json({ message: "Document updated successfully" });
      } catch (error) {
        console.error("Error updating document content:", error);
        res.status(500).json({ error: "Failed to update document content" });
      }
    });

    // Add integration status endpoints
    app.get("/api/integrations/status", async (req, res) => {
      try {
        // Get all configs for the current user
        const configs = await db
          .select()
          .from(integrationConfigs)
          .where(eq(integrationConfigs.userId, req.user?.id || 'anonymous'));

        // Initialize status object
        const statuses: Record<string, any> = {};

        // Check each integration's status based on its configuration
        for (const config of configs) {
          const hasCredentials = Boolean(config.apiKey);

          if (!config.enabled) {
            statuses[config.integrationId] = {
              status: 'disconnected',
              lastChecked: new Date().toISOString(),
              message: 'Integration disabled'
            };
            continue;
          }

          if (!hasCredentials) {
            statuses[config.integrationId] = {
              status: 'disconnected',
              lastChecked: new Date().toISOString(),
              message: 'API key required'
            };
            continue;
          }

          // Mock connection check - replace with actual API checks in production
          const isConnected = hasCredentials && Math.random() > 0.2; // 80% success rate for demo

          statuses[config.integrationId] = {
            status: isConnected ? 'connected' : 'error',
            lastChecked: new Date().toISOString(),
            message: isConnected
              ? 'Connected and syncing'
              : 'Authentication failed. Please check your credentials.'
          };
        }

        // Add default disconnected status for unconfigured integrations
        const allPlatforms = [
          'mailchimp', 'sendgrid', 'hubspot', 'klaviyo',
          'facebook', 'instagram', 'twitter', 'linkedin',
          'google-analytics', 'mixpanel', 'segment', 'amplitude'
        ];

        for (const platform of allPlatforms) {
          if (!statuses[platform]) {
            statuses[platform] = {
              status: 'disconnected',
              lastChecked: new Date().toISOString(),
              message: 'Not configured'
            };
          }
        }

        res.json(statuses);
      } catch (error) {
        console.error("Error fetching integration statuses:", error);
        res.status(500).json({ error: "Failed to fetch integration statuses" });
      }
    });

    // Add integration config endpoints
    app.get("/api/integrations/configs", async (req, res) => {
      try {
        const configs = await db
          .select()
          .from(integrationConfigs)
          .where(eq(integrationConfigs.userId, req.user?.id || 'anonymous'));

        // Convert array of configs to object keyed by integration ID
        const configsMap = configs.reduce((acc, config) => ({
          ...acc,
          [config.integrationId]: {
            apiKey: config.apiKey,
            enabled: config.enabled,
            syncFrequency: config.syncFrequency,
            webhookUrl: config.webhookUrl,
            customFields: config.customFields,
          }
        }), {});

        res.json(configsMap);
      } catch (error) {
        console.error("Error fetching integration configs:", error);
        res.status(500).json({ error: "Failed to fetch integration configurations" });
      }
    });

    app.put("/api/integrations/:id/config", async (req, res) => {
      try {
        const { id } = req.params;
        const config = req.body;

        // Update or insert config
        const [updatedConfig] = await db
          .insert(integrationConfigs)
          .values({
            userId: req.user?.id || 'anonymous',
            integrationId: id,
            apiKey: config.apiKey,
            enabled: config.enabled,
            syncFrequency: config.syncFrequency,
            webhookUrl: config.webhookUrl,
            customFields: config.customFields,
          })
          .onConflictDoUpdate({
            target: [integrationConfigs.userId, integrationConfigs.integrationId],
            set: {
              apiKey: config.apiKey,
              enabled: config.enabled,
              syncFrequency: config.syncFrequency,
              webhookUrl: config.webhookUrl,
              customFields: config.customFields,
              updatedAt: new Date(),
            },
          })
          .returning();

        res.json(updatedConfig);
      } catch (error) {
        console.error("Error saving integration config:", error);
        res.status(500).json({ error: "Failed to save integration configuration" });
      }
    });

    // Update the refresh endpoint to check actual connection
    app.post("/api/integrations/:id/refresh", async (req, res) => {
      try {
        const { id } = req.params;

        // Get the integration config
        const [config] = await db
          .select()
          .from(integrationConfigs)
          .where(
            and(
              eq(integrationConfigs.userId, req.user?.id || 'anonymous'),
              eq(integrationConfigs.integrationId, id)
            )
          );

        let status;
        if (!config?.enabled) {
          status = {
            status: 'disconnected',
            lastChecked: new Date().toISOString(),
            message: 'Integration disabled'
          };
        } else if (!config?.apiKey) {
          status = {
            status: 'disconnected',
            lastChecked: new Date().toISOString(),
            message: 'API key required'
          };
        } else {
          // Mock connection check - replace with actual API checks
          const isConnected = Math.random() > 0.2; // 80% success rate for demo
          status = {
            status: isConnected ? 'connected' : 'error',
            lastChecked: new Date().toISOString(),
            message: isConnected
              ? 'Connected and syncing'
              : 'Authentication failed. Please check your credentials.'
          };
        }

        // Track the refresh attempt
        await trackAIEngineUsage(
          req.user?.id || 'anonymous',
          'web_search',
          0.1,
          { integration: id, action: 'refresh' }
        );

        res.json(status);
      } catch (error) {
        console.error("Error refreshing integration status:", error);
        res.status(500).json({ error: "Failed to refresh integration status" });
      }
    });

    // Add new marketing calendar routes
    app.get("/api/marketing/calendar/events", async (req, res) => {
      try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

        // Get events from database
        const events = await db.query.marketingEvents.findMany({
          where: and(
            startDate ? gte(marketingEvents.startDate, startDate) : undefined,
            endDate ? lte(marketingEvents.endDate, endDate) : undefined
          ),
          orderBy: [marketingEvents.startDate]
        });

        res.json(events);
      } catch (error) {
        console.error("Error fetching calendar events:", error);
        res.status(500).json({ error: "Failed to fetch calendar events" });
      }
    });

    app.post("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
      try {
        const { title, description, startDate, endDate, type, status, location } = req.body;

        // Validate required fields
        if (!title || !startDate || !type) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Create new event
        const [event] = await db
          .insert(marketingEvents)
          .values({
            title,
            description,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            type,
            status: status || 'scheduled',
            createdBy: req.user?.id || 'system',
            location
          })
          .returning();

        // Broadcast event to connected clients
        wsServer.broadcastToRoom('calendar', {
          type: 'calendar_event_created',
          data: event
        });

        res.json(event);

      } catch (error) {
        console.error("Error creating calendar event:", error);
        res.status(500).json({ error: "Failed to create calendar event" });
      }
    });

    app.post("/api/marketing/calendar/sync-outlook", async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Authentication required" });
        }

        // Simulate Outlook sync for now (will be replaced with actual Microsoft Graph API integration)
        await new Promise(resolve => setTimeout(resolve, 1000));

        const sampleOutlookEvent = {
          id: "outlook-1",
          title: "Marketing Team Meeting",
          startDate: new Date(),
          endDate: new Date(Date.now() + 3600000),
          type: "meeting",
          status: "scheduled",
          outlookEventId: "123456"
        };

        res.json({
          message: "Calendar synced with Outlook",
          syncedEvents: [sampleOutlookEvent]
        });
      } catch (error) {
        console.error("Error syncing with Outlook:", error);
        res.status(500).json({ error: "Failed to sync with Outlook calendar" });
      }
    });

    // Add member update endpoint
    app.patch("/api/members/:memberId", async (req, res) => {
      try {
        const { memberId } = req.params;
        const updates = req.body;

        const updatedMember = await updateMemberData(memberId, updates);
        res.json(updatedMember);
      } catch (error) {
        console.error("Error updating member:", error);
        res.status(500).json({ error: "Failed to update member data" });
      }
    });

    // Add member search endpoint
    app.get("/api/members", async (req, res) => {
      try {
        const searchTerm = req.query.search as string;
        const filters = {
          membershipType: req.query.membershipType as string,
          status: req.query.status as string
        };

        const members = await searchMembers(searchTerm, filters);
        res.json(members);
      } catch (error) {
        console.error("Error searching members:", error);
        res.status(500).json({ error: "Failed to search members" });
      }
    });

    // Add health report generation endpoint
    app.post("/api/health-report", async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: "Authentication required" });
        }

        // Mock data for demonstration - replace with actual data fetching
        const metrics = [
          {
            name: "Steps",
            value: 8432,
            unit: "steps",
            date: new Date().toISOString()
          },
          {
            name: "Heart Rate",
            value: 72,
            unit: "bpm",
            date: new Date().toISOString()
          },
          {
            name: "Sleep",
            value: 7.5,
            unit: "hours",
            date: new Date().toISOString()
          },
          {
            name: "Calories",
            value: 2250,
            unit: "kcal",
            date: new Date().toISOString()
          }
        ];

        const achievements = [
          {
            name: "Fitness Warrior",
            description: "Complete 10 workouts in a month",
            completedAt: "2025-01-20",
            progress: 100
          },
          {
            name: "Consistency King",
            description: "Log in for 7 consecutive days",
            progress: 85
          },
          {
            name: "Health Champion",
            description: "Maintain heart rate zones during workouts",
            progress: 60
          }
        ];

        const filename = await generateHealthReport(userId, metrics, achievements);

        res.json({
          success: true,
          filename,
          downloadUrl: `/uploads/${filename}`
        });

      } catch (error) {
        console.error("Error generating health report:", error);
        res.status(500).json({
          error: "Failed to generate health report",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Add calendar event endpoints
    app.get("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
      try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

        // Get events from database
        const events = await db.query.marketingEvents.findMany({
          where: and(
            startDate ? gte(marketingEvents.startDate, startDate) : undefined,
            endDate ? lte(marketingEvents.endDate, endDate) : undefined
          ),
          orderBy: [marketingEvents.startDate]
        });

        res.json(events);
      } catch (error) {
        console.error("Error fetching calendar events:", error);
        res.status(500).json({ error: "Failed to fetch calendar events" });
      }
    });

    app.post("/api/marketing/calendar/events", async (req: AuthenticatedRequest, res) => {
      try {
        const { title, description, startDate, endDate, type, status, location } = req.body;

        // Validate required fields
        if (!title || !startDate || !type) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Create new event
        const [event] = await db
          .insert(marketingEvents)
          .values({
            title,
            description,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            type,
            status: status || 'scheduled',
            createdBy: req.user?.id || 'system',
            location
          })
          .returning();

        // Broadcast event to connected clients
        wsServer.broadcastToRoom('calendar', {
          type: 'calendar_event_created',
          data: event
        });

        res.json(event);
      } catch (error) {
        console.error("Error creating calendar event:", error);
        res.status(500).json({ error: "Failed to create calendar event" });
      }
    });

    app.post("/api/marketing/calendar/sync-outlook", async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Authentication required" });
        }

        // Simulate Outlook sync for now (will be replaced with actual Microsoft Graph API integration)
        await new Promise(resolve => setTimeout(resolve, 1000));

        const sampleOutlookEvent = {
          id: "outlook-1",
          title: "Marketing Team Meeting",
          startDate: new Date(),
          endDate: new Date(Date.now() + 3600000),
          type: "meeting",
          status: "scheduled",
          outlookEventId: "123456"
        };

        res.json({
          message: "Calendar synced with Outlook",
          syncedEvents: [sampleOutlookEvent]
        });
      } catch (error) {
        console.error("Error syncing with Outlook:", error);
        res.status(500).json({ error: "Failed to sync with Outlook calendar" });
      }
    });

    return httpServer;
  } catch (error) {
    console.error("Error registering routes:", error);
    throw error;
  }
}

import { WebSocketServer } from 'ws';
// ... existing imports remain unchanged ...

// Update WebSocket setup
export function setupWebSocketServer(httpServer: Server, app: Express): WebSocketServer {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/socket.io'
  });

  const clients = new Map<string, WebSocket>();
  const rooms = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'join_room') {
          const roomName = data.room;
          if (!rooms.has(roomName)) {
            rooms.set(roomName, new Set());
          }
          rooms.get(roomName)?.add(ws);
          console.log(`Client joined room: ${roomName}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      // Remove client from all rooms
      rooms.forEach(clients => clients.delete(ws));
    });
  });

  // Add broadcast helper
  wss.broadcastToRoom = (room: string, message: any) => {
    const clients = rooms.get(room);
    if (clients) {
      const messageStr = JSON.stringify(message);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
  };
  wss.broadcastTrainingLevel = async (userId: string) => {
    try {
      const trainingLevel = await getUserTrainingLevel(userId);
      wss.broadcastToRoom('training', { type: 'training_level_updated', trainingLevel });
    } catch (error) {
      console.error("Error broadcasting training level:", error);
    }
  };

  // Add calendar events endpoints
  app.get('/api/marketing/calendar/events', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const events = await db.select().from(marketingEvents)
        .where(
          and(
            gte(marketingEvents.startDate, new Date(startDate as string)),
            lte(marketingEvents.endDate, new Date(endDate as string))
          )
        );
      res.json(events);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
  });

  app.post('/api/marketing/calendar/events', async (req: AuthenticatedRequest, res) => {
    try {
      const eventData = {
        ...req.body,
        createdBy: req.user?.id || 'anonymous',
        status: 'scheduled'
      };

      const [event] = await db.insert(marketingEvents)
        .values(eventData)
        .returning();

      // Broadcast to all clients in the calendar room
      wss.broadcastToRoom('calendar', {
        type: 'calendar_event_created',
        event
      });

      res.json(event);
    } catch (error) {
      console.error('Error creating calendar event:', error);
      res.status(500).json({ error: 'Failed to create calendar event' });
    }
  });

  app.post('/api/marketing/calendar/sync-outlook', async (req: AuthenticatedRequest, res) => {
    try {
      // For demo purposes, simulate syncing with Outlook
      // In production, this would use Microsoft Graph API
      const events = await db.select().from(marketingEvents)
        .where(eq(marketingEvents.createdBy, req.user?.id || 'anonymous'));

      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update events with mock Outlook IDs
      const syncedEvents = await Promise.all(events.map(async event => {
        if (!event.outlookEventId) {
          const [updated] = await db.update(marketingEvents)
            .set({
              outlookEventId: `outlook-${Math.random().toString(36).slice(2)}`,
              outlookCalendarId: 'primary',
              lastSyncedAt: new Date()
            })
            .where(eq(marketingEvents.id, event.id))
            .returning();
          return updated;
        }
        return event;
      }));

      res.json({ syncedEvents });
    } catch (error) {
      console.error('Error syncing with Outlook:', error);
      res.status(500).json({ error: 'Failed to sync with Outlook' });
    }
  });

  return wss;
}