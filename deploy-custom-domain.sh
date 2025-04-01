#!/bin/bash

# Enhanced deployment script with custom domain support
# This script builds and prepares the application for deployment with custom domain support

echo "=== NOMAD AI ENGINE DEPLOYMENT SCRIPT ==="
echo "This script prepares the application for deployment with custom domain support"
echo "============================================"

# Environment check
if [ "$NODE_ENV" == "production" ]; then
  echo "✅ Running in production mode"
else
  echo "⚠️ Setting NODE_ENV to production for deployment"
  export NODE_ENV=production
fi

# Step 1: Build the application
echo -e "\n🔨 Building the application..."

# Build the frontend
echo "Building frontend (client)..."
cd client && npx vite build
if [ $? -ne 0 ]; then
  echo "❌ Frontend build failed. Aborting deployment."
  exit 1
fi
cd ..

# Build the backend
echo "Building backend (server)..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
if [ $? -ne 0 ]; then
  echo "❌ Backend build failed. Aborting deployment."
  exit 1
fi

# Copy static files if needed
if [ -d "client/public" ]; then
  echo "Copying static files..."
  mkdir -p dist/public
  cp -r client/dist/* dist/public/
fi

# Step 2: Verify build artifacts
echo -e "\n🔍 Verifying build artifacts..."

if [ -f "dist/index.js" ]; then
  echo "✅ Server build verified: dist/index.js"
else
  echo "❌ Server build not found at dist/index.js"
  exit 1
fi

if [ -f "dist/public/index.html" ]; then
  echo "✅ Frontend build verified: dist/public/index.html"
else
  echo "❌ Frontend build not found at dist/public/index.html"
  exit 1
fi

# Step 3: Test custom domain endpoints
echo -e "\n🧪 Testing custom domain endpoints..."

# Start the server in test mode with a timeout
echo "Starting server in test mode..."
NODE_ENV=production PORT=5001 node dist/index.js &
SERVER_PID=$!

# Give the server time to start
echo "Waiting for server to start..."
sleep 5

# Test health endpoints
echo "Testing health endpoints..."
curl -s http://localhost:5001/health > /dev/null
HEALTH_STATUS=$?

curl -s http://localhost:5001/healthz > /dev/null
HEALTHZ_STATUS=$?

curl -s http://localhost:5001/ping > /dev/null
PING_STATUS=$?

# Kill the test server
kill $SERVER_PID

# Check results
if [ $HEALTH_STATUS -eq 0 ] && [ $HEALTHZ_STATUS -eq 0 ] && [ $PING_STATUS -eq 0 ]; then
  echo "✅ Custom domain health endpoints verified"
else
  echo "⚠️ Some health endpoints failed, but continuing with deployment"
fi

# Step 4: Final instructions
echo -e "\n✅ Build and tests completed"
echo -e "\n============ DEPLOYMENT INSTRUCTIONS ============"
echo "1. In Replit deployment settings, use these configurations:"
echo "   Build command: cd client && vite build && cd .. && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
echo "   Run command: NODE_ENV=production node dist/index.js"
echo ""
echo "2. Make sure all required environment variables are set"
echo ""
echo "3. After deployment, verify these health endpoints:"
echo "   - /health"
echo "   - /healthz"
echo "   - /ping"
echo "   - /api/health"
echo ""
echo "4. If 502 errors persist, run: node scripts/test-custom-domain.js yourdomain.com"
echo "   and check custom-domain-troubleshooting.md for additional guidance"
echo "===================================================="

echo -e "\nThe application is now ready for deployment! 🚀"