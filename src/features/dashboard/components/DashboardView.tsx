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

const DashboardView = () => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    );
  }

  const totalQuestions = questions.length;
  const completedQuestions = userProgress.filter(p => p.completed).length;
  const overallProgress = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Your Coding Journey
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Track your progress, master algorithms, and achieve your coding goals
        </p>
        
        {/* Overall Progress Card */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Target className="h-5 w-5" />
              Overall Progress
            </CardTitle>
            <CardDescription>Your coding mastery journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{overallProgress}%</div>
              <p className="text-sm text-muted-foreground">
                {completedQuestions} of {totalQuestions} problems solved
              </p>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Progress Statistics */}
      <ProgressStats questions={questions} userProgress={userProgress} />

      {/* Search and Filter */}
      <SearchAndFilter
        questions={questions}
        userProgress={userProgress}
        onFilteredQuestionsChange={(filteredQuestions: Question[]) => setFilteredQuestions(filteredQuestions)}
        onSortChange={() => {}} // Will be handled by SearchAndFilter component
      />

      {/* Advanced Features */}
      <AdvancedFeatures userProgress={userProgress} questions={questions} />

      {/* Progress Charts */}
      <ProgressCharts questions={questions} userProgress={userProgress} />

      {/* Sheets and Questions */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Problem Sheets</h2>
        </div>

        {sheets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No problem sheets available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {sheets.map((sheet) => {
              const sheetQuestions = filteredQuestions.filter(q => q.sheet_id === sheet.id);
              const sheetTopics = getUniqueTopics(sheetQuestions);
              
              return (
                <Card key={sheet.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{sheet.title}</CardTitle>
                        <CardDescription className="mt-2">{sheet.description}</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {sheetQuestions.length} questions
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {sheetTopics.map((topic) => {
                      const topicQuestions = sheetQuestions.filter(q => q.topic === topic);
                      const topicProgress = calculateTopicProgress(questions, userProgress, topic);
                      
                      return (
                        <Collapsible key={topic} defaultOpen={false} className="group data-[state=open]:bg-muted/30 rounded-lg transition-all">
                          <CollapsibleTrigger className="w-full">
                            <Button 
                              variant="ghost" 
                              className="w-full justify-between p-4 h-auto hover:bg-muted/50 rounded-lg border border-transparent hover:border-border/50 transition-all"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="text-left">
                                  <h3 className="font-semibold text-base">{topic}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {topicQuestions.length} questions
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="text-right">
                                  <div className="text-sm font-semibold">{topicProgress.percentage}%</div>
                                  <Progress value={topicProgress.percentage} className="w-16 h-1" />
                                </div>
                                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                              </div>
                            </Button>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent className="px-4 pb-4">
                            <div className="grid gap-3 pt-4">
                              {topicQuestions.map((question) => {
                                const progress = userProgress.find(p => p.question_id === question.id);
                                return (
                                  <QuestionItem
                                    key={question.id}
                                    question={question}
                                    progress={progress}
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;