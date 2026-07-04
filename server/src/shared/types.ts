export type UserRole = 'ADMIN' | 'TEAM_LEAD' | 'MEMBER';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISubTask {
  _id?: string;
  title: string;
  isCompleted: boolean;
}

export interface IComment {
  _id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface IAttachment {
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface IActivityLog {
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

export interface ITask {
  _id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  deadline?: string;
  estimatedHours?: number;
  labels: string[];
  subtasks: ISubTask[];
  assignedTo?: IUser | string | null;
  createdBy: IUser | string;
  comments: IComment[];
  attachments: IAttachment[];
  activities: IActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  message: string;
  read: boolean;
  type?: 'TASK_ASSIGNED' | 'STATUS_CHANGED' | 'COMMENT_ADDED' | 'DEADLINE_APPROACHING' | 'SYSTEM';
  taskId?: string;
  createdAt: string;
}

export interface IDashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  productivityRate: number;
  aiSuggestions: string[];
}

export interface IWeeklyProgress {
  day: string;
  completed: number;
  created: number;
}

export interface IPriorityDistribution {
  priority: TaskPriority;
  count: number;
}

export interface IWorkloadDistribution {
  userName: string;
  taskCount: number;
  estimatedHours: number;
}
