import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeOpenAI } from "./services/azure/openai_service";
import { initializeEquipmentDatabase } from "./services/azure/equipment_service";
import { db } from "@db";
import { equipment } from "@db/schema";

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

async function initializeDatabase() {
  let retries = 3;
  while (retries > 0) {
    try {
      log("Attempting database connection...");

      // Log database connection details (without sensitive info)
      log(`Database host: ${process.env.PGHOST}`);
      log(`Database port: ${process.env.PGPORT}`);
      log(`Database name: ${process.env.PGDATABASE}`);

      // Test PostgreSQL connection using the equipment table
      await db.select().from(equipment).limit(1);
      log("✓ PostgreSQL database connection successful");

      // Verify schema exists
      try {
        const [result] = await db.select({ 
          table_exists: db.sql`EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'equipment'
          )` 
        }).limit(1);

        if (!result?.table_exists) {
          throw new Error("Equipment table does not exist");
        }
        log("✓ Database schema verification successful");
      } catch (schemaError) {
        console.error("Schema verification failed:", schemaError);
        throw new Error("Database schema verification failed");
      }

      return true;
    } catch (error) {
      console.error(`Database connection attempt failed (${retries} retries left):`, error);
      retries--;
      if (retries > 0) {
        log(`Retrying database connection in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  throw new Error("Failed to connect to PostgreSQL database after multiple attempts");
}

(async () => {
  try {
    log("Starting server initialization...");

    // Initialize PostgreSQL first as it's critical
    try {
      log("Initializing PostgreSQL database connection...");
      await initializeDatabase();
    } catch (error) {
      console.error("Critical error - Database initialization failed:", error);
      process.exit(1);
    }

    // Initialize Equipment Database with Azure Blob Storage backup
    try {
      log("Starting Equipment database initialization...");
      const equipmentDbInitialized = await initializeEquipmentDatabase();
      if (equipmentDbInitialized) {
        log("✓ Equipment database initialized with Azure Blob Storage backup");
      } else {
        log("! Equipment database initialized in PostgreSQL-only mode");
      }
    } catch (error) {
      console.error("Failed to initialize Equipment database:", error);
      log("! Equipment database initialization failed - check database connection");
      throw error; // This is critical, we need the database
    }

    // Initialize Azure OpenAI
    let openAIInitialized = false;
    try {
      log("Starting Azure OpenAI initialization...");
      const openAIClient = await initializeOpenAI();
      if (!openAIClient) {
        log("! Azure OpenAI disabled - AI features will be limited");
      } else {
        openAIInitialized = true;
        log("✓ Azure OpenAI initialized successfully");
      }
    } catch (error) {
      console.error("Failed to initialize OpenAI:", error);
      log("! Azure OpenAI initialization failed - continuing with limited functionality");
    }

    log("Registering routes and initializing server...");
    const server = registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client
    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`✓ Server running on port ${PORT}`);
      log("Server initialization complete!");
      log(`Services status:
        PostgreSQL: ✓ Connected
        Azure Blob Storage: ${process.env.AZURE_STORAGE_CONNECTION_STRING ? '✓ Connected' : '⚠ Disabled'}
        OpenAI: ${openAIInitialized ? '✓ Connected' : '⚠ Disabled'}
      `);
    });
  } catch (error) {
    console.error("Fatal error during server startup:", error);
    log("! Server initialization failed");
    process.exit(1);
  }
})();