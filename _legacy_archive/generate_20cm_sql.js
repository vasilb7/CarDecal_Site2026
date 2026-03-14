import fs from 'fs';

const BGN_TO_EUR = 1.95583;

// Parse the text
const lines = `20cm-42 - 1,94eur
20cm-45 - 1,94eur
20cm-171 - 1,89eur
20cm-172 - 3,00лв.
20cm-175 - 3,00лв.
20cm-176 - 3,00лв.
20cm-177 - 3,00лв.
20cm-178 - 3,65лв.
20cm-181 - 3,65лв.
20cm-183 - 2,48лв.`.split('\n').filter(l => l.trim().length > 0);

const queries = [];

for (const line of lines) {
  const parts = line.split(' - ');
  if (parts.length < 2) continue;
  
  const slug = parts[0].trim().toLowerCase();
  const pricePart = parts[1].trim().toLowerCase().replace(',', '.');
  
  let eurPrice, bgnPrice;
  
  if (pricePart.includes('eur')) {
    eurPrice = parseFloat(pricePart.replace('eur', '').trim());
    bgnPrice = eurPrice * BGN_TO_EUR;
  } else if (pricePart.includes('лв')) {
    bgnPrice = parseFloat(pricePart.replace('лв.', '').replace('лв', '').trim());
    eurPrice = bgnPrice / BGN_TO_EUR;
  }
  
  const bgnStr = bgnPrice.toFixed(2);
  const eurStr = eurPrice.toFixed(2);
  
  queries.push(`UPDATE products SET price='${bgnStr}', wholesale_price='${bgnStr}', price_eur=${eurStr}, wholesale_price_eur=${eurStr} WHERE slug='${slug}';`);
}

const sql = queries.join('\n');
fs.writeFileSync('update_20cm_prices.sql', sql);
console.log(sql);
