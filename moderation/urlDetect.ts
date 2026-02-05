import { DICTS } from './index';

export type Hit = { category: string; match: string; score: number };

function isAllowed(host: string): boolean {
  for (const d of DICTS.allowDomains) {
    if (host === d || host.endsWith('.' + d)) return true;
  }
  return false;
}

function extractHosts(text: string): string[] {
  // Captures hostnames from http(s) URLs and bare domains
  const regex = /(?:https?:\/\/)?([\w.-]+\.[a-z]{2,})(?:\/\S*)?/gi;
  const hosts: string[] = [];
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    hosts.push(m[1].toLowerCase());
  }

  return [...new Set(hosts)];
}

function matchDomain(host: string, set: Set<string>): boolean {
  for (const d of set) {
    if (host === d || host.endsWith('.' + d)) return true;
  }
  return false;
}

export function checkUrls(text: string): Hit[] {
  const hosts = extractHosts(text);
  const hits: Hit[] = [];

  for (const host of hosts) {
    if (isAllowed(host)) continue;

    // Shorteners → quarantine bias
    if (matchDomain(host, DICTS.shorteners)) {
      hits.push({ category: 'evasion_attempt', match: host, score: 3 });
      continue;
    }

    // TLD blocks
    for (const tld of DICTS.adultTlds) {
      if (host.endsWith(tld)) {
        hits.push({ category: 'sexual_explicit', match: host, score: 5 });
        break;
      }
    }

    if (matchDomain(host, DICTS.malwareDomains)) hits.push({ category: 'malware', match: host, score: 7 });
    if (matchDomain(host, DICTS.piracyDomains)) hits.push({ category: 'piracy', match: host, score: 5 });
    if (matchDomain(host, DICTS.unsafeDomains)) hits.push({ category: 'unsafe_content', match: host, score: 6 });
    if (matchDomain(host, DICTS.adultDomains)) hits.push({ category: 'sexual_explicit', match: host, score: 5 });
  }

  return hits;
}
