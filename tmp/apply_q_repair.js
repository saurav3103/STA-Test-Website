const fs = require('fs');
const file = 'src/data/questions.js';
const src = fs.readFileSync(file, 'utf8');
const m = src.match(/(const QUESTION_BANK = )(\[[\s\S]*\])(\s*;[\s\S]*)/);
if (!m) throw new Error('QUESTION_BANK array not found');
const prefix = m[1];
const arr = Function(`"use strict"; return (${m[2]});`)();
const suffix = m[3];

const looksPrompt = (s) => {
  if (typeof s !== 'string') return false;
  const t = s.trim();
  if (!t) return false;
  if (/\?$/.test(t)) return true;
  return /^(which|what|where|when|why|how|name|identify|calculate|as\s+per|in\s+which|the\s+.+\s+(is|are|will|can|has|have))\b/i.test(t);
};

const shortish = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length <= 6;

let repaired = 0;
for (const q of arr) {
  if (!Array.isArray(q.options) || q.options.length !== 4) continue;
  const originalQuestion = q.question;
  const [a, b, c, d] = q.options;
  if (looksPrompt(c) && shortish(originalQuestion) && !looksPrompt(originalQuestion)) {
    q.question = c;
    q.options = [originalQuestion, a, b, d];
    repaired += 1;
  }
}

const out = prefix + JSON.stringify(arr, null, 2) + suffix;
fs.writeFileSync(file, out, 'utf8');
console.log('Repaired rows:', repaired);
console.log('Total rows:', arr.length);
