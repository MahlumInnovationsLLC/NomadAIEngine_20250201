import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeManufacturingDatabase } from "./services/azure/facility_service";
import { initializeOpenAI } from "./services/azure/openai_service";
import { setupWebSocketServer } from "./services/websocket";
import manufacturingRoutes from "./routes/manufacturing";
import inventoryRoutes from "./routes/inventory";
import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Update CORS middleware for SPA
app.use((req, res, next) => {
  // Allow requests from our SPA origin
  const allowedOrigins = [
    'https://46b47950-8491-429d-bb1f-18901647ad16-00-2mfwamy4bpsuy.spock.replit.dev',
    process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : ''
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  // Allow credentials and required headers for token-based auth
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

// Register routes
app.use('/api/manufacturing', manufacturingRoutes);
app.use('/api/inventory', inventoryRoutes);

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
    // Initialize Prisma
    await prisma.$connect();
    log("Database connection established successfully");

    // Kill any existing process on port 5000
    try {
      const server = app.listen(5000);
      server.close();
    } catch (error) {
      console.log('Port 5000 is free to use');
    }

    log("Initializing Azure services...");

    try {
      await initializeManufacturingDatabase();
      log("Manufacturing database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize manufacturing database, continuing with limited functionality:", error);
    }

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

    const server = createServer(app);

    // Setup WebSocket server with both Socket.IO and raw WebSocket support
    const wsServer = setupWebSocketServer(server);

    // Register routes after WebSocket setup
    await registerRoutes(app);

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

    // Kill any existing process on port 5000
    server.on('error', (e: any) => {
      if (e.code === 'EADDRINUSE') {
        log(`Port ${PORT} is busy, attempting to close previous instance...`);
        server.close();
        process.exit(1);
      }
    });

    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT} with WebSocket support`);
    });

    // Handle cleanup on shutdown
    process.on('SIGTERM', async () => {
      await prisma.$disconnect();
      server.close(() => {
        log('Server shutting down');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();