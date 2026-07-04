import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { AlertCircle } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white">Page Not Found</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  );
};
export default NotFound;
