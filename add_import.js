const fs = require('fs');
const path = 'e:/Antigravity/Agency/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("import { cn } from '../lib/utils'")) {
    content = content.replace("import { dashboardService } from '../lib/dashboardService';", "import { dashboardService } from '../lib/dashboardService';\nimport { cn } from '../lib/utils';");
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully added cn import.');
} else {
    console.log('cn import already exists.');
}
