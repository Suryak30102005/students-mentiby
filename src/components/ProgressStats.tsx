import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Clock, 
  CheckCircle, 
  BookmarkCheck,
  TrendingUp,
  Trophy,
  Flame,
  Calendar
} from 'lucide-react';

interface Question {
  id: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface UserProgress {
  question_id: string;
  completed: boolean;
  marked_for_revision: boolean;
  time_spent?: number;
  completed_at?: string;
}

interface ProgressStatsProps {
  questions: Question[];
  userProgress: UserProgress[];
}

export function ProgressStats({ questions, userProgress }: ProgressStatsProps) {
  const totalQuestions = questions.length;
  const completedQuestions = userProgress.filter(p => p.completed).length;
  const revisionQuestions = userProgress.filter(p => p.marked_for_revision).length;
  const totalTimeSpent = userProgress.reduce((sum, p) => sum + (p.time_spent || 0), 0);
  
  const completionRate = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;
  
  // Calculate streak (consecutive days with completions)
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
  
  // Calculate average time per question
  const avgTimePerQuestion = completedQuestions > 0 ? Math.round(totalTimeSpent / completedQuestions) : 0;
  
  // Difficulty breakdown
  const difficultyStats = {
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}%</div>
          <p className="text-xs text-muted-foreground">
            {completedQuestions} of {totalQuestions} completed
          </p>
          <Progress value={completionRate} className="mt-2" />
        </CardContent>
      </Card>

      {/* Time Spent */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTime(totalTimeSpent)}</div>
          <p className="text-xs text-muted-foreground">
            Total practice time
          </p>
        </CardContent>
      </Card>

      {/* Current Streak */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentStreak}</div>
          <p className="text-xs text-muted-foreground">
            {currentStreak === 1 ? 'day' : 'days'}
          </p>
        </CardContent>
      </Card>

      {/* Average Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
          <Trophy className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTime(avgTimePerQuestion)}</div>
          <p className="text-xs text-muted-foreground">
            per question
          </p>
        </CardContent>
      </Card>

      {/* Completed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedQuestions}</div>
          <p className="text-xs text-muted-foreground">
            Questions solved
          </p>
        </CardContent>
      </Card>

      {/* For Revision */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">For Revision</CardTitle>
          <BookmarkCheck className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{revisionQuestions}</div>
          <p className="text-xs text-muted-foreground">
            Marked for review
          </p>
        </CardContent>
      </Card>
      {/* Difficulty Breakdown */}
      <Card className="md:col-span-2 lg:col-span-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Difficulty Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(difficultyStats).map(([difficulty, stats]) => {
              const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
              const colorClass = difficulty === 'Easy' ? 'text-green-600' : 
                                difficulty === 'Medium' ? 'text-yellow-600' : 'text-red-600';
              
              return (
                <div key={difficulty} className="text-center">
                  <Badge variant="outline" className={`mb-2 ${colorClass}`}>
                    {difficulty}
                  </Badge>
                  <div className="text-lg font-semibold">{percentage}%</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.completed}/{stats.total}
                  </p>
                  <Progress value={percentage} className="mt-1 h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}