import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, BookOpen, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
}

const Dashboard = () => {
  const { user } = useAuth();
  const [sheets, setSheets] = useState<Sheet[]>([]);
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
      setUserProgress(progressData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSheetProgress = (sheetId: string) => {
    const sheetQuestions = questions.filter(q => q.sheet_id === sheetId);
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
    const topicQuestions = questions.filter(q => q.sheet_id === sheetId && q.topic === topic);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Track your coding progress across different practice sheets</p>
        </div>
      </div>

      <div className="grid gap-6">
        {sheets.map((sheet) => {
          const progress = getSheetProgress(sheet.id);
          return (
            <Card key={sheet.id} className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle className="text-xl">{sheet.title}</CardTitle>
                      <CardDescription>{sheet.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{progress.percentage}%</div>
                    <div className="text-sm text-muted-foreground">
                      {progress.completed}/{progress.total} completed
                    </div>
                  </div>
                </div>
                <Progress value={progress.percentage} className="mt-4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sheet.topics.map((topic) => {
                    const topicProgress = getTopicProgress(sheet.id, topic);
                    const topicQuestions = questions.filter(q => q.sheet_id === sheet.id && q.topic === topic);
                    
                    return (
                      <Collapsible key={topic}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                            <div className="flex items-center space-x-3">
                              <Target className="h-5 w-5 text-primary" />
                              <div className="text-left">
                                <div className="font-semibold">{topic}</div>
                                <div className="text-sm text-muted-foreground">
                                  {topicProgress.completed}/{topicProgress.total} questions completed
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div className="font-semibold">{topicProgress.percentage}%</div>
                                <Progress value={topicProgress.percentage} className="w-20" />
                              </div>
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-4">
                          <div className="space-y-2 mt-4">
                            {topicQuestions.map((question) => {
                              const questionProgress = userProgress.find(p => p.question_id === question.id);
                              return (
                                <div key={question.id} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${getDifficultyColor(question.difficulty)}`} />
                                    <div>
                                      <div className="font-medium">{question.title}</div>
                                      <div className="flex space-x-1 mt-1">
                                        {question.tags.map((tag) => (
                                          <Badge key={tag} variant="secondary" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {questionProgress?.completed && (
                                      <Badge variant="default">Completed</Badge>
                                    )}
                                    {questionProgress?.marked_for_revision && (
                                      <Badge variant="outline">For Revision</Badge>
                                    )}
                                    {question.solve_url && (
                                      <Button size="sm" variant="outline" asChild>
                                        <a href={question.solve_url} target="_blank" rel="noopener noreferrer">
                                          Solve
                                        </a>
                                      </Button>
                                    )}
                                  </div>
                                </div>
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
  );
};

export default Dashboard;