import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  BookmarkPlus, 
  X, 
  Trash2,
  RotateCcw 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface BulkActionsProps {
  questions: Question[];
  userProgress: UserProgress[];
  userId: string;
  onProgressUpdate: (updates: { questionId: string; progress: Partial<UserProgress> }[]) => void;
}

export function BulkActions({ questions, userProgress, userId, onProgressUpdate }: BulkActionsProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map(q => q.id));
    }
  };

  const handleSelectQuestion = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const performBulkAction = async (action: 'complete' | 'revision' | 'reset') => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "No questions selected",
        description: "Please select questions to perform bulk actions.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const updates = selectedQuestions.map(questionId => {
        const currentProgress = userProgress.find(p => p.question_id === questionId);
        let newProgress: Partial<UserProgress> = {};

        switch (action) {
          case 'complete':
            newProgress = { 
              completed: true,
              completed_at: new Date().toISOString() 
            };
            break;
          case 'revision':
            newProgress = { marked_for_revision: true };
            break;
          case 'reset':
            newProgress = { 
              completed: false, 
              marked_for_revision: false,
              completed_at: undefined 
            };
            break;
        }

        return {
          user_id: userId,
          question_id: questionId,
          completed: currentProgress?.completed || false,
          marked_for_revision: currentProgress?.marked_for_revision || false,
          note: currentProgress?.note || '',
          time_spent: currentProgress?.time_spent || 0,
          ...newProgress,
        };
      });

      const { error } = await supabase
        .from('user_progress')
        .upsert(updates, { onConflict: 'user_id,question_id' });

      if (error) throw error;

      // Update local state
      const progressUpdates = selectedQuestions.map(questionId => ({
        questionId,
        progress: updates.find(u => u.question_id === questionId) || {}
      }));
      
      onProgressUpdate(progressUpdates);
      
      setSelectedQuestions([]);
      
      const actionNames = {
        complete: 'completed',
        revision: 'marked for revision',
        reset: 'reset'
      };

      toast({
        title: "Bulk action completed",
        description: `${selectedQuestions.length} questions ${actionNames[action]}.`,
      });
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: "Error",
        description: "Failed to perform bulk action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (questions.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={selectedQuestions.length === questions.length}
              onCheckedChange={handleSelectAll}
              className="h-5 w-5"
            />
            <span>Bulk Actions</span>
            {selectedQuestions.length > 0 && (
              <Badge variant="secondary">
                {selectedQuestions.length} selected
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedQuestions([])}
            disabled={selectedQuestions.length === 0}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      {selectedQuestions.length > 0 && (
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => performBulkAction('complete')}
              disabled={isProcessing}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Completed
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => performBulkAction('revision')}
              disabled={isProcessing}
            >
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Mark for Revision
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => performBulkAction('reset')}
              disabled={isProcessing}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Progress
            </Button>
          </div>
        </CardContent>
      )}

      {/* Question Selection List */}
      <CardContent className="pt-0">
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {questions.map((question) => {
            const isSelected = selectedQuestions.includes(question.id);
            const progress = userProgress.find(p => p.question_id === question.id);
            
            return (
              <div
                key={question.id}
                className={`flex items-center space-x-3 p-2 rounded-lg border transition-colors ${
                  isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => handleSelectQuestion(question.id)}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => handleSelectQuestion(question.id)}
                  className="h-4 w-4"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      question.difficulty === 'Easy' ? 'bg-green-500' :
                      question.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium truncate">{question.title}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">{question.topic}</Badge>
                    {progress?.completed && (
                      <Badge variant="default" className="text-xs">Completed</Badge>
                    )}
                    {progress?.marked_for_revision && (
                      <Badge variant="outline" className="text-xs">Revision</Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}