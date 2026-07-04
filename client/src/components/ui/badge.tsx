import React, { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-200';
  
  const variants = {
    primary: 'bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40',
    secondary: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40',
    warning: 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40',
    danger: 'bg-rose-50 text-rose-800 border-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40',
    info: 'bg-sky-50 text-sky-800 border-sky-100 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900/40',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
export default Badge;
