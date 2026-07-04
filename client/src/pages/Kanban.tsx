import React, { useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Card, CardHeader, CardBody } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Clock, MessageSquare, Paperclip, CheckSquare as CheckIcon, Plus } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { TaskStatus, ITask, TaskPriority } from '../shared/types';
import { toast } from '../store/useToastStore';

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'border-t-slate-400 bg-slate-100/50 dark:bg-slate-900/30' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-t-blue-500 bg-blue-50/20 dark:bg-blue-950/10' },
  { id: 'REVIEW', title: 'In Review', color: 'border-t-amber-500 bg-amber-50/20 dark:bg-amber-950/10' },
  { id: 'COMPLETED', title: 'Completed', color: 'border-t-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10' },
];

const PRIORITY_BADGES = {
  LOW: 'primary',
  MEDIUM: 'warning',
  HIGH: 'warning',
  CRITICAL: 'danger',
} as const;

// Draggable Task Card Component
const DraggableTaskCard: React.FC<{ task: ITask }> = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 ${
        isDragging ? 'opacity-40 border-dashed border-blue-500' : ''
      }`}
    >
      <div className="space-y-3">
        {/* Top Info */}
        <div className="flex items-center justify-between">
          <Badge variant={PRIORITY_BADGES[task.priority]}>{task.priority}</Badge>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {task.category}
          </span>
        </div>

        {/* Title */}
        <Link
          to={`/tasks/${task._id}`}
          className="block font-semibold text-sm hover:text-blue-600 dark:hover:text-blue-400 text-slate-850 dark:text-slate-100 line-clamp-2"
        >
          {task.title}
        </Link>

        {/* Subtask progress bar */}
        {totalSubtasks > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>Subtasks</span>
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Card Footer Info */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Metadata counters */}
          <div className="flex items-center gap-3 text-slate-400">
            {task.comments.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold">
                <MessageSquare className="w-3.5 h-3.5" />
                {task.comments.length}
              </span>
            )}
            {task.attachments.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold">
                <Paperclip className="w-3.5 h-3.5" />
                {task.attachments.length}
              </span>
            )}
            {task.deadline && (
              <span className="flex items-center gap-1 text-[11px] font-semibold">
                <Clock className="w-3.5 h-3.5" />
                {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>

          {/* Assigned User Avatar */}
          {task.assignedTo && (
            <img
              src={
                typeof task.assignedTo === 'object'
                  ? task.assignedTo.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&q=80'
                  : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&q=80'
              }
              alt="assignee"
              className="w-6 h-6 rounded-full border border-slate-100 dark:border-slate-850 object-cover"
              title={typeof task.assignedTo === 'object' ? task.assignedTo.name : 'Assignee'}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Droppable Column Component
const KanbanColumn: React.FC<{
  column: { id: TaskStatus; title: string; color: string };
  tasks: ITask[];
}> = ({ column, tasks }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-4 p-4 rounded-2xl border-t-4 border border-slate-200/50 dark:border-slate-800/80 min-h-[70vh] w-full transition-colors duration-200 ${
        column.color
      } ${isOver ? 'bg-slate-200/30 dark:bg-slate-800/20' : ''}`}
    >
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-855 dark:text-slate-100 flex items-center gap-2">
          {column.title}
          <span className="px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800 text-xs text-slate-500">
            {tasks.length}
          </span>
        </h4>
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[68vh] pr-1">
        {tasks.map((task) => (
          <DraggableTaskCard key={task._id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200/60 dark:border-slate-850/40 rounded-xl p-8 text-center text-xs text-slate-400">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
};

export const Kanban: React.FC = () => {
  const { tasks, fetchTasks, updateTaskStatusLocal, updateTask } = useTaskStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id.toString();
    const newStatus = over.id as TaskStatus;

    // Find original task to check if status actually changed
    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistically update local client state
    updateTaskStatusLocal(taskId, newStatus);

    try {
      await updateTask(taskId, { status: newStatus });
      toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
    } catch (err: any) {
      // Revert status on failure
      updateTaskStatusLocal(taskId, task.status);
      toast.error(err.message || 'Failed to update status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Board Title & actions */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Drag and drop tasks across columns to update their status in real-time.
          </p>
        </div>
        <Link to="/tasks">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Create Task
          </Button>
        </Link>
      </div>

      {/* Dnd Board Grid */}
      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {COLUMNS.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.id);
            return (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={columnTasks}
              />
            );
          })}
        </div>
      </DndContext>
    </div>
  );
};
export default Kanban;
