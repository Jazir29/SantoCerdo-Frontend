import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SelectOption {
  value: string | number;
  label: string;
  subLabel?: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string | number;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'ghost' | 'view' | 'badge';
  size?: 'default' | 'sm';
}


export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  error,
  icon: Icon,
  className = '',
  disabled = false,
  variant = 'default',
  size = 'default',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const safeOptions = Array.isArray(options) ? options.filter(opt => opt && (opt.value !== undefined && opt.value !== null)) : [];
  const selectedOption = safeOptions.find(opt => opt.value === value);

  

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string | number) => {
    if (disabled) return;
    if (onChange && optionValue !== undefined && optionValue !== null) {
      onChange(optionValue.toString());
    }
    setIsOpen(false);
  };

const isGhost = variant === 'ghost';
const isView = variant === 'view';
const isBadge = variant === 'badge';
const isSm = size === 'sm';

 return (
    <div className={`w-full space-y-1 ${className}`} ref={containerRef}>
      {label && (
        <label className={`font-bold text-zinc-400 uppercase tracking-widest ml-1 ${
          isSm ? 'text-[10px]' : 'text-[10px] md:text-[11px]'
        }`}>
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
  type="button"
  disabled={disabled || isView}
  onClick={() => !disabled && !isView && setIsOpen(!isOpen)}
  className={`
    w-full flex items-center justify-between rounded-xl transition-all text-left
    ${isBadge
      ? 'bg-amber-50 border border-amber-200 text-amber-600 rounded-full px-3 py-1.5 text-xs font-bold w-auto inline-flex hover:bg-amber-100'
      : isSm
        ? 'py-2 px-3 text-xs md:py-2.5 md:px-4 md:text-sm'
        : 'py-2.5 md:py-3 px-4 text-sm'
    }
    font-bold outline-none
    ${isView
      ? 'bg-white border border-zinc-200 font-bold text-zinc-900 cursor-default'
      : isBadge
        ? ''
        : `${isGhost ? 'bg-transparent border-none' : 'bg-zinc-50 border border-zinc-200'}`
    }
    ${isOpen && !isGhost && !isView && !isBadge ? 'ring-4 ring-amber-500/10 border-amber-500 bg-white' : ''}
    ${isOpen && isGhost ? 'text-amber-500' : ''}
    ${isOpen && isBadge ? 'bg-amber-100 border-amber-300' : ''}
    ${!isOpen && !isGhost && !isView && !isBadge ? 'hover:bg-zinc-100/50' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : isView ? '' : 'cursor-pointer'}
    ${error && !isBadge ? 'border-red-500 ring-red-500/10' : ''}
  `}
>
  <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
    {Icon && (
      <Icon size={isSm || isBadge ? 13 : 18} className="shrink-0 text-zinc-400" />
    )}
    <span className={`truncate ${!selectedOption && !isView ? (isBadge ? 'text-amber-500' : 'text-zinc-400 font-medium') : ''}`}>
      {selectedOption ? selectedOption.label : isView ? 'N/A' : placeholder}
    </span>
  </div>
  {!isView && (
    <ChevronDown
      size={isBadge ? 13 : isSm ? 14 : 18}
      className={`transition-transform duration-300 shrink-0 ml-1
        ${isBadge ? 'text-amber-500' : 'text-zinc-400'}
        ${isOpen ? 'rotate-180' : ''}
      `}
    />
  )}
</button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 4, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="absolute z-50 w-full bg-white border border-zinc-200 rounded-2xl shadow-2xl shadow-zinc-200/50 overflow-hidden py-2"
            >
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {safeOptions.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-zinc-400 italic text-center">
                    No hay opciones disponibles
                  </div>
                ) : (
                  safeOptions.map((option) => {
                    const isSelected = option.value === value;
                    return (
                      <button
  key={option.value}
  type="button"
  disabled={option.disabled}
  onClick={() => handleSelect(option.value)}
  className={`

  w-full flex items-center justify-between px-4 py-3 md:px-4 md:py-3 text-xs md:text-sm transition-colors text-left
    ${isSelected 
      ? 'bg-amber-50 text-amber-700 font-bold' 
      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium'}
    ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `}
>
  <div className="flex flex-col">
    <span>{option.label}</span>
    {option.subLabel && (
      <span className={`text-[9px] md:text-[10px] font-medium ${isSelected ? 'text-amber-600/70' : 'text-zinc-400'}`}>
        {option.subLabel}
      </span>
    )}
  </div>
  {isSelected && <Check size={12} className="text-amber-500 md:w-4 md:h-4" />}
</button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && <p className="text-[10px] text-red-500 ml-1 font-bold uppercase tracking-wider">{error}</p>}
    </div>
  );
};
