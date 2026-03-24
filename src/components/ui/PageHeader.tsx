import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, className }) => {
  return (
    <div className={`flex flex-row md:flex-row justify-between items-center gap-4 mb-4 md:mb-10 ${className || ''}`}>
      <div>
        <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-zinc-500 mt-1 md:mt-2 text-xs sm:text-sm md:text-base font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 w-auto">
          {action}
        </div>
      )}
    </div>
  );
};
