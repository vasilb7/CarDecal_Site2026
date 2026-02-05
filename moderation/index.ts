// Rules
import policyMatrix from './rules/policy.matrix.json';
import evasionRulesRaw from './rules/evasion.regex.json';
import sexualTemplatesRaw from './rules/sexual.templates.regex.json';
import combinationsRaw from './rules/combinations.regex.json';

// Dictionaries
import allowContextRaw from './dictionaries/allow.context.phrases.txt?raw';
import allowDomainsRaw from './dictionaries/allow.domains.txt?raw';
import adultDomainsRaw from './dictionaries/adult.domains.txt?raw';
import piracyDomainsRaw from './dictionaries/piracy.domains.txt?raw';
import malwareDomainsRaw from './dictionaries/malware.domains.txt?raw';
import unsafeGeneralRaw from './dictionaries/unsafe.general.txt?raw';
import adultTldsRaw from './dictionaries/adult.tlds.txt?raw';
import urlShortenersRaw from './dictionaries/url.shorteners.txt?raw';
import enCoreRaw from './dictionaries/en.core.txt?raw';
import bgCoreRaw from './dictionaries/bg.core.txt?raw';
import sexualPhrasesRaw from './dictionaries/sexual.explicit.phrases.txt?raw';
import violencePhrasesRaw from './dictionaries/violence.selfharm.phrases.txt?raw';
import hatePhrasesRaw from './dictionaries/hate.slurs.restricted.txt?raw';

export type Zone = 'username' | 'comments' | 'chat' | 'product_description' | 'default';

function parseList(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))
  );
}

export const POLICY = policyMatrix;

export const DICTS = {
  allowContext: parseList(allowContextRaw),
  allowDomains: parseList(allowDomainsRaw),
  adultDomains: parseList(adultDomainsRaw),
  piracyDomains: parseList(piracyDomainsRaw),
  malwareDomains: parseList(malwareDomainsRaw),
  unsafeDomains: parseList(unsafeGeneralRaw),
  adultTlds: parseList(adultTldsRaw),
  shorteners: parseList(urlShortenersRaw),
  enCore: parseList(enCoreRaw),
  bgCore: parseList(bgCoreRaw),
  sexual: parseList(sexualPhrasesRaw),
  violenceSelfharm: parseList(violencePhrasesRaw),
  hate: parseList(hatePhrasesRaw),
};

export const EVASION_RULES = (Array.isArray(evasionRulesRaw) ? evasionRulesRaw : []).map(r => {
  try {
    return { ...r, pattern: new RegExp(r.pattern, 'i') };
  } catch (e) {
    console.error('Invalid Evasion Regex:', r.pattern);
    return null;
  }
}).filter(Boolean) as Array<{ category: string; score: number; pattern: RegExp }>;

export const SEXUAL_TEMPLATE_RULES = (Array.isArray(sexualTemplatesRaw) ? sexualTemplatesRaw : []).map(r => {
  try {
    return { ...r, pattern: new RegExp(r.pattern, 'i') };
  } catch (e) {
    console.error('Invalid Sexual Template Regex:', r.pattern);
    return null;
  }
}).filter(Boolean) as Array<{ category: string; score: number; pattern: RegExp }>;

export const COMBINATIONS = (Array.isArray(combinationsRaw) ? combinationsRaw : []).map(r => {
  try {
    let score = 5;
    if (r.severity === 'critical') score = 10;
    else if (r.severity === 'high') score = 8;
    
    return { 
        category: r.tags?.[0] || 'combination', 
        score,
        pattern: new RegExp(r.pattern, 'i'),
        tags: r.tags,
        severity: r.severity
    };
  } catch (e) {
    console.error('Invalid Combination Regex:', r.pattern);
    return null;
  }
}).filter(Boolean) as Array<{ category: string; score: number; pattern: RegExp; tags: string[]; severity: string }>;
