import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Card, CardHeader, CardBody } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from '../store/useToastStore';
import api from '../utils/api';
import { Save, User } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, token } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put(`/users/${user?._id}`, { name, avatar });
      // Update state in Zustand store manually
      useAuthStore.setState({ user: response.data.data.user });
      toast.success('Profile updated successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="flex items-center gap-3">
        <User className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Profile Settings</h3>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Avatar preview block */}
          <div className="flex items-center gap-6 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
            <img
              src={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
              alt="avatar"
              className="w-20 h-20 rounded-full border border-slate-200 object-cover"
            />
            <div className="space-y-1">
              <p className="font-bold text-slate-800 dark:text-white">{user?.name}</p>
              <p className="text-xs text-slate-400">Role: <span className="font-semibold text-blue-600 dark:text-blue-400">{user?.role}</span></p>
              <p className="text-xs text-slate-400">Email: {user?.email}</p>
            </div>
          </div>

          <Input
            id="profile-name"
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            id="profile-avatar"
            label="Avatar Image URL"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
          />

          <Button type="submit" loading={loading} className="w-full py-3">
            <Save className="w-4 h-4 mr-2" />
            Save Profile Changes
          </Button>
        </form>
      </CardBody>
    </Card>
  );
};
export default Profile;
