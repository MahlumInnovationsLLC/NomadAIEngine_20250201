import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeManufacturingDatabase } from "./services/azure/facility_service";
import { initializeOpenAI } from "./services/azure/openai_service";
import { setupWebSocketServer } from "./services/websocket";
import manufacturingRoutes from "./routes/manufacturing";
import inventoryRoutes from "./routes/inventory";
import aiRoutes from "./routes/ai";
import salesRoutes from "./routes/sales";
import facilityRoutes from "./routes/facility";
import logisticsRoutes from "./routes/logistics";

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Update CORS middleware for SPA and WebSocket
app.use((req, res, next) => {
  const allowedOrigins = [
    process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '',
    'https://46b47950-8491-429d-bb1f-18901647ad16-00-2mfwamy4bpsuy.spock.replit.dev'
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

// Register routes
app.use('/api/manufacturing', manufacturingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/facility', facilityRoutes);
app.use('/api/logistics', logisticsRoutes);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Health check endpoint - this is crucial for the workflow to detect the server is ready
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

(async () => {
  try {
    log("Initializing Azure services...");

    try {
      await initializeManufacturingDatabase();
      log("Manufacturing database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize manufacturing database:", error);
    }

    try {
      const openAIClient = await initializeOpenAI();
      if (!openAIClient) {
        log("Azure OpenAI disabled - AI features will be limited");
      } else {
        log("Azure OpenAI initialized successfully");
      }
    } catch (error) {
      console.error("Failed to initialize OpenAI:", error);
    }

    const server = createServer(app);

    // Setup WebSocket server
    const wsServer = setupWebSocketServer(server);
    app.set('wsServer', wsServer);

    // Register routes after WebSocket setup
    await registerRoutes(app);

    // Error handling middleware
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

    // Start server and wait for it to be ready
    await new Promise<void>((resolve) => {
      server.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is ready and listening on port ${PORT}`);
        log(`Server running on port ${PORT} with WebSocket support`);
        resolve();
      });
    });

    // Handle cleanup on shutdown
    process.on('SIGTERM', () => {
      server.close(() => {
        log('Server shutting down');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();