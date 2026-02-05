import { POLICY, Zone } from './index';

type Hit = { category: string; match: string; score: number };

export function decide(zone: Zone, hits: Hit[]) {
  const base = (POLICY.zoneOverrides as any)?.[zone]?.thresholds ?? POLICY.thresholds;

  const score = Math.min(hits.reduce((a: number, h: Hit) => a + (h.score ?? 0), 0), 10);

  const has = (c: string) => hits.some(h => h.category === c);

  // Hard-block rules (enterprise)
  if (has('malware')) return { action: 'block' as const, score: 10, reason: 'malware' };
  
  if (zone === 'username' && (has('sexual_explicit') || has('piracy') || has('unsafe_content')))
    return { action: 'block' as const, score: 10, reason: 'username_unsafe' };
    
  if (zone === 'product_description' && (has('sexual_explicit') || has('piracy')))
    return { action: 'block' as const, score: 10, reason: 'product_unsafe' };

  // Threshold-based
  let action: 'allow'|'mask'|'quarantine'|'block' = 'allow';
  if (score >= base.block) action = 'block';
  else if (score >= base.quarantine) action = 'quarantine';
  else if (score >= base.mask) action = 'mask';

  return { action, score, reason: 'thresholds' };
}
