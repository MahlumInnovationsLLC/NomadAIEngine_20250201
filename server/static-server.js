// A simple static file server for production use

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Find the build directory
const buildPaths = [
  path.resolve(process.cwd(), 'dist/public'),
  path.resolve(process.cwd(), 'client/dist')
];

let validBuildPath = null;
for (const buildPath of buildPaths) {
  if (fs.existsSync(path.join(buildPath, 'index.html'))) {
    validBuildPath = buildPath;
    console.log(`Found valid build at ${buildPath}`);
    break;
  }
}

if (!validBuildPath) {
  console.error(`No valid build found. Checked: ${buildPaths.join(', ')}`);
  process.exit(1);
}

// Rewrite asset paths in index.html to use relative paths
const indexPath = path.join(validBuildPath, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Replace absolute paths with relative paths in the index.html file
indexContent = indexContent.replace(/src="\/assets\//g, 'src="./assets/');
indexContent = indexContent.replace(/href="\/assets\//g, 'href="./assets/');

// Write the modified index.html back to disk
fs.writeFileSync(indexPath, indexContent);
console.log('Updated asset paths in index.html to use relative references');

// Serve static files
app.use(express.static(validBuildPath));

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(validBuildPath, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Static server running on http://0.0.0.0:${PORT}`);
});