import React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
}

export const Table: React.FC<TableProps> = ({ headers, children, loading, emptyMessage = 'No hay datos disponibles' }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-zinc-50/50 text-zinc-500 text-[10px] uppercase tracking-[0.15em] font-black border-b border-zinc-100">
            {headers.map((header, i) => (
              <th key={i} className={`p-6 font-black ${i === headers.length - 1 ? 'text-right' : ''}`}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cargando...</p>
                </div>
              </td>
            </tr>
          ) : React.Children.count(children) === 0 ? (
            <tr>
              <td colSpan={headers.length} className="p-12 text-center text-zinc-400 text-xs italic">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
};

export const TableRow: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <tr 
    onClick={onClick}
    className={`group transition-colors ${onClick ? 'cursor-pointer hover:bg-zinc-50/80' : ''}`}
  >
    {children}
  </tr>
);

export const TableCell: React.FC<{ children: React.ReactNode; className?: string; align?: 'left' | 'right' | 'center' }> = ({ 
  children, 
  className = '',
  align = 'left'
}) => {
  const alignment = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center'
  };
  
  return (
    <td className={`p-4 md:p-6 text-sm ${alignment[align]} ${className}`}>
      {children}
    </td>
  );
};
