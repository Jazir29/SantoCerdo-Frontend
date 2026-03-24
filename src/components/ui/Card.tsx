import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', animate = true }) => {
  const Component = animate ? motion.div : 'div';
  
  return (
    <Component
      initial={animate ? { opacity: 0, y: 10 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      className={`bg-white border border-zinc-200 rounded-[2rem] shadow-sm overflow-hidden ${className}`}
    >
      {children}
    </Component>
  );
};

export const CardHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="p-4 sm:p-8 border-b border-zinc-100 flex justify-between items-start">
    <div>
      <h3 className="text-xl font-bold text-zinc-900 tracking-tight">{title}</h3>
      {subtitle && <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-bold">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-4 sm:p-8 ${className}`}>
    {children}
  </div>
);
