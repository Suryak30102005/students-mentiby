import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  ExternalLink, 
  Clock, 
  Target, 
  Lightbulb,
  BookOpen,
  Code,
  CheckCircle,
  BookmarkPlus,
  StickyNote
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface QuestionDetailsProps {
  question: Question;
  progress?: UserProgress;
  children: React.ReactNode;
}

export function QuestionDetails({ question, progress, children }: QuestionDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Hard': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
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

  // Mock problem description and hints (in a real app, this would come from the database)
  const problemDescription = `
This is a coding problem that tests your understanding of ${question.topic}. 

**Problem Statement:**
Implement a solution that demonstrates proficiency in ${question.topic} concepts. This ${question.difficulty.toLowerCase()} level problem will help you practice fundamental algorithms and data structures.

**Input:**
- The input parameters will be provided in the problem interface
- Consider edge cases and boundary conditions

**Output:**
- Return the expected result according to the problem requirements
- Ensure your solution handles all specified cases

**Constraints:**
- Time complexity should be optimized
- Consider space complexity trade-offs
- Handle edge cases appropriately

**Example:**
\`\`\`
Input: example_input
Output: expected_output
\`\`\`
  `;

  const hints = [
    `Consider using ${question.topic} principles to approach this problem`,
    `Think about the most efficient algorithm for this ${question.difficulty.toLowerCase()} problem`,
    `Break down the problem into smaller subproblems`,
    `Consider the time and space complexity of your solution`
  ];

  const relatedConcepts = [
    'Algorithms',
    'Data Structures', 
    'Problem Solving',
    question.topic,
    ...question.tags
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                question.difficulty === 'Easy' ? 'bg-green-500' :
                question.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span>{question.title}</span>
            </div>
            <Badge className={getDifficultyColor(question.difficulty)}>
              {question.difficulty}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {progress?.completed && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Completed</span>
                </div>
              )}
              {progress?.marked_for_revision && (
                <div className="flex items-center text-blue-600">
                  <BookmarkPlus className="h-4 w-4 mr-1" />
                  <span className="text-sm">For Revision</span>
                </div>
              )}
              {progress?.time_spent && (
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-sm">{formatTime(progress.time_spent)}</span>
                </div>
              )}
            </div>
            
            {question.solve_url && (
              <Button asChild>
                <a href={question.solve_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Solve Problem
                </a>
              </Button>
            )}
          </div>

          <Separator />

          {/* Topic and Tags */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span className="font-medium">Topic:</span>
              <Badge variant="outline">{question.topic}</Badge>
            </div>
            
            {question.tags.length > 0 && (
              <div className="flex items-center space-x-2">
                <Code className="h-4 w-4" />
                <span className="font-medium">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {question.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Tabbed Content */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="hints">Hints</TabsTrigger>
              <TabsTrigger value="concepts">Concepts</TabsTrigger>
              <TabsTrigger value="notes">My Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Problem Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {problemDescription}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="hints" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2" />
                    Hints & Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {hints.map((hint, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <p className="text-sm">{hint}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="concepts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Related Concepts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {relatedConcepts.map((concept) => (
                      <Badge key={concept} variant="outline" className="text-sm">
                        {concept}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <StickyNote className="h-5 w-5 mr-2" />
                    Personal Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add your personal notes about this problem..."
                    value={progress?.note || ''}
                    className="min-h-[200px]"
                    readOnly
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    To edit notes, use the note button in the main dashboard.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}