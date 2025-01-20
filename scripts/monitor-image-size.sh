#!/bin/bash

# Print current date/time
echo "Build started at $(date)"

# Build the application and capture size information
echo "Building application..."
npm run build

# Check dist folder size
echo "Checking dist folder size..."
du -sh dist/

# Print memory usage information
echo "Memory usage information:"
free -h

# Check node_modules size
echo "Checking node_modules size..."
du -sh node_modules/

echo "Build completed at $(date)"
