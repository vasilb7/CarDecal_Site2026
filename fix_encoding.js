const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'pages', 'AdminDashboard.tsx');
try {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  
  // Line 1583 in 1-based index is index 1582
  if (lines.length >= 1583) {
    console.log('Original line:', lines[1582]);
    lines[1582] = "                                    showToast('Избраните снимки бяха изтрити!', 'success');";
    console.log('New line:', lines[1582]);
    
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log('Successfully updated line 1583');
  } else {
    console.error('File too short');
  }
} catch (err) {
  console.error('Error:', err);
}
