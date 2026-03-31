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
  function createPaper({ title, teacherEmail, questionIds, timeLimit, passMark }) {
    const papers = load(STORAGE_KEYS.PAPERS) || {};
    let code;
    do { code = generateCode(); } while (papers[code]);

    papers[code] = {
      code,
      title,
      teacherEmail,
      questionIds,
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

  // ── Results ───────────────────────────────────────────────────────────────
  function saveResult({ paperCode, studentEmail, studentName, answers, timeTaken }) {
    const paper = getPaper(paperCode);
    if (!paper) return null;

    const questions = QUESTION_BANK.filter(q => paper.questionIds.includes(q.id));
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

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    seedDefaultTeacher, loginTeacher, loginStudent, registerStudent, registerTeacher,
    getSession, logout, requireAuth,
    createPaper, getPaper, getTeacherPapers, togglePaperActive, deletePaper,
    saveResult, getPaperResults, getStudentResults, getResult,
    generatePaperQuestions, shuffle,
  };
})();
