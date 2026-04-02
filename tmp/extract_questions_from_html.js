const fs = require('fs');
const path = require('path');

const inputPath = path.join('src', 'data', 'extracted_content.txt');
const outJsonPath = path.join('src', 'data', 'asian_book_questions.generated.json');
const outJsPath = path.join('src', 'data', 'asian_book_questions.generated.js');
const outLiveJsPath = path.join('src', 'data', 'asian_book_questions.js');
const unresolvedPath = path.join('tmp', 'extracted_unresolved.json');
const imagesDirPath = path.join('public', 'assets', 'asian-book');
const manualOverridesPath = path.join('tmp', 'manual_image_overrides.json');

function decodeEntities(str) {
	if (!str) return '';
	const named = {
		amp: '&',
		lt: '<',
		gt: '>',
		quot: '"',
		apos: "'",
		nbsp: ' ',
		ndash: '-',
		mdash: '-',
		hellip: '...'
	};
	return str
		.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
		.replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
		.replace(/&([a-zA-Z]+);/g, (m, n) => (named[n] !== undefined ? named[n] : m));
}

function normalizeText(str) {
	return decodeEntities(String(str || ''))
		.replace(/\u00a0/g, ' ')
		.replace(/[\r\n\t]+/g, ' ')
		.replace(/\s+/g, ' ')
		.replace(/\s+([,.;:?])/g, '$1')
		.trim();
}

function parseHtmlFragment(html) {
	const root = { type: 'tag', name: 'root', children: [] };
	const stack = [root];
	const tokenRe = /<!--[^]*?-->|<\/?[a-zA-Z0-9]+\b[^>]*>|[^<]+/g;
	let m;
	while ((m = tokenRe.exec(html))) {
		const tok = m[0];
		if (!tok) continue;
		if (tok.startsWith('<!--')) continue;

		if (tok[0] !== '<') {
			const text = tok;
			if (text) stack[stack.length - 1].children.push({ type: 'text', text });
			continue;
		}

		const isEnd = /^<\//.test(tok);
		const tagMatch = tok.match(/^<\/?\s*([a-zA-Z0-9]+)/);
		if (!tagMatch) continue;
		const tag = tagMatch[1].toLowerCase();
		const selfClose = /\/>$/.test(tok) || tag === 'img' || tag === 'br' || tag === 'hr' || tag === 'meta' || tag === 'input';

		if (isEnd) {
			for (let i = stack.length - 1; i > 0; i -= 1) {
				if (stack[i].name === tag) {
					stack.length = i;
					break;
				}
			}
			continue;
		}

		const node = { type: 'tag', name: tag, children: [], raw: tok };
		stack[stack.length - 1].children.push(node);
		if (!selfClose) stack.push(node);
	}
	return root;
}

function textContent(node) {
	if (!node) return '';
	if (node.type === 'text') return node.text;
	return (node.children || []).map(textContent).join(' ');
}

function containsTag(node, tagName) {
	if (!node) return false;
	if (node.type === 'tag' && node.name === tagName) return true;
	return (node.children || []).some((c) => containsTag(c, tagName));
}

function ownTextOfLi(node) {
	if (!node || node.type !== 'tag' || node.name !== 'li') return '';
	const parts = [];
	for (const c of node.children || []) {
		if (c.type === 'tag' && (c.name === 'ol' || c.name === 'ul')) continue;
		parts.push(textContent(c));
	}
	return normalizeText(parts.join(' '));
}

function directChildrenByName(node, name) {
	return (node.children || []).filter((c) => c.type === 'tag' && c.name === name);
}

function collectTokens(node, tokens, insideLi) {
	if (!node || node.type !== 'tag') return;

	if (node.name === 'li') {
		if (insideLi) return;
		const stem = ownTextOfLi(node);
		const hasImg = containsTag(node, 'img');
		const directLists = directChildrenByName(node, 'ol').concat(directChildrenByName(node, 'ul'));
		const nestedLis = [];
		for (const listNode of directLists) {
			for (const c of listNode.children || []) {
				if (c.type === 'tag' && c.name === 'li') {
					const t = normalizeText(textContent(c));
					if (t) nestedLis.push(t);
				}
			}
		}

		if (nestedLis.length >= 2) {
			tokens.push({ kind: 'nested', text: stem, options: nestedLis, hasImg });
		} else if (stem || hasImg) {
			tokens.push({ kind: 'line', text: stem, hasImg });
		}
		return;
	}

	if (node.name === 'p') {
		const txt = normalizeText(textContent(node));
		const hasImg = containsTag(node, 'img');
		if (txt || hasImg) tokens.push({ kind: 'p', text: txt, hasImg });
	}

	for (const c of node.children || []) {
		if (c.type === 'tag') collectTokens(c, tokens, insideLi || node.name === 'li');
	}
}

