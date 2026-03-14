import fs from 'fs';

const updates = {
  "15cm-05": 2.28,
  "15cm-06": 2.28,
  "15cm-07": 2.28,
  "15cm-18": 2.00,
  "15cm-19": 1.85,
  "15cm-20": 1.85,
  "15cm-39": 2.53,
  "15cm-40": 2.53,
  "15cm-52": 2.65,
  "15cm-54": 2.65,
  "15cm-55": 2.65,
  "15cm-56": 2.65,
  "15cm-69": 2.00,
  "15cm-70": 2.00,
  "15cm-71": 2.00,
  "15cm-74": 2.00,
  "15cm-77": 2.28,
  "15cm-89": 2.00,
  "15cm-93": 1.82,
  "15cm-94": 1.85,
  "15cm-95": 1.80,
  "15cm-96": 1.80,
  "15cm-97": 1.80,
  "15cm-98": 1.80,
  "15cm-99": 1.80,
  "15cm-100": 1.80,
  "15cm-117": 1.55,
  "15cm-118": 1.55,
  "15cm-119": 1.55,
  "15cm-120": 2.95,
  "15cm-121": 2.95,
  "15cm-122": 2.95,
  "15cm-123": 2.95
};

const BGN_TO_EUR = 1.95583;

let sqlFile = fs.readFileSync('15cm_text.txt', 'utf8');
const lines = sqlFile.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  const match = line.match(/^(15cm-\d+)$/i);
  if (match) {
    const slug = match[1].toLowerCase();
    if (updates[slug]) {
        const bgnPrice = updates[slug].toFixed(2);
        const eurPrice = (updates[slug] / BGN_TO_EUR).toFixed(2);
        
        const priceStr = `${bgnPrice}ЛВ \t\t\t ${eurPrice}€`;
        
        // Search ahead for existing price
        let priceFoundAt = -1;
        for (let j = i + 1; j < lines.length && j < i + 10; j++) {
            if (lines[j].match(/^(15cm-\d+)$/i)) break;
            if (lines[j].match(/[\d.]+[ЛВ€]/i)) {
                priceFoundAt = j;
                break;
            }
        }
        
        if (priceFoundAt !== -1) {
            lines[priceFoundAt] = priceStr;
        } else {
            lines.splice(i + 1, 0, "", priceStr, "");
        }
    }
  }
}

fs.writeFileSync('15cm_text.txt', lines.join('\n'));
console.log('Fixed 15cm_text.txt');
