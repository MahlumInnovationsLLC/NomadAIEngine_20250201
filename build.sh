#!/bin/bash

# Build script for deployment
echo "Starting build process..."

# Navigate to client directory and build frontend
echo "Building frontend..."
cd client && npx vite build
cd ..

# Build server
echo "Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"