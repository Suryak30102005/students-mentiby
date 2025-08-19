import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  X, 
  ArrowUpDown,
  CheckCircle,
  BookmarkCheck,
  Circle 
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Question, UserProgress, SearchAndFilterProps } from '@/types';


export function SearchAndFilter({ 
  questions, 
  userProgress, 
  onFilteredQuestionsChange,
  onSortChange 
}: SearchAndFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get unique topics from questions
  const uniqueTopics = [...new Set(questions.map(q => q.topic))];

  // Apply filters
  const applyFilters = useCallback(() => {
    const filtered = questions.filter(question => {
      const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesDifficulty = selectedDifficulty === 'all' || question.difficulty === selectedDifficulty;
      const matchesTopic = selectedTopic === 'all' || question.topic === selectedTopic;
      
      const progress = userProgress.find(p => p.question_id === question.id);
      let matchesStatus = true;
      
      if (selectedStatus === 'completed') {
        matchesStatus = progress?.completed || false;
      } else if (selectedStatus === 'pending') {
        matchesStatus = !progress?.completed;
      } else if (selectedStatus === 'revision') {
        matchesStatus = progress?.marked_for_revision || false;
      }

      return matchesSearch && matchesDifficulty && matchesTopic && matchesStatus;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title': {
          comparison = a.title.localeCompare(b.title);
          break;
        }
        case 'difficulty': {
          const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
          comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
          break;
        }
        case 'topic': {
          comparison = a.topic.localeCompare(b.topic);
          break;
        }
        case 'completion': {
          const aCompleted = userProgress.find(p => p.question_id === a.id)?.completed || false;
          const bCompleted = userProgress.find(p => p.question_id === b.id)?.completed || false;
          comparison = Number(aCompleted) - Number(bCompleted);
          break;
        }
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    onFilteredQuestionsChange(filtered);
  }, [questions, userProgress, searchTerm, selectedDifficulty, selectedTopic, selectedStatus, sortBy, sortOrder, onFilteredQuestionsChange]);

  // Apply filters whenever any filter changes
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDifficulty('all');
    setSelectedTopic('all');
    setSelectedStatus('all');
    setSortBy('title');
    setSortOrder('asc');
  };

  const handleSortChange = (newSortBy: string) => {
    if (newSortBy === sortBy) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
      onSortChange(newSortBy, newOrder);
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
      onSortChange(newSortBy, 'asc');
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedDifficulty !== 'all') count++;
    if (selectedTopic !== 'all') count++;
    if (selectedStatus !== 'all') count++;
    return count;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search & Filter</span>
          </div>
          <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions by title or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sorting Options */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={sortBy === 'title' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('title')}
          >
            Title
            <ArrowUpDown className="h-3 w-3 ml-1" />
          </Button>
          <Button
            variant={sortBy === 'difficulty' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('difficulty')}
          >
            Difficulty
            <ArrowUpDown className="h-3 w-3 ml-1" />
          </Button>
          <Button
            variant={sortBy === 'topic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('topic')}
          >
            Topic
            <ArrowUpDown className="h-3 w-3 ml-1" />
          </Button>
          <Button
            variant={sortBy === 'completion' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('completion')}
          >
            Status
            <ArrowUpDown className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <CollapsibleContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Difficulty Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Difficulty</label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="All difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Topic Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Topic</label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="All topics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {uniqueTopics.map(topic => (
                      <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completed
                      </div>
                    </SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center">
                        <Circle className="h-4 w-4 mr-2" />
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="revision">
                      <div className="flex items-center">
                        <BookmarkCheck className="h-4 w-4 mr-2" />
                        For Revision
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}