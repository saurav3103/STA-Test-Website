// ─── Question Helper Utilities ──────────────────────────────────────────────────
// Utility functions for working with Asian Book questions and the question bank

const QuestionHelper = (() => {
  // ── Asian Book Question Categories ──────────────────────────────────────
  const CATEGORIES = {
    CORONA: 'Corona',
    SURGE_IMPEDANCE: 'Surge Impedance',
    LIGHTNING_ARRESTER: 'Lightning Arrester',
    SKIN_EFFECT: 'Skin Effect',
  };

  /**
   * Get all questions from a specific category
   * @param {string} category - The category name (from CATEGORIES)
   * @returns {array} Questions matching the category
   */
  function getQuestionsByCategory(category) {
    const asianBookQuestions = App.getAsianBookQuestions();
    return asianBookQuestions.filter(q => q.topic && q.topic.includes(category));
  }

  /**
   * Get statistics about Asian Book questions
   * @returns {object} Stats about extracted questions
   */
  function getAsianBookStats() {
    const asianBook = App.getAsianBookQuestions();
    const stats = {
      total: asianBook.length,
      byCategory: {},
      sourceDocuments: 1,
      lastUpdated: new Date().toISOString(),
    };

    Object.values(CATEGORIES).forEach(category => {
      stats.byCategory[category] = asianBook.filter(q => 
        q.topic && q.topic.includes(category)
      ).length;
    });

    return stats;
  }

  /**
   * Create a test from specific categories
   * @param {array} categories - Array of category names
   * @param {number} questionsPerCategory - How many questions from each category
   * @returns {array} Mixed questions from selected categories
   */
  function createThematicTest(categories, questionsPerCategory = 5) {
    const asianBook = App.getAsianBookQuestions();
    const test = [];

    categories.forEach(category => {
      const categoryQuestions = asianBook.filter(q => 
        q.topic && q.topic.includes(category)
      );
      const selected = App.shuffle(categoryQuestions).slice(0, questionsPerCategory);
      test.push(...selected);
    });

    return App.shuffle(test);
  }

  /**
   * Get an educational topic overview
   * @param {string} topic - Topic keyword
   * @returns {object} Topic information and questions
   */
  function getTopicOverview(topic) {
    const questions = App.getQuestionsByTopic(topic);
    return {
      topic,
      totalQuestions: questions.length,
      questions,
      difficulty: estimateDifficulty(questions),
      coverage: calculateTopicCoverage(topic),
    };
  }

  /**
   * Estimate difficulty level of a set of questions
   * @private
   * @returns {string} 'Easy', 'Medium', or 'Hard'
   */
  function estimateDifficulty(questions) {
    if (questions.length === 0) return 'Unknown';
    // Simple estimation based on question count and variability
    const uniqueTopics = new Set(questions.map(q => q.topic)).size;
    const complexity = uniqueTopics / questions.length;
    
    if (complexity < 0.5) return 'Easy';
    if (complexity < 0.8) return 'Medium';
    return 'Hard';
  }

  /**
   * Calculate how well a topic is covered
   * @private
   * @returns {object} Coverage metrics
   */
  function calculateTopicCoverage(topic) {
    const questions = App.getQuestionsByTopic(topic);
    return {
      questionsAvailable: questions.length,
      subtopics: new Set(questions.map(q => q.topic)).size,
      adequatelyCovered: questions.length >= 5,
    };
  }

  /**
   * Generate a quick reference guide for a topic
   * @param {string} topic - Topic name
   * @returns {string} HTML-formatted quick reference
   */
  function generateTopicGuide(topic) {
    const overview = getTopicOverview(topic);
    let guide = `<div class="topic-guide">
      <h3>${overview.topic}</h3>
      <p><strong>Questions Available:</strong> ${overview.totalQuestions}</p>
      <p><strong>Difficulty:</strong> ${overview.difficulty}</p>
      <p><strong>Coverage:</strong> ${overview.coverage.adequatelyCovered ? '✓ Comprehensive' : '✗ Limited'}</p>
      <ul class="sample-questions">`;

    overview.questions.slice(0, 3).forEach(q => {
      guide += `<li>${q.question}</li>`;
    });

    guide += `</ul></div>`;
    return guide;
  }

  /**
   * Get recommended study plan for a student
   * @returns {object} Recommended questions and study order
   */
  function getStudyPlan() {
    const stats = getAsianBookStats();
    const plan = {
      recommended: [
        {
          category: 'Corona',
          reason: 'Most comprehensive coverage',
          questions: 18,
          estimatedTime: '45 minutes',
        },
        {
          category: 'Skin Effect',
          reason: 'Core transmission line concept',
          questions: 5,
          estimatedTime: '15 minutes',
        },
        {
          category: 'Lightning Arrester',
          reason: 'Important for safety',
          questions: 2,
          estimatedTime: '5 minutes',
        },
        {
          category: 'Surge Impedance',
          reason: 'Technical understanding',
          questions: 2,
          estimatedTime: '5 minutes',
        },
      ],
      totalQuestions: stats.total,
      totalEstimatedTime: '70 minutes',
      difficulty: 'Intermediate',
    };
    return plan;
  }

  /**
   * Export question data for analysis
   * @returns {string} JSON string of Asian Book questions
   */
  function exportQuestions() {
    const asianBook = App.getAsianBookQuestions();
    return JSON.stringify(asianBook, null, 2);
  }

  /**
   * Get trending questions (most common difficulty in a category)
   * @param {string} category - Category name
   * @returns {array} Top questions from category
   */
  function getTrendingQuestions(category) {
    const categoryQuestions = getQuestionsByCategory(category);
    return categoryQuestions.slice(0, 10);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    CATEGORIES,
    getQuestionsByCategory,
    getAsianBookStats,
    createThematicTest,
    getTopicOverview,
    generateTopicGuide,
    getStudyPlan,
    exportQuestions,
    getTrendingQuestions,
  };
})();

// Export for Node.js if in that environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuestionHelper;
}
