import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { ProgressCharts } from '@/components/ProgressCharts';
import { ProgressStats } from '@/components/ProgressStats';
import { AdvancedFeatures } from '@/components/AdvancedFeatures';

interface Question {
  id: string;
  sheet_id: string;
  title: string;
  topic: string;
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  solve_url?: string;
}

interface UserProgress {
  question_id: string;
  completed: boolean;
  marked_for_revision: boolean;
  note?: string;
  time_spent?: number;
  completed_at?: string;
}

const ProgressAnalytics = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .order('order_index');

      if (questionsError) throw questionsError;

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id);

      if (progressError) throw progressError;

      setQuestions(questionsData || []);
      setUserProgress(progressData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="container max-w-7xl mx-auto space-y-8 px-4 py-6">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Progress Analytics
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Deep insights into your learning journey with comprehensive data visualization and performance metrics
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ProgressStats questions={questions} userProgress={userProgress} />
          </div>
          <div>
            <AdvancedFeatures questions={questions} userProgress={userProgress} />
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="h-1 w-12 bg-gradient-to-r from-primary to-primary/60 rounded-full"></div>
              <h2 className="text-2xl font-bold text-primary">Detailed Analytics</h2>
              <div className="h-1 w-12 bg-gradient-to-l from-primary to-primary/60 rounded-full"></div>
            </div>
            <p className="text-muted-foreground">Visual breakdown of your progress across different dimensions</p>
          </div>
          
          <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border rounded-2xl p-6">
            <ProgressCharts questions={questions} userProgress={userProgress} />
        </div>
      </div>
    </div>
    </div>
  );
};

export default ProgressAnalytics;