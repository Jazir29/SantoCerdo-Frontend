import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Package, Save, AlertTriangle, Eye, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { api } from '../services/api';
import { Product } from '../types';

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 12;
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete confirmation states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchProducts(true);
  }, [searchTerm]);

  const fetchProducts = async (isInitial = true) => {
    if (isInitial) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentOffset = isInitial ? 0 : offset;
      const page = Math.floor(currentOffset / limit) + 1;
      const data = await api.getProducts(page, limit, searchTerm);
      
      if (data && data.data) {
        if (isInitial) {
          setProducts(data.data);
        } else {
          setProducts(prev => [...prev, ...data.data]);
        }
        setTotalProducts(data.total);
        setHasMore(data.data.length === limit);
        setOffset(currentOffset + data.data.length);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const openNewModal = () => {
    navigate('/pricing');
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
      
      await fetchProducts(true);
      closeModal();
    } catch (error) {
      console.error(error);
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
      await fetchProducts(true);
    } catch (error) {
      console.error(error);
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
          <Button onClick={openNewModal} className="flex items-center gap-1.5 text-xs md:text-sm px-4 md:px-5 py-2 md:py-2.5 w-auto">
            <Plus size={14} className="md:hidden" />
            <Plus size={20} className="hidden md:block" />
            <span>Nuevo Producto</span>
          </Button>
        }
      />

      <div className="flex items-center bg-white px-2 py-1 md:p-3 rounded-xl md:rounded-[2rem] border border-zinc-200 shadow-sm">
        <div className="relative flex-1">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar productos ..."
            icon={Search}
            className="bg-transparent border-none focus:ring-0"
            variant="ghost"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-zinc-500">Cargando productos...</div>
        ) : (products || []).map((product) => (
  <div key={product.id}>
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardContent className="p-3 md:p-6 flex flex-col flex-1">

      {/* ── MÓVIL ── */}
      <div className="md:hidden flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <Package size={14} />
          </div>
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
            product.stock > 20 ? 'bg-emerald-100 text-emerald-700' :
            product.stock > 0  ? 'bg-orange-100 text-orange-700' :
            'bg-red-100 text-red-700'
          }`}>{product.stock} und</span>
        </div>

        <h3 className="font-bold text-zinc-900 text-sm leading-tight mb-3">{product.name}</h3>

        <div className="flex gap-1.5 mb-3">
          <div className="flex-1 bg-amber-50 p-1.5 rounded-lg">
            <p className="text-[8px] font-bold text-amber-400 uppercase tracking-widest mb-0.5">Venta</p>
            <p className="text-[11px] font-bold text-amber-600 whitespace-nowrap">S/ {product.price}</p>
          </div>
          <div className="flex-1 bg-zinc-50 p-1.5 rounded-lg">
            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Costo</p>
            <p className="text-[11px] font-bold text-zinc-700 whitespace-nowrap">S/ {product.cost}</p>
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

      {hasMore && products.length > 0 && (
        <div className="flex justify-center py-8">
          <Button 
            variant="secondary" 
            onClick={() => fetchProducts(false)}
            disabled={loadingMore}
            className="px-8"
          >
            {loadingMore ? 'Cargando...' : 'Cargar más'}
          </Button>
        </div>
      )}

      {!hasMore && products.length > 0 && (
        <div className="text-center py-8 text-zinc-400 text-sm">No hay más productos para mostrar</div>
      )}

      <div className="flex justify-between items-center py-4 border-t border-zinc-100 mt-4 text-sm text-zinc-500">
        <div>Mostrando {products.length} de {totalProducts} productos</div>
      </div>

      {/* Product Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isViewing ? 'Detalles del Producto' : (selectedProduct ? 'Editar Producto' : 'Nuevo Producto')}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              {isViewing ? 'Cerrar' : 'Cancelar'}
            </Button>
            {isViewing && (
              <Button onClick={() => setIsViewing(false)} icon={Edit2}>
                Editar Producto
              </Button>
            )}
            {!isViewing && (
              <Button onClick={handleSave} loading={isSaving} icon={Save}>
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
    </div>
  );
}
