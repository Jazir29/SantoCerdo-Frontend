import { useState, useEffect, useMemo } from 'react';
import { Package, Calendar, TrendingUp, ChevronLeft, ChevronRight, Search, Eye, Filter, X } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { Modal } from '../components/ui/Modal';
import { api } from '../services/api';
import { ProductionBatch } from '../types';
import { useToast } from '../components/ui/Toast';

const PAGE_SIZE = 9;

export default function ProductionRegistry() {
  const toast = useToast();
  const [allBatches, setAllBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  useEffect(() => {
    fetchAllBatches();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterProduct, filterStartDate, filterEndDate]);

  const fetchAllBatches = async () => {
    setLoading(true);
    try {
      const response = await api.getProductionBatches(1, 9999, '');
      setAllBatches(response.data);
    } catch (error: any) {
      toast(error?.message || 'Error al cargar lotes', 'error');
      setAllBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const productOptions = useMemo(() => {
    const names = Array.from(new Set(allBatches.map(b => b.product_name).filter(Boolean)));
    return [
      { value: '', label: 'Todos los productos' },
      ...names.sort().map(n => ({ value: n, label: n })),
    ];
  }, [allBatches]);

  const filteredBatches = useMemo(() => {
    return allBatches.filter(b => {
      if (searchTerm && !b.product_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterProduct && b.product_name !== filterProduct) return false;
      const dateStr = b.created_at.split('T')[0];
      if (filterStartDate && dateStr < filterStartDate) return false;
      if (filterEndDate && dateStr > filterEndDate) return false;
      return true;
    });
  }, [allBatches, searchTerm, filterProduct, filterStartDate, filterEndDate]);

  const hasActiveFilters = !!(searchTerm || filterProduct || filterStartDate || filterEndDate);

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterProduct('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / PAGE_SIZE));
  const displayBatches = filteredBatches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const safe = (n: any) => isFinite(Number(n)) ? Number(n) : 0;

  const renderDetails = () => {
    if (!selectedBatch) return null;

    const b = selectedBatch;
    const batchYieldKg      = safe(b.batch_yield_grams) / 1000;
    const costPerKg         = batchYieldKg > 0 ? safe(b.total_batch_cost) / batchYieldKg : 0;
    const suggestedPricePerKg = b.margin_percent < 100
      ? costPerKg / (1 - safe(b.margin_percent) / 100) : 0;
    const profitPerKg       = suggestedPricePerKg - costPerKg;
    const profitPerUnit     = safe(b.price_per_unit) - safe(b.cost_per_unit);

    const ingPct  = suggestedPricePerKg > 0
      ? ((safe(b.total_ingredients_cost) / batchYieldKg) / suggestedPricePerKg) * 100 : 0;
    const opPct   = suggestedPricePerKg > 0
      ? ((safe(b.total_operations_cost) / batchYieldKg) / suggestedPricePerKg) * 100 : 0;
    const profPct = suggestedPricePerKg > 0
      ? (profitPerKg / suggestedPricePerKg) * 100 : 0;

    return (
      <div className="space-y-6">
        {/* Ingredientes y Operaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Package size={16} /></div>
              <h4 className="font-bold text-zinc-900">Materia Prima</h4>
            </div>
            <div className="bg-zinc-50 rounded-2xl p-4 space-y-2">
              {b.ingredients_detail.map((ing, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-zinc-600">{ing.name || '—'}</span>
                  <span className="font-bold text-zinc-900">S/ {safe(ing.amount).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-zinc-200 flex justify-between font-bold text-zinc-900 text-sm">
                <span>Subtotal Insumos</span>
                <span>S/ {safe(b.total_ingredients_cost).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><TrendingUp size={16} /></div>
              <h4 className="font-bold text-zinc-900">Costos Operativos</h4>
            </div>
            <div className="bg-zinc-50 rounded-2xl p-4 space-y-2">
              {b.operations_detail.map((op, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-zinc-600">{op.name || '—'}</span>
                  <span className="font-bold text-zinc-900">S/ {safe(op.amount).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-zinc-200 flex justify-between font-bold text-zinc-900 text-sm">
                <span>Subtotal Operativo</span>
                <span>S/ {safe(b.total_operations_cost).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Análisis de Rentabilidad */}
        <div className="bg-zinc-900 rounded-3xl p-4 md:p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp size={120} /></div>
          <div className="relative z-10 space-y-6">
            <h4 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <TrendingUp size={18} /> Análisis de Rentabilidad Registrado
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-zinc-800 pb-6">
              <div>
                <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Costo (1 kg)</p>
                <p className="text-xl font-bold text-zinc-300">S/ {costPerKg.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Costo (1 und)</p>
                <p className="text-xl font-bold text-zinc-300">S/ {safe(b.cost_per_unit).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Ganancia (1 kg)</p>
                <p className="text-xl font-bold text-emerald-400">S/ {profitPerKg.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Ganancia (1 und)</p>
                <p className="text-xl font-bold text-emerald-400">S/ {profitPerUnit.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Precio Sugerido (Kg)</p>
                <p className="text-3xl font-black text-white">S/ {suggestedPricePerKg.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Precio Sugerido (Und)</p>
                <p className="text-3xl font-black text-white">S/ {safe(b.price_per_unit).toFixed(2)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-zinc-500 mb-2 font-bold uppercase tracking-wider">
                Composición del Precio en este Lote
              </p>
              <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                <div style={{ width: `${ingPct}%` }} className="bg-blue-500" />
                <div style={{ width: `${opPct}%` }} className="bg-purple-500" />
                <div style={{ width: `${profPct}%` }} className="bg-emerald-500" />
              </div>
              <div className="flex justify-between mt-2 text-xs font-bold">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Insumos ({ingPct.toFixed(1)}%)
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  Operativo ({opPct.toFixed(1)}%)
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Margen ({profPct.toFixed(1)}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen del lote */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
            <p className="text-zinc-400 text-xs uppercase font-bold tracking-wider mb-1">Rendimiento</p>
            <p className="text-base font-bold text-zinc-900">{safe(b.batch_yield_grams).toLocaleString()}g</p>
            <p className="text-xs text-zinc-400">{batchYieldKg.toFixed(2)} kg</p>
          </div>
          <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
            <p className="text-zinc-400 text-xs uppercase font-bold tracking-wider mb-1">Peso Unitario</p>
            <p className="text-base font-bold text-zinc-900">{safe(b.unit_weight_grams)}g</p>
          </div>
          <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
            <p className="text-zinc-400 text-xs uppercase font-bold tracking-wider mb-1">Unidades</p>
            <p className="text-base font-bold text-zinc-900">{safe(b.units_produced)} und</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-emerald-600 text-xs uppercase font-bold tracking-wider mb-1">Margen Aplicado</p>
            <p className="text-base font-bold text-emerald-700">{safe(b.margin_percent)}%</p>
          </div>
        </div>

        {/* Notas */}
        {b.notes && (
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Notas</p>
            <p className="text-sm text-zinc-600 italic">{b.notes}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registro de Producción"
        subtitle="Historial de lotes producidos y costos calculados"
      />

      {/* Mobile filter bar */}
      <div className="md:hidden flex items-center gap-2 bg-white rounded-2xl border border-zinc-200 shadow-sm p-2">
        <button
          onClick={() => hasActiveFilters ? clearAllFilters() : setIsFilterModalOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition-colors ${
            hasActiveFilters ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-zinc-50 border-zinc-100 text-zinc-500'
          }`}
        >
          <Filter size={11} />
          Filtros
          {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
        </button>
        <div className="flex-1">
          <Input
            placeholder="Buscar por producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
            variant="ghost"
          />
        </div>
      </div>

      {/* Desktop filter bar + pagination */}
      <div className="hidden md:flex items-center bg-white rounded-3xl border border-zinc-200 shadow-sm gap-2 px-3 py-1.5">
        <button
          onClick={() => hasActiveFilters && clearAllFilters()}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shrink-0 transition-colors ${
            hasActiveFilters ? 'bg-amber-50 border-amber-200 cursor-pointer hover:bg-amber-100' : 'bg-zinc-50 border-zinc-100 cursor-default'
          }`}
        >
          <Filter size={12} className={hasActiveFilters ? 'text-amber-600' : 'text-zinc-400'} />
          <span className={`text-2xs font-black uppercase tracking-widest ${hasActiveFilters ? 'text-amber-600' : 'text-zinc-400'}`}>
            Filtros
          </span>
        </button>
        <div className="w-px h-6 bg-zinc-100 shrink-0" />
        <div className="w-48 shrink-0">
          <Select
            variant="ghost"
            options={productOptions}
            value={filterProduct}
            onChange={setFilterProduct}
            placeholder="Todos los productos"
          />
        </div>
        <div className="w-px h-6 bg-zinc-100 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <DatePicker
            placeholder="Desde"
            value={filterStartDate}
            onChange={setFilterStartDate}
            variant="ghost"
          />
          <span className="text-zinc-300 text-2xs font-black">al</span>
          <DatePicker
            placeholder="Hasta"
            value={filterEndDate}
            onChange={setFilterEndDate}
            variant="ghost"
          />
        </div>
        <button
          onClick={clearAllFilters}
          className="p-1.5 text-zinc-300 hover:text-zinc-600 transition-colors shrink-0"
          title="Limpiar filtros"
        >
          <X size={14} />
        </button>
        <div className="w-px h-6 bg-zinc-100 shrink-0" />
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Buscar por producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
            variant="ghost"
          />
        </div>
        <div className="w-px h-6 bg-zinc-100 shrink-0" />
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" icon={ChevronLeft}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}>
          </Button>
          <span className="text-sm font-medium text-zinc-500 px-2 whitespace-nowrap">
            {page} / {totalPages}
          </span>
          <Button variant="ghost" size="sm" icon={ChevronRight}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}>
          </Button>
        </div>
      </div>

      {/* Grid de lotes */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 bg-zinc-100 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : displayBatches.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-2">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="text-zinc-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-1">No hay registros</h3>
            <p className="text-zinc-500">
              {hasActiveFilters ? 'No hay lotes que coincidan con los filtros aplicados.' : 'Los lotes que calcules y guardes aparecerán aquí.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayBatches.map((batch) => (
            <Card key={batch.id} className="rounded-3xl hover:shadow-md transition-shadow overflow-hidden border-zinc-100">
              {/* Header oscuro */}
              <div className="bg-zinc-900 p-4 text-white">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-zinc-800 rounded-lg">
                    <Package size={16} className="text-amber-400" />
                  </div>
                  <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                    <Calendar size={10} />
                    {formatDate(batch.created_at)}
                  </span>
                </div>
                <h3 className="text-base font-bold truncate">{batch.product_name}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {safe(batch.batch_yield_grams).toLocaleString()}g lote · {safe(batch.unit_weight_grams)}g/und
                </p>
              </div>

              {/* Body */}
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-bold text-zinc-400 mb-0.5">Producción</p>
                    <p className="text-sm font-bold text-zinc-900">{safe(batch.units_produced)} unidades</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider font-bold text-zinc-400 mb-0.5">Costo Total</p>
                    <p className="text-sm font-bold text-zinc-900">S/ {safe(batch.total_batch_cost).toFixed(2)}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-bold text-zinc-400 mb-0.5">Costo Unitario</p>
                    <p className="text-sm font-bold text-zinc-600">S/ {safe(batch.cost_per_unit).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider font-bold text-zinc-400 mb-0.5">Precio Venta</p>
                    <p className="text-sm font-bold text-emerald-600">S/ {safe(batch.price_per_unit).toFixed(2)}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                      <TrendingUp size={12} />
                    </div>
                    <span className="text-xs font-bold text-zinc-500">Margen</span>
                    <span className="text-sm font-black text-emerald-600">{safe(batch.margin_percent)}%</span>
                  </div>
                  <Button variant="ghost" size="sm" icon={Eye}
                    onClick={() => { setSelectedBatch(batch); setIsModalOpen(true); }}
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                    Detalles
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mobile pagination */}
      {!loading && filteredBatches.length > 0 && (
        <div className="md:hidden flex items-center justify-between py-2">
          <span className="text-sm text-zinc-400">
            {filteredBatches.length} lote{filteredBatches.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={ChevronLeft}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}>
            </Button>
            <span className="text-sm font-medium text-zinc-500">{page} / {totalPages}</span>
            <Button variant="ghost" size="sm" icon={ChevronRight}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}>
            </Button>
          </div>
        </div>
      )}

      {/* Footer total */}
      {!loading && (
        <div className="text-sm text-zinc-400 text-center">
          {filteredBatches.length} de {allBatches.length} lote{allBatches.length !== 1 ? 's' : ''} registrado{allBatches.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Modal detalle */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Detalles: ${selectedBatch?.product_name}`}
        size="lg"
        footer={
          <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
            Cerrar
          </Button>
        }
      >
        {renderDetails()}
      </Modal>

      {/* Mobile Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filtros"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={clearAllFilters}>
              Limpiar
            </Button>
            <Button size="sm" onClick={() => setIsFilterModalOpen(false)}>
              Aplicar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Producto"
            size="sm"
            options={productOptions}
            value={filterProduct}
            onChange={setFilterProduct}
          />
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Desde"
              size="sm"
              value={filterStartDate}
              onChange={setFilterStartDate}
            />
            <DatePicker
              label="Hasta"
              size="sm"
              value={filterEndDate}
              onChange={setFilterEndDate}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
