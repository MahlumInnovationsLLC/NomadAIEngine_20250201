import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'client', 'src', 'components', 'manufacturing', 'ProductionLinePanel.tsx');

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Replace all instances of the Badge component showing raw status with formatted status
  const updatedContent = data.replace(
    /<Badge variant="outline">\{project\.status\}<\/Badge>/g,
    '<Badge variant="outline">{formatStatusForDisplay(project.status)}</Badge>'
  );

  fs.writeFile(filePath, updatedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('Successfully updated all status display badges in ProductionLinePanel.tsx');
  });
});