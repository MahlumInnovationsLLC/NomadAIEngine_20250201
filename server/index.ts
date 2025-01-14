// index.ts

import express, { type Request, Response, NextFunction } from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeCosmosDB } from "./services/azure/cosmos_service";
import { initializeOpenAI } from "./services/azure/openai_service";

const app = express();

// Basic middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple request-logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Create a WebSocket server (noServer = true)
const wss = new WebSocketServer({ noServer: true });

// Attach WebSocket upgrade event
server.on("upgrade", (request, socket, head) => {
  // If needed, skip non-websocket upgrade checks, or do your own auth logic.
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

// Error-handling middleware for Express
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Server error:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(status).json({ message });
});

// If in development, enable Vite dev middleware; otherwise, serve static
// We'll do this AFTER server starts listening in an async post-start block.
async function initializeDevOrStatic() {
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
}

// Immediately start listening so Azure sees a responding container
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);

  // Now do async tasks AFTER binding to the port
  void postStartupInit();
});

// Our main async init tasks that we now run AFTER the server is up:
async function postStartupInit() {
  try {
    log("Registering routes...");
    await registerRoutes(app);

    // Initialize Azure services in the background
    await initializeServices();

    // Dev or production mode setup
    await initializeDevOrStatic();

    console.log("postStartupInit complete.");
  } catch (error) {
    console.error("Failed in postStartupInit:", error);
  }
}

// This function attempts any needed Azure inits (Cosmos, OpenAI)
async function initializeServices() {
  log("Initializing Azure services...");

  // 1) Initialize Cosmos DB
  try {
    await initializeCosmosDB();
    log("Cosmos DB initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Cosmos DB, continuing with limited functionality:", error);
  }

  // 2) Initialize Azure OpenAI
  try {
    const openAIClient = await initializeOpenAI();
    if (!openAIClient) {
      log("Azure OpenAI disabled - AI features will be limited");
    } else {
      log("Azure OpenAI initialized successfully");
    }
  } catch (error) {
    console.error("Failed to initialize OpenAI, continuing with limited functionality:", error);
  }
}

// Handle WebSocket connections
wss.on("connection", (ws) => {
  ws.on("error", console.error);
  ws.on("message", (data) => {
    try {
      console.log("received: %s", data);
      // Handle the incoming websocket message...
    } catch (e) {
      console.error("Error processing message:", e);
    }
  });
});