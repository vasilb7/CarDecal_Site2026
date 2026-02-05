const leetMap: Record<string, string> = {
  '@': 'a', '4': 'a', '^': 'a', 'α': 'a',
  '0': 'o', '()': 'o', '[]': 'o', '*': 'o',
  '1': 'i', '!': 'i', '|': 'i', 'l': 'i', '¡': 'i',
  '3': 'e', '€': 'e', 'é': 'e', 'è': 'e',
  '$': 's', '5': 's', 'z': 's',
  '7': 't', '+': 't', '†': 't',
  'vm': 'am', // 'Scvmbeag' -> 'Scumbag' style
  'vv': 'w',
  '\\/': 'v',
  '|<': 'k',
  'ck': 'k', // normalize 'fuck' -> 'fuk' sometimes helps, but blocking 'fuck' is better. Let's keep 'ck' for now.
  'ph': 'f'
};

const homoglyphs: Record<string, string> = {
  'а': 'a', 'А': 'a',
  'е': 'e', 'Е': 'e',
  'о': 'o', 'О': 'o',
  'р': 'p', 'Р': 'p',
  'с': 'c', 'С': 'c',
  'у': 'y', 'У': 'y',
  'х': 'x', 'Х': 'x',
  'к': 'k', 'К': 'k',
  'м': 'm', 'М': 'm',
  'т': 't', 'Т': 't',
  'в': 'b', 'В': 'b', // Visually similar
  'н': 'h', 'Н': 'h'  // Visually similar
};

export function normalizeText(input: string) {
  if (!input) return '';

  // 1. Unicode Normalization
  let s = input.normalize('NFKC').toLowerCase();

  // 2. Homoglyph Mapping (Cyrillic -> Latin visual equivalents)
  // This helps catch "mixed script" attacks like "fucк" (last char is Cyrillic)
  s = s.split('').map(char => homoglyphs[char] || char).join('');

  // 3. Leetspeak Replacement
  s = s.replace(/[@401!|3$7+^€α]/g, (ch) => leetMap[ch] ?? ch);

  // 4. Aggressive Symbol Removal (Strip everything except alphanumeric)
  // We keep spaces for word boundary checks, but remove them later for partial matches
  // Allow simple spaces.
  s = s.replace(/[^a-z0-9\s]/g, '');

  // 5. Repeated Character Reduction (collapse 3+ into 2)
  // 'shiiiit' -> 'shiit'. We stick to 2 because 'ass' needs 2.
  s = s.replace(/(.)\1{2,}/g, '$1$1');

  // 6. Space Normalization
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}
