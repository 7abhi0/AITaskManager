import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useTaskStore } from './store/useTaskStore';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import Tasks from './pages/Tasks';
import TaskDetails from './pages/TaskDetails';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import ToastProvider from './components/ui/toast';

// Protected Route wrapper for Authenticated users
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, isInitializing, user } = useAuthStore();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400">
        Bootstrapping Session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Route wrapper for guest routes (Login/Register should be inaccessible when logged in)
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { initAuth, isAuthenticated, user } = useAuthStore();
  const { setupSocket, disconnectSocket } = useTaskStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Connect WebSockets when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setupSocket(user._id);
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, user, setupSocket, disconnectSocket]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      <Routes>
        {/* Guest Authentication Routes */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        {/* Protected App Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex">
                {/* Fixed Left Sidebar */}
                <Sidebar />

                {/* Main Content Layout with Navbar */}
                <div className="flex-1 pl-64 min-h-screen flex flex-col">
                  <Navbar />
                  
                  {/* Outer Main Container */}
                  <main className="flex-1 mt-16 p-8 overflow-x-hidden">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/kanban" element={<Kanban />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/tasks/:id" element={<TaskDetails />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/profile" element={<Profile />} />
                      
                      {/* Admin Restricted route */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute allowedRoles={['ADMIN']}>
                            <AdminPanel />
                          </ProtectedRoute>
                        }
                      />
                      
                      {/* Sub-path Failures fallback */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* Toast Alert overlay notifications */}
      <ToastProvider />
    </div>
  );
};
export default App;
