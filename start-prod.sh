#!/bin/bash

# Production start script
echo "Starting production server..."

# Set production environment
export NODE_ENV=production

# Port configuration
export PORT=${PORT:-5000}

# Start the server
node dist/index.js