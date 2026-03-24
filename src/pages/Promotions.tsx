import React, { useState, useEffect } from 'react';
import { Plus, Tag, Trash2, Edit2, CheckCircle, XCircle, Calendar, Percent, DollarSign, Search, Save, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { DatePicker } from '../components/ui/DatePicker';
import { api } from '../services/api';
import { Promotion } from '../types';

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPromotions, setTotalPromotions] = useState(0);
  const limit = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPromo, setCurrentPromo] = useState<Partial<Promotion>>({
    name: '',
    code: '',
    type: 'percentage',
    value: 0,
    start_date: '',
    end_date: '',
    active: 1
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPromotions(1);
  }, [searchTerm]);

  const fetchPromotions = async (page = 1) => {
    setLoading(true);
    try {
      const data = await api.getPromotions(page, limit, searchTerm);
      setPromotions(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalPromotions(data.total || 0);
      setCurrentPage(data.page || 1);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (isEditing && currentPromo.id) {
        await api.updatePromotion(currentPromo.id, currentPromo);
      } else {
        await api.createPromotion(currentPromo);
      }

      await fetchPromotions(currentPage);
      setIsModalOpen(false);
      setIsEditing(false);
      setCurrentPromo({
        name: '',
        code: '',
        type: 'percentage',
        value: 0,
        start_date: '',
        end_date: '',
        active: 1
      });
    } catch (error) {
      console.error('Error saving promotion:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta promoción?')) return;

    try {
      await api.deletePromotion(id);
      fetchPromotions(currentPage);
    } catch (error) {
      console.error('Error deleting promotion:', error);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Promociones" 
        subtitle="Gestiona descuentos y cupones para tus clientes"
        action={
          <Button 
            onClick={() => { setIsEditing(false); setCurrentPromo({ name: '', code: '', type: 'percentage', value: 0, start_date: '', end_date: '', active: 1 }); setIsModalOpen(true); }}
            className="flex items-center gap-1.5 text-xs md:text-sm px-4 md:px-5 py-2 md:py-2.5 w-auto"
          >
            <Plus size={14} className="md:hidden" />
            <Plus size={20} className="hidden md:block" />
            <span>Nueva Promoción</span>
          </Button>
        }
      />

      <Card>
        <div className="border-b border-zinc-100">
          {/* Móvil */}
          <div className="flex items-center gap-2 p-2 md:hidden">
            <div className="flex-1">
              <Input placeholder="Buscar..." icon={Search} className="bg-transparent border-none focus:ring-0 text-xs"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} variant="ghost" />
            </div>
          </div>
          {/* Desktop */}
          <div className="hidden md:block p-4 md:p-8 bg-zinc-50/30">
            <div className="max-w-md">
              <Input icon={Search} placeholder="Buscar por nombre o código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="sm" />
            </div>
          </div>
        </div>

        {/* Mobile Card List */}
<div className="md:hidden">
  {loading ? (
    <div className="p-8 text-center text-zinc-500 text-sm">Cargando promociones...</div>
  ) : promotions.length === 0 ? (
    <div className="p-8 text-center text-zinc-500 text-sm">No se encontraron promociones</div>
  ) : promotions.map((promo) => (
    <div
      key={promo.id}
      className="px-4 py-4 active:bg-zinc-50 transition-colors border-b-4 border-zinc-50 last:border-b-0"
      onClick={() => { setIsEditing(false); setIsViewing(true); setCurrentPromo(promo); setIsModalOpen(true); }}
    >
      {/* Fila 1: fecha + estado */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-zinc-400 flex items-center gap-1">
          {(promo.start_date || promo.end_date) && (
            <>
              <Calendar size={10} />
              {promo.start_date ? new Date(promo.start_date).toLocaleDateString() : '∞'}
              {' – '}
              {promo.end_date ? new Date(promo.end_date).toLocaleDateString() : '∞'}
            </>
          )}
        </span>
        {promo.active ? (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600">Activo</span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-400">Inactivo</span>
        )}
      </div>

      {/* Fila 2: nombre */}
      <h4 className="font-bold text-zinc-900 text-base mb-2.5">{promo.name}</h4>

      {/* Fila 3: código + descuento + botones */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <span className="font-mono text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg">
          {promo.code}
        </span>
        <span className="text-sm font-bold text-emerald-600 flex items-center gap-0.5">
          {promo.type === 'percentage' ? (
            <>{promo.value}%</>
          ) : (
            <>S/ {Number(promo.value || 0).toFixed(2)}</>
          )}
        </span>
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsViewing(false); setCurrentPromo(promo); setIsModalOpen(true); }}
            className="h-8 w-8 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 active:bg-zinc-200"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(promo.id); }}
            className="h-8 w-8 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 active:bg-zinc-200"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  ))}
