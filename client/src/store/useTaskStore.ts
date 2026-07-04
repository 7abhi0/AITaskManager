import { create } from 'zustand';
import api from '../utils/api';
import { ITask, IDashboardStats, TaskStatus } from '../shared/types';
import { io, Socket } from 'socket.io-client';

interface TaskState {
  tasks: ITask[];
  totalTasks: number;
  activeTask: ITask | null;
  dashboardStats: IDashboardStats | null;
  analytics: any | null;
  loading: boolean;
  filters: {
    search: string;
    status: string;
    priority: string;
    category: string;
    assignedTo: string;
  };
  socket: Socket | null;
  onlineUsers: string[];

  fetchTasks: () => Promise<void>;
  fetchTaskById: (id: string) => Promise<void>;
  createTask: (taskData: any) => Promise<void>;
  updateTask: (id: string, updateData: any) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addComment: (id: string, commentText: string) => Promise<void>;
  addAttachment: (id: string, formData: FormData) => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  triggerAISubtasks: (id: string) => Promise<void>;
  
  updateTaskStatusLocal: (id: string, newStatus: TaskStatus) => void;
  setFilters: (newFilters: Partial<TaskState['filters']>) => void;
  setupSocket: (userId: string) => void;
  disconnectSocket: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  totalTasks: 0,
  activeTask: null,
  dashboardStats: null,
  analytics: null,
  loading: false,
  filters: {
    search: '',
    status: '',
    priority: '',
    category: '',
    assignedTo: '',
  },
  socket: null,
  onlineUsers: [],

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const { search, status, priority, category, assignedTo } = get().filters;
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (category) params.append('category', category);
      if (assignedTo) params.append('assignedTo', assignedTo);

      const response = await api.get(`/tasks?${params.toString()}`);
      const { tasks, total } = response.data.data;
      set({ tasks, totalTasks: total, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },

  fetchTaskById: async (id) => {
    set({ loading: true });
    try {
      const response = await api.get(`/tasks/${id}`);
      set({ activeTask: response.data.data.task, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },

  createTask: async (taskData) => {
    try {
      await api.post('/tasks', taskData);
      get().fetchTasks();
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Create task failed');
    }
  },

  updateTask: async (id, updateData) => {
    try {
      await api.put(`/tasks/${id}`, updateData);
      // Wait for socket to broadcast or refresh manually
      get().fetchTasks();
      if (get().activeTask?._id === id) {
        get().fetchTaskById(id);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Update task failed');
    }
  },

  deleteTask: async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      get().fetchTasks();
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Delete task failed');
    }
  },

  addComment: async (id, commentText) => {
    try {
      const response = await api.post(`/tasks/${id}/comments`, { text: commentText });
      set({ activeTask: response.data.data.task });
      // Update local task comment array as well
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === id ? response.data.data.task : t)),
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to add comment');
    }
  },

  addAttachment: async (id, formData) => {
    try {
      const response = await api.post(`/tasks/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set({ activeTask: response.data.data.task });
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === id ? response.data.data.task : t)),
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to attach file');
    }
  },

  fetchDashboardStats: async () => {
    try {
      const response = await api.get('/tasks/dashboard/stats');
      set({ dashboardStats: response.data.data.stats });
    } catch (error) {}
  },

  fetchAnalytics: async () => {
    try {
      const response = await api.get('/tasks/dashboard/analytics');
      set({ analytics: response.data.data.analytics });
    } catch (error) {}
  },

  triggerAISubtasks: async (id) => {
    try {
      const response = await api.post(`/tasks/${id}/ai/subtasks`);
      set({ activeTask: response.data.data.task });
      get().fetchTasks();
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'AI subtask generation failed.');
    }
  },

  updateTaskStatusLocal: (id, newStatus) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task._id === id ? { ...task, status: newStatus } : task
      ),
    }));
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().fetchTasks();
  },

  setupSocket: (userId) => {
    if (get().socket) return;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl);

    socket.emit('register', userId);

    socket.on('task_created', (task: ITask) => {
      set((state) => ({ tasks: [task, ...state.tasks] }));
    });

    socket.on('task_updated', (updatedTask: ITask) => {
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)),
      }));
      if (get().activeTask?._id === updatedTask._id) {
        set({ activeTask: updatedTask });
      }
    });

    socket.on('task_deleted', ({ id }) => {
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== id),
      }));
      if (get().activeTask?._id === id) {
        set({ activeTask: null });
      }
    });

    socket.on('online_users', (onlineUsers: string[]) => {
      set({ onlineUsers });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
