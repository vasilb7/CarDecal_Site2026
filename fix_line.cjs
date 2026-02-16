const fs = require('fs');
const path = require('path');

const targetPath = path.join(process.cwd(), 'pages', 'AdminDashboard.tsx');

try {
  const content = fs.readFileSync(targetPath, 'utf8');
  const lines = content.split(/\r?\n/);
  
  if (lines.length > 1582) {
    const originalLine = lines[1582];
    console.log('Original line 1583:', originalLine);
    
    // Check if it's the right line content or close to it
    if (originalLine.includes('showToast')) {
      const newLine = "                                    showToast('Избраните снимки бяха изтрити!', 'success');";
      lines[1582] = newLine;
      console.log('Replaced with:', newLine);
      
      fs.writeFileSync(targetPath, lines.join('\n'));
      console.log('File written successfully.');
    } else {
        console.log('Line 1583 does not contain showToast, skipping.');
    }
  } else {
    console.error('File too short');
  }

} catch (e) {
  console.error('Error:', e);
}
