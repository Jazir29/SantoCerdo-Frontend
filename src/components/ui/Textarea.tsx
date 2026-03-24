import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'view';
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = '',
  variant = 'default',
  ...props
}) => {
  const isView = variant === 'view';

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full transition-all duration-200
          rounded-xl text-sm
          focus:outline-none
          ${isView 
            ? 'bg-white border border-zinc-200 px-4 py-3 font-bold text-zinc-900 cursor-default min-h-0 resize-none' 
            : `bg-zinc-50 border px-4 py-3 min-h-[100px] focus:ring-4 ${
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
      {error && (
        <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};