function cleanOption(text) {
	let t = normalizeText(text);
	t = t.replace(/^[A-Da-d][\)\.]\s+/, '');
	t = t.replace(/^\(?[ivxIVX]+\)?[\)\.]\s+/, '');
	t = t.replace(/^\d+[\)\.]\s+/, '');
	return normalizeText(t);
}

function isHeadingText(text) {
	if (!text) return false;
	const t = normalizeText(text);
	if (/^\d+\.\s+[A-Za-z]/.test(t) && !/[?]/.test(t)) return true;
	if (/^(transmission and distribution|generation of electrical energy|digital electronics|electrical appliances|corona,? lightning and skin effect)$/i.test(t)) return true;
	return false;
}

function headingToTopic(text) {
	return normalizeText(text).replace(/^\d+\.\s*/, '');
}

function isQuestionText(text) {
	if (!text) return false;
	const t = normalizeText(text);
	if (t.length < 6) return false;
	if (/[?]$/.test(t)) return true;
	if (/\.{3,}|…/.test(t)) return true;
	if (/^from\s+the\s+given\s+(figure|diagram)\b/i.test(t)) return true;
	if (/^(which|what|where|when|why|how|name|identify|calculate|determine|find|state|for|in\s+an?|the\s+purpose|the\s+function|as\s+per)\b/i.test(t)) return true;
	if (/\b(calculate|determine|find)\b/i.test(t) && /\b(figure|diagram)\b/i.test(t)) return true;
	if (/\b(is|are|will|can|should|does|do|used|called|known)\b/i.test(t) && t.split(' ').length > 8) return true;
	return false;
}

function mentionsFigureText(text) {
	return /figure|diagram|shown below|given below|circuit below|in-figure|in figure/i.test(normalizeText(text || ''));
}

