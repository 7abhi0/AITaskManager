import React, { useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Card, CardHeader, CardBody } from '../components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const PRIORITY_COLORS = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export const Analytics: React.FC = () => {
  const { analytics, fetchAnalytics } = useTaskStore();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly activity timeline */}
        <Card>
          <CardHeader>
            <h3 className="font-bold text-slate-800 dark:text-white">Activity Progress</h3>
          </CardHeader>
          <CardBody className="h-80">
            {analytics?.weeklyProgress ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.weeklyProgress}>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="created" name="Created" stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-20">Loading weekly metrics...</p>
            )}
          </CardBody>
        </Card>

        {/* Priority distribution */}
        <Card>
          <CardHeader>
            <h3 className="font-bold text-slate-800 dark:text-white">Priority Distribution</h3>
          </CardHeader>
          <CardBody className="h-80">
            {analytics?.priorityDistribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.priorityDistribution}>
                  <XAxis dataKey="priority" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
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
              <p className="text-sm text-slate-400 text-center py-20">Loading priority models...</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion status rates */}
        <Card>
          <CardHeader>
            <h3 className="font-bold text-slate-800 dark:text-white">Completion Share</h3>
          </CardHeader>
          <CardBody className="h-80 flex items-center justify-center">
            {analytics?.completionRate && analytics.completionRate.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.completionRate}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.completionRate.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-20">No status distributions available.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
export default Analytics;
