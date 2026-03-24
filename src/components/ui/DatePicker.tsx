import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday,
  parseISO,
  isValid,
  setMonth,
  setYear,
  getYear,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

interface DatePickerProps {
  label?: string;
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'view' | 'ghost';
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Seleccionar fecha...',
  error,
  className = '',
  disabled = false,
  variant = 'default',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const [currentMonth, setCurrentMonth] = useState(value ? parseISO(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const isView = variant === 'view';
  const isGhost = variant === 'ghost';

  // Reset view mode when opening
  useEffect(() => {
    if (isOpen) setViewMode('days');
  }, [isOpen]);

  // Ensure currentMonth is valid
  useEffect(() => {
    if (!isValid(currentMonth)) {
      setCurrentMonth(new Date());
    }
  }, [currentMonth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateClick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const nextYearRange = () => setCurrentMonth(setYear(currentMonth, getYear(currentMonth) + 12));
  const prevYearRange = () => setCurrentMonth(setYear(currentMonth, getYear(currentMonth) - 12));

  const selectedDate = value && isValid(parseISO(value)) ? parseISO(value) : null;

  const renderHeader = () => {
    const monthName = format(currentMonth, 'MMMM', { locale: es });
    const year = getYear(currentMonth);

    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
        <button
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            if (viewMode === 'days') prevMonth();
            else if (viewMode === 'years') prevYearRange();
          }}
          className={`p-2 hover:bg-white hover:shadow-sm rounded-xl text-zinc-400 hover:text-zinc-900 transition-all active:scale-95 ${viewMode === 'months' ? 'invisible' : ''}`}
        >
          <ChevronLeft size={18} />
        </button>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setViewMode(viewMode === 'months' ? 'days' : 'months'); }}
            className="text-xs font-black text-zinc-900 uppercase tracking-widest hover:text-amber-500 transition-colors px-1 py-0.5 rounded"
          >
            {monthName}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setViewMode(viewMode === 'years' ? 'days' : 'years'); }}
            className="text-xs font-black text-zinc-900 uppercase tracking-widest hover:text-amber-500 transition-colors px-1 py-0.5 rounded"
          >
            {year}
          </button>
        </div>

        <button
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            if (viewMode === 'days') nextMonth();
            else if (viewMode === 'years') nextYearRange();
          }}
          className={`p-2 hover:bg-white hover:shadow-sm rounded-xl text-zinc-400 hover:text-zinc-900 transition-all active:scale-95 ${viewMode === 'months' ? 'invisible' : ''}`}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, i) => (
          <div key={i} className="text-[10px] font-black text-zinc-400 uppercase text-center py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1 px-2 pb-2">
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDateClick(day)}
              className={`
                h-9 w-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all
                ${!isCurrentMonth ? 'text-zinc-300' : 'text-zinc-700'}
                ${isSelected 
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                  : isCurrentDay
                  ? 'bg-amber-50 text-amber-600 border border-amber-100'
                  : 'hover:bg-zinc-100'}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    );
  };

  const renderMonths = () => {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    return (
      <div className="grid grid-cols-3 gap-2 p-4">
        {months.map((month, i) => {
          const isCurrent = i === currentMonth.getMonth();
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentMonth(setMonth(currentMonth, i));
                setViewMode('days');
              }}
              className={`
                py-3 rounded-xl text-xs font-bold transition-all
                ${isCurrent 
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                  : 'text-zinc-700 hover:bg-zinc-100'}
              `}
            >
              {month}
            </button>
          );
        })}
      </div>
    );
  };

  const renderYears = () => {
    const currentYear = getYear(currentMonth);
    const startYear = currentYear - (currentYear % 12);
    const years = Array.from({ length: 12 }, (_, i) => startYear + i);

    return (
      <div className="grid grid-cols-3 gap-2 p-4">
        {years.map((year) => {
          const isCurrent = year === currentYear;
          return (
            <button
              key={year}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentMonth(setYear(currentMonth, year));
                setViewMode('days');
              }}
              className={`
                py-3 rounded-xl text-xs font-bold transition-all
                ${isCurrent 
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                  : 'text-zinc-700 hover:bg-zinc-100'}
              `}
            >
              {year}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="relative group">
          <CalendarIcon 
            size={isGhost ? 14 : 18} 
            className={`absolute ${isGhost ? 'left-1' : 'left-4'} top-1/2 -translate-y-1/2 transition-colors ${
              error ? 'text-red-400' : isView ? 'text-zinc-400' : 'text-zinc-400 group-focus-within:text-amber-500'
            }`} 
          />
          <input
            type="text"
            readOnly
            disabled={disabled || isView}
            onClick={() => !disabled && !isView && setIsOpen(!isOpen)}
            placeholder={placeholder}
            value={selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''}
            className={`
              w-full py-3 ${isGhost ? 'pl-6' : 'pl-11'} pr-10 rounded-xl text-sm font-bold transition-all
              ${isView 
                ? 'bg-white border border-zinc-200 cursor-default text-zinc-900' 
                : isGhost
                ? `bg-transparent border-none shadow-none px-2 py-1 h-auto cursor-pointer text-zinc-900 ${
                    isOpen ? 'text-amber-600' : 'hover:text-amber-500'
                  }`
                : `bg-zinc-50 border border-zinc-200 outline-none cursor-pointer ${
                    isOpen ? 'ring-4 ring-amber-500/10 border-amber-500 bg-white' : 'hover:bg-zinc-100/50'
                  }`
              }
              ${error ? 'border-red-500 ring-red-500/10' : ''}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
          {value && !disabled && !isView && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 4, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="absolute z-50 w-72 bg-white border border-zinc-200 rounded-2xl shadow-2xl shadow-zinc-200/50 overflow-hidden"
            >
              {renderHeader()}
              <div className="p-2">
                {viewMode === 'days' && (
                  <>
                    {renderDays()}
                    {renderCells()}
                  </>
                )}
                {viewMode === 'months' && renderMonths()}
                {viewMode === 'years' && renderYears()}
                
                <div className="mt-2 pt-2 border-t border-zinc-50 flex justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const today = new Date();
                      setCurrentMonth(today);
                      handleDateClick(today);
                    }}
                    className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-600 transition-colors py-1 px-4"
                  >
                    Hoy
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1">{error}</p>}
    </div>
  );
};
