import { DICTS, EVASION_RULES, POLICY, SEXUAL_TEMPLATE_RULES, COMBINATIONS } from './index';
import { normalizeText } from './normalize';
import { checkUrls } from './urlDetect';

export type Hit = { category: string; match: string; score: number };

function isSafeContext(normalized: string): boolean {
  for (const phrase of DICTS.allowContext) {
    if (normalized.includes(phrase)) return true;
  }
  return false;
}

export function detect(text: string): { normalized: string; hits: Hit[] } {
  if (!text) return { normalized: '', hits: [] };
  
  const normalized = normalizeText(text);
  const hits: Hit[] = [];

  // 1. Context allowlist
  if (isSafeContext(normalized)) return { normalized, hits };

  // 2. URL/domain checks
  hits.push(...checkUrls(text));

  // 3. Phrase-level (explicit)
  for (const phrase of DICTS.sexual) {
    if (normalized.includes(phrase)) {
        hits.push({ 
            category: 'sexual_explicit', 
            match: phrase, 
            score: (POLICY.categoryScores as any).sexual_explicit ?? 4 
        });
    }
  }
  
  for (const phrase of DICTS.violenceSelfharm) {
    if (normalized.includes(phrase)) {
        hits.push({ 
            category: 'selfharm', 
            match: phrase, 
            score: (POLICY.categoryScores as any).selfharm ?? 8 
        });
    }
  }

  // 4. Word-level (Core Profanity)
  const words = normalized.split(/\s+/);
  for (const w of words) {
    if (DICTS.enCore.has(w) || DICTS.bgCore.has(w)) {
      hits.push({ 
          category: 'general_profanity', 
          match: w, 
          score: (POLICY.categoryScores as any).general_profanity ?? 2 
      });
    }
    if (DICTS.hate.has(w)) {
      hits.push({ 
          category: 'hate_slur', 
          match: w, 
          score: (POLICY.categoryScores as any).hate_slur ?? 8 
      });
    }
  }

  // 5. Sliding Window / Space Deletion Check (Strict Mode)
  // Check for "f u c k" -> "fuck"
  // Safe approach: Join words of length <= 2
  const joinedShortWords = words.reduce((acc, curr) => {
      // If current word is short and previous accumulation ends with short logic, append
      // Simplified: Just check if we can form a blocklisted word by joining tokens
      return acc + curr;
  }, "");
  
  // Actually, simplest efficient way: "spaced" checks.
  // We check if the SPACELESS version contains specific critical words?
  // No, too many false positives ("classic").
  // Better: Check adjacent short tokens.
  
  for (let i = 0; i < words.length; i++) {
      // Check window of 4 words
      if (i + 3 < words.length) {
          const combined = words.slice(i, i + 4).join('');
          if (DICTS.enCore.has(combined) || DICTS.bgCore.has(combined)) {
               hits.push({ category: 'evasion_attempt', match: combined, score: 3 });
          }
      }
      // Check window of 2 words (e.g. "fuck u")
       if (i + 1 < words.length) {
          const combined = words.slice(i, i + 2).join('');
          if (DICTS.enCore.has(combined) || DICTS.bgCore.has(combined)) {
               hits.push({ category: 'evasion_attempt', match: combined, score: 3 });
          }
      }
  }

  // 6. Template rules (porn-industry patterns)
  for (const r of SEXUAL_TEMPLATE_RULES) {
    if (r.pattern.test(normalized) || r.pattern.test(text)) {
        hits.push({ category: r.category, match: r.pattern.source, score: r.score });
    }
  }

  // 7. Combination Rules (Multi-token Regexes)
  for (const r of COMBINATIONS) {
    if (r.pattern.test(normalized) || r.pattern.test(text)) {
      hits.push({ category: r.category, match: r.pattern.source, score: r.score });
    }
  }

  // 8. Evasion rules
  for (const r of EVASION_RULES) {
    if (r.pattern.test(text) || r.pattern.test(normalized)) {
        hits.push({ category: r.category, match: r.pattern.source, score: r.score });
    }
  }

  return { normalized, hits };
}
