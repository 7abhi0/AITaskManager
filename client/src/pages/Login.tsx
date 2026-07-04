import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from '../store/useToastStore';
import { Card, CardHeader, CardBody } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all credentials.');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Login failed.');
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI Task Manager</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please enter your credentials to log in.</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" className="w-full py-3 mt-2" loading={loading}>
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold transition-colors">
              Register Here
            </Link>
          </div>

          {/* Dummy logins helper box */}
          <div className="mt-6 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/30 text-xs">
            <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">Seed accounts for testing:</p>
            <div className="space-y-1 text-slate-500 dark:text-slate-400">
              <p>🔑 <span className="font-semibold text-slate-700 dark:text-slate-300">Admin:</span> admin@taskmanager.com (password123)</p>
              <p>🔑 <span className="font-semibold text-slate-700 dark:text-slate-300">Team Lead:</span> lead@taskmanager.com (password123)</p>
              <p>🔑 <span className="font-semibold text-slate-700 dark:text-slate-300">Member:</span> member@taskmanager.com (password123)</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
export default Login;
