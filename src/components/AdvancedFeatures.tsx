import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';

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
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivity: ''
  });

  useEffect(() => {
    calculateStreaks();
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

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Flame className="h-5 w-5 mr-2 text-orange-500" />
          Streak Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{streakData.currentStreak}</div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{streakData.longestStreak}</div>
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
  );
}