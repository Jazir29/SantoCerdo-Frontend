import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Package, Save, AlertTriangle, Eye, Search, Filter, X } from 'lucide-react';
import { FiltersPill } from '../components/ui/FiltersPill';
import { MobileFilterBar } from '../components/ui/MobileFilterBar';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { api } from '../services/api';
import { Product } from '../types';
import { useToast } from '../components/ui/Toast';

export default function Products() {
  const navigate = useNavigate();
  const toast = useToast();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState('all');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts(1, 9999, '');
      if (data && data.data) {
        setAllProducts(data.data);
      }
    } catch (error: any) {
      toast(error?.message || 'Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(allProducts.map(p => p.category).filter(Boolean))) as string[];
    return cats.sort();
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.description?.toLowerCase().includes(q)) return false;
      }
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterStock === 'low' && p.stock > 20) return false;
      if (filterStock === 'out' && p.stock > 0) return false;
      if (filterMinPrice !== '' && p.price < Number(filterMinPrice)) return false;
      if (filterMaxPrice !== '' && p.price > Number(filterMaxPrice)) return false;
      return true;
    });
  }, [allProducts, searchTerm, filterCategory, filterStock, filterMinPrice, filterMaxPrice]);

  const hasActiveFilters = !!(searchTerm || filterCategory || filterStock !== 'all' || filterMinPrice || filterMaxPrice);

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterStock('all');
    setFilterMinPrice('');
    setFilterMaxPrice('');
  };

  const openEditModal = (product: Product, viewOnly: boolean = false) => {
    setSelectedProduct(product);
    setEditForm(product);
    setIsViewing(viewOnly);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setEditForm({});
    setIsViewing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (selectedProduct) {
        await api.updateProduct(selectedProduct.id, editForm);
      } else {
        await api.createProduct(editForm);
      }
      await fetchProducts();
      closeModal();
      toast(selectedProduct ? 'Producto actualizado' : 'Producto creado', 'success');
    } catch (error: any) {
      toast(error?.message || 'Error al guardar producto', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (id: number) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await api.deleteProduct(productToDelete);
      await fetchProducts();
      toast('Producto eliminado', 'success');
    } catch (error: any) {
      toast(error?.message || 'Error al eliminar producto', 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Productos"
        subtitle="Catálogo de manteca y derivados"
        action={
          <Button onClick={() => navigate('/pricing')} className="flex items-center gap-1.5 text-xs md:text-sm px-4 md:px-5 py-2 md:py-2.5 w-auto">
            <Plus size={14} className="md:hidden" />
            <Plus size={20} className="hidden md:block" />
            <span>Nuevo Producto</span>
          </Button>
        }
      />

      {/* Mobile filter bar */}
      <MobileFilterBar
        hasActiveFilters={hasActiveFilters}
        onFilterClick={() => hasActiveFilters ? clearAllFilters() : setIsFilterModalOpen(true)}
      >
        <div className="flex-1">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar productos..."
            icon={Search}
            variant="ghost"
          />
        </div>
      </MobileFilterBar>

      {/* Desktop filter bar */}
      <div className="hidden md:flex items-center bg-white rounded-3xl border border-zinc-200 shadow-sm gap-2 px-3 py-1.5">
        <FiltersPill
          hasActiveFilters={hasActiveFilters}
          onClick={() => hasActiveFilters && clearAllFilters()}
        />
        <div className="w-px h-6 bg-zinc-100 shrink-0" />
        <div className="w-44 shrink-0">
          <Select
            variant="ghost"
            options={[{ value: '', label: 'Todas las categorías' }, ...categories.map(c => ({ value: c, label: c }))]}
            value={filterCategory}
            onChange={setFilterCategory}
            placeholder="Categoría"
          />
        </div>
        <div className="w-px h-6 bg-zinc-100 shrink-0" />
        <div className="w-40 shrink-0">
          <Select
            variant="ghost"
            options={[
              { value: 'all', label: 'Todo el stock' },
              { value: 'low', label: 'Stock bajo (≤20)' },
              { value: 'out', label: 'Sin stock' },
            ]}
            value={filterStock}
            onChange={setFilterStock}
          />
        </div>
        <div className="w-px h-6 bg-zinc-100 shrink-0" />
        <div className="flex items-center gap-1 shrink-0">
          <Input
            type="number"
            value={filterMinPrice}
            onChange={(e) => setFilterMinPrice(e.target.value)}
            placeholder="S/ Mín"
            variant="ghost"
            className="w-20"
          />
          <span className="text-zinc-300 text-xs shrink-0">→</span>
          <Input
            type="number"
            value={filterMaxPrice}
            onChange={(e) => setFilterMaxPrice(e.target.value)}
            placeholder="S/ Máx"
            variant="ghost"
            className="w-20"
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar productos..."
            icon={Search}
            variant="ghost"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-zinc-500">Cargando productos...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-zinc-400">No se encontraron productos</div>
        ) : filteredProducts.map((product) => (
          <div key={product.id}>
            <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
              <CardContent className="p-3 md:p-4 flex flex-col flex-1">

              {/* ── MÓVIL ── */}
              <div className="md:hidden flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <Package size={14} />
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-full text-2xs font-bold ${
                    product.stock > 20 ? 'bg-emerald-100 text-emerald-700' :
                    product.stock > 0  ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>{product.stock} und</span>
                </div>

                <h3 className="font-bold text-zinc-900 text-sm leading-tight mb-2">{product.name}</h3>

                {product.weight_grams && (
                  <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-600 text-2xs font-bold rounded-full mb-2">
                    {product.weight_grams}g por unidad
                  </span>
                )}

                <div className="flex gap-1.5 mb-3">
                  <div className="flex-1 bg-amber-50 p-1.5 rounded-lg">
                    <p className="text-3xs font-bold text-amber-400 uppercase tracking-widest mb-0.5">Venta</p>
                    <p className="text-xs font-bold text-amber-600 whitespace-nowrap">S/ {product.price}</p>
                  </div>
                  <div className="flex-1 bg-zinc-50 p-1.5 rounded-lg">
                    <p className="text-3xs font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Costo</p>
                    <p className="text-xs font-bold text-zinc-700 whitespace-nowrap">S/ {product.cost}</p>
                  </div>
                </div>

                <div className="flex-1" />

                <div className="flex gap-1.5 pt-2 border-t border-zinc-100">
                  <button onClick={() => openEditModal(product, true)}
                    className="flex-1 h-8 flex items-center justify-center bg-zinc-100 rounded-xl text-zinc-500">
                    <Eye size={13} />
                  </button>
                  <button onClick={() => openEditModal(product, false)}
                    className="flex-1 h-8 flex items-center justify-center bg-zinc-100 rounded-xl text-zinc-500">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => confirmDelete(product.id)}
                    className="flex-1 h-8 flex items-center justify-center bg-zinc-100 rounded-xl text-zinc-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* ── DESKTOP ── */}
              <div className="hidden md:block">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <Package size={24} />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-zinc-900 mb-1">{product.name}</h3>
                <p className="text-zinc-500 text-sm mb-4 line-clamp-2">{product.description}</p>
                {product.weight_grams && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full mb-4">
                    {product.weight_grams}g por unidad
                  </span>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-zinc-50 p-3 rounded-xl">
                    <p className="text-xs font-medium text-zinc-500 mb-1">Precio Venta</p>
                    <p className="text-lg font-bold text-amber-600">S/ {product.price}</p>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-xl">
                    <p className="text-xs font-medium text-zinc-500 mb-1">Costo</p>
                    <p className="text-lg font-bold text-zinc-900">S/ {product.cost}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(product, true)} icon={Eye} />
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(product, false)} icon={Edit2} />
                    <Button
                      variant="ghost" size="sm"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => confirmDelete(product.id)}
                      icon={Trash2}
                    />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    product.stock > 20 ? 'bg-emerald-100 text-emerald-700' :
                    product.stock > 0  ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {product.stock} und
                  </span>
                </div>
              </div>

              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center py-4 border-t border-zinc-100 mt-4 text-sm text-zinc-500">
        <div>Mostrando {filteredProducts.length} de {allProducts.length} productos</div>
      </div>

      {/* Product Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isViewing ? 'Detalles del Producto' : (selectedProduct ? 'Editar Producto' : 'Nuevo Producto')}
        footer={
          <>
            <Button size="sm" variant="secondary" onClick={closeModal}>
              {isViewing ? 'Cerrar' : 'Cancelar'}
            </Button>
            {isViewing && (
              <Button size="sm" onClick={() => setIsViewing(false)} icon={Edit2}>
                Editar Producto
              </Button>
            )}
            {!isViewing && (
              <Button size="sm" onClick={handleSave} loading={isSaving} icon={Save}>
                {isSaving ? 'Guardando...' : 'Guardar Producto'}
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-6">
          <Input
            label="Nombre del Producto"
            value={editForm.name || ''}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Ingresar nombre del producto"
            variant={isViewing ? 'view' : 'default'}
            size="sm"
          />
          <Textarea
            label="Descripción"
            value={editForm.description || ''}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            placeholder="Ingresar descripción"
            variant={isViewing ? 'view' : 'default'}
            size="sm"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio de Venta (S/)"
              type="number"
              value={editForm.price !== undefined ? editForm.price : 0}
              onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
              placeholder="0.00"
              min="0"
              step="0.01"
              variant={isViewing ? 'view' : 'default'}
              size="sm"
            />
            <Input
              label="Costo (S/)"
              type="number"
              value={editForm.cost !== undefined ? editForm.cost : 0}
              onChange={(e) => setEditForm({ ...editForm, cost: Number(e.target.value) })}
              placeholder="0.00"
              min="0"
              step="0.01"
              variant={isViewing ? 'view' : 'default'}
              size="sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Stock (und)"
              type="number"
              value={editForm.stock !== undefined ? editForm.stock : 0}
              onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })}
              placeholder="0"
              min="0"
              variant={isViewing ? 'view' : 'default'}
              size="sm"
            />
            <Input
              label="Gramos por Producto (g)"
              type="number"
              value={editForm.weight_grams !== undefined ? editForm.weight_grams : ''}
              onChange={(e) => setEditForm({ ...editForm, weight_grams: Number(e.target.value) })}
              placeholder="0"
              min="0"
              variant={isViewing ? 'view' : 'default'}
              size="sm"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="¿Eliminar producto?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} className="flex-1">
              Eliminar
            </Button>
          </>
        }
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <p className="text-zinc-500">
            Esta acción no se puede deshacer. El producto será eliminado permanentemente del catálogo.
          </p>
        </div>
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
            label="Categoría"
            size="sm"
            options={[{ value: '', label: 'Todas las categorías' }, ...categories.map(c => ({ value: c, label: c }))]}
            value={filterCategory}
            onChange={setFilterCategory}
          />
          <Select
            label="Estado de stock"
            size="sm"
            options={[
              { value: 'all', label: 'Todo el stock' },
              { value: 'low', label: 'Stock bajo (≤20 und)' },
              { value: 'out', label: 'Sin stock' },
            ]}
            value={filterStock}
            onChange={setFilterStock}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Precio mínimo (S/)"
              size="sm"
              type="number"
              value={filterMinPrice}
              onChange={(e) => setFilterMinPrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            <Input
              label="Precio máximo (S/)"
              size="sm"
              type="number"
              value={filterMaxPrice}
              onChange={(e) => setFilterMaxPrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
