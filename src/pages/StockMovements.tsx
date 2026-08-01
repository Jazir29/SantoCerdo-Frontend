import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';
import { Product } from '../types';

// ── Types ─────────────────────────────────────────────────────

interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  type: 'batch' | 'order_create' | 'order_cancel' | 'order_update';
  reference_id: number | null;
  reference_type: 'order' | 'batch' | null;
  notes: string | null;
  created_at: string;
  created_by: number | null;
  created_by_name: string | null;
}

// ── Badge helpers ─────────────────────────────────────────────

const TYPE_LABELS: Record<string, { label: string; className: string }> = {
  batch:        { label: 'Producción',    className: 'bg-green-50 text-green-700 border-green-200' },
  order_create: { label: 'Venta',         className: 'bg-red-50 text-red-700 border-red-200' },
  order_cancel: { label: 'Cancelación',   className: 'bg-amber-50 text-amber-700 border-amber-200' },
  order_update: { label: 'Actualización', className: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const TYPE_OPTIONS = [
  { value: 'all',          label: 'Todos los tipos' },
  { value: 'batch',        label: 'Producción' },
  { value: 'order_create', label: 'Venta' },
  { value: 'order_cancel', label: 'Cancelación' },
  { value: 'order_update', label: 'Actualización' },
];

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_LABELS[type] ?? { label: type, className: 'bg-zinc-50 text-zinc-700 border-zinc-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function QuantityCell({ quantity }: { quantity: number }) {
  const isPositive = quantity > 0;
  return (
    <span className={`font-bold tabular-nums ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? `+${quantity}` : `${quantity}`}
    </span>
  );
}

function ReferenceCell({ referenceId, referenceType }: { referenceId: number | null; referenceType: 'order' | 'batch' | null }) {
  if (!referenceId || !referenceType) return <span className="text-zinc-400 text-xs">—</span>;
  const label = referenceType === 'order' ? 'Orden' : 'Lote';
  return (
    <span className="text-xs font-semibold text-zinc-600">
      {label} #{referenceId}
    </span>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

// ── Main page ─────────────────────────────────────────────────

export default function StockMovements() {
  const toast = useToast();

  const [movements, setMovements]   = useState<StockMovement[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(false);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [page, setPage]             = useState(1);
  const [productId, setProductId]   = useState<string>('');
  const [type, setType]             = useState<string>('all');
  const [startDate, setStartDate]   = useState<string>('');
  const [endDate, setEndDate]       = useState<string>('');

  const LIMIT = 20;

  const fetchMovements = useCallback(async (currentPage: number) => {
    setLoading(true);
    try {
      const result = await api.getStockMovements({
        page: currentPage,
        limit: LIMIT,
        productId: productId ? Number(productId) : undefined,
        type: type !== 'all' ? type : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setMovements(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      toast(err.message || 'Error al cargar movimientos', 'error');
    } finally {
      setLoading(false);
    }
  }, [productId, type, startDate, endDate, toast]);

  // Load products for filter select
  useEffect(() => {
    api.getAllProducts()
      .then(setProducts)
      .catch(() => {});
  }, []);

  // Fetch movements when filters or page change
  useEffect(() => {
    fetchMovements(page);
  }, [fetchMovements, page]);

  const handleFilterChange = () => {
    setPage(1);
    fetchMovements(1);
  };

  const handleClearFilters = () => {
    setProductId('');
    setType('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const productOptions = [
    { value: '', label: 'Todos los productos' },
    ...products.map(p => ({ value: p.id, label: p.name })),
  ];

  const TABLE_HEADERS = ['Fecha', 'Producto', 'Cantidad', 'Tipo', 'Referencia', 'Usuario'];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Movimientos de Inventario"
        subtitle="Historial de entradas y salidas de stock"
      />

      {/* Filter Bar */}
      <div className="flex items-center bg-white rounded-2xl md:rounded-3xl border border-zinc-200 shadow-sm divide-x divide-zinc-100">
        <div className="flex-1 px-2 min-w-0">
          <Select
            variant="ghost"
            options={productOptions}
            value={productId}
            onChange={(v) => { setProductId(v === '' ? '' : v); setPage(1); }}
            placeholder="Todos los productos"
          />
        </div>
        <div className="w-52 px-2 shrink-0">
          <Select
            variant="ghost"
            options={TYPE_OPTIONS}
            value={type}
            onChange={(v) => { setType(v); setPage(1); }}
            placeholder="Todos los tipos"
          />
        </div>
        <div className="flex items-center gap-2 px-3 shrink-0">
          <DatePicker
            placeholder="Desde"
            value={startDate}
            onChange={(v) => { setStartDate(v); setPage(1); }}
            variant="ghost"
          />
          <span className="text-zinc-300 text-2xs font-black">al</span>
          <DatePicker
            placeholder="Hasta"
            value={endDate}
            onChange={(v) => { setEndDate(v); setPage(1); }}
            variant="ghost"
          />
        </div>
        <button
          onClick={handleClearFilters}
          className="px-3 py-2 text-zinc-300 hover:text-zinc-600 transition-colors shrink-0"
          title="Limpiar filtros"
        >
          <X size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Summary bar */}
        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            {total} movimiento{total !== 1 ? 's' : ''}
          </p>
        </div>

        <Table headers={TABLE_HEADERS} loading={loading} emptyMessage="No hay movimientos registrados">
          {movements.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <span className="text-xs text-zinc-500 whitespace-nowrap">{formatDate(m.created_at)}</span>
              </TableCell>
              <TableCell>
                <span className="font-semibold text-zinc-900 text-sm">{m.product_name || '—'}</span>
              </TableCell>
              <TableCell>
                <QuantityCell quantity={m.quantity} />
              </TableCell>
              <TableCell>
                <TypeBadge type={m.type} />
              </TableCell>
              <TableCell>
                <ReferenceCell referenceId={m.reference_id} referenceType={m.reference_type} />
              </TableCell>
              <TableCell>
                <span className="text-xs text-zinc-500">{m.created_by_name?.trim() || '—'}</span>
              </TableCell>
            </TableRow>
          ))}
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-zinc-100 flex items-center justify-between">
            <p className="text-xs text-zinc-400 font-medium">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        pageNum === page
                          ? 'bg-amber-500 text-zinc-900 shadow-sm'
                          : 'text-zinc-500 hover:bg-zinc-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
