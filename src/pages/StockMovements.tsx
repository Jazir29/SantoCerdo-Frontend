import { useState, useEffect, useCallback } from 'react';
import { X, Filter, Search } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
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
    <span className={`font-bold tabular-nums text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
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

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
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

  // Mobile filter modal
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [draftProductId, setDraftProductId] = useState<string>('');
  const [draftType, setDraftType]           = useState<string>('all');
  const [draftStartDate, setDraftStartDate] = useState<string>('');
  const [draftEndDate, setDraftEndDate]     = useState<string>('');

  const LIMIT = 20;

  const activeFilterCount = [productId, type !== 'all', startDate, endDate].filter(Boolean).length;

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

  useEffect(() => {
    api.getAllProducts()
      .then(setProducts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchMovements(page);
  }, [fetchMovements, page]);

  const handleClearFilters = () => {
    setProductId('');
    setType('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const openFilterModal = () => {
    setDraftProductId(productId);
    setDraftType(type);
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
    setIsFilterModalOpen(true);
  };

  const applyMobileFilters = () => {
    setProductId(draftProductId);
    setType(draftType);
    setStartDate(draftStartDate);
    setEndDate(draftEndDate);
    setPage(1);
    setIsFilterModalOpen(false);
  };

  const productOptions = [
    { value: '', label: 'Todos los productos' },
    ...products.map(p => ({ value: p.id, label: p.name })),
  ];

  const TABLE_HEADERS = ['Fecha', 'Producto', 'Cantidad', 'Tipo', 'Referencia', 'Usuario'];
  const hasActiveFilters = !!(productId || type !== 'all' || startDate || endDate);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Movimientos de Inventario"
        subtitle="Historial de entradas y salidas de stock"
      />

      {/* ── MOBILE Filter Bar ── */}
      <div className="flex items-center gap-2 md:hidden bg-white rounded-2xl border border-zinc-200 shadow-sm px-3 py-2">
        <Filter size={14} className={hasActiveFilters ? 'text-amber-500 shrink-0' : 'text-zinc-400 shrink-0'} />
        <button onClick={openFilterModal} className="flex-1 text-left text-sm text-zinc-400">
          {activeFilterCount > 0 ? `${activeFilterCount} filtro${activeFilterCount > 1 ? 's' : ''} activo${activeFilterCount > 1 ? 's' : ''}` : 'Filtrar movimientos...'}
        </button>
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
            {activeFilterCount}
          </span>
        )}
        <button
          onClick={() => hasActiveFilters ? handleClearFilters() : openFilterModal()}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
            hasActiveFilters ? 'bg-amber-50 text-amber-600' : 'bg-zinc-100 text-zinc-600'
          }`}
        >
          Filtros
        </button>
      </div>

      {/* ── DESKTOP Filter Bar ── */}
      <div className="hidden md:flex items-center bg-white rounded-2xl md:rounded-3xl border border-zinc-200 shadow-sm divide-x divide-zinc-100">
        <button
          onClick={() => hasActiveFilters && handleClearFilters()}
          className={`flex items-center gap-2 px-3 py-2 shrink-0 transition-colors ${
            hasActiveFilters ? 'bg-amber-50 cursor-pointer hover:bg-amber-100' : 'cursor-default'
          }`}
        >
          <Filter size={12} className={hasActiveFilters ? 'text-amber-600' : 'text-zinc-400'} />
          <span className={`text-2xs font-black uppercase tracking-widest ${hasActiveFilters ? 'text-amber-600' : 'text-zinc-400'}`}>
            Filtros
          </span>
        </button>
        <div className="flex-1 px-2 min-w-0">
          <Select
            variant="ghost"
            options={productOptions}
            value={productId}
            onChange={(v) => { setProductId(v === '' ? '' : v); setPage(1); }}
            placeholder="Todos los productos"
          />
        </div>
        <div className="w-44 px-2 shrink-0">
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

      {/* ── Table container ── */}
      <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Summary bar */}
        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            {total} movimiento{total !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ── MOBILE Card List ── */}
        <div className="md:hidden">
          {loading ? (
            <div className="py-12 text-center text-zinc-400 text-sm">Cargando...</div>
          ) : movements.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-sm">No hay movimientos registrados</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {movements.map((m) => (
                <div key={m.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <TypeBadge type={m.type} />
                      <span className="text-zinc-400 text-xs ml-auto shrink-0">{formatDateShort(m.created_at)}</span>
                    </div>
                    <p className="font-semibold text-zinc-900 text-sm truncate mb-0.5">{m.product_name || '—'}</p>
                    <div className="flex items-center gap-3">
                      <ReferenceCell referenceId={m.reference_id} referenceType={m.reference_type} />
                      {m.created_by_name && (
                        <span className="text-xs text-zinc-400 truncate">{m.created_by_name.trim()}</span>
                      )}
                    </div>
                  </div>
                  <QuantityCell quantity={m.quantity} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── DESKTOP Table ── */}
        <div className="hidden md:block">
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
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-zinc-100 flex items-center justify-between">
            <p className="text-xs text-zinc-400 font-medium">
              <span className="md:hidden">{page} / {totalPages}</span>
              <span className="hidden md:inline">Página {page} de {totalPages}</span>
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
              <div className="hidden md:flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        pageNum === page ? 'bg-amber-500 text-zinc-900 shadow-sm' : 'text-zinc-500 hover:bg-zinc-100'
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

      {/* ── MOBILE Filter Modal ── */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filtros"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => {
              setDraftProductId(''); setDraftType('all'); setDraftStartDate(''); setDraftEndDate('');
            }}>
              Limpiar
            </Button>
            <Button size="sm" onClick={applyMobileFilters}>
              Aplicar filtros
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Producto"
            options={productOptions}
            value={draftProductId}
            onChange={setDraftProductId}
            size="sm"
          />
          <Select
            label="Tipo de movimiento"
            options={TYPE_OPTIONS}
            value={draftType}
            onChange={setDraftType}
            size="sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Desde"
              value={draftStartDate}
              onChange={setDraftStartDate}
              size="sm"
            />
            <DatePicker
              label="Hasta"
              value={draftEndDate}
              onChange={setDraftEndDate}
              size="sm"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
