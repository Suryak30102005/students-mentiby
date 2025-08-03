// Application constants and configuration

export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'] as const;

export const DIFFICULTY_COLORS = {
  Easy: 'text-green-600',
  Medium: 'text-yellow-600', 
  Hard: 'text-red-600'
} as const;

export const CHART_COLORS = {
  Easy: '#22c55e',
  Medium: '#eab308',
  Hard: '#ef4444'
} as const;

export const SORT_OPTIONS = [
  { label: 'Difficulty', value: 'difficulty' },
  { label: 'Title', value: 'title' },
  { label: 'Topic', value: 'topic' },
  { label: 'Completion', value: 'completion' }
] as const;

export const FILTER_OPTIONS = {
  STATUS: [
    { label: 'All', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Revision', value: 'revision' }
  ],
  DIFFICULTY: [
    { label: 'All Difficulties', value: 'all' },
    { label: 'Easy', value: 'Easy' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Hard', value: 'Hard' }
  ]
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student'
} as const;

export const ADMIN_EMAILS = [
  'gopikrishnackofficial@gmail.com',
  'praveenchintuyt@gmail.com'
] as const;

// Real-time subscription channel names
export const CHANNELS = {
  QUESTIONS: 'questions-changes',
  SHEETS: 'sheets-changes', 
  USER_PROGRESS: 'user-progress-changes',
  ADMIN_QUESTIONS: 'admin-questions-changes',
  ADMIN_SHEETS: 'admin-sheets-changes'
} as const;

// Time formatting constants
export const TIME_FORMATS = {
  SECONDS_IN_MINUTE: 60,
  SECONDS_IN_HOUR: 3600
} as const;