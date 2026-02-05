import { moderate } from '../moderate';

const cases = [
  { zone: 'comments', text: 'check this: https://pornhub.com', expect: 'block' },
  { zone: 'comments', text: 'b i g c o c k', expect: 'block' }, // should hit evasion + sexual templates
  { zone: 'username', text: 'myname_bit.ly/xyz', expect: 'block' },
  { zone: 'comments', text: 'sex education is important', expect: 'allow' },
  { zone: 'comments', text: 'download movie from 1337x.to', expect: 'block' },
  // Strict Mode Tests
  { zone: 'comments', text: 'I will kill you', expect: 'block' }, // combination
  { zone: 'comments', text: 'you are a monkey', expect: 'block' }, // combination/hate
  { zone: 'comments', text: 'f u c k', expect: 'block' }, // sliding window
  { zone: 'comments', text: 'f.u.c.k', expect: 'block' }, // aggressive symbol stripping
  { zone: 'comments', text: 'go fuk yourself', expect: 'block' }, // normalization
  { zone: 'comments', text: 'fuuuuuck', expect: 'block' }, // repeated char reduction
  { zone: 'comments', text: 'кур', expect: 'block' }, // BG core
  { zone: 'comments', text: 'кyp', expect: 'block' }, // BG homoglyph (using latin 'y' and 'p')
  { zone: 'comments', text: 'classic car', expect: 'allow' }, // false positive check
  { zone: 'comments', text: 'this is a bass guitar', expect: 'allow' }, // false positive check
] as const;

export function runTests() {
    console.log('Running Moderation Tests...');
    let passed = 0;
    for (const c of cases) {
      const res = moderate(c.text, c.zone as any);
      if (res.action !== c.expect) {
        console.error(`FAIL [${c.zone}] "${c.text}" -> got ${res.action}, expected ${c.expect}`, res.hits);
      } else {
        passed++;
        console.log(`PASS [${c.zone}] "${c.text}" -> ${res.action}`);
      }
    }
    console.log(`Tests finished: ${passed}/${cases.length} passed.`);
}
