import React, { useEffect } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { Card, CardHeader, CardBody } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Check, Bell, BellOff, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '../store/useToastStore';

export const Notifications: React.FC = () => {
  const { notifications, fetchNotifications, markAsRead, markAllRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      toast.success('All notifications marked as read.');
    } catch (error) {}
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {}
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          User Notifications
        </h3>
        {notifications.some((n) => !n.read) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <Check className="w-4 h-4 mr-1.5" />
            Mark all read
          </Button>
        )}
      </CardHeader>
      <CardBody className="divide-y divide-slate-100 dark:divide-slate-800/60 p-0">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif._id}
              className={`flex items-start justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${
                !notif.read ? 'bg-blue-50/15 dark:bg-blue-950/5 border-l-4 border-l-blue-600' : 'pl-6'
              }`}
            >
              <div className="space-y-1.5 flex-1 pr-4">
                <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-850 dark:text-white' : 'text-slate-600 dark:text-slate-350'}`}>
                  {notif.message}
                </p>
                <div className="flex gap-4 items-center text-[10px] text-slate-400">
                  <span>📅 {new Date(notif.createdAt).toLocaleString()}</span>
                  {notif.taskId && (
                    <Link
                      to={`/tasks/${notif.taskId}`}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold flex items-center gap-0.5"
                    >
                      View task Details
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
              {!notif.read && (
                <button
                  onClick={() => handleMarkAsRead(notif._id)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-16 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <BellOff className="w-6 h-6" />
            </div>
            <p className="text-slate-400 text-sm">No notifications found.</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
export default Notifications;
