// Centralized type definitions for the entire application

export interface Sheet {
  id: string;
  title: string;
  description: string;
  topics: string[];
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  sheet_id: string;
  title: string;
  topic: string;
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  solve_url?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  question_id: string;
  completed: boolean;
  marked_for_revision: boolean;
  note?: string;
  time_spent?: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  cohort?: string;
  created_at: string;
  updated_at: string;
}

// Progress-related types
export interface DifficultyStats {
  Easy: {
    total: number;
    completed: number;
  };
  Medium: {
    total: number;
    completed: number;
  };
  Hard: {
    total: number;
    completed: number;
  };
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

export interface ChartDataPoint {
  name: string;
  total: number;
  completed: number;
  color: string;
}

export interface TopicProgress {
  topic: string;
  total: number;
  completed: number;
  percentage: number;
}

// Form types
export interface SheetFormData {
  title: string;
  description: string;
  topics: string;
}

export interface QuestionFormData {
  sheet_id: string;
  title: string;
  topic: string;
  tags: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  solve_url: string;
  order_index: number;
}

// Filter and search types
export interface FilterOptions {
  difficulty: string;
  topic: string;
  status: string;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Component prop types
export interface ProgressStatsProps {
  questions: Question[];
  userProgress: UserProgress[];
}

export interface ProgressChartsProps {
  questions: Question[];
  userProgress: UserProgress[];
}

export interface AdvancedFeaturesProps {
  userProgress: UserProgress[];
  questions: Question[];
}

export interface QuestionItemProps {
  question: Question;
  progress?: UserProgress;
  userId: string;
  onProgressUpdate: (questionId: string, updates: Partial<UserProgress>) => void;
}

export interface QuestionDetailsProps {
  question: Question;
  progress?: UserProgress;
  children: React.ReactNode;
}

export interface SearchAndFilterProps {
  questions: Question[];
  userProgress: UserProgress[];
  onFilteredQuestionsChange: (questions: Question[]) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}