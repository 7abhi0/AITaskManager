import React, { useEffect, useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { useAuthStore } from '../store/useAuthStore';
import { Card, CardHeader, CardBody } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Modal } from '../components/ui/modal';
import { toast } from '../store/useToastStore';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { Search, Plus, Trash2, Edit, Eye, Filter, ListTodo } from 'lucide-react';
import { TaskStatus, TaskPriority, ITask } from '../shared/types';

export const Tasks: React.FC = () => {
  const {
    tasks,
    totalTasks,
    filters,
    loading,
    fetchTasks,
    createTask,
    deleteTask,
    setFilters,
  } = useTaskStore();
  const { user } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  // Task creation Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [category, setCategory] = useState('Frontend');
  const [deadline, setDeadline] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [labels, setLabels] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTasks();
    loadUsers();
  }, [fetchTasks]);

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data.users || []);
    } catch (error) {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Task title is required.');
      return;
    }

    setCreating(true);
    try {
      const parsedLabels = labels
        .split(',')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      await createTask({
        title,
        description,
        priority,
        status,
        category,
        deadline: deadline || undefined,
        estimatedHours,
        labels: parsedLabels,
        assignedTo: assignedTo || null,
      });

      toast.success('Task created successfully!');
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create task.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(id);
      toast.success('Task deleted successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete task.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setStatus('TODO');
    setCategory('Frontend');
    setDeadline('');
    setEstimatedHours(0);
    setLabels('');
    setAssignedTo('');
  };

  return (
    <div className="space-y-6">
      {/* Filtering and search row */}
      <Card>
        <CardBody className="flex flex-col md:flex-row items-center gap-4 justify-between">
          {/* Search Input */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Filters triggers */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({ status: e.target.value })}
              className="px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-350 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">In Review</option>
              <option value="COMPLETED">Completed</option>
            </select>

            {/* Priority filter */}
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ priority: e.target.value })}
              className="px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-350 focus:outline-none"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>

            {/* Category filter */}
            <select
              value={filters.category}
              onChange={(e) => setFilters({ category: e.target.value })}
              className="px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-350 focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="Design">Design</option>
              <option value="QA">QA</option>
              <option value="Security">Security</option>
              <option value="DevOps">DevOps</option>
              <option value="Database">Database</option>
            </select>

            {/* Create Trigger */}
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              New Task
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Task table list */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/80">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Task Title</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Category</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Priority</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Deadline</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Assignee</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/tasks/${task._id}`} className="font-semibold text-sm text-slate-850 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400">
                        {task.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-450 dark:text-slate-400 font-medium">
                      {task.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={task.priority === 'CRITICAL' ? 'danger' : task.priority === 'HIGH' ? 'warning' : 'primary'}>
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'info' : 'secondary'}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-450 dark:text-slate-400 font-medium">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              typeof task.assignedTo === 'object'
                                ? task.assignedTo.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&q=80'
                                : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&q=80'
                            }
                            alt="assignee"
                            className="w-6 h-6 rounded-full border border-slate-100 dark:border-slate-850 object-cover"
                          />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {typeof task.assignedTo === 'object' ? task.assignedTo.name : 'User'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/tasks/${task._id}`}>
                          <Button variant="ghost" size="sm" className="!p-2">
                            <Eye className="w-4 h-4 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200" />
                          </Button>
                        </Link>
                        {user && ['ADMIN', 'TEAM_LEAD'].includes(user.role) && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(task._id)} className="!p-2">
                            <Trash2 className="w-4 h-4 text-rose-500 hover:text-rose-700" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No tasks match your criteria. Create a new task to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Task Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Task"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="task-title"
            label="Task Title"
            placeholder="e.g. Implement Socket connection"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail task requirements..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              id="task-priority"
              label="Priority Level"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Select>

            <Select
              id="task-status"
              label="Initial Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">In Review</option>
              <option value="COMPLETED">Completed</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              id="task-category"
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="Design">Design</option>
              <option value="QA">QA</option>
              <option value="DevOps">DevOps</option>
              <option value="Database">Database</option>
              <option value="Security">Security</option>
            </Select>

            <Input
              id="task-deadline"
              type="date"
              label="Due Date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="task-hours"
              type="number"
              label="Estimated Hours"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(parseInt(e.target.value, 10) || 0)}
            />

            <Select
              id="task-assignee"
              label="Assign Member"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </Select>
          </div>

          <Input
            id="task-labels"
            label="Labels (comma separated)"
            placeholder="e.g. bug, fix, api"
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Tasks;
