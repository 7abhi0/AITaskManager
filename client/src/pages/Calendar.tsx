import React, { useEffect, useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Card, CardHeader, CardBody } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Calendar: React.FC = () => {
  const { tasks, fetchTasks } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Render days array
  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysArray.push(new Date(year, month, d));
  }

  // Helper to find tasks due on a date
  const getTasksForDate = (date: Date) => {
    return tasks.filter((t) => {
      if (!t.deadline) return false;
      const dDate = new Date(t.deadline);
      return (
        dDate.getDate() === date.getDate() &&
        dDate.getMonth() === date.getMonth() &&
        dDate.getFullYear() === date.getFullYear()
      );
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white">
          {monthNames[month]} {year}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-400"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardBody className="p-4">
        {/* Week days header */}
        <div className="grid grid-cols-7 text-center font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 border-t border-l border-slate-100 dark:border-slate-800/80">
          {daysArray.map((date, idx) => {
            if (!date) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="h-32 border-r border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/10"
                />
              );
            }

            const dayTasks = getTasksForDate(date);
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <div
                key={`day-${date.getDate()}`}
                className={`h-32 p-2 border-r border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 flex flex-col gap-1 transition-colors relative overflow-hidden ${
                  isToday ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                }`}
              >
                {/* Date label */}
                <span
                  className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${
                    isToday
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {date.getDate()}
                </span>

                {/* Due Tasks List */}
                <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
                  {dayTasks.map((t) => (
                    <Link
                      key={t._id}
                      to={`/tasks/${t._id}`}
                      className="block text-[10px] font-semibold truncate p-1 rounded bg-blue-50 border border-blue-150 dark:bg-blue-950/20 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 hover:opacity-85 transition-opacity"
                      title={t.title}
                    >
                      {t.title}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};
export default Calendar;
