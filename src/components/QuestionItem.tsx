import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Clock, 
  Play, 
  Pause, 
  BookmarkPlus, 
  BookmarkCheck, 
  StickyNote,
  ExternalLink 
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

interface QuestionItemProps {
  question: Question;
  progress?: UserProgress;
  userId: string;
  onProgressUpdate: (questionId: string, updates: Partial<UserProgress>) => void;
}

export function QuestionItem({ question, progress, userId, onProgressUpdate }: QuestionItemProps) {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeSpent, setTimeSpent] = useState(progress?.time_spent || 0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [note, setNote] = useState(progress?.note || '');
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const { toast } = useToast();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const startTimer = () => {
    setIsTimerRunning(true);
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopTimer = async () => {
    setIsTimerRunning(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    // Save time to database
    await updateProgress({ time_spent: timeSpent });
  };

  const updateProgress = async (updates: Partial<UserProgress>) => {
    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          question_id: question.id,
          completed: progress?.completed || false,
          marked_for_revision: progress?.marked_for_revision || false,
          note: progress?.note,
          time_spent: progress?.time_spent || 0,
          ...updates,
        });

      if (error) throw error;

      onProgressUpdate(question.id, updates);
      
      toast({
        title: "Progress updated",
        description: "Your progress has been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleCompletion = async () => {
    const newCompleted = !progress?.completed;
    await updateProgress({ 
      completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : undefined 
    });
  };

  const toggleRevision = async () => {
    const newRevision = !progress?.marked_for_revision;
    await updateProgress({ marked_for_revision: newRevision });
  };

  const saveNote = async () => {
    await updateProgress({ note });
    setIsNoteExpanded(false);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Checkbox
            checked={progress?.completed || false}
            onCheckedChange={toggleCompletion}
            className="h-5 w-5"
          />
          <div className={`w-3 h-3 rounded-full ${getDifficultyColor(question.difficulty)}`} />
          <div>
            <div className={`font-medium ${progress?.completed ? 'line-through text-muted-foreground' : ''}`}>
              {question.title}
            </div>
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
          {/* Timer */}
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>{formatTime(timeSpent)}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={isTimerRunning ? stopTimer : startTimer}
            >
              {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
          </div>

          {/* Revision Toggle */}
          <Button
            size="sm"
            variant={progress?.marked_for_revision ? "default" : "outline"}
            onClick={toggleRevision}
          >
            {progress?.marked_for_revision ? 
              <BookmarkCheck className="h-3 w-3" /> : 
              <BookmarkPlus className="h-3 w-3" />
            }
          </Button>

          {/* Note Toggle */}
          <Button
            size="sm"
            variant={progress?.note ? "default" : "outline"}
            onClick={() => setIsNoteExpanded(!isNoteExpanded)}
          >
            <StickyNote className="h-3 w-3" />
          </Button>

          {/* Solve Link */}
          {question.solve_url && (
            <Button size="sm" variant="outline" asChild>
              <a href={question.solve_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}

          {/* Status Badges */}
          {progress?.completed && (
            <Badge variant="default">Completed</Badge>
          )}
          {progress?.marked_for_revision && (
            <Badge variant="outline">For Revision</Badge>
          )}
        </div>
      </div>

      {/* Note Section */}
      <Collapsible open={isNoteExpanded} onOpenChange={setIsNoteExpanded}>
        <CollapsibleContent className="mt-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Add a note about this question..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end space-x-2">
              <Button size="sm" variant="outline" onClick={() => setIsNoteExpanded(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveNote}>
                Save Note
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}