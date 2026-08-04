import { Filter } from 'lucide-react';

interface MobileFilterBarProps {
  hasActiveFilters: boolean;
  onFilterClick: () => void;
  children?: React.ReactNode;
  /** standalone: white box with border+shadow (default). card: plain bar with bottom border for use inside a Card. */
  variant?: 'standalone' | 'card';
}

export function MobileFilterBar({
  hasActiveFilters,
  onFilterClick,
  children,
  variant = 'standalone',
}: MobileFilterBarProps) {
  const containerClass =
    variant === 'standalone'
      ? 'bg-white rounded-2xl border border-zinc-200 shadow-sm'
      : 'border-b border-zinc-100';

  return (
    <div className={`flex items-center gap-2 p-2 md:hidden ${containerClass}`}>
      <button
        onClick={onFilterClick}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition-colors ${
          hasActiveFilters
            ? 'bg-amber-50 border-amber-200 text-amber-600'
            : 'bg-zinc-50 border-zinc-100 text-zinc-500'
        }`}
      >
        <Filter size={11} />
        Filtros
        {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
      </button>
      {children}
    </div>
  );
}