function normalizeQuestionText(text) {
	return normalizeText(text)
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function stripTags(html) {
	return normalizeText(String(html || '').replace(/<[^>]+>/g, ' '));
}

function extractImageAnchorsFromHtml(html, imageCount) {
	const anchors = [];
	const imgRe = /<img\b[^>]*>/gi;
	let m;
	let imgIdx = 1;

	while ((m = imgRe.exec(html)) && imgIdx <= imageCount) {
		const contextStart = Math.max(0, m.index - 8000);
		const context = html.slice(contextStart, m.index);

		let anchorText = '';
		const liMatches = Array.from(context.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi));
		for (let i = liMatches.length - 1; i >= 0; i -= 1) {
			const t = stripTags(liMatches[i][1]);
			if (isQuestionText(t)) {
				anchorText = t;
				break;
			}
		}

		if (!anchorText) {
			const pMatches = Array.from(context.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
			for (let i = pMatches.length - 1; i >= 0; i -= 1) {
				const t = stripTags(pMatches[i][1]);
				if (isQuestionText(t)) {
					anchorText = t;
					break;
				}
			}
		}

		anchors.push({
			image: `../assets/asian-book/image${imgIdx}.png`,
			anchorText,
		});
		imgIdx += 1;
	}

	return anchors;
}

function assignImagesByAnchors(questions, anchors) {
	if (!Array.isArray(questions) || !questions.length || !Array.isArray(anchors) || !anchors.length) return;

	const usedQuestionIdx = new Set();
	let cursor = 0;

	for (const anchor of anchors) {
		const aNorm = normalizeQuestionText(anchor.anchorText);
		let bestIdx = -1;
		let bestScore = -1;
		const start = Math.max(0, cursor);
		const end = Math.min(questions.length, start + 180);

		for (let i = start; i < end; i += 1) {
			if (usedQuestionIdx.has(i)) continue;
			const qNorm = normalizeQuestionText(questions[i].question);
			if (!qNorm) continue;

			let score = 0;
			if (aNorm) {
				if (qNorm === aNorm) score = 1000;
				else if (qNorm.includes(aNorm) || aNorm.includes(qNorm)) score = 700;
				else {
					const aWords = new Set(aNorm.split(' ').filter((w) => w.length > 2));
					const qWords = new Set(qNorm.split(' ').filter((w) => w.length > 2));
					let overlap = 0;
					aWords.forEach((w) => {
						if (qWords.has(w)) overlap += 1;
					});
					score = overlap;
				}
			} else if (mentionsFigureText(questions[i].question)) {
				score = 5;
			}

			if (score > bestScore) {
				bestScore = score;
				bestIdx = i;
			}
		}

		if (bestIdx >= 0 && bestScore >= 4) {
			questions[bestIdx].image = anchor.image;
			usedQuestionIdx.add(bestIdx);
			cursor = bestIdx + 1;
		}
	}
}

function loadManualOverrides() {
	if (!fs.existsSync(manualOverridesPath)) {
		return { questionIdToImage: {}, questionTextToImage: {} };
	}
	try {
		const raw = JSON.parse(fs.readFileSync(manualOverridesPath, 'utf8'));
		return {
			questionIdToImage: raw.questionIdToImage || {},
			questionTextToImage: raw.questionTextToImage || {},
		};
	} catch (e) {
		console.warn('Failed to parse manual overrides JSON:', e.message);
		return { questionIdToImage: {}, questionTextToImage: {} };
	}
}

function applyManualOverrides(questions, overrides) {
	if (!Array.isArray(questions) || !questions.length) return;
	const byId = (overrides && overrides.questionIdToImage) || {};
	const byText = (overrides && overrides.questionTextToImage) || {};

	for (const q of questions) {
		const idKey = String(q.id);
		const idMapped = byId[idKey];
		if (idMapped) {
			q.image = idMapped;
			continue;
		}

		const tKey = normalizeQuestionText(q.question);
		const textMapped = byText[tKey];
		if (textMapped) q.image = textMapped;
	}
}

function isLikelyOption(text) {
	if (!text) return false;
	const t = cleanOption(text);
	const wc = t.split(/\s+/).filter(Boolean).length;
	if (!t) return false;
	if (isQuestionText(t)) return false;
	if (isHeadingText(t)) return false;
	if (wc > 0 && wc <= 18) return true;
	return false;
}

function classifyTopic(stem, fallbackTopic) {
	const s = normalizeText(stem).toLowerCase();
	if (fallbackTopic && fallbackTopic !== 'General') return fallbackTopic;
	if (/corona|lightning|surge|skin effect/.test(s)) return 'Corona, Lightning and Skin Effect';
	if (/hydro|nuclear|solar|wind|biogas|tidal|geothermal|mhd|reactor/.test(s)) return 'Generation of Electrical Energy';
	if (/gate|flip flop|binary|digital|logic/.test(s)) return 'Digital Electronics';
	if (/fan|heater|iron|geyser|pump|appliance|thermostat/.test(s)) return 'Electrical Appliances';
	return 'General';
}

function extractQuestions(tokens) {
	const questions = [];
	const unresolved = [];
	let topic = 'General';
	let imageIndex = 1;
	const imageCount = fs.existsSync(imagesDirPath)
		? fs.readdirSync(imagesDirPath).filter((f) => /^image\d+\.png$/i.test(f)).length
		: 0;

	const nextImagePath = () => {
		if (imageIndex > imageCount || imageCount === 0) return '';
		const p = `../assets/asian-book/image${imageIndex}.png`;
		imageIndex += 1;
		return p;
	};

	for (let i = 0; i < tokens.length; i += 1) {
		const tok = tokens[i];
		const t = normalizeText(tok.text);

		if (isHeadingText(t)) {
			topic = headingToTopic(t);
			continue;
		}

		if (tok.kind === 'nested') {
			const stem = t || '[Image-based question]';
			const options = tok.options.map(cleanOption).filter(Boolean).slice(0, 4);
			const shouldAttachImage = tok.hasImg || mentionsFigureText(stem);
			const imagePath = shouldAttachImage ? nextImagePath() : '';
			if (options.length === 4) {
				questions.push({
					topic: classifyTopic(stem, topic),
					question: stem,
					options,
					image: imagePath,
					answer: null
				});
			} else {
				unresolved.push({ reason: 'nested-options-not-4', stem, options, index: i, hasImg: tok.hasImg });
			}
			continue;
		}

		if (!isQuestionText(t)) continue;

		let stem = t;
		let j = i + 1;
		let hasImage = !!tok.hasImg;

		while (j < tokens.length) {
			const nxt = tokens[j];
			const nt = normalizeText(nxt.text);
			if (!nt) {
				j += 1;
				continue;
			}
			if (isHeadingText(nt)) break;
			if (nxt.kind === 'p' && !isQuestionText(nt) && !isLikelyOption(nt)) {
				stem = normalizeText(`${stem} ${nt}`);
				j += 1;
				continue;
			}
			break;
		}

		const options = [];
		let k = j;
		while (k < tokens.length && options.length < 4) {
			if (tokens[k].hasImg) {
				hasImage = true;
				k += 1;
				continue;
			}
			const ot = normalizeText(tokens[k].text);
			if (!ot) {
				k += 1;
				continue;
			}
			if (isHeadingText(ot)) break;
			if (isQuestionText(ot) && options.length > 0) break;
			if (isLikelyOption(ot)) {
				options.push(cleanOption(ot));
				k += 1;
				continue;
			}
			if (tokens[k].kind === 'p' && !isQuestionText(ot) && options.length === 0) {
				stem = normalizeText(`${stem} ${ot}`);
				k += 1;
				continue;
			}
			k += 1;
		}

		if (options.length === 4) {
			const shouldAttachImage = hasImage || mentionsFigureText(stem);
			const imagePath = shouldAttachImage ? nextImagePath() : '';
			questions.push({
				topic: classifyTopic(stem, topic),
				question: stem,
				options,
				image: imagePath,
				answer: null
			});
			i = k - 1;
		} else {
			unresolved.push({ reason: 'missing-options', stem, optionsFound: options, index: i, hasImg: hasImage });
		}
	}

	const seen = new Set();
	const deduped = [];
	for (const q of questions) {
		const key = `${q.topic}::${q.question}`.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		deduped.push(q);
	}

	return { questions: deduped, unresolved };
}

function main() {
	const html = fs.readFileSync(inputPath, 'utf8');
	const imageCount = fs.existsSync(imagesDirPath)
		? fs.readdirSync(imagesDirPath).filter((f) => /^image\d+\.png$/i.test(f)).length
		: 0;
	const dom = parseHtmlFragment(html);
	const tokens = [];
	for (const c of dom.children || []) {
		if (c.type === 'tag') collectTokens(c, tokens, false);
	}

	const { questions, unresolved } = extractQuestions(tokens);

	const output = questions.map((q, idx) => ({
		id: idx + 1,
		topic: q.topic,
		question: q.question,
		options: q.options,
		image: q.image || '',
		answer: q.answer
	}));

	// Anchor mapping is the authoritative image mapping source.
	output.forEach((q) => {
		q.image = '';
	});

	const anchors = extractImageAnchorsFromHtml(html, imageCount);
	assignImagesByAnchors(output, anchors);
	const manualOverrides = loadManualOverrides();
	applyManualOverrides(output, manualOverrides);

	fs.writeFileSync(outJsonPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

	const jsPayload = [
		'// Auto-generated from src/data/extracted_content.txt',
		`// Generated on ${new Date().toISOString()}`,
		`const ASIAN_BOOK_QUESTIONS = ${JSON.stringify(output, null, 2)};`,
		'',
		"if (typeof module !== 'undefined' && module.exports) module.exports = ASIAN_BOOK_QUESTIONS;",
		''
	].join('\n');
	fs.writeFileSync(outJsPath, jsPayload, 'utf8');
	fs.writeFileSync(outLiveJsPath, jsPayload, 'utf8');

	fs.writeFileSync(unresolvedPath, `${JSON.stringify(unresolved, null, 2)}\n`, 'utf8');

	console.log(`Tokens: ${tokens.length}`);
	console.log(`Questions extracted: ${output.length}`);
	console.log(`Unresolved blocks: ${unresolved.length}`);
	console.log(`Wrote: ${outJsonPath}`);
	console.log(`Wrote: ${outJsPath}`);
	console.log(`Wrote: ${outLiveJsPath}`);
	console.log(`Wrote: ${unresolvedPath}`);
}

main();
