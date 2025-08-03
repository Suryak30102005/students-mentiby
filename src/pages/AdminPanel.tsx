import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Target, 
  Users,
  BarChart3,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface Sheet {
  id: string;
  title: string;
  description: string;
  topics: string[];
  created_at: string;
}

interface Question {
  id: string;
  sheet_id: string;
  title: string;
  topic: string;
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  solve_url?: string;
  order_index: number;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('student');
  const [isSheetDialogOpen, setIsSheetDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState<Sheet | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form states
  const [sheetForm, setSheetForm] = useState({
    title: '',
    description: '',
    topics: ''
  });

  const [questionForm, setQuestionForm] = useState({
    sheet_id: '',
    title: '',
    topic: '',
    tags: '',
    difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard',
    solve_url: '',
    order_index: 0
  });

  useEffect(() => {
    if (user) {
      checkAdminAccess();
      fetchData();
    }
  }, [user]);

  // Set up real-time subscriptions for admin panel
  useEffect(() => {
    if (!user || userRole !== 'admin') return;

    console.log('Setting up real-time subscriptions for admin panel');

    const questionsSubscription = supabase
      .channel('admin-questions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions'
        },
        (payload) => {
          console.log('Questions changed in admin panel:', payload);
          fetchData(); // Refetch all data when questions change
        }
      )
      .subscribe();

    const sheetsSubscription = supabase
      .channel('admin-sheets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sheets'
        },
        (payload) => {
          console.log('Sheets changed in admin panel:', payload);
          fetchData(); // Refetch all data when sheets change
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up admin panel subscriptions');
      supabase.removeChannel(questionsSubscription);
      supabase.removeChannel(sheetsSubscription);
    };
  }, [user, userRole]);

