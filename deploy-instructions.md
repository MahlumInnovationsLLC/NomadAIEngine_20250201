# Deployment Instructions for Nomad AI Engine Application

## Recent Deployment Fixes

We've made the following critical fixes to ensure successful deployment:

1. **Fixed path reference in client/index.html**: Updated from `/src/main.tsx` to `./src/main.tsx` to use a relative path.
2. **Enhanced PORT environment variable handling**: The server now correctly uses process.env.PORT in all environments.
3. **Added robust root route handler**: Created a dedicated '/' route that works even if the frontend build is unavailable.
4. **Improved routing order**: Ensured the root handler takes precedence over Vite middleware.

## Pre-Deployment Checks

1. Ensure your main.tsx file is in `client/src/main.tsx` (this is confirmed)
2. Ensure the server correctly uses process.env.PORT (this is now fixed)
3. Ensure all environment variables are set correctly

## Replit Deployment Steps

### 1. Configure Build Command

When deploying through Replit, you'll need to modify the build command in the deployment settings:

```
cd client && vite build && cd .. && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

This command does two important things:
- First, it navigates to the client directory and builds the frontend assets
- Then, it returns to the root directory and builds the server code

### 2. Configure Run Command

Set the run command in deployment settings to:

```
NODE_ENV=production node dist/index.js
```

This ensures the application runs in production mode with the correct environment settings.

### 3. Port Configuration

Ensure port configuration in Replit is set to:
- Internal Port: 5000
- External Port: 80

This mapping is already configured in your .replit file, but verify it's preserved in the deployment settings.

### 4. Environment Variables

Make sure all required environment variables are set in the deployment environment:
- AZURE_FORM_RECOGNIZER_KEY
- AZURE_FORM_RECOGNIZER_ENDPOINT
- NOMAD_AZURE_TENANT_ID (for Azure AD authentication)
- NOMAD_AZURE_CLIENT_ID (for Azure AD authentication)
- NOMAD_AZURE_AD_SECRET (for Azure AD authentication)
- Other application-specific variables

### 5. Deploy

After configuring these settings, deploy the application using Replit's deploy button.

## Troubleshooting

If you encounter the "pre-transform error for /src/main.tsx" again:
1. Double-check the build command includes `cd client` before running Vite
2. Verify that index.html in the client directory refers to the correct path for main.tsx
   - We've updated this from `/src/main.tsx` to `./src/main.tsx` which should fix the issue
   - The leading slash was causing Vite to look in the wrong location

For 502 errors:
1. Check server logs to see if the application is successfully binding to port 5000
2. Ensure the application isn't crashing due to missing environment variables
3. Check that the server is properly serving static assets from the dist/public directory

## Files to Check When Troubleshooting

- `vite.config.ts` - Verifies the root is set to client directory
- `server/vite.ts` - Handles serving the frontend in development
- `server/index.ts` - Confirms proper port binding (5000)
- `client/index.html` - Confirms proper reference to main.tsx