import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  suffix?: string;
  error?: string;
  variant?: 'default' | 'view' | 'ghost';
  size?: 'default' | 'sm';
}

export const Input: React.FC<InputProps> = ({
  label,
  icon: Icon,
  suffix,
  error,
  className = '',
  variant = 'default',
  size = 'default',
  ...props
}) => {
  const isView = variant === 'view';
  const isSm = size === 'sm';

  return (
    <div className="space-y-1 w-full">
      {label && (
        <label className={`font-bold text-zinc-400 uppercase tracking-widest ml-1 ${
          isSm ? 'text-[10px]' : 'text-[10px] md:text-[11px]'
        }`}>
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <Icon
            size={isSm ? 13 : 18}
            className={`absolute top-1/2 -translate-y-1/2 transition-colors ${
              isSm ? 'left-3' : 'left-4'
            } ${
              error ? 'text-red-400' : isView ? 'text-zinc-400' : 'text-zinc-400 group-focus-within:text-amber-500'
            }`}
          />
        )}
        <input
          className={`
            w-full transition-all duration-200 rounded-xl focus:outline-none
            ${isSm ? 'text-xs py-2' : 'text-sm py-2.5 md:py-3'}
              ${Icon ? isSm ? 'pl-8' : 'pl-11' : isSm ? 'pl-3' : 'pl-4'}
            ${suffix ? 'pr-12' : isSm ? 'pr-3' : 'pr-4'}
            ${isView
              ? 'bg-white border border-zinc-200 font-bold text-zinc-900 cursor-default'
              : `bg-zinc-50 border focus:ring-4 ${
                  error
                    ? 'border-red-200 focus:border-red-500 focus:ring-red-500/10 text-red-900'
                    : 'border-zinc-200 focus:border-amber-500 focus:ring-amber-500/10 text-zinc-900'
                }`
            }
            ${className}
          `}
          readOnly={isView || props.readOnly}
          {...props}
        />
        {suffix && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium text-xs pointer-events-none">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1">
          {error}
        </p>
      )}
    </div>
  );
};