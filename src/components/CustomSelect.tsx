import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

export default function CustomSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Seleccionar...', 
  className = '', 
  buttonClassName = '',
  disabled = false 
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-left outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-amber-500'} ${buttonClassName}`}
      >
        <span className={selectedOption ? 'text-zinc-900' : 'text-zinc-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-100 rounded-xl shadow-lg overflow-hidden py-1">
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  if (!option.disabled) {
                    onChange(option.value);
                    setIsOpen(false);
                  }
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  option.disabled ? 'opacity-50 cursor-not-allowed text-zinc-400' :
                  value === option.value
                    ? 'bg-amber-50 text-amber-700 font-medium'
                    : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {option.label}
              </button>
            ))}
            {options.length === 0 && (
              <div className="px-4 py-2.5 text-sm text-zinc-500 text-center">
                No hay opciones
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
