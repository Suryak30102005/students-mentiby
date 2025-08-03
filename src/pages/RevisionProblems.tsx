import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookmarkCheck, Clock, AlertCircle } from 'lucide-react';
import { QuestionItem } from '@/components/QuestionItem';
import { sheetService, questionService, progressService } from '@/services/supabase';
import { getDifficultyColor, calculateCompletionRate } from '@/utils';
import type { Sheet, Question, UserProgress } from '@/types';

const RevisionProblems = () => {
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
    if (!user) return;

    setLoading(true);
    try {
      const [sheetsResult, questionsResult, progressResult] = await Promise.all([
        sheetService.getAllSheets(),
        questionService.getAllQuestions(),
        progressService.getRevisionQuestions(user.id)
      ]);

      if (sheetsResult.error) throw sheetsResult.error;
      if (questionsResult.error) throw questionsResult.error;
      if (progressResult.error) throw progressResult.error;

      setSheets(sheetsResult.data || []);
      setQuestions(questionsResult.data || []);
      setUserProgress(progressResult.data || []);
    } catch (error) {
      console.error('Error fetching revision data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (questionId: string, updates: Partial<UserProgress>) => {
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
  };

  // Get questions marked for revision
  const revisionQuestions = questions.filter(q => 
    userProgress.some(p => p.question_id === q.id && p.marked_for_revision)
  );

  // Group revision questions by sheet
  const revisionBySheet = sheets.map(sheet => ({
    ...sheet,
    questions: revisionQuestions.filter(q => q.sheet_id === sheet.id)
  })).filter(sheet => sheet.questions.length > 0);

  // Get statistics
  const totalRevisionProblems = revisionQuestions.length;
  const completedRevisionProblems = revisionQuestions.filter(q => {
    const progress = userProgress.find(p => p.question_id === q.id);
    return progress?.completed;
  }).length;

  const difficultyBreakdown = {
    Easy: revisionQuestions.filter(q => q.difficulty === 'Easy').length,
    Medium: revisionQuestions.filter(q => q.difficulty === 'Medium').length,
    Hard: revisionQuestions.filter(q => q.difficulty === 'Hard').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading revision problems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="container max-w-7xl mx-auto space-y-8 px-4 py-6">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center space-x-3">
            <BookmarkCheck className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Revision Problems
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Focus on problems you've marked for revision to strengthen your understanding
          </p>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revision</CardTitle>
              <BookmarkCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRevisionProblems}</div>
              <p className="text-xs text-muted-foreground">
                problems marked for revision
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedRevisionProblems}</div>
              <p className="text-xs text-muted-foreground">
                out of {totalRevisionProblems} revision problems
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {totalRevisionProblems - completedRevisionProblems}
              </div>
              <p className="text-xs text-muted-foreground">
                problems still need attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <BookmarkCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalRevisionProblems > 0 ? Math.round((completedRevisionProblems / totalRevisionProblems) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                revision completion rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Difficulty Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Difficulty Breakdown</CardTitle>
            <CardDescription>
              Distribution of revision problems by difficulty level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Easy: {difficultyBreakdown.Easy}
              </Badge>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Medium: {difficultyBreakdown.Medium}
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Hard: {difficultyBreakdown.Hard}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Revision Problems by Sheet */}
        {totalRevisionProblems === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookmarkCheck className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Problems Marked for Revision</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You haven't marked any problems for revision yet. As you practice, you can mark challenging problems to review them later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="h-1 w-8 bg-primary rounded-full"></div>
              <h2 className="text-xl font-semibold">Revision Problems by Sheet</h2>
            </div>
            
            {revisionBySheet.map((sheet) => (
              <Card key={sheet.id} className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                        <BookmarkCheck className="h-6 w-6 text-orange-600" />
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
                      <div className="text-lg font-bold text-orange-600">{sheet.questions.length}</div>
                      <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        problems to review
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {sheet.questions.map((question) => {
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RevisionProblems;