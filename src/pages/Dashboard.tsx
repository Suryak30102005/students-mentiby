import { useState, useEffect, useCallback } from 'react';
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
import { sheetService, questionService, progressService, realtimeService } from '@/services/supabase';
import { calculateTopicProgress, getUniqueTopics } from '@/utils';
import type { Sheet, Question, UserProgress } from '@/types';

const Dashboard = () => {
  const { user } = useAuth();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [sheetsResult, questionsResult, progressResult] = await Promise.all([
        sheetService.getAllSheets(),
        questionService.getAllQuestions(),
        progressService.getUserProgress(user.id)
      ]);

      if (sheetsResult.error) throw sheetsResult.error;
      if (questionsResult.error) throw questionsResult.error;
      if (progressResult.error) throw progressResult.error;

      setSheets(sheetsResult.data || []);
      setQuestions(questionsResult.data || []);
      setUserProgress(progressResult.data || []);
      setFilteredQuestions(questionsResult.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscriptions for dashboard');

    const questionsSubscription = realtimeService.subscribeToQuestions((payload) => {
      console.log('Questions changed in dashboard:', payload);
      fetchData();
    });

    const progressSubscription = realtimeService.subscribeToUserProgress((payload) => {
      console.log('User progress changed in dashboard:', payload);  
      fetchData();
    });

    return () => {
      console.log('Cleaning up dashboard subscriptions');
      realtimeService.unsubscribe(questionsSubscription);
      realtimeService.unsubscribe(progressSubscription);
    };
  }, [user, fetchData]);

  const handleProgressUpdate = useCallback(async (questionId: string, updates: Partial<UserProgress>) => {
    if (!user) return;

    try {
      const result = await progressService.updateProgress(user.id, questionId, updates);
      if (result.error) throw result.error;

      // Update local state
      setUserProgress(prev => {
        const existingIndex = prev.findIndex(p => p.question_id === questionId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...updates };
          return updated;
        } else {
          return [...prev, result.data];
        }
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [user]);

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
    return calculateTopicProgress(
      filteredQuestions.filter(q => q.sheet_id === sheetId),
      userProgress,
      topic
    );
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
    <div className="space-y-8">
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

        {/* Practice Controls */}
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
                    {/* Show questions grouped by their actual topics instead of predefined sheet topics */}
                    {[...new Set(filteredQuestions.filter(q => q.sheet_id === sheet.id).map(q => q.topic))].map((topic) => {
                      const topicProgress = getTopicProgress(sheet.id, topic);
                      const topicQuestions = filteredQuestions.filter(q => q.sheet_id === sheet.id && q.topic === topic);
                      
                      return (
                        <Collapsible key={topic} defaultOpen={false} className="group data-[state=open]:bg-muted/30 rounded-lg transition-all">
                          <CollapsibleTrigger className="w-full">
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
                                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
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