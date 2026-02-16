const fs = require('fs');
const path = require('path');

const targetPath = 'pages/AdminDashboard.tsx';
console.log('Reading file:', targetPath);

try {
  const content = fs.readFileSync(targetPath, 'utf8');
  console.log('Read successfully, length:', content.length);
  
  const lines = content.split('\n'); // Using simple \n split
  console.log('Line count:', lines.length);

  if (lines.length > 1582) {
    const originalLine = lines[1582];
    console.log('Original line 1583:', originalLine.trim());
    
    // Check if it's the right line
    if (originalLine.includes('showToast')) {
      const newLine = "                                    showToast('Избраните снимки бяха изтрити!', 'success');";
      lines[1582] = newLine;
      console.log('Replaced with:', newLine.trim());
      
      fs.writeFileSync(targetPath, lines.join('\n'));
      console.log('File written successfully.');
    } else {
        console.log('Line 1583 does not contain showToast, skipping.');
        // Search nearby
        for(let i=1580; i<1590; i++) {
            if(lines[i] && lines[i].includes('showToast')) {
                console.log(`Found showToast at line ${i+1}: ${lines[i].trim()}`);
            }
        }
    }
  } else {
    console.error('File too short');
  }

} catch (e) {
  console.error('Error:', e);
}
