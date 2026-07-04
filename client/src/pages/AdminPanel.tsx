import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select } from '../components/ui/select';
import { toast } from '../store/useToastStore';
import { useAuthStore } from '../store/useAuthStore';
import { Shield, Trash2, ShieldAlert } from 'lucide-react';
import api from '../utils/api';
import { UserRole } from '../shared/types';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data.data.users || []);
    } catch (error) {
      toast.error('Failed to load user lists.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await api.put(`/users/${userId}`, { role: newRole });
      toast.success('User role updated successfully.');
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update role.');
    }
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentUser?._id) {
      toast.error('You cannot delete your own admin account.');
      return;
    }
    if (!window.confirm('Are you sure you want to permanently delete this user? All their task assignments will be unassigned.')) return;

    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted successfully.');
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete user.');
    }
  };

  if (loading && users.length === 0) {
    return <div className="text-center py-12 text-slate-400">Loading user database...</div>;
  }

  return (
    <Card className="max-w-6xl mx-auto overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-2">
        <Shield className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Admin Management Portal</h3>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/80">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Member</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Current Role</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Modify Role</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Danger Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&q=80'}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-450 dark:text-slate-400 font-medium">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={user.role === 'ADMIN' ? 'danger' : user.role === 'TEAM_LEAD' ? 'warning' : 'primary'}>
                    {user.role}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user._id !== currentUser?._id ? (
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value as UserRole)}
                      className="px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-650 dark:text-slate-350 focus:outline-none"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="TEAM_LEAD">Team Lead</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Self Account</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  {user._id !== currentUser?._id ? (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(user._id)} className="!p-2">
                      <Trash2 className="w-4 h-4 text-rose-500 hover:text-rose-700" />
                    </Button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Protected
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
export default AdminPanel;
