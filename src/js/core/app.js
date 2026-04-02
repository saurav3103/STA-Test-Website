// ─── ElectroTest App State ───────────────────────────────────────────────────

const App = (() => {
  const STORAGE_KEYS = {
    TEACHERS: 'et_teachers',
    STUDENTS: 'et_students',
    PAPERS: 'et_papers',
    RESULTS: 'et_results',
    SESSION: 'et_session',
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const load = key => JSON.parse(localStorage.getItem(key) || 'null');
  const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function hashString(str) {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createSeededRng(seed) {
    let t = seed >>> 0;
    return function rng() {
      t += 0x6D2B79F5;
      let x = Math.imul(t ^ (t >>> 15), 1 | t);
      x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleWithSeed(arr, seedStr) {
    const a = [...arr];
    const rand = createSeededRng(hashString(seedStr));
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function looksLikePrompt(text) {
    if (typeof text !== 'string') return false;
    const t = text.trim();
    if (!t) return false;
    if (/[?:]$/.test(t)) return true;
    return /^(which|what|where|when|why|how|name|identify|the\s|this\s|to\s)/i.test(t);
  }

  function mergeUploadedQuestionBanks() {
    if (typeof QUESTION_BANK === 'undefined' || !Array.isArray(QUESTION_BANK)) return;
    if (QUESTION_BANK.some(q => q && q.source === 'asian_book')) return;
    if (typeof ASIAN_BOOK_QUESTIONS === 'undefined' || !Array.isArray(ASIAN_BOOK_QUESTIONS) || !ASIAN_BOOK_QUESTIONS.length) return;

    const existingIds = new Set(QUESTION_BANK.map(q => q && q.id).filter(id => Number.isFinite(Number(id))).map(Number));
    let nextId = existingIds.size ? Math.max(...existingIds) : 0;

    const normalized = ASIAN_BOOK_QUESTIONS
      .filter(q => q && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length === 4)
      .map(q => {
        const cloned = {
          ...q,
          options: [...q.options],
          source: 'asian_book',
          originalId: q.id,
        };

        let id = Number(cloned.id);
        if (!Number.isFinite(id) || existingIds.has(id)) {
          id = ++nextId;
        } else {
          nextId = Math.max(nextId, id);
        }

        existingIds.add(id);
        cloned.id = id;
        return cloned;
      });

    if (!normalized.length) return;
    QUESTION_BANK.push(...normalized);
    console.log('Integrated uploaded questions:', normalized.length, 'Total:', QUESTION_BANK.length);
  }

  function sanitizeQuestionBank() {
    if (typeof QUESTION_BANK === 'undefined' || !Array.isArray(QUESTION_BANK)) return;

    const cleaned = QUESTION_BANK.filter(q => {
      if (!q || !Array.isArray(q.options) || q.options.length !== 4) return false;

      const promptLikeOptionExists = q.options.some(opt => looksLikePrompt(opt));
      const questionWords = String(q.question || '').trim().split(/\s+/).filter(Boolean).length;
      const questionLooksLikeShortAnswer = questionWords > 0 && questionWords <= 10 && !looksLikePrompt(q.question);

      // Drop split/misaligned rows where the prompt ended up inside options.
      if (promptLikeOptionExists && questionLooksLikeShortAnswer && q.answer === 0) {
        return false;
      }

      return true;
    });

    if (cleaned.length !== QUESTION_BANK.length) {
      const removed = QUESTION_BANK.length - cleaned.length;
      QUESTION_BANK.splice(0, QUESTION_BANK.length, ...cleaned);
      console.warn('Filtered malformed question rows:', removed);
    }
  }

  mergeUploadedQuestionBanks();
  sanitizeQuestionBank();

  // ── Auth ─────────────────────────────────────────────────────────────────
  function seedDefaultTeacher() {
    let teachers = load(STORAGE_KEYS.TEACHERS) || {};
    if (!teachers['teacher@demo.com']) {
      teachers['teacher@demo.com'] = { name: 'Mr. Anderson', password: 'teacher123', role: 'teacher' };
      save(STORAGE_KEYS.TEACHERS, teachers);
    }
    let students = load(STORAGE_KEYS.STUDENTS) || {};
    if (!students['student@demo.com']) {
      students['student@demo.com'] = { name: 'Alex Johnson', password: 'student123', role: 'student' };
      save(STORAGE_KEYS.STUDENTS, students);
    }
  }

  function loginTeacher(email, password) {
    const teachers = load(STORAGE_KEYS.TEACHERS) || {};
    const t = teachers[email];
    if (!t || t.password !== password) return null;
    const session = { role: 'teacher', email, name: t.name };
    save(STORAGE_KEYS.SESSION, session);
    return session;
  }

  function loginStudent(email, password) {
    const students = load(STORAGE_KEYS.STUDENTS) || {};
    const s = students[email];
    if (!s || s.password !== password) return null;
    const session = { role: 'student', email, name: s.name };
    save(STORAGE_KEYS.SESSION, session);
    return session;
  }

  function registerStudent(email, password, name) {
    const students = load(STORAGE_KEYS.STUDENTS) || {};
    if (students[email]) return { error: 'Email already registered.' };
    students[email] = { name, password, role: 'student' };
    save(STORAGE_KEYS.STUDENTS, students);
    return { success: true };
  }

  function registerTeacher(email, password, name) {
    const teachers = load(STORAGE_KEYS.TEACHERS) || {};
    if (teachers[email]) return { error: 'Email already registered.' };
    teachers[email] = { name, password, role: 'teacher' };
    save(STORAGE_KEYS.TEACHERS, teachers);
    return { success: true };
  }

  function getSession() { return load(STORAGE_KEYS.SESSION); }
  function logout() { localStorage.removeItem(STORAGE_KEYS.SESSION); }

  function requireAuth(role) {
    const s = getSession();
    if (!s || (role && s.role !== role)) {
      window.location.href = '../index.html';
      return null;
    }
    return s;
  }

  // ── Papers ────────────────────────────────────────────────────────────────
  function createPaper({ title, teacherEmail, questionIds, questionPoolIds, questionCount, randomPerStudent, timeLimit, passMark }) {
    const papers = load(STORAGE_KEYS.PAPERS) || {};
    let code;
    do { code = generateCode(); } while (papers[code]);

    const fallbackIds = Array.isArray(questionIds) ? questionIds : [];
    const poolIds = Array.isArray(questionPoolIds) && questionPoolIds.length
      ? [...new Set(questionPoolIds)]
      : [...new Set(fallbackIds)];
    const finalCount = Math.max(1, Math.min(Number(questionCount) || fallbackIds.length || poolIds.length, poolIds.length || fallbackIds.length || 1));
    const fixedIds = fallbackIds.length ? fallbackIds.slice(0, finalCount) : poolIds.slice(0, finalCount);

    papers[code] = {
      code,
      title,
      teacherEmail,
      questionIds: fixedIds,
      questionPoolIds: poolIds,
      questionCount: finalCount,
      randomPerStudent: randomPerStudent !== false,
      timeLimit: timeLimit || 30, // minutes
      passMark: passMark || 60,
      createdAt: new Date().toISOString(),
      active: true,
    };
    save(STORAGE_KEYS.PAPERS, papers);
    return papers[code];
  }

  function getPaper(code) {
    const papers = load(STORAGE_KEYS.PAPERS) || {};
    return papers[code] || null;
  }

  function getTeacherPapers(teacherEmail) {
    const papers = load(STORAGE_KEYS.PAPERS) || {};
    return Object.values(papers).filter(p => p.teacherEmail === teacherEmail)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function togglePaperActive(code, active) {
    const papers = load(STORAGE_KEYS.PAPERS) || {};
    if (papers[code]) { papers[code].active = active; save(STORAGE_KEYS.PAPERS, papers); }
  }

  function deletePaper(code) {
    const papers = load(STORAGE_KEYS.PAPERS) || {};
    delete papers[code];
    save(STORAGE_KEYS.PAPERS, papers);
  }

  function pickStudentQuestionIds(paper, studentEmail) {
    if (!paper) return [];

    const fixedIds = Array.isArray(paper.questionIds) ? paper.questionIds : [];
    const poolIds = Array.isArray(paper.questionPoolIds) && paper.questionPoolIds.length
      ? paper.questionPoolIds
      : fixedIds;

    if (!poolIds.length) return [];

    const count = Math.max(1, Math.min(Number(paper.questionCount) || fixedIds.length || poolIds.length, poolIds.length));
    if (paper.randomPerStudent === false || !studentEmail) {
      return [...poolIds].slice(0, count);
    }

    const seed = `${paper.code}|${studentEmail.toLowerCase()}`;
    return shuffleWithSeed([...poolIds], seed).slice(0, count);
  }

  // ── Results ───────────────────────────────────────────────────────────────
  function saveResult({ paperCode, studentEmail, studentName, questionIds, answers, timeTaken }) {
    const paper = getPaper(paperCode);
    if (!paper) return null;

    const effectiveIds = (Array.isArray(questionIds) && questionIds.length)
      ? questionIds
      : pickStudentQuestionIds(paper, studentEmail);
    const questionById = new Map(QUESTION_BANK.map(q => [q.id, q]));
    const questions = effectiveIds.map(id => questionById.get(id)).filter(Boolean);

    if (!questions.length) return null;

    let score = 0;
    const breakdown = questions.map(q => {
      const studentAns = answers[q.id];
      const correct = studentAns === q.answer;
      if (correct) score++;
      return { id: q.id, question: q.question, studentAns, correctAns: q.answer, correct, options: q.options };
    });

    const percentage = Math.round((score / questions.length) * 100);
    const result = {
      id: `${paperCode}_${studentEmail}_${Date.now()}`,
      paperCode,
      paperTitle: paper.title,
      studentEmail,
      studentName,
      questionIds: questions.map(q => q.id),
      score,
      total: questions.length,
      percentage,
      passed: percentage >= paper.passMark,
      passMark: paper.passMark,
      timeTaken,
      breakdown,
      submittedAt: new Date().toISOString(),
    };

    const results = load(STORAGE_KEYS.RESULTS) || [];
    results.push(result);
    save(STORAGE_KEYS.RESULTS, results);
    return result;
  }

  function getPaperResults(paperCode) {
    const results = load(STORAGE_KEYS.RESULTS) || [];
    return results.filter(r => r.paperCode === paperCode)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  function getStudentResults(studentEmail) {
    const results = load(STORAGE_KEYS.RESULTS) || [];
    return results.filter(r => r.studentEmail === studentEmail)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  function getResult(resultId) {
    const results = load(STORAGE_KEYS.RESULTS) || [];
    return results.find(r => r.id === resultId) || null;
  }

  function generatePaperQuestions(count) {
    return shuffle(QUESTION_BANK).slice(0, count).map(q => q.id);
  }

  // ── Question Management (Asian Book Integration) ─────────────────────────
  function getAsianBookQuestions() {
    const merged = QUESTION_BANK.filter(q => q && q.source === 'asian_book');
    if (merged.length) return merged;
    return (typeof ASIAN_BOOK_QUESTIONS !== 'undefined') ? ASIAN_BOOK_QUESTIONS : [];
  }

  function getQuestionsByTopic(topic, questionBank = null) {
    const bank = questionBank || QUESTION_BANK;
    return bank.filter(q => q.topic && q.topic.includes(topic));
  }

  function getRandomQuestions(count, questionBank = null) {
    const bank = questionBank || QUESTION_BANK;
    return shuffle(bank).slice(0, count);
  }

  function getAllQuestionStats() {
    const total = QUESTION_BANK.length;
    const topicGroups = {};
    QUESTION_BANK.forEach(q => {
      const topic = q.topic || 'Uncategorized';
      topicGroups[topic] = (topicGroups[topic] || 0) + 1;
    });
    return { total, topics: topicGroups, topicCount: Object.keys(topicGroups).length };
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    seedDefaultTeacher, loginTeacher, loginStudent, registerStudent, registerTeacher,
    getSession, logout, requireAuth,
    createPaper, getPaper, getTeacherPapers, togglePaperActive, deletePaper, pickStudentQuestionIds,
    saveResult, getPaperResults, getStudentResults, getResult,
    generatePaperQuestions, shuffle,
    getAsianBookQuestions, getQuestionsByTopic, getRandomQuestions, getAllQuestionStats,
  };
})();
