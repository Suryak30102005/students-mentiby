// Utility functions used across the application
import type { Question, UserProgress, DifficultyStats, TopicProgress } from '@/types';
import { DIFFICULTY_COLORS, TIME_FORMATS } from '@/constants';

// ============= TIME UTILITIES =============
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / TIME_FORMATS.SECONDS_IN_HOUR);
  const minutes = Math.floor((seconds % TIME_FORMATS.SECONDS_IN_HOUR) / TIME_FORMATS.SECONDS_IN_MINUTE);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
};

export const calculateTimeDifference = (startTime: Date, endTime: Date): number => {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
};

// ============= PROGRESS CALCULATIONS =============
export const calculateCompletionRate = (total: number, completed: number): number => {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

export const calculateDifficultyStats = (
  questions: Question[],
  userProgress: UserProgress[]
): DifficultyStats => {
  return {
    Easy: {
      total: questions.filter(q => q.difficulty === 'Easy').length,
      completed: questions.filter(q => 
        q.difficulty === 'Easy' && 
        userProgress.some(p => p.question_id === q.id && p.completed)
      ).length
    },
    Medium: {
      total: questions.filter(q => q.difficulty === 'Medium').length,
      completed: questions.filter(q => 
        q.difficulty === 'Medium' && 
        userProgress.some(p => p.question_id === q.id && p.completed)
      ).length
    },
    Hard: {
      total: questions.filter(q => q.difficulty === 'Hard').length,
      completed: questions.filter(q => 
        q.difficulty === 'Hard' && 
        userProgress.some(p => p.question_id === q.id && p.completed)
      ).length
    }
  };
};

export const calculateTopicProgress = (
  questions: Question[],
  userProgress: UserProgress[],
  topic: string
): TopicProgress => {
  const topicQuestions = questions.filter(q => q.topic === topic);
  const completedInTopic = topicQuestions.filter(q =>
    userProgress.some(p => p.question_id === q.id && p.completed)
  ).length;
  
  return {
    topic,
    total: topicQuestions.length,
    completed: completedInTopic,
    percentage: calculateCompletionRate(topicQuestions.length, completedInTopic)
  };
};

export const calculateCurrentStreak = (userProgress: UserProgress[]): number => {
  const today = new Date();
  let currentStreak = 0;
  let checkDate = new Date(today);
  
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const completedToday = userProgress.some(p => 
      p.completed && p.completed_at && 
      new Date(p.completed_at).toISOString().split('T')[0] === dateStr
    );
    
    if (completedToday) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return currentStreak;
};

export const getQuestionsCompletedToday = (userProgress: UserProgress[]): number => {
  const todayStr = new Date().toISOString().split('T')[0];
  return userProgress.filter(p => 
    p.completed && p.completed_at && 
    new Date(p.completed_at).toISOString().split('T')[0] === todayStr
  ).length;
};

// ============= STYLING UTILITIES =============
export const getDifficultyColor = (difficulty: string): string => {
  return DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS] || '';
};

export const getDifficultyBadgeVariant = (difficulty: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (difficulty) {
    case 'Easy':
      return 'default';
    case 'Medium':
      return 'secondary';
    case 'Hard':
      return 'destructive';
    default:
      return 'outline';
  }
};

// ============= DATA FILTERING UTILITIES =============
export const filterQuestionsByStatus = (
  questions: Question[],
  userProgress: UserProgress[],
  status: string
): Question[] => {
  switch (status) {
    case 'completed':
      return questions.filter(q =>
        userProgress.some(p => p.question_id === q.id && p.completed)
      );
    case 'pending':
      return questions.filter(q =>
        !userProgress.some(p => p.question_id === q.id && p.completed)
      );
    case 'revision':
      return questions.filter(q =>
        userProgress.some(p => p.question_id === q.id && p.marked_for_revision)
      );
    default:
      return questions;
  }
};

export const filterQuestionsByDifficulty = (
  questions: Question[],
  difficulty: string
): Question[] => {
  if (difficulty === 'all') return questions;
  return questions.filter(q => q.difficulty === difficulty);
};

export const filterQuestionsByTopic = (
  questions: Question[],
  topic: string
): Question[] => {
  if (topic === 'all') return questions;
  return questions.filter(q => q.topic === topic);
};

export const searchQuestions = (
  questions: Question[],
  searchTerm: string
): Question[] => {
  if (!searchTerm.trim()) return questions;
  
  const term = searchTerm.toLowerCase();
  return questions.filter(q =>
    q.title.toLowerCase().includes(term) ||
    q.topic.toLowerCase().includes(term) ||
    q.tags.some(tag => tag.toLowerCase().includes(term))
  );
};

// ============= SORTING UTILITIES =============
export const sortQuestions = (
  questions: Question[],
  userProgress: UserProgress[],
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): Question[] => {
  const sorted = [...questions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'difficulty':
        const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'topic':
        comparison = a.topic.localeCompare(b.topic);
        break;
      case 'completion':
        const aCompleted = userProgress.some(p => p.question_id === a.id && p.completed);
        const bCompleted = userProgress.some(p => p.question_id === b.id && p.completed);
        comparison = Number(aCompleted) - Number(bCompleted);
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
};

// ============= VALIDATION UTILITIES =============
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isAdminEmail = (email: string): boolean => {
  const adminEmails = ['gopikrishnackofficial@gmail.com', 'praveenchintuyt@gmail.com'];
  return adminEmails.includes(email);
};

// ============= ARRAY UTILITIES =============
export const getUniqueTopics = (questions: Question[]): string[] => {
  return [...new Set(questions.map(q => q.topic))].sort();
};

export const getUniqueTags = (questions: Question[]): string[] => {
  const allTags = questions.flatMap(q => q.tags);
  return [...new Set(allTags)].sort();
};

// ============= FORMAT UTILITIES =============
export const formatDateForDisplay = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatArrayForInput = (array: string[]): string => {
  return array.join(', ');
};

export const parseInputToArray = (input: string): string[] => {
  return input.split(',').map(item => item.trim()).filter(Boolean);
};