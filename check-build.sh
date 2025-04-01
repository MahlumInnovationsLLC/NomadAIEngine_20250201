#!/bin/bash

# Simple script to check the production build status
echo "Checking production build status..."

# Look for build files in expected locations
DIST_PUBLIC="dist/public/index.html"
CLIENT_DIST="client/dist/index.html"

# Check if files exist
if [ -f "$DIST_PUBLIC" ]; then
  echo "✅ Found build at $DIST_PUBLIC"
  ls -la dist/public/
else
  echo "❌ No build found at $DIST_PUBLIC"
fi

if [ -f "$CLIENT_DIST" ]; then
  echo "✅ Found build at $CLIENT_DIST"
  ls -la client/dist/
else
  echo "❌ No build found at $CLIENT_DIST"
fi

# If neither build exists, suggest running build script
if [ ! -f "$DIST_PUBLIC" ] && [ ! -f "$CLIENT_DIST" ]; then
  echo ""
  echo "No production build found. Consider running:"
  echo "  bash build.sh"
  echo ""
  echo "Or for deployment:"
  echo "  NODE_ENV=production bash build.sh"
fi

echo ""
echo "Current environment information:"
echo "NODE_ENV=${NODE_ENV:-development}"
echo "PORT=${PORT:-5000}"