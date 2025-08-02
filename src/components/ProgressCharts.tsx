import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

interface Question {
  id: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface UserProgress {
  question_id: string;
  completed: boolean;
  marked_for_revision: boolean;
  time_spent?: number;
  completed_at?: string;
}

interface ProgressChartsProps {
  questions: Question[];
  userProgress: UserProgress[];
}

export function ProgressCharts({ questions, userProgress }: ProgressChartsProps) {
  // Difficulty distribution data
  const difficultyData = [
    { name: 'Easy', total: 0, completed: 0, color: '#22c55e' },
    { name: 'Medium', total: 0, completed: 0, color: '#eab308' },
    { name: 'Hard', total: 0, completed: 0, color: '#ef4444' }
  ];

  questions.forEach(question => {
    const diffIndex = difficultyData.findIndex(d => d.name === question.difficulty);
    if (diffIndex !== -1) {
      difficultyData[diffIndex].total++;
      const isCompleted = userProgress.find(p => p.question_id === question.id && p.completed);
      if (isCompleted) {
        difficultyData[diffIndex].completed++;
      }
    }
  });

  // Topic distribution data
  const topicData = questions.reduce((acc, question) => {
    const existingTopic = acc.find(item => item.topic === question.topic);
    const isCompleted = userProgress.find(p => p.question_id === question.id && p.completed);
    
    if (existingTopic) {
      existingTopic.total++;
      if (isCompleted) existingTopic.completed++;
    } else {
      acc.push({
        topic: question.topic,
        total: 1,
        completed: isCompleted ? 1 : 0,
        percentage: 0
      });
    }
    return acc;
  }, [] as Array<{ topic: string; total: number; completed: number; percentage: number }>);

  // Calculate percentages
  topicData.forEach(item => {
    item.percentage = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
  });

  // Completion status pie chart data
  const completionData = [
    {
      name: 'Completed',
      value: userProgress.filter(p => p.completed).length,
      color: '#22c55e'
    },
    {
      name: 'For Revision',
      value: userProgress.filter(p => p.marked_for_revision && !p.completed).length,
      color: '#eab308'
    },
    {
      name: 'Pending',
      value: questions.length - userProgress.filter(p => p.completed).length,
      color: '#64748b'
    }
  ];

  // Progress over time (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toISOString().split('T')[0],
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      completed: 0
    };
  });

  userProgress.forEach(progress => {
    if (progress.completed && progress.completed_at) {
      const completedDate = new Date(progress.completed_at).toISOString().split('T')[0];
      const dayData = last7Days.find(d => d.date === completedDate);
      if (dayData) {
        dayData.completed++;
      }
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Difficulty Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Progress by Difficulty
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={difficultyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  value, 
                  name === 'completed' ? 'Completed' : 'Total'
                ]}
              />
              <Legend />
              <Bar dataKey="total" fill="#e2e8f0" name="Total" />
              <Bar dataKey="completed" fill="#22c55e" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Completion Status Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChartIcon className="h-5 w-5 mr-2" />
            Overall Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={completionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {completionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Topic Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Progress by Topic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topicData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="topic" type="category" width={100} />
              <Tooltip 
                formatter={(value: number) => [`${value}%`, 'Completion Rate']}
              />
              <Bar dataKey="percentage" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Weekly Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [value, 'Questions Completed']}
                labelFormatter={(label) => `Day: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#22c55e" 
                strokeWidth={3}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}