</div>

        <div className="hidden md:block overflow-x-auto">
          <Table 
            headers={['Promoción', 'Código', 'Descuento', 'Vigencia', 'Estado', 'Acciones']}
            loading={loading}
            emptyMessage="No se encontraron promociones"
          >
            {(promotions || []).map((promo) => (
              <TableRow key={promo.id}>
                <TableCell>
                  <div className="flex items-center gap-3 min-w-[150px]">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                      <Tag size={16} className="md:hidden" />
                      <Tag size={20} className="hidden md:block" />
                    </div>
                    <span className="font-bold text-zinc-900 text-sm md:text-base">{promo.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-0.5 md:px-3 md:py-1 bg-zinc-100 text-zinc-600 rounded-lg font-mono font-bold text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap">
                    {promo.code}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 font-bold text-zinc-900 text-xs md:text-sm whitespace-nowrap">
                    {promo.type === 'percentage' ? (
                      <><Percent size={12} className="text-zinc-400" /> {promo.value}%</>
                    ) : (
                      <><DollarSign size={12} className="text-zinc-400" /> S/ {Number(promo.value || 0).toFixed(2)}</>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-[10px] md:text-xs text-zinc-500 font-medium whitespace-nowrap">
                    <Calendar size={12} className="text-zinc-400" />
                    <span>
                      {promo.start_date ? new Date(promo.start_date).toLocaleDateString() : '∞'} - {promo.end_date ? new Date(promo.end_date).toLocaleDateString() : '∞'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {promo.active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                      <CheckCircle size={10} /> Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 text-zinc-400 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                      <XCircle size={10} /> Inactivo
                    </span>
                  )}
                </TableCell>
                <TableCell align="right">
                  <div className="flex items-center justify-end gap-1 md:gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setIsViewing(true);
                        setCurrentPromo(promo);
                        setIsModalOpen(true);
                      }}
                      icon={Eye}
                      className="h-8 w-8 p-0"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(true);
                        setIsViewing(false);
                        setCurrentPromo(promo);
                        setIsModalOpen(true);
                      }}
                      icon={Edit2}
                      className="h-8 w-8 p-0"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                      onClick={() => handleDelete(promo.id)}
                      icon={Trash2}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-4 md:px-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/50">
          <div className="text-xs md:text-sm text-zinc-500 order-2 sm:order-1">
            <span className="font-medium text-zinc-900">{promotions.length}</span> de <span className="font-medium text-zinc-900">{totalPromotions}</span> promociones
          </div>
          <div className="flex gap-1 md:gap-2 order-1 sm:order-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => fetchPromotions(currentPage - 1)}
              className="text-xs px-2"
            >
              Anterior
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => fetchPromotions(page)}
                  className="w-7 h-7 md:w-8 md:h-8 p-0 text-xs"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => fetchPromotions(currentPage + 1)}
              className="text-xs px-2"
            >
              Siguiente
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsViewing(false);
        }}
        title={isViewing ? 'Detalles de la Promoción' : (isEditing ? 'Editar Promoción' : 'Nueva Promoción')}
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setIsModalOpen(false);
              setIsViewing(false);
            }}>
              {isViewing ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!isViewing && (
              <Button onClick={handleSave} loading={isSaving} icon={Save}>
                {isEditing ? 'Guardar Cambios' : 'Crear Promoción'}
              </Button>
            )}
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-6">
          <Input
            label="Nombre de la Promoción"
            required
            value={currentPromo.name}
            onChange={(e) => setCurrentPromo({ ...currentPromo, name: e.target.value })}
            placeholder="Ej: Descuento de Verano"
            variant={isViewing ? 'view' : 'default'}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <Input
              label="Código de Cupón"
              required
              value={currentPromo.code}
              onChange={(e) => setCurrentPromo({ ...currentPromo, code: e.target.value.toUpperCase() })}
              placeholder="VERANO2024"
              className="font-mono font-bold uppercase tracking-wider"
              variant={isViewing ? 'view' : 'default'}
            />
            <Select
              label="Tipo de Descuento"
              value={currentPromo.type}
              onChange={(val) => setCurrentPromo({ ...currentPromo, type: val as any })}
              options={[
                { value: 'percentage', label: 'Porcentaje (%)' },
                { value: 'fixed', label: 'Monto Fijo (S/)' }
              ]}
              variant={isViewing ? 'view' : 'default'}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <Input
              label="Valor del Descuento"
              required
              type="number"
              step="0.01"
              icon={currentPromo.type === 'percentage' ? Percent : DollarSign}
              value={currentPromo.value}
              onChange={(e) => setCurrentPromo({ ...currentPromo, value: parseFloat(e.target.value) })}
              variant={isViewing ? 'view' : 'default'}
            />
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Estado</label>
              <div className="flex items-center gap-4 h-[46px]">
                <label className={`flex items-center gap-3 ${isViewing ? 'cursor-default' : 'cursor-pointer'} group`}>
                  <input
                    type="checkbox"
                    checked={currentPromo.active === 1}
                    onChange={(e) => !isViewing && setCurrentPromo({ ...currentPromo, active: e.target.checked ? 1 : 0 })}
                    className="w-5 h-5 rounded-lg border-zinc-300 text-amber-500 focus:ring-amber-500/20 transition-all"
                    disabled={isViewing}
                  />
                  <span className="text-sm font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors">Activo</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <DatePicker
              label="Fecha Inicio"
              value={currentPromo.start_date?.split('T')[0] || ''}
              onChange={(val) => setCurrentPromo({ ...currentPromo, start_date: val })}
              variant={isViewing ? 'view' : 'default'}
            />
            <DatePicker
              label="Fecha Fin"
              value={currentPromo.end_date?.split('T')[0] || ''}
              onChange={(val) => setCurrentPromo({ ...currentPromo, end_date: val })}
              variant={isViewing ? 'view' : 'default'}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
