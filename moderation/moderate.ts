import { Zone } from './index';
import { detect } from './detect';
import { decide } from './policy';

export function moderate(text: string, zone: Zone = 'default') {
  const { normalized, hits } = detect(text);
  const decision = decide(zone, hits);

  return {
    zone,
    ...decision,
    normalized,
    hits
  };
}