  const checkAdminAccess = async () => {
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setUserRole(data.role);
        if (data.role !== 'admin') {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges to access this panel.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const fetchData = async () => {
    console.log('Fetching admin panel data...');
    try {
      const { data: sheetsData, error: sheetsError } = await supabase
        .from('sheets')
        .select('*')
        .order('created_at', { ascending: false });

      if (sheetsError) throw sheetsError;

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .order('order_index');

      if (questionsError) throw questionsError;

      console.log('Fetched sheets:', sheetsData?.length);
      console.log('Fetched questions:', questionsData?.length);
      
      setSheets(sheetsData || []);
      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const sheetData = {
        title: sheetForm.title,
        description: sheetForm.description,
        topics: sheetForm.topics.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (editingSheet) {
        const { error } = await supabase
          .from('sheets')
          .update(sheetData)
          .eq('id', editingSheet.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Sheet updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('sheets')
          .insert(sheetData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Sheet created successfully.",
        });
      }

      setSheetForm({ title: '', description: '', topics: '' });
      setEditingSheet(null);
      setIsSheetDialogOpen(false);
      await fetchData(); // Ensure data is refreshed
    } catch (error) {
      console.error('Error saving sheet:', error);
      toast({
        title: "Error",
        description: "Failed to save sheet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const questionData = {
        sheet_id: questionForm.sheet_id,
        title: questionForm.title,
        topic: questionForm.topic,
        tags: questionForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        difficulty: questionForm.difficulty,
        solve_url: questionForm.solve_url || null,
        order_index: questionForm.order_index
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingQuestion.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Question updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('questions')
          .insert(questionData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Question created successfully.",
        });
      }

      setQuestionForm({
        sheet_id: '',
        title: '',
        topic: '',
        tags: '',
        difficulty: 'Easy',
        solve_url: '',
        order_index: 0
      });
      setEditingQuestion(null);
      setIsQuestionDialogOpen(false);
      await fetchData(); // Ensure data is refreshed
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: "Error",
        description: "Failed to save question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSheet = async (sheetId: string) => {
    if (!confirm('Are you sure you want to delete this sheet and all its questions?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sheets')
        .delete()
        .eq('id', sheetId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sheet deleted successfully.",
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting sheet:', error);
      toast({
        title: "Error",
        description: "Failed to delete sheet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question deleted successfully.",
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const editSheet = (sheet: Sheet) => {
    setEditingSheet(sheet);
    setSheetForm({
      title: sheet.title,
      description: sheet.description,
      topics: sheet.topics.join(', ')
    });
    setIsSheetDialogOpen(true);
  };

  const editQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      sheet_id: question.sheet_id,
      title: question.title,
      topic: question.topic,
      tags: question.tags.join(', '),
      difficulty: question.difficulty,
      solve_url: question.solve_url || '',
      order_index: question.order_index
    });
    setIsQuestionDialogOpen(true);
  };

  // Show access denied if not admin
  if (!loading && userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">You don't have permission to access the admin panel.</p>
          <Button asChild>
            <Link to="/">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage sheets, questions, and system settings</p>
        </div>
        <Badge variant="outline" className="bg-primary/10">
          <Settings className="h-3 w-3 mr-1" />
          Administrator
        </Badge>
      </div>

      <Tabs defaultValue="sheets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sheets">
            <BookOpen className="h-4 w-4 mr-2" />
            Sheets
          </TabsTrigger>
          <TabsTrigger value="questions">
            <Target className="h-4 w-4 mr-2" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sheets" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Practice Sheets</h2>
            <Dialog open={isSheetDialogOpen} onOpenChange={setIsSheetDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingSheet(null);
                  setSheetForm({ title: '', description: '', topics: '' });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sheet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSheet ? 'Edit Sheet' : 'Create New Sheet'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSheetSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={sheetForm.title}
                      onChange={(e) => setSheetForm({ ...sheetForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={sheetForm.description}
                      onChange={(e) => setSheetForm({ ...sheetForm, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="topics">Topics (comma-separated)</Label>
                    <Input
                      id="topics"
                      value={sheetForm.topics}
                      onChange={(e) => setSheetForm({ ...sheetForm, topics: e.target.value })}
                      placeholder="Arrays, Strings, Dynamic Programming"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsSheetDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingSheet ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {sheets.map((sheet) => (
              <Card key={sheet.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{sheet.title}</CardTitle>
                      <CardDescription>{sheet.description}</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => editSheet(sheet)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteSheet(sheet.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {sheet.topics.map((topic) => (
                      <Badge key={topic} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {questions.filter(q => q.sheet_id === sheet.id).length} questions
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Questions</h2>
            <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingQuestion(null);
                  setQuestionForm({
                    sheet_id: '',
                    title: '',
                    topic: '',
                    tags: '',
                    difficulty: 'Easy',
                    solve_url: '',
                    order_index: 0
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingQuestion ? 'Edit Question' : 'Create New Question'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleQuestionSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sheet">Sheet</Label>
                      <Select
                        value={questionForm.sheet_id}
                        onValueChange={(value) => setQuestionForm({ ...questionForm, sheet_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a sheet" />
                        </SelectTrigger>
                        <SelectContent>
                          {sheets.map((sheet) => (
                            <SelectItem key={sheet.id} value={sheet.id}>
                              {sheet.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select
                        value={questionForm.difficulty}
                        onValueChange={(value) => 
                          setQuestionForm({ ...questionForm, difficulty: value as 'Easy' | 'Medium' | 'Hard' })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="questionTitle">Question Title</Label>
                    <Input
                      id="questionTitle"
                      value={questionForm.title}
                      onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="topic">Topic</Label>
                      <Input
                        id="topic"
                        value={questionForm.topic}
                        onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="orderIndex">Order Index</Label>
                      <Input
                        id="orderIndex"
                        type="number"
                        value={questionForm.order_index}
                        onChange={(e) => setQuestionForm({ ...questionForm, order_index: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={questionForm.tags}
                      onChange={(e) => setQuestionForm({ ...questionForm, tags: e.target.value })}
                      placeholder="recursion, backtracking, optimization"
                    />
                  </div>
                  <div>
                    <Label htmlFor="solveUrl">Solve URL (optional)</Label>
                    <Input
                      id="solveUrl"
                      type="url"
                      value={questionForm.solve_url}
                      onChange={(e) => setQuestionForm({ ...questionForm, solve_url: e.target.value })}
                      placeholder="https://leetcode.com/problems/..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingQuestion ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {questions.map((question) => {
              const sheet = sheets.find(s => s.id === question.sheet_id);
              return (
                <Card key={question.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            question.difficulty === 'Easy' ? 'bg-green-500' :
                            question.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <h3 className="font-medium">{question.title}</h3>
                          <Badge variant="outline">{question.difficulty}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Sheet: {sheet?.title} | Topic: {question.topic}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {question.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => editQuestion(question)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">User management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
              <CardDescription>View platform usage and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;