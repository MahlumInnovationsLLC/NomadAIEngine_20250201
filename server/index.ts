import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeCosmosDB } from "./services/azure/cosmos_service";
import { initializeOpenAI } from "./services/azure/openai_service";
import { initializeEquipmentDatabase } from "./services/azure/equipment_service";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logging middleware
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
    log("Starting server initialization...");

    // Initialize Azure services
    log("Initializing Azure services...");

    // Initialize Cosmos DB
    try {
      log("Starting Cosmos DB initialization...");
      await initializeCosmosDB();
      log("✓ Cosmos DB initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Cosmos DB:", error);
      log("! Cosmos DB initialization failed - continuing with limited functionality");
    }

    // Initialize Azure OpenAI
    try {
      log("Starting Azure OpenAI initialization...");
      const openAIClient = await initializeOpenAI();
      if (!openAIClient) {
        log("! Azure OpenAI disabled - AI features will be limited");
      } else {
        log("✓ Azure OpenAI initialized successfully");
      }
    } catch (error) {
      console.error("Failed to initialize OpenAI:", error);
      log("! Azure OpenAI initialization failed - continuing with limited functionality");
    }

    // Initialize Equipment Database
    try {
      log("Starting Equipment database initialization...");
      const equipmentDbInitialized = await initializeEquipmentDatabase();
      if (equipmentDbInitialized) {
        log("✓ Equipment database initialized with Azure Cosmos DB backup");
      } else {
        log("! Equipment database initialized in PostgreSQL-only mode");
      }
    } catch (error) {
      console.error("Failed to initialize Equipment database:", error);
      log("! Equipment database initialization failed - check database connection");
      throw error; // This is critical, we need the database
    }

    log("Registering routes and initializing server...");
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      log("Setting up Vite development server...");
      await setupVite(app, server);
      log("✓ Vite development server initialized");
    } else {
      log("Setting up static file serving...");
      serveStatic(app);
      log("✓ Static file serving initialized");
    }

    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`✓ Server running on port ${PORT}`);
      log("Server initialization complete!");
    });
  } catch (error) {
    console.error("Fatal error during server startup:", error);
    log("! Server initialization failed");
    process.exit(1);
  }
})();