import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, 
  Trophy, 
  Target, 
  Calendar,
  Award,
  Star,
  CheckCircle,
  Download,
  Share2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  target: number;
  category: 'streak' | 'completion' | 'time' | 'difficulty';
}

interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  deadline: string;
  type: 'daily' | 'weekly' | 'monthly';
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivity: string;
}

interface AdvancedFeaturesProps {
  userProgress: any[];
  questions: any[];
}

export function AdvancedFeatures({ userProgress, questions }: AdvancedFeaturesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivity: ''
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    calculateStreaks();
    calculateAchievements();
    loadGoals();
  }, [userProgress]);

  const calculateStreaks = () => {
    const completedDates = userProgress
      .filter(p => p.completed && p.completed_at)
      .map(p => new Date(p.completed_at).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    // Calculate current streak
    if (completedDates.includes(today) || completedDates.includes(yesterday)) {
      const startDate = completedDates.includes(today) ? today : yesterday;
      let checkDate = new Date(startDate);
      
      while (completedDates.includes(checkDate.toDateString())) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Calculate longest streak
    for (let i = 0; i < completedDates.length; i++) {
      const currentDate = new Date(completedDates[i]);
      const nextDate = completedDates[i + 1] ? new Date(completedDates[i + 1]) : null;
      
      tempStreak = 1;
      
      if (nextDate) {
        const dayDiff = (currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24);
        if (dayDiff === 1) {
          let j = i + 1;
          while (j < completedDates.length) {
            const checkDate = new Date(completedDates[j - 1]);
            const nextCheckDate = new Date(completedDates[j]);
            const diff = (checkDate.getTime() - nextCheckDate.getTime()) / (1000 * 60 * 60 * 24);
            
            if (diff === 1) {
              tempStreak++;
              j++;
            } else {
              break;
            }
          }
        }
      }
      
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    setStreakData({
      currentStreak,
      longestStreak,
      lastActivity: completedDates[0] || ''
    });
  };

  const calculateAchievements = () => {
    const completedCount = userProgress.filter(p => p.completed).length;
    const totalTimeSpent = userProgress.reduce((sum, p) => sum + (p.time_spent || 0), 0);
    const difficultyBreakdown = {
      Easy: userProgress.filter(p => {
        const question = questions.find(q => q.id === p.question_id);
        return p.completed && question?.difficulty === 'Easy';
      }).length,
      Medium: userProgress.filter(p => {
        const question = questions.find(q => q.id === p.question_id);
        return p.completed && question?.difficulty === 'Medium';
      }).length,
      Hard: userProgress.filter(p => {
        const question = questions.find(q => q.id === p.question_id);
        return p.completed && question?.difficulty === 'Hard';
      }).length
    };

    const achievementsList: Achievement[] = [
      {
        id: '1',
        title: 'First Steps',
        description: 'Complete your first question',
        icon: <Star className="h-6 w-6" />,
        unlocked: completedCount >= 1,
        progress: Math.min(completedCount, 1),
        target: 1,
        category: 'completion'
      },
      {
        id: '2',
        title: 'Getting Started',
        description: 'Complete 10 questions',
        icon: <Target className="h-6 w-6" />,
        unlocked: completedCount >= 10,
        progress: Math.min(completedCount, 10),
        target: 10,
        category: 'completion'
      },
      {
        id: '3',
        title: 'Century Club',
        description: 'Complete 100 questions',
        icon: <Trophy className="h-6 w-6" />,
        unlocked: completedCount >= 100,
        progress: Math.min(completedCount, 100),
        target: 100,
        category: 'completion'
      },
      {
        id: '4',
        title: 'Streak Master',
        description: 'Maintain a 7-day streak',
        icon: <Flame className="h-6 w-6" />,
        unlocked: streakData.longestStreak >= 7,
        progress: Math.min(streakData.longestStreak, 7),
        target: 7,
        category: 'streak'
      },
      {
        id: '5',
        title: 'Easy Peasy',
        description: 'Complete 50 Easy questions',
        icon: <CheckCircle className="h-6 w-6" />,
        unlocked: difficultyBreakdown.Easy >= 50,
        progress: Math.min(difficultyBreakdown.Easy, 50),
        target: 50,
        category: 'difficulty'
      },
      {
        id: '6',
        title: 'Challenge Accepted',
        description: 'Complete 25 Hard questions',
        icon: <Award className="h-6 w-6" />,
        unlocked: difficultyBreakdown.Hard >= 25,
        progress: Math.min(difficultyBreakdown.Hard, 25),
        target: 25,
        category: 'difficulty'
      },
      {
        id: '7',
        title: 'Time Warrior',
        description: 'Spend 50+ hours practicing',
        icon: <Calendar className="h-6 w-6" />,
        unlocked: totalTimeSpent >= 180000, // 50 hours in seconds
        progress: Math.min(totalTimeSpent, 180000),
        target: 180000,
        category: 'time'
      }
    ];

    setAchievements(achievementsList);
  };

  const loadGoals = () => {
    // For now, we'll use mock goals. In a real app, these would be stored in the database
    const mockGoals: Goal[] = [
      {
        id: '1',
        title: 'Daily Practice',
        description: 'Complete 3 questions today',
        target: 3,
        current: userProgress.filter(p => {
          return p.completed && p.completed_at && 
            new Date(p.completed_at).toDateString() === new Date().toDateString();
        }).length,
        deadline: new Date().toISOString(),
        type: 'daily'
      },
      {
        id: '2',
        title: 'Weekly Challenge',
        description: 'Complete 20 questions this week',
        target: 20,
        current: userProgress.filter(p => {
          if (!p.completed || !p.completed_at) return false;
          const completedDate = new Date(p.completed_at);
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          weekStart.setHours(0, 0, 0, 0);
          return completedDate >= weekStart;
        }).length,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'weekly'
      }
    ];

    setGoals(mockGoals);
  };

  const exportProgress = async () => {
    try {
      const exportData = {
        user: user?.email,
        exportDate: new Date().toISOString(),
        summary: {
          totalQuestions: questions.length,
          completedQuestions: userProgress.filter(p => p.completed).length,
          totalTimeSpent: userProgress.reduce((sum, p) => sum + (p.time_spent || 0), 0),
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak
        },
        progress: userProgress.map(p => {
          const question = questions.find(q => q.id === p.question_id);
          return {
            questionTitle: question?.title || 'Unknown',
            topic: question?.topic || 'Unknown',
            difficulty: question?.difficulty || 'Unknown',
            completed: p.completed,
            timeSpent: p.time_spent || 0,
            completedAt: p.completed_at,
            markedForRevision: p.marked_for_revision,
            note: p.note
          };
        }),
        achievements: achievements.filter(a => a.unlocked).map(a => ({
          title: a.title,
          description: a.description,
          category: a.category
        }))
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `coding-progress-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Your progress data has been downloaded.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export failed",
        description: "Failed to export progress data.",
        variant: "destructive",
      });
    }
  };

  const shareProgress = async () => {
    const shareData = {
      title: 'My Coding Progress',
      text: `I've completed ${userProgress.filter(p => p.completed).length} coding questions with a current streak of ${streakData.currentStreak} days! 🔥`,
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully",
          description: "Your progress has been shared!",
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      toast({
        title: "Copied to clipboard",
        description: "Share text copied to clipboard!",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Streak Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Flame className="h-5 w-5 mr-2 text-orange-500" />
            Streak Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500">{streakData.currentStreak}</div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{streakData.longestStreak}</div>
              <p className="text-sm text-muted-foreground">Longest Streak</p>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">
                {streakData.lastActivity ? new Date(streakData.lastActivity).toLocaleDateString() : 'No activity'}
              </div>
              <p className="text-sm text-muted-foreground">Last Activity</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border ${
                  achievement.unlocked
                    ? 'bg-primary/10 border-primary'
                    : 'bg-muted/50 border-muted'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-full ${
                      achievement.unlocked
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {achievement.icon}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-medium">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.target}</span>
                      </div>
                      <Progress 
                        value={(achievement.progress / achievement.target) * 100} 
                        className="h-2"
                      />
                    </div>
                    {achievement.unlocked && (
                      <Badge variant="default" className="text-xs">
                        Unlocked!
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-500" />
            Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {goals.map((goal) => (
              <div key={goal.id} className="p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{goal.title}</h3>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {goal.type}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{goal.current}/{goal.target}</span>
                  </div>
                  <Progress 
                    value={(goal.current / goal.target) * 100} 
                    className="h-2"
                  />
                  {goal.current >= goal.target && (
                    <Badge variant="default" className="text-xs">
                      Goal Achieved! 🎉
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export and Sharing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Share2 className="h-5 w-5 mr-2" />
            Export & Share
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={exportProgress} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export Progress Data
            </Button>
            <Button onClick={shareProgress} variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share Progress
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Export your complete progress data as JSON or share your achievements with others.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}