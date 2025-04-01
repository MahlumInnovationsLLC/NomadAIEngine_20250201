import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeManufacturingDatabase } from "./services/azure/facility_service";
import { initializeOpenAI } from "./services/azure/openai_service";
import { setupWebSocketServer } from "./services/websocket";
import manufacturingRoutes, { setupManufacturingSocketIO } from "./routes/manufacturing";
import { registerWebSocketManager } from "./routes/manufacturing/team-analytics";
import inventoryRoutes from "./routes/inventory";
import aiRoutes from "./routes/ai";
import salesRoutes from "./routes/sales";
import facilityRoutes from "./routes/facility";
import logisticsRoutes from "./routes/logistics";
import warehouseRoutes from "./routes/warehouse";
import azureADRouter from "./routes/azure-ad";
import ocrRouter from "./routes/ocr";

const app = express();
// Increase JSON and URL-encoded limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Trust proxy and enable CORS
app.set('trust proxy', true);
app.disable('x-powered-by');

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.host;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cache-Control', 'no-cache');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

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

let server: ReturnType<typeof createServer> | null = null;
let isShuttingDown = false;

const startServer = async (retryCount = 0) => {
  try {
    log("Initializing Azure services...");

    // Initialize services
    await initializeManufacturingDatabase();
    log("Manufacturing database initialized successfully");

    const openAIClient = await initializeOpenAI();
    if (!openAIClient) {
      log("Azure OpenAI disabled - AI features will be limited");
    } else {
      log("Azure OpenAI initialized successfully");
    }

    if (server) {
      await new Promise<void>((resolve) => {
        server!.close(() => resolve());
      });
    }

    server = createServer(app);

    // Setup WebSocket server with Socket.IO
    const wsServer = setupWebSocketServer(server);
    setupManufacturingSocketIO(wsServer.io); // Setup manufacturing namespace
    registerWebSocketManager(wsServer); // Register with team-analytics module
    app.set('wsServer', wsServer);

    // Register API routes
    // Add a simple status endpoint to test API connectivity
    app.get('/api/status', (req, res) => {
      res.json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        host: req.headers.host,
        origin: req.headers.origin,
        url: req.url
      });
    });

    // Serve test pages
    app.get('/test', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'server', 'test.html'));
    });

    // Serve static test files
    app.use('/connection-test', express.static(path.join(process.cwd(), 'public-test')));

    app.use('/api/manufacturing', manufacturingRoutes);
    app.use('/api/inventory', inventoryRoutes);
    app.use('/api/ai', aiRoutes);
    app.use('/api/sales', salesRoutes);
    app.use('/api/facility', facilityRoutes);
    app.use('/api/logistics', logisticsRoutes);
    app.use('/api/warehouse', warehouseRoutes);
    app.use('/api/azure-ad', azureADRouter);
    app.use('/api/ocr', ocrRouter);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      const details = err.stack || undefined;

      res.status(status).json({
        message,
        details: process.env.NODE_ENV === 'development' ? details : undefined
      });
    });

    // Setup Vite or serve static files
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const PORT = Number(process.env.PORT || 8080);
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    return new Promise<void>((resolve, reject) => {
      if (isShuttingDown) {
        return resolve();
      }

      const handleError = (error: any) => {
        if (error.code === 'EADDRINUSE') {
          if (retryCount < MAX_RETRIES) {
            log(`Port ${PORT} is busy, retrying in ${RETRY_DELAY/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
            setTimeout(() => {
              startServer(retryCount + 1).then(resolve).catch(reject);
            }, RETRY_DELAY);
          } else {
            const err = new Error(`Port ${PORT} is in use after ${MAX_RETRIES} attempts`);
            log(err.message);
            reject(err);
          }
        } else {
          console.error('Server error:', error);
          reject(error);
        }
      };

      server!.once('error', handleError);

      server!.listen(PORT, '0.0.0.0', () => {
        server!.removeListener('error', handleError);
        log(`Server running on port ${PORT} (0.0.0.0) with Socket.IO support`);
        resolve();
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    throw error;
  }
};

// Cleanup handler
const cleanup = async () => {
  if (isShuttingDown) return;

  isShuttingDown = true;
  log('Starting graceful shutdown...');

  if (server) {
    await new Promise<void>((resolve) => {
      server!.close(() => {
        log('Server shutdown complete');
        resolve();
      });
    });
  }

  process.exit(0);
};

// Register cleanup handlers
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  log('Critical error occurred, initiating shutdown...');
  cleanup();
});

// Start the server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});