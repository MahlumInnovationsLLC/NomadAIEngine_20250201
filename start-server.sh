#!/bin/bash

# Force set the PORT environment variable to ensure consistent port usage
export PORT=5000

# Print environment information
echo "Starting server with:"
echo "PORT: $PORT"
echo "NODE_ENV: $NODE_ENV"
echo "Current directory: $(pwd)"

# Check for existing node processes
echo "Checking for existing node processes..."
ps aux | grep node

# Start the server with explicit environment variables
NODE_ENV=development PORT=5000 npm run dev