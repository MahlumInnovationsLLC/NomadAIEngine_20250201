#!/bin/bash

# Print current date/time
echo "Build started at $(date)"

# Check initial node_modules size
if [ -d "node_modules" ]; then
    echo "Initial node_modules size:"
    du -sh node_modules/
fi

# List largest packages in node_modules
if [ -d "node_modules" ]; then
    echo "Top 10 largest packages:"
    du -sh node_modules/* | sort -hr | head -n 10
fi

# Build the application and capture size information
echo "Building application..."
npm run build

# Check dist folder size
echo "Checking dist folder size..."
du -sh dist/
if [ -d "dist/public/assets" ]; then
    echo "Largest asset files:"
    find dist/public/assets -type f -exec du -sh {} \; | sort -hr | head -n 10
fi

# Print memory usage information
echo "Memory usage information:"
free -h

echo "Build completed at $(date)"