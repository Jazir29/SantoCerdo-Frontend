import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, className }) => {
  return (
    <div className={`flex flex-row md:flex-row justify-between items-center gap-4 mb-3 md:mb-6 ${className || ''}`}>
      <div>
        <h1 className="text-base sm:text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-zinc-500 mt-0.5 md:mt-1 text-xs sm:text-xs md:text-sm font-medium flex items-center gap-2">
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
