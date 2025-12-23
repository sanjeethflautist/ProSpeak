-- Insert sample daily sentences for practice
INSERT INTO daily_sentences (sentence, category, difficulty_level, date) VALUES
  -- Project Updates
  ('We are on track to complete the project milestone by the end of this sprint.', 'project_update', 'medium', CURRENT_DATE),
  ('The deadline has been extended by two weeks to ensure quality delivery.', 'project_update', 'easy', CURRENT_DATE),
  ('I need to prioritize the critical features before moving to enhancements.', 'project_update', 'medium', CURRENT_DATE),
  
  -- Technical Discussions
  ('The database migration completed successfully without any data loss.', 'technical', 'medium', CURRENT_DATE),
  ('We should consider implementing caching to improve application performance.', 'technical', 'hard', CURRENT_DATE),
  ('The API endpoint is returning a 500 error due to missing authentication headers.', 'technical', 'hard', CURRENT_DATE),
  ('I have deployed the latest changes to the staging environment for testing.', 'technical', 'medium', CURRENT_DATE),
  
  -- Client Communication
  ('Thank you for your feedback. I will incorporate these changes in the next iteration.', 'client', 'easy', CURRENT_DATE),
  ('The client has requested additional features that were not in the original scope.', 'client', 'medium', CURRENT_DATE),
  ('I will schedule a meeting with stakeholders to discuss the project timeline.', 'client', 'medium', CURRENT_DATE),
  ('We need to manage client expectations regarding the delivery date.', 'client', 'medium', CURRENT_DATE),
  
  -- Team Collaboration
  ('Let us have a quick standup to sync on today''s priorities and blockers.', 'team', 'easy', CURRENT_DATE),
  ('I appreciate your help with the code review. Your feedback was very valuable.', 'team', 'easy', CURRENT_DATE),
  ('The retrospective meeting helped us identify areas for improvement in our workflow.', 'team', 'hard', CURRENT_DATE),
  ('Can someone assist me with debugging this authentication issue?', 'team', 'easy', CURRENT_DATE),
  
  -- Problem Solving
  ('I have identified the root cause of the bug and implemented a fix.', 'problem_solving', 'medium', CURRENT_DATE),
  ('We need to troubleshoot the memory leak that is affecting system performance.', 'problem_solving', 'hard', CURRENT_DATE),
  ('After investigating the issue, I found that it was caused by a configuration error.', 'problem_solving', 'medium', CURRENT_DATE),
  ('Let me propose an alternative solution that addresses the core problem more effectively.', 'problem_solving', 'hard', CURRENT_DATE),
  
  -- General Professional
  ('I am working on improving my communication skills for better team collaboration.', 'general', 'medium', CURRENT_DATE),
  ('Could you please clarify the requirements for this feature?', 'general', 'easy', CURRENT_DATE),
  ('I will document the implementation details in the technical specification.', 'general', 'medium', CURRENT_DATE),
  ('Please let me know if you need any additional information or clarification.', 'general', 'easy', CURRENT_DATE)
ON CONFLICT (sentence, date) DO NOTHING;
