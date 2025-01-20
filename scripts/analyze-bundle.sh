
#!/bin/bash

echo "Analyzing bundle size..."
du -sh dist/public/assets/* | sort -hr

echo "\nLargest files in dist:"
find dist -type f -exec du -sh {} \; | sort -hr | head -n 10

echo "\nNode modules by size:"
du -sh node_modules/* | sort -hr | head -n 15
