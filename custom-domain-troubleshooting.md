# Custom Domain Troubleshooting Guide

This guide provides steps to resolve common issues with custom domains in Replit deployments, particularly 502 HTTP errors.

## Recent Fixes Implemented

We've made the following improvements to resolve 502 HTTP errors on custom domains:

1. **Enhanced Root Route Handling**: Added robust handling of the root route (`/`) that works even if frontend build files are missing
2. **Custom Domain Middleware**: Created middleware specifically for handling requests from custom domains
3. **Health Check Endpoints**: Added dedicated health check endpoints at `/health`, `/healthz`, and `/ping` for monitoring and deployment checks
4. **Enhanced Error Handling**: Improved fallback behavior when errors occur to ensure requests don't result in 502s
5. **Diagnostic Tools**: Added a test script that verifies server response to custom domain requests

## Common Issues and Solutions

### 1. 502 HTTP Errors

**Causes:**
- Incorrect port configuration
- Misconfigured health check endpoints
- Root route not properly handled
- Missing or incomplete frontend build

**Solutions:**
- Ensure PORT environment variable is properly used (✓ fixed in our code)
- Verify health check endpoints respond with 200 status (✓ implemented)
- Ensure root route (`/`) handler works correctly (✓ fixed)
- Make sure server can handle requests from different Accept headers (✓ fixed)

### 2. Custom Domain Not Working

**Verification Steps:**
1. Run the test script: `node scripts/test-custom-domain.js yourdomain.com`
2. Check if health checks respond correctly
3. Verify custom domain is properly configured in Replit deployment settings
4. Ensure DNS settings point to your Replit app correctly

## Deployment Checklist

Before deploying with a custom domain, ensure:

1. **Build Configuration**:
   - Build command: `cd client && vite build && cd .. && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`
   - Run command: `NODE_ENV=production node dist/index.js`

2. **Environment Variables**:
   - Set all necessary environment variables in deployment settings
   - Ensure PORT variable is available in your deployment environment

3. **Health Checks**:
   - Replit's deployment platform performs health checks to verify your app is running
   - Our new health endpoints (/health, /healthz, /ping) ensure these checks pass

## Detailed Diagnostics

If issues persist after deployment:

1. Check application logs in Replit dashboard
2. Test each endpoint using the test script
3. Verify your server listens on 0.0.0.0 (not localhost or 127.0.0.1)
4. Ensure custom domain DNS settings have propagated

## Need More Help?

If you continue to experience issues:

1. Try rebuilding and redeploying the application
2. Check Replit's status page for any ongoing service issues
3. Submit a detailed support request to Replit with logs and error details