import express from 'express';
import fs from 'fs';
import path from 'path';

const healthRouter = express.Router();

/**
 * Enhanced health check endpoint for custom domains
 * This provides verbose health information to help with debugging domain issues
 */
healthRouter.get('/', (req, res) => {
  const buildPaths = [
    path.resolve(process.cwd(), 'dist/public'),
    path.resolve(process.cwd(), 'client/dist')
  ];
  
  // Check for build paths and index.html
  const buildStatus = buildPaths.map(buildPath => {
    const exists = fs.existsSync(buildPath);
    const indexExists = exists && fs.existsSync(path.join(buildPath, 'index.html'));
    return {
      path: buildPath,
      exists,
      indexExists
    };
  });
  
  // Gather detailed health information
  const healthInfo = {
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    request: {
      host: req.headers.host,
      origin: req.headers.origin,
      protocol: req.protocol,
      url: req.url,
      path: req.path,
      method: req.method,
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-forwarded-host': req.headers['x-forwarded-host'],
      'x-forwarded-proto': req.headers['x-forwarded-proto']
    },
    server: {
      port: process.env.PORT || '5000',
      address: '0.0.0.0',
      uptime: process.uptime()
    },
    build: buildStatus
  };
  
  res.status(200).json(healthInfo);
});

/**
 * Specific health check endpoint for Replit deployment
 * This endpoint responds with a simple 200 OK to indicate the server is running
 */
healthRouter.get('/ping', (_req, res) => {
  res.status(200).send('OK');
});

/**
 * Built frontend check endpoint
 * This endpoint checks if the built frontend files exist
 */
healthRouter.get('/frontend', (_req, res) => {
  const buildPaths = [
    path.resolve(process.cwd(), 'dist/public'),
    path.resolve(process.cwd(), 'client/dist')
  ];
  
  // Check for built frontend files
  for (const buildPath of buildPaths) {
    if (fs.existsSync(buildPath) && fs.existsSync(path.join(buildPath, 'index.html'))) {
      return res.json({
        status: 'ok',
        path: buildPath,
        message: 'Frontend build found'
      });
    }
  }
  
  // No build found
  res.status(404).json({
    status: 'error',
    message: 'Frontend build not found',
    checkedPaths: buildPaths
  });
});

export default healthRouter;