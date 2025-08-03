import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, BookOpen, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { QuestionItem } from '@/components/QuestionItem';
import { ProgressStats } from '@/components/ProgressStats';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { ProgressCharts } from '@/components/ProgressCharts';
import { AdvancedFeatures } from '@/components/AdvancedFeatures';

interface Sheet {
  id: string;
  title: string;
  description: string;
  topics: string[];
}

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

const Dashboard = () => {
  const { user } = useAuth();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch sheets
      const { data: sheetsData, error: sheetsError } = await supabase
        .from('sheets')
        .select('*');

      if (sheetsError) throw sheetsError;

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

      setSheets(sheetsData || []);
      setQuestions(questionsData || []);
      setFilteredQuestions(questionsData || []);
      setUserProgress(progressData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = (questionId: string, updates: Partial<UserProgress>) => {
    setUserProgress(prev => {
      const existingIndex = prev.findIndex(p => p.question_id === questionId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...updates };
        return updated;
      } else {
        return [...prev, { question_id: questionId, completed: false, marked_for_revision: false, ...updates }];
      }
    });
  };

  const handleFilteredQuestionsChange = (filtered: Question[]) => {
    setFilteredQuestions(filtered);
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    // Sorting is handled in SearchAndFilter component
  };

  const getSheetProgress = (sheetId: string) => {
    const sheetQuestions = filteredQuestions.filter(q => q.sheet_id === sheetId);
    const completedQuestions = sheetQuestions.filter(q => 
      userProgress.some(p => p.question_id === q.id && p.completed)
    );
    return {
      total: sheetQuestions.length,
      completed: completedQuestions.length,
      percentage: sheetQuestions.length > 0 ? Math.round((completedQuestions.length / sheetQuestions.length) * 100) : 0
    };
  };

  const getTopicProgress = (sheetId: string, topic: string) => {
    const topicQuestions = filteredQuestions.filter(q => q.sheet_id === sheetId && q.topic === topic);
    const completedQuestions = topicQuestions.filter(q => 
      userProgress.some(p => p.question_id === q.id && p.completed)
    );
    return {
      total: topicQuestions.length,
      completed: completedQuestions.length,
      percentage: topicQuestions.length > 0 ? Math.round((completedQuestions.length / topicQuestions.length) * 100) : 0
    };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container max-w-7xl mx-auto space-y-8 px-4 py-6">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Your Learning Dashboard
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track your coding journey with intelligent insights and personalized progress analytics
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ProgressStats questions={questions} userProgress={userProgress} />
          </div>
          <div className="space-y-6">
            <AdvancedFeatures questions={questions} userProgress={userProgress} />
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <div className="h-1 w-8 bg-primary rounded-full"></div>
            <h2 className="text-xl font-semibold">Progress Analytics</h2>
          </div>
          <ProgressCharts questions={questions} userProgress={userProgress} />
        </div>

        {/* Controls Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <div className="h-1 w-8 bg-primary rounded-full"></div>
            <h2 className="text-xl font-semibold">Practice Sheets</h2>
          </div>
          <div className="bg-card/50 backdrop-blur-sm border rounded-xl p-6">
            <SearchAndFilter 
              questions={questions}
              userProgress={userProgress}
              onFilteredQuestionsChange={handleFilteredQuestionsChange}
              onSortChange={handleSortChange}
            />
          </div>
        </div>

        {/* Practice Sheets */}
        <div className="space-y-6">
          {sheets.map((sheet, index) => {
            const progress = getSheetProgress(sheet.id);
            return (
              <Card key={sheet.id} className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {sheet.title}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          {sheet.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-3xl font-bold text-primary">{progress.percentage}%</div>
                      <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {progress.completed} of {progress.total} completed
                      </div>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Progress value={progress.percentage} className="h-2" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {sheet.topics.map((topic) => {
                      const topicProgress = getTopicProgress(sheet.id, topic);
                      const topicQuestions = filteredQuestions.filter(q => q.sheet_id === sheet.id && q.topic === topic);
                      
                      return (
                        <Collapsible key={topic}>
                          <CollapsibleTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="w-full justify-between p-4 h-auto hover:bg-muted/50 rounded-lg border border-transparent hover:border-border/50 transition-all"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Target className="h-4 w-4 text-primary" />
                                </div>
                                <div className="text-left space-y-1">
                                  <div className="font-medium">{topic}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {topicProgress.completed}/{topicProgress.total} questions
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right space-y-1">
                                  <div className="text-sm font-semibold">{topicProgress.percentage}%</div>
                                  <Progress value={topicProgress.percentage} className="w-16 h-1" />
                                </div>
                                <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                              </div>
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-4 pb-2">
                            <div className="space-y-2 mt-3 pl-12">
                              {topicQuestions.map((question) => {
                                const questionProgress = userProgress.find(p => p.question_id === question.id);
                                return (
                                  <QuestionItem
                                    key={question.id}
                                    question={question}
                                    progress={questionProgress}
                                    userId={user?.id || ''}
                                    onProgressUpdate={handleProgressUpdate}
                                  />
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;