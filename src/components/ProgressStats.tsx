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
  Calendar,
  Timer
} from 'lucide-react';
import { formatTime, calculateDifficultyStats, calculateCurrentStreak, getQuestionsCompletedToday, getDifficultyColor } from '@/utils';
import type { ProgressStatsProps } from '@/types';

export function ProgressStats({ questions, userProgress }: ProgressStatsProps) {
  const totalQuestions = questions.length;
  const completedQuestions = userProgress.filter(p => p.completed).length;
  const revisionQuestions = userProgress.filter(p => p.marked_for_revision).length;
  const totalTimeSpent = userProgress.reduce((sum, p) => sum + (p.time_spent || 0), 0);
  
  const completionRate = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;
  
  // Calculate stats using utility functions
  const currentStreak = calculateCurrentStreak(userProgress);
  const avgTimePerQuestion = completedQuestions > 0 ? Math.round(totalTimeSpent / completedQuestions) : 0;
  const questionsCompletedToday = getQuestionsCompletedToday(userProgress);
  
  // Difficulty breakdown
  const difficultyStats = calculateDifficultyStats(questions, userProgress);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
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

      {/* Average Time Per Question */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Time</CardTitle>
          <Timer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTime(avgTimePerQuestion)}</div>
          <p className="text-xs text-muted-foreground">
            Per question solved
          </p>
        </CardContent>
      </Card>

      {/* Today's Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{questionsCompletedToday}</div>
          <p className="text-xs text-muted-foreground">
            Questions completed today
          </p>
        </CardContent>
      </Card>

      {/* Difficulty Breakdown */}
      <Card className="md:col-span-2 lg:col-span-4">
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