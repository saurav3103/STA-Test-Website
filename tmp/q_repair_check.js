const fs = require('fs');
const src = fs.readFileSync('src/data/questions.js', 'utf8');
const m = src.match(/const QUESTION_BANK = (\[[\s\S]*\]);/);
const arr = JSON.parse(m[1]);

const looksPrompt = (s) => {
  if (typeof s !== 'string') return false;
  const t = s.trim();
  if (!t) return false;
  if (/\?$/.test(t)) return true;
  return /^(which|what|where|when|why|how|name|identify|calculate|as\s+per|in\s+which|the\s+.+\s+(is|are|will|can|has|have))\b/i.test(t);
};

const shortish = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length <= 6;

let repaired = 0;
const samples = [];
for (const q of arr) {
  if (!Array.isArray(q.options) || q.options.length !== 4) continue;
  const [a, b, c, d] = q.options;
  if (looksPrompt(c) && shortish(q.question) && !looksPrompt(q.question)) {
    if (samples.length < 12) {
      samples.push({
        id: q.id,
        beforeQ: q.question,
        beforeOpts: q.options,
        afterQ: c,
        afterOpts: [q.question, a, b, d],
      });
    }
    repaired += 1;
  }
}

console.log('potential repairs:', repaired);
console.log(JSON.stringify(samples, null, 2));
