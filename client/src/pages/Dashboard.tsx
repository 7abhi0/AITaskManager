import React, { useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Card, CardHeader, CardBody } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const PRIORITY_COLORS = {
  LOW: '#10b981',     // emerald
  MEDIUM: '#f59e0b',  // amber
  HIGH: '#f97316',    // orange
  CRITICAL: '#ef4444', // rose
};

export const Dashboard: React.FC = () => {
  const {
    tasks,
    dashboardStats,
    analytics,
    loading,
    fetchTasks,
    fetchDashboardStats,
    fetchAnalytics,
  } = useTaskStore();

  useEffect(() => {
    fetchTasks();
    fetchDashboardStats();
    fetchAnalytics();
  }, [fetchTasks, fetchDashboardStats, fetchAnalytics]);

  const cards = [
    {
      title: 'Total Tasks',
      value: dashboardStats?.totalTasks || 0,
      icon: CheckSquare,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400',
    },
    {
      title: 'Completed',
      value: dashboardStats?.completedTasks || 0,
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400',
    },
    {
      title: 'Pending',
      value: dashboardStats?.pendingTasks || 0,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400',
    },
    {
      title: 'Overdue',
      value: dashboardStats?.overdueTasks || 0,
      icon: AlertCircle,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400',
    },
  ];

  // Upcoming deadlines (sort and show top 5)
  const upcomingDeadlines = [...tasks]
    .filter((t) => t.status !== 'COMPLETED' && t.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="hover:scale-[1.01] transition-transform duration-200">
              <CardBody className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {card.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Main Grid: charts and suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Rate card */}
        <Card className="flex flex-col justify-center">
          <CardBody className="text-center py-8 space-y-4">
            <h3 className="text-base font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Productivity Score
            </h3>
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-36 h-36">
                <circle
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="62"
                  cx="72"
                  cy="72"
                />
                <circle
                  className="text-blue-600 transition-all duration-1000"
                  strokeWidth="8"
                  strokeDasharray={389}
                  strokeDashoffset={389 - (389 * (dashboardStats?.productivityRate || 0)) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="62"
                  cx="72"
                  cy="72"
                />
              </svg>
              <span className="absolute text-3xl font-black text-slate-800 dark:text-white">
                {dashboardStats?.productivityRate || 0}%
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 px-4 leading-relaxed">
              Based on the ratio of completed tasks vs total tasks assigned. Keep checking off items to score higher!
            </p>
          </CardBody>
        </Card>

        {/* AI Recommendations */}
        <Card className="lg:col-span-2 glass">
          <CardHeader className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            <h3 className="font-bold text-slate-800 dark:text-white">Smart AI Suggestions</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            {dashboardStats?.aiSuggestions && dashboardStats.aiSuggestions.length > 0 ? (
              dashboardStats.aiSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-indigo-100/50 dark:border-indigo-950/20 bg-indigo-50/30 dark:bg-indigo-950/10 text-sm leading-relaxed text-indigo-900 dark:text-indigo-350 flex items-start gap-3"
                >
                  <Sparkles className="w-4 h-4 mt-0.5 text-indigo-500 flex-shrink-0" />
                  <div>{suggestion}</div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                AI is compiling suggestion insights. Check back once tasks are assigned.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Chart */}
        <Card>
          <CardHeader>
            <h3 className="font-bold text-slate-800 dark:text-white">Weekly Performance</h3>
          </CardHeader>
          <CardBody className="h-80">
            {analytics?.weeklyProgress ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.weeklyProgress}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                  />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stroke="#cbd5e1"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">Loading progress charts...</div>
            )}
          </CardBody>
        </Card>

        {/* Priority Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <h3 className="font-bold text-slate-800 dark:text-white">Tasks by Priority</h3>
          </CardHeader>
          <CardBody className="h-80">
            {analytics?.priorityDistribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.priorityDistribution}>
                  <XAxis dataKey="priority" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {analytics.priorityDistribution.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PRIORITY_COLORS[entry.priority as keyof typeof PRIORITY_COLORS] || '#3b82f6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">Loading priority charts...</div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Deadlines list */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white">Approaching Deadlines</h3>
          <Link to="/calendar">
            <Button variant="ghost" size="sm" className="text-xs font-semibold">
              View Calendar
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardBody className="divide-y divide-slate-100 dark:divide-slate-800/60 p-0">
          {upcomingDeadlines.length > 0 ? (
            upcomingDeadlines.map((task) => (
              <div key={task._id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex flex-col gap-1">
                  <Link to={`/tasks/${task._id}`} className="font-semibold text-sm hover:text-blue-600 dark:hover:text-blue-400">
                    {task.title}
                  </Link>
                  <div className="flex gap-2">
                    <Badge variant={task.priority === 'CRITICAL' ? 'danger' : task.priority === 'HIGH' ? 'warning' : 'primary'}>
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {task.category}
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                  📅 {new Date(task.deadline!).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No impending deadlines. Enjoy the calm!</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
export default Dashboard;
