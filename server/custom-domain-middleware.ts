import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

/**
 * Custom middleware to handle requests on custom domains
 * This helps prevent 502 errors by ensuring all routes are properly handled
 */
export function customDomainMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check if this is a health check request from Replit
  if (req.path === '/healthz' || req.path === '/health' || req.path === '/ping') {
    return res.status(200).json({ status: 'ok', message: 'Health check passed' });
  }

  // Check if this is an API request
  if (req.path.startsWith('/api/')) {
    // Let API requests pass through to the API routes
    return next();
  }

  // Check for static files in the build directory
  const possibleBuildPaths = [
    path.resolve(process.cwd(), 'dist/public'),
    path.resolve(process.cwd(), 'client/dist')
  ];

  // For root path specifically, try to serve index.html from build path
  if (req.path === '/' || req.path === '') {
    for (const buildPath of possibleBuildPaths) {
      const indexPath = path.join(buildPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log(`Found index.html at ${indexPath}, serving for root path`);
        return res.sendFile(indexPath);
      }
    }
  }

  // Continue to next middleware
  next();
}

/**
 * Fallback middleware for handling 404s and SPA routing
 * This should be registered after all other routes
 */
export function fallbackMiddleware(req: Request, res: Response) {
  // Skip fallback for API routes that weren't handled
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.originalUrl
    });
  }

  // Try to serve the SPA index.html for client-side routing
  const possibleBuildPaths = [
    path.resolve(process.cwd(), 'dist/public'),
    path.resolve(process.cwd(), 'client/dist')
  ];

  for (const buildPath of possibleBuildPaths) {
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log(`Serving index.html at ${indexPath} for SPA route: ${req.path}`);
      return res.sendFile(indexPath);
    }
  }

  // Provide a helpful fallback for missing build
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
      </style>
    </head>
    <body>
      <h1>NOMAD AI Engine</h1>
      <div class="card">
        <h2>Route Not Found</h2>
        <p>The requested page "${req.path}" does not exist.</p>
        <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
        <p>Server Time: ${new Date().toISOString()}</p>
      </div>
      <div class="card">
        <h2>Build Status</h2>
        <p>The frontend build may be missing or incomplete.</p>
        <p>Please make sure the build process completed successfully.</p>
      </div>
    </body>
    </html>
  `;
  return res.status(404).type('html').send(html);
}