import { Filter } from 'lucide-react';

interface FiltersPillProps {
  hasActiveFilters: boolean;
  onClick: () => void;
}

export function FiltersPill({ hasActiveFilters, onClick }: FiltersPillProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shrink-0 transition-colors ${
        hasActiveFilters
          ? 'bg-amber-50 border-amber-200 cursor-pointer hover:bg-amber-100'
          : 'bg-zinc-50 border-zinc-100 cursor-default'
      }`}
    >
      <Filter size={12} className={hasActiveFilters ? 'text-amber-600' : 'text-zinc-400'} />
      <span className={`text-2xs font-black uppercase tracking-widest ${hasActiveFilters ? 'text-amber-600' : 'text-zinc-400'}`}>
        Filtros
      </span>
    </button>
  );
}
