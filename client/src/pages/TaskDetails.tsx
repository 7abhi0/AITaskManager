import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTaskStore } from '../store/useTaskStore';
import { Card, CardHeader, CardBody } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { toast } from '../store/useToastStore';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  Paperclip,
  CheckSquare,
  MessageSquare,
  History,
  Send,
  Upload,
} from 'lucide-react';
import { TaskStatus, TaskPriority } from '../shared/types';
import api from '../utils/api';

export const TaskDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    activeTask,
    loading,
    fetchTaskById,
    updateTask,
    addComment,
    addAttachment,
    triggerAISubtasks,
  } = useTaskStore();

  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiSubtaskLoading, setAiSubtaskLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTaskById(id);
    }
  }, [id, fetchTaskById]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
        Loading task details...
      </div>
    );
  }

  if (!activeTask) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Task not found or has been deleted.</p>
        <Link to="/tasks">
          <Button>Back to Task List</Button>
        </Link>
      </div>
    );
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      await updateTask(activeTask._id, { status: e.target.value as TaskStatus });
      toast.success('Task status updated successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status.');
    }
  };

  const handlePriorityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      await updateTask(activeTask._id, { priority: e.target.value as TaskPriority });
      toast.success('Task priority updated successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update priority.');
    }
  };

  // Toggle individual subtask completion state
  const handleToggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    const updatedSubtasks = activeTask.subtasks.map((s) =>
      s._id === subtaskId ? { ...s, isCompleted: !isCompleted } : s
    );

    try {
      await updateTask(activeTask._id, { subtasks: updatedSubtasks });
      toast.success('Subtask updated.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update subtask.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setCommentLoading(true);
    try {
      await addComment(activeTask._id, commentText);
      setCommentText('');
      toast.success('Comment posted successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post comment.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAttachFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await addAttachment(activeTask._id, formData);
      setFile(null);
      toast.success('File attached successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSuggestSubtasks = async () => {
    setAiSubtaskLoading(true);
    try {
      await triggerAISubtasks(activeTask._id);
      toast.success('AI successfully broke this task into subtasks!');
    } catch (err: any) {
      toast.error(err.message || 'AI generation failed.');
    } finally {
      setAiSubtaskLoading(false);
    }
  };

  const creator = activeTask.createdBy as any;
  const assignee = activeTask.assignedTo as any;

  return (
    <div className="space-y-6">
      {/* Back button header */}
      <div className="flex justify-between items-center">
        <Link to="/tasks" className="flex items-center text-slate-500 hover:text-slate-700 dark:hover:text-white font-semibold text-sm transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Link>

        {/* AI Action quick recommendation triggers */}
        <Button variant="outline" size="sm" onClick={handleSuggestSubtasks} loading={aiSubtaskLoading} className="border-indigo-200 text-indigo-700 dark:border-indigo-900/60 dark:text-indigo-400 dark:hover:bg-indigo-950/20 bg-indigo-50/30">
          <Sparkles className="w-4 h-4 mr-1.5" />
          AI Subtasks recommendation
        </Button>
      </div>

      {/* Main Details layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left main information column (spanning 2 spaces) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardBody className="p-6 space-y-6">
              {/* Category, title & description */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                  {activeTask.category}
                </span>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  {activeTask.title}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {activeTask.description || 'No description provided.'}
                </p>
              </div>

              {/* Status and Priority selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Select
                  id="task-details-status"
                  label="Update Status"
                  value={activeTask.status}
                  onChange={handleStatusChange}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">In Review</option>
                  <option value="COMPLETED">Completed</option>
                </Select>

                <Select
                  id="task-details-priority"
                  label="Adjust Priority"
                  value={activeTask.priority}
                  onChange={handlePriorityChange}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </Select>
              </div>

              {/* Subtasks checklist */}
              <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-slate-500" />
                  Subtasks Checklist
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activeTask.subtasks && activeTask.subtasks.length > 0 ? (
                    activeTask.subtasks.map((sub) => (
                      <div
                        key={sub._id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={sub.isCompleted}
                          onChange={() => handleToggleSubtask(sub._id!, sub.isCompleted)}
                          className="w-4.5 h-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`text-sm ${sub.isCompleted ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                          {sub.title}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 leading-loose">
                      No subtasks generated yet. Try requesting some with the AI Subtasks recommendation button.
                    </p>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Comments section */}
          <Card>
            <CardHeader className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-slate-500" />
              <h3 className="font-bold text-slate-800 dark:text-white">Discussion Thread</h3>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* Form */}
              <form onSubmit={handleAddComment} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Post comment to thread..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                />
                <Button type="submit" loading={commentLoading}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>

              {/* List */}
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {activeTask.comments && activeTask.comments.length > 0 ? (
                  activeTask.comments.map((comm) => (
                    <div key={comm._id} className="flex gap-3 items-start">
                      <img
                        src={comm.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&q=80'}
                        alt="avatar"
                        className="w-8 h-8 rounded-full border object-cover"
                      />
                      <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-805/40 p-3 rounded-2xl space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{comm.userName}</span>
                          <span className="text-[10px] text-slate-400">{new Date(comm.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">{comm.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No comments posted yet. Start the discussion!</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right sidebar column: metadata, files, activities */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card>
            <CardBody className="p-6 space-y-4 text-xs font-medium">
              <h3 className="font-bold text-sm text-slate-850 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Task Details</h3>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Created By:</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">{creator?.name || 'Admin'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Assigned To:</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  {assignee?.name ? (
                    <div className="flex items-center gap-1.5">
                      <img src={assignee.avatar} className="w-5 h-5 rounded-full object-cover" />
                      {assignee.name}
                    </div>
                  ) : (
                    'Unassigned'
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Estimates:</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">⏰ {activeTask.estimatedHours || 0} Hours</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Deadline:</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  📅 {activeTask.deadline ? new Date(activeTask.deadline).toLocaleDateString() : 'No limit'}
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Files Card */}
          <Card>
            <CardHeader className="flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-slate-500" />
              <h3 className="font-bold text-slate-800 dark:text-white">Attachments</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              {/* Form */}
              <form onSubmit={handleAttachFile} className="flex gap-2">
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="attach-file-selector"
                />
                <label
                  htmlFor="attach-file-selector"
                  className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-center text-xs text-slate-400 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors flex items-center justify-center gap-1.5 font-bold"
                >
                  <Upload className="w-4 h-4" />
                  {file ? file.name.substring(0, 15) : 'Select File'}
                </label>
                {file && (
                  <Button type="submit" loading={uploading}>
                    Attach
                  </Button>
                )}
              </form>

              {/* Attachments List */}
              <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                {activeTask.attachments && activeTask.attachments.length > 0 ? (
                  activeTask.attachments.map((attach, idx) => (
                    <a
                      key={idx}
                      href={attach.path.startsWith('http') ? attach.path : `http://localhost:5000${attach.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-350 transition-colors font-semibold"
                    >
                      <Paperclip className="w-4 h-4 flex-shrink-0 text-slate-400" />
                      <span className="truncate flex-1">{attach.filename}</span>
                    </a>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-400 text-center py-2">No file attachments upload.</p>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Activity Log Card */}
          <Card>
            <CardHeader className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" />
              <h3 className="font-bold text-slate-800 dark:text-white">Activity Trail</h3>
            </CardHeader>
            <CardBody className="p-0 max-h-60 overflow-y-auto">
              <div className="relative border-l-2 border-slate-100 dark:border-slate-800/60 ml-6 py-4 space-y-4">
                {activeTask.activities && activeTask.activities.length > 0 ? (
                  activeTask.activities.map((act, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900" />
                      <div className="text-[10px] text-slate-400">{new Date(act.timestamp).toLocaleString()}</div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight mt-0.5">{act.userName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-450 mt-0.5 leading-snug">{act.action}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center ml-0 pl-4">No audit logs found.</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default TaskDetails;
