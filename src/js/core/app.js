// ─── ElectroTest App State (Supabase Edition) ────────────────────────────────

const App = (() => {

  // ── Helpers ──────────────────────────────────────────────────────────────
  const loadSession = () => JSON.parse(localStorage.getItem('et_session') || 'null');
  const saveSession = (val) => localStorage.setItem('et_session', JSON.stringify(val));

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
        const cloned = { ...q, options: [...q.options], source: 'asian_book', originalId: q.id };
        let id = Number(cloned.id);
        if (!Number.isFinite(id) || existingIds.has(id)) { id = ++nextId; } else { nextId = Math.max(nextId, id); }
        existingIds.add(id);
        cloned.id = id;
        return cloned;
      });

    if (!normalized.length) return;
    QUESTION_BANK.push(...normalized);
  }

  function sanitizeQuestionBank() {
    if (typeof QUESTION_BANK === 'undefined' || !Array.isArray(QUESTION_BANK)) return;
    const cleaned = QUESTION_BANK.filter(q => {
      if (!q || !Array.isArray(q.options) || q.options.length !== 4) return false;
      const promptLikeOptionExists = q.options.some(opt => looksLikePrompt(opt));
      const questionWords = String(q.question || '').trim().split(/\s+/).filter(Boolean).length;
      const questionLooksLikeShortAnswer = questionWords > 0 && questionWords <= 10 && !looksLikePrompt(q.question);
      if (promptLikeOptionExists && questionLooksLikeShortAnswer && q.answer === 0) return false;
      return true;
    });
    if (cleaned.length !== QUESTION_BANK.length) {
      QUESTION_BANK.splice(0, QUESTION_BANK.length, ...cleaned);
    }
  }

  mergeUploadedQuestionBanks();
  sanitizeQuestionBank();

  // ── Auth (Supabase) ───────────────────────────────────────────────────────

  async function seedDefaultTeacher() {
    // Insert demo accounts if they don't exist
    const demos = [
      { email: 'teacher@demo.com', password: 'teacher123', name: 'Mr. Anderson', role: 'teacher' },
      { email: 'student@demo.com', password: 'student123', name: 'Alex Johnson', role: 'student' },
    ];
    for (const demo of demos) {
      const { data } = await db.from('users').select('email').eq('email', demo.email).single();
      if (!data) {
        await db.from('users').insert(demo);
      }
    }
  }

  function inferRoleFromEmail(email) {
    const value = String(email || '').toLowerCase();
    const [localPart = '', domain = ''] = value.split('@');
    if (/(teacher|staff|faculty|instructor|admin)/.test(localPart) || /(teacher|faculty|school|staff|admin)/.test(domain)) {
      return 'teacher';
    }
    return 'student';
  }

  async function loginAccount(email, password) {
    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !data) return null;

    const session = { role: data.role, email: data.email, name: data.name };
    saveSession(session);
    return session;
  }

  async function registerStudent(email, password, name) {
    const { data: existing } = await db.from('users').select('email').eq('email', email).single();
    if (existing) return { error: 'Email already registered.' };
    const { error } = await db.from('users').insert({ email, password, name, role: 'student' });
    if (error) return { error: error.message };
    return { success: true };
  }

  async function registerTeacher(email, password, name) {
    const { data: existing } = await db.from('users').select('email').eq('email', email).single();
    if (existing) return { error: 'Email already registered.' };
    const { error } = await db.from('users').insert({ email, password, name, role: 'teacher' });
    if (error) return { error: error.message };
    return { success: true };
  }

  function getSession() { return loadSession(); }
  function logout() { localStorage.removeItem('et_session'); }

  function requireAuth(role) {
    const s = getSession();
    if (!s || (role && s.role !== role)) {
      window.location.href = '../index.html';
      return null;
    }
    return s;
  }

  // ── Papers (Supabase) ─────────────────────────────────────────────────────

  async function createPaper({ title, teacherEmail, questionIds, questionPoolIds, questionCount, randomPerStudent, timeLimit, passMark }) {
    const fallbackIds = Array.isArray(questionIds) ? questionIds : [];
    const poolIds = Array.isArray(questionPoolIds) && questionPoolIds.length
      ? [...new Set(questionPoolIds)]
      : [...new Set(fallbackIds)];
    const finalCount = Math.max(1, Math.min(Number(questionCount) || fallbackIds.length || poolIds.length, poolIds.length || fallbackIds.length || 1));
    const fixedIds = fallbackIds.length ? fallbackIds.slice(0, finalCount) : poolIds.slice(0, finalCount);

    let code;
    let exists = true;
    while (exists) {
      code = generateCode();
      const { data } = await db.from('papers').select('code').eq('code', code).single();
      exists = !!data;
    }

    const paper = {
      code,
      title,
      teacher_email: teacherEmail,
      question_ids: fixedIds,
      question_pool_ids: poolIds,
      question_count: finalCount,
      random_per_student: randomPerStudent !== false,
      time_limit: timeLimit || 30,
      pass_mark: passMark || 60,
      created_at: new Date().toISOString(),
      active: true,
    };

    const { error } = await db.from('papers').insert(paper);
    if (error) return null;
    return paper;
  }

  async function getPaper(code) {
    const { data, error } = await db.from('papers').select('*').eq('code', code).single();
    if (error || !data) return null;
    return {
      code: data.code,
      title: data.title,
      teacherEmail: data.teacher_email,
      questionIds: data.question_ids,
      questionPoolIds: data.question_pool_ids,
      questionCount: data.question_count,
      randomPerStudent: data.random_per_student,
      timeLimit: data.time_limit,
      passMark: data.pass_mark,
      createdAt: data.created_at,
      active: data.active,
    };
  }

  async function getTeacherPapers(teacherEmail) {
    const { data, error } = await db.from('papers').select('*').eq('teacher_email', teacherEmail).order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(d => ({
      code: d.code, title: d.title, teacherEmail: d.teacher_email,
      questionIds: d.question_ids, questionPoolIds: d.question_pool_ids,
      questionCount: d.question_count, randomPerStudent: d.random_per_student,
      timeLimit: d.time_limit, passMark: d.pass_mark, createdAt: d.created_at, active: d.active,
    }));
  }

  async function togglePaperActive(code, active) {
    await db.from('papers').update({ active }).eq('code', code);
  }

  async function deletePaper(code) {
    await db.from('papers').delete().eq('code', code);
  }

  function pickStudentQuestionIds(paper, studentEmail) {
    if (!paper) return [];
    const fixedIds = Array.isArray(paper.questionIds) ? paper.questionIds : [];
    const poolIds = Array.isArray(paper.questionPoolIds) && paper.questionPoolIds.length ? paper.questionPoolIds : fixedIds;
    if (!poolIds.length) return [];
    const count = Math.max(1, Math.min(Number(paper.questionCount) || fixedIds.length || poolIds.length, poolIds.length));
    if (paper.randomPerStudent === false || !studentEmail) return [...poolIds].slice(0, count);
    const seed = `${paper.code}|${studentEmail.toLowerCase()}`;
    return shuffleWithSeed([...poolIds], seed).slice(0, count);
  }

  // ── Results (Supabase) ────────────────────────────────────────────────────

  async function saveResult({ paperCode, studentEmail, studentName, questionIds, answers, timeTaken }) {
    const paper = await getPaper(paperCode);
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
      paper_code: paperCode,
      paper_title: paper.title,
      student_email: studentEmail,
      student_name: studentName,
      question_ids: questions.map(q => q.id),
      score,
      total: questions.length,
      percentage,
      passed: percentage >= paper.passMark,
      pass_mark: paper.passMark,
      time_taken: timeTaken,
      breakdown,
      submitted_at: new Date().toISOString(),
    };

    const { error } = await db.from('results').insert(result);
    if (error) return null;
    return {
      ...result,
      paperCode: result.paper_code,
      paperTitle: result.paper_title,
      studentEmail: result.student_email,
      studentName: result.student_name,
      questionIds: result.question_ids,
      timeTaken: result.time_taken,
      passMark: result.pass_mark,
      submittedAt: result.submitted_at,
    };
  }

  async function getPaperResults(paperCode) {
    const { data, error } = await db.from('results').select('*').eq('paper_code', paperCode).order('submitted_at', { ascending: false });
    if (error || !data) return [];
    return data.map(r => ({ ...r, paperCode: r.paper_code, paperTitle: r.paper_title, studentEmail: r.student_email, studentName: r.student_name, timeTaken: r.time_taken, passMark: r.pass_mark, submittedAt: r.submitted_at }));
  }

  async function getStudentResults(studentEmail) {
    const { data, error } = await db.from('results').select('*').eq('student_email', studentEmail).order('submitted_at', { ascending: false });
    if (error || !data) return [];
    return data.map(r => ({ ...r, paperCode: r.paper_code, paperTitle: r.paper_title, studentEmail: r.student_email, studentName: r.student_name, timeTaken: r.time_taken, passMark: r.pass_mark, submittedAt: r.submitted_at }));
  }

  async function getResult(resultId) {
    const { data, error } = await db.from('results').select('*').eq('id', resultId).single();
    if (error || !data) return null;
    return { ...data, paperCode: data.paper_code, paperTitle: data.paper_title, studentEmail: data.student_email, studentName: data.student_name, timeTaken: data.time_taken, passMark: data.pass_mark, submittedAt: data.submitted_at };
  }

  function generatePaperQuestions(count) {
    return shuffle(QUESTION_BANK).slice(0, count).map(q => q.id);
  }

  // ── Question Management ───────────────────────────────────────────────────
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
    seedDefaultTeacher, inferRoleFromEmail, loginAccount,
    registerStudent, registerTeacher,
    getSession, logout, requireAuth,
    createPaper, getPaper, getTeacherPapers, togglePaperActive, deletePaper, pickStudentQuestionIds,
    saveResult, getPaperResults, getStudentResults, getResult,
    generatePaperQuestions, shuffle,
    getAsianBookQuestions, getQuestionsByTopic, getRandomQuestions, getAllQuestionStats,
  };
})();