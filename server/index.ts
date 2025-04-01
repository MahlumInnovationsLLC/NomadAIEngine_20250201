import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
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
import healthRouter from "./routes/health";
import { customDomainMiddleware, fallbackMiddleware } from "./custom-domain-middleware";

const app = express();

// Root route handler - defined before any middleware
// This ensures it takes priority over all other routes
app.get('/', (req, res, next) => {
  // Only handle root route if it's the exact match
  if (req.path !== '/') {
    return next();
  }
  
  // Check if we're in production and have a built frontend to serve
  const indexPaths = [
    path.resolve(process.cwd(), 'dist/public/index.html'),
    path.resolve(process.cwd(), 'client/dist/index.html')
  ];
  
  // First, try to serve the built frontend if it exists
  // We'll check for build files even in development mode
  for (const indexPath of indexPaths) {
    if (fs.existsSync(indexPath)) {
      console.log(`Found index.html at ${indexPath}, serving it`);
      return res.sendFile(indexPath);
    }
  }
  console.log(`No build found at ${indexPaths.join(' or ')}`);
  
  // In production mode, we'll add a warning that the build is missing
  const isMissingProductionBuild = process.env.NODE_ENV === 'production';
  
  // If we're in development or no build found, use our fallback behavior
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    // For HTML requests, serve a simple HTML page with links to API endpoints
    // This ensures the domain works even if the frontend build isn't available
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NOMAD AI Engine</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
          }
          h1 { color: #333; }
          .card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .endpoint {
            background: #f5f5f5;
            padding: 0.5rem;
            border-radius: 4px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <h1>NOMAD AI Engine</h1>
        <div class="card">
          <h2>Server Status: Online</h2>
          <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
          <p>Time: ${new Date().toISOString()}</p>
        </div>
        <div class="card">
          <h2>Available API Endpoints</h2>
          <div class="endpoint">/api/status</div>
          <div class="endpoint">/api/health</div>
        </div>
        ${isMissingProductionBuild ? `
        <div class="card" style="background-color: #fff3cd; border-color: #ffeeba;">
          <h2>⚠️ Production Notice</h2>
          <p>This is a fallback page. The production build was not found at:</p>
          <div class="endpoint">${indexPaths.join('</div><div class="endpoint">')}</div>
          <p>Please make sure the build process completed successfully.</p>
        </div>` : ''}
      </body>
      </html>
    `;
    return res.type('html').send(html);
  } else {
    // Respond directly for API clients or other non-HTML requests
    return res.json({
      app: 'NOMAD AI Engine',
      status: 'running',
      environment: process.env.NODE_ENV || 'development',
      time: new Date().toISOString(),
      endpoints: {
        api: '/api',
        status: '/api/status',
        health: '/api/health'
      }
    });
  }
});

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

    // Register enhanced health check router
    app.use('/api/health', healthRouter);
    
    // Add direct health check endpoints for Replit and custom domains
    app.get('/healthz', (req, res) => res.status(200).send('OK'));
    app.get('/health', (req, res) => res.status(200).send('OK'));
    app.get('/ping', (req, res) => res.status(200).send('OK'));
    
    // Root route handler is already defined at the top of the file

    app.use('/api/manufacturing', manufacturingRoutes);
    app.use('/api/inventory', inventoryRoutes);
    app.use('/api/ai', aiRoutes);
    app.use('/api/sales', salesRoutes);
    app.use('/api/facility', facilityRoutes);
    app.use('/api/logistics', logisticsRoutes);
    app.use('/api/warehouse', warehouseRoutes);
    app.use('/api/azure-ad', azureADRouter);
    app.use('/api/ocr', ocrRouter);

    // Add a catch-all route for API endpoints that don't exist
    app.use('/api/*', (req, res) => {
      res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });

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

    // Register custom domain middleware to handle requests from custom domains
    // This should be placed before the Vite/static middleware to ensure proper handling
    app.use(customDomainMiddleware);

    // The root handler should be processed before setting up Vite or static file serving
    // Otherwise, Vite/static middleware might intercept the root route
    
    // Setup Vite or serve static files for remaining routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    
    // Register the fallback middleware which will handle any routes not caught by previous middleware
    // This is particularly important for SPA (Single Page Application) routing and custom domains
    app.use(fallbackMiddleware);

    // Always use PORT environment variable when available (critical for Replit deployment)
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;
    
    // Log the PORT we're using
    console.log(`Using PORT=${PORT} (from env: ${process.env.PORT || 'not set'})`);

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

      // Log detailed connection info
      console.log(`Attempting to start server on port ${PORT} with host 0.0.0.0`);
      console.log(`Environment info: NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}`);
      
      server!.listen(PORT, '0.0.0.0', () => {
        server!.removeListener('error', handleError);
        const address = server!.address();
        console.log(`Server address: ${JSON.stringify(address)}`);
        log(`Server running on port ${PORT} (0.0.0.0) with Socket.IO support`);
        log(`External URL should be: http://localhost:${PORT}/api/status`);
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