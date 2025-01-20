
import express, { type Request, Response, NextFunction } from "express";
import { Server } from "socket.io";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeCosmosDB } from "./services/azure/cosmos_service";
import { initializeOpenAI } from "./services/azure/openai_service";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

(async () => {
  try {
    // Initialize Azure services first
    log("Initializing Azure services...");

    // Initialize Cosmos DB
    try {
      await initializeCosmosDB();
      log("Cosmos DB initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Cosmos DB, continuing with limited functionality:", error);
    }

    // Initialize Azure OpenAI
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

    const server = await registerRoutes(app);
    
    // Initialize WebSocket service with proper error handling
    const wsServer = setupWebSocketServer(server);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
