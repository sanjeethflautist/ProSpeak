// This file is no longer used - sentence generation moved to backend cron job
// Keeping for reference only

export const categorizeSentence = (sentence) => {
  const keywords = {
    'project_update': ['project', 'sprint', 'milestone', 'deadline', 'delivery', 'timeline'],
    'technical': ['system', 'architecture', 'database', 'API', 'infrastructure', 'deployment'],
    'client': ['client', 'customer', 'requirement', 'feedback', 'expectation', 'stakeholder'],
    'team': ['team', 'collaborate', 'meeting', 'standup', 'retrospective', 'planning'],
    'problem_solving': ['issue', 'bug', 'fix', 'solution', 'troubleshoot', 'resolve']
  }

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => sentence.toLowerCase().includes(word))) {
      return category
    }
  }

  return 'general'
}
