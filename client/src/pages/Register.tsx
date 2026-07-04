import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from '../store/useToastStore';
import { Card, CardHeader, CardBody } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { UserPlus } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all registration fields.');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password, role });
      toast.success('Registration successful. Welcome!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="max-w-md w-full glass shadow-2xl">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-2xl mx-auto shadow-lg shadow-blue-500/25 mb-4">
            A
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Join AI Task Manager</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create an account to collaborate with your team.</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              type="text"
              label="Full Name"
              placeholder="Alex Developer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="alex@taskmanager.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Select
              id="role"
              label="Assigned Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="MEMBER">Team Member</option>
              <option value="TEAM_LEAD">Team Lead</option>
              <option value="ADMIN">System Administrator</option>
            </Select>
            <Button type="submit" className="w-full py-3 mt-2" loading={loading}>
              <UserPlus className="w-4 h-4 mr-2" />
              Register Account
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold transition-colors">
              Sign In
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
export default Register;
