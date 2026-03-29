import { useState, useEffect, useRef } from 'react';
import { Plus, Search, CheckCircle, Clock, X, Save, Trash2, Eye, AlertTriangle, User, MapPin, Phone, Mail, Building2, Tag, DollarSign, Edit2, Truck, Download, Building, Package, Calendar,Filter } from 'lucide-react';
import { toPng } from 'html-to-image';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { DatePicker } from '../components/ui/DatePicker';
import { api } from '../services/api';
import { Order, Customer, Product, OrderItem, CustomerAddress } from '../types';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const limit = 10;
  
  // New Order Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  // Promotion States
  const [promotions, setPromotions] = useState<any[]>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | ''>('');
  const [appliedPromotion, setAppliedPromotion] = useState<any>(null);
  const [promoError, setPromoError] = useState('');

  // Order Details States
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  
  // Address States
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    address: '',
    reference: '',
    department: '',
    province: '',
    district: '',
    save: false,
    name: ''
  });
  
  // Delete Order States
  const [isDeleteOrderModalOpen, setIsDeleteOrderModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const shippingLabelRef = useRef<HTMLDivElement>(null);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  

  useEffect(() => {
    fetchOrders(1);
    fetchCustomers();
    fetchProducts();
    fetchPromotions();
  }, [searchTerm, filterStatus, filterStartDate, filterEndDate]);

  const fetchPromotions = async () => {
    try {
      const data = await api.getPromotions(1, 1000);
      setPromotions(Array.isArray(data.data) ? data.data.filter(p => p.active) : []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  };

  useEffect(() => {
    if (selectedCustomerId) {
      api.getCustomerAddresses(selectedCustomerId as number)
        .then(data => {
          const safeData = Array.isArray(data) ? data : [];
          setCustomerAddresses(safeData);
          
          // Only set default address if we don't have one selected yet
          // This prevents overwriting the order's address when opening the edit modal
          // We also check isEditing to be extra safe
          if (!selectedAddress && !isEditing) {
            const favAddr = safeData.find((a: any) => a.is_favorite === 1);
            if (favAddr) {
              setSelectedAddress(`addr_${favAddr.id}`);
            } else if (safeData.length > 0) {
              setSelectedAddress(`addr_${safeData[0].id}`);
            }
          }
        })
        .catch(err => {
          console.error('Error fetching addresses:', err);
          setCustomerAddresses([]);
        });
      setIsAddingNewAddress(false);
    } else {
      setCustomerAddresses([]);
      setSelectedAddress('');
      setIsAddingNewAddress(false);
    }
  }, [selectedCustomerId, customers, isEditing]);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const data = await api.getOrders({
        page,
        limit,
        search: searchTerm,
        status: filterStatus,
        startDate: filterStartDate,
        endDate: filterEndDate
      });
      setOrders(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalOrders(data.total || 0);
      setCurrentPage(data.page || 1);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await api.getAllCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await api.getAllProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const openNewOrderModal = () => {
    setIsEditing(false);
    setEditingOrderId(null);
    setSelectedCustomerId('');
    setOrderItems([{ product_id: 0, quantity: 1, price: 0 }]);
    setIsModalOpen(true);
  };

  const openEditOrderModal = async (order: Order) => {
    if (order.status === 'completed') return;
    
    // Fetch full order details to populate the form
    try {
      const data = await api.getOrderById(order.id.toString());
      
      // Set address and customer first, then set isEditing to true
      // This helps the useEffect for addresses to know we're in edit mode
      const customer = customers.find(c => c.id === data.customer_id);
      
      // We need to fetch addresses to find the correct ID if it's a secondary one
      const addrData = await api.getCustomerAddresses(data.customer_id);
      
      const matchAddr = (Array.isArray(addrData) ? addrData : []).find((a: any) => a.address === data.delivery_address);
      if (matchAddr) {
        setSelectedAddress(`addr_${matchAddr.id}`);
      } else if (addrData.length > 0) {
        setSelectedAddress(`addr_${addrData[0].id}`);
      }

      setSelectedCustomerId(data.customer_id);
      setIsEditing(true);
      setEditingOrderId(order.id);
      
      setOrderItems((data.items || []).map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      })));
      setSelectedPromotionId(data.promotion_id || '');
      if (data.promotion_id) {
        // Find promotion details from the list we already have
        const promo = promotions.find(p => p.id === data.promotion_id);
        if (promo) {
          setAppliedPromotion(promo);
        }
      }
      
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error opening edit modal:', error);
    }
  };

  const closeNewOrderModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingOrderId(null);
    setSelectedCustomerId('');
    setOrderItems([]);
    setSelectedAddress('');
    setIsAddingNewAddress(false);
    setSelectedPromotionId('');
    setAppliedPromotion(null);
    setPromoError('');
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { product_id: 0, quantity: 1, price: 0 }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: number) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-update price when product is selected
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].price = product.price;
      }
    }
    
    setOrderItems(newItems);
  };

  const calculateTotal = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (!appliedPromotion) return subtotal;

    let discount = 0;
    if (appliedPromotion.type === 'percentage') {
      discount = subtotal * (appliedPromotion.value / 100);
    } else {
      discount = appliedPromotion.value;
    }
    return Math.max(0, subtotal - discount);
  };

  const handleSaveOrder = async () => {
    if (!selectedCustomerId || orderItems.length === 0 || orderItems.some(i => !i.product_id || i.quantity <= 0)) return;
    if (isAddingNewAddress && !newAddressForm.address) return;
    
    setIsSaving(true);
    try {
      const url = isEditing ? `/api/orders/${editingOrderId}` : '/api/orders';
      const method = isEditing ? 'PUT' : 'POST';

      let delivery_address = '';
      let delivery_department = '';
      let delivery_province = '';
      let delivery_district = '';
      let delivery_reference = '';

      if (isAddingNewAddress) {
        delivery_address = newAddressForm.address;
        delivery_department = newAddressForm.department;
        delivery_province = newAddressForm.province;
        delivery_district = newAddressForm.district;
        delivery_reference = newAddressForm.reference;
      } else {
        const customer = customers.find(c => c.id === selectedCustomerId);
        
        if (selectedAddress.startsWith('addr_')) {
          const addrId = Number(selectedAddress.split('_')[1]);
          const addr = customerAddresses.find(a => a.id === addrId);
          if (addr) {
            delivery_address = addr.address;
            delivery_department = addr.department;
            delivery_province = addr.province;
            delivery_district = addr.district;
            delivery_reference = addr.reference || '';
          }
        } else {
          // Fallback for when it's just a string (e.g. from an old order being edited)
          delivery_address = selectedAddress;
          // Try to find it in customer addresses by string if possible
          const found = customerAddresses.find(a => a.address === selectedAddress);
          if (found) {
            delivery_department = found.department;
            delivery_province = found.province;
            delivery_district = found.district;
            delivery_reference = found.reference;
          }
        }
      }
      
      const orderData = {
        customer_id: selectedCustomerId,
        items: orderItems,
        delivery_address,
        delivery_department,
        delivery_province,
        delivery_district,
        delivery_reference,
        new_address_to_save: isAddingNewAddress ? newAddressForm : null,
        promotion_id: appliedPromotion?.id || null
      };

      if (isEditing && editingOrderId) {
        await api.updateOrder(editingOrderId, orderData);
      } else {
        await api.createOrder(orderData);
      }
      
      await fetchOrders(currentPage);
      await fetchProducts(); // Refresh stock
      closeNewOrderModal();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.updateOrderStatus(id, status);
      fetchOrders(currentPage);
      if (orderDetails && orderDetails.order_id === id) {
        viewOrderDetails(id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const viewOrderDetails = async (id: number) => {
    try {
      const data = await api.getOrderById(id.toString());
      setOrderDetails(data);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error viewing order details:', error);
      alert(`No se pudo cargar el detalle de la orden: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const confirmDeleteOrder = (id: number) => {
    setOrderToDelete(id);
    setIsDeleteOrderModalOpen(true);
  };

  const deleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await api.cancelOrder(orderToDelete);
      setIsDeleteOrderModalOpen(false);
      setOrderToDelete(null);
      setIsDetailsModalOpen(false);
      await fetchOrders(currentPage);
      await fetchProducts(); // Refresh stock
    } catch (error) {
      console.error(error);
    }
  };

  const downloadShippingLabel = async (order: any) => {
    if (!shippingLabelRef.current) {
      console.error('Shipping label ref not found');
      return;
    }
    
    setIsGeneratingImage(true);
    try {
      // Small delay to ensure DOM is ready and styles applied
      await new Promise(resolve => setTimeout(resolve, 300));

      const dataUrl = await toPng(shippingLabelRef.current, {
        quality: 1.0,
        pixelRatio: 3, // Higher quality
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      
      const link = document.createElement('a');
      link.download = `guia_envio_orden_${order.order_id}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsGeneratingImage(false);
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Hubo un error al generar la imagen. Por favor, intente de nuevo.');
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Órdenes"
        subtitle="Gestiona los pedidos de manteca"
        action={
          <Button onClick={openNewOrderModal} className="flex items-center gap-1.5 text-xs md:text-sm px-4 md:px-5 py-2 md:py-2.5 w-auto">
            <Plus size={14} className="md:hidden" />
            <Plus size={20} className="hidden md:block" />
            <span>Nueva Orden</span>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-zinc-100">
            {/* ── MÓVIL: barra compacta ── */}
            <div className="flex items-center gap-2 p-2 md:hidden">
              <div className="flex-1">
                <Input
                  placeholder="Buscar orden..."
                  icon={Search}
                  className="bg-transparent border-none focus:ring-0 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  variant="ghost"
                />
              </div>
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-50 rounded-lg border border-zinc-100 text-zinc-500 text-[10px] font-bold shrink-0"
              >
                <Filter size={11} />
                Filtros
                {(filterStatus !== 'all' || filterStartDate || filterEndDate) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
              </button>
            </div>

            {/* ── DESKTOP: filtros completos ── */}
            <div className="hidden md:block p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-0">
                  <Input
                    label="Buscar"
                    placeholder="Buscar orden..."
                    icon={Search}
                    className="w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-48">
                  <Select
                    label="Estado"
                    value={filterStatus}
                    onChange={setFilterStatus}
                    options={[
                      { value: 'all', label: 'Todos los estados' },
                      { value: 'pending', label: 'Pendiente' },
                      { value: 'shipped', label: 'Enviado' },
                      { value: 'completed', label: 'Completado' },
                      { value: 'cancelled', label: 'Cancelada' }
                    ]}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="w-44">
                    <DatePicker label="Desde" value={filterStartDate} onChange={setFilterStartDate}/>
                  </div>
                  <div className="w-44">
                    <DatePicker label="Hasta" value={filterEndDate} onChange={setFilterEndDate}/>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterStartDate(''); setFilterEndDate(''); }}
                  className="text-zinc-400 hover:text-zinc-600 h-[38px]">
                  Limpiar
                </Button>
              </div>
            </div>
          </div>

        {/* Mobile Card List */}
        <div className="md:hidden divide-y divide-zinc-100">
          {loading ? (
            <div className="p-8 text-center text-zinc-500 text-sm">Cargando órdenes...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">No se encontraron órdenes</div>
          ) : orders.map((order) => (
            <div
  key={order.id}
  className="px-4 py-4 active:bg-zinc-50 transition-colors border-b-4 border-zinc-50 last:border-b-0"
  onClick={() => viewOrderDetails(order.id)}
>
  {/* Fila 1: ID + fecha + estado */}
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-mono font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-lg">
        #{(order.id || '').toString().padStart(4, '0')}
      </span>
      <span className="text-[11px] text-zinc-400 flex items-center gap-1">
        <Calendar size={10} /> {new Date(order.created_at).toLocaleDateString()}
      </span>
    </div>
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
      order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
      order.status === 'shipped' ? 'bg-blue-50 text-blue-600' :
      order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
      'bg-amber-50 text-amber-600'
    }`}>
      {order.status === 'completed' ? 'Completado' :
       order.status === 'shipped' ? 'Enviado' :
       order.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
    </span>
  </div>

  {/* Fila 2: nombre */}
  <h4 className="font-bold text-zinc-900 text-base mb-2.5">
    {order.customer_name} {order.customer_last_name}
  </h4>

  {/* Fila 3: total + descuento + botones */}
  <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <span className="text-base font-bold text-zinc-900 whitespace-nowrap">
        S/ {Number(order.total_amount).toFixed(2)}
      </span>
      {order.promotion_name && (
        <span 
          className="h-6 w-6 flex items-center justify-center bg-amber-50 border border-amber-100 rounded-full text-amber-500"
          title={order.promotion_name}
        >
          <Tag size={10} />
        </span>
      )}
    </div>
    <div className="flex items-center gap-1 shrink-0">
<button onClick={(e) => { e.stopPropagation(); viewOrderDetails(order.id); }}
  className="h-8 w-8 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 active:bg-zinc-200">
  <Eye size={14} />
</button>
{order.status === 'pending' && (
  <button onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'shipped'); }}
    className="h-8 w-8 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 active:bg-zinc-200">
    <Truck size={14} />
  </button>
)}
{order.status === 'shipped' && (
  <button onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'completed'); }}
    className="h-8 w-8 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 active:bg-zinc-200">
    <CheckCircle size={14} />
  </button>
)}
{order.status !== 'cancelled' && (
  <button onClick={(e) => { e.stopPropagation(); confirmDeleteOrder(order.id); }}
    className="h-8 w-8 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 active:bg-zinc-200">
    <Trash2 size={14} />
  </button>
)}
    </div>
  </div>
</div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <Table 
            headers={['ID', 'Cliente', 'Fecha', 'Total', 'Descuento', 'Estado', 'Acciones']}
            loading={loading}
            emptyMessage="No se encontraron órdenes"
          >
            {(orders || []).map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-[10px] md:text-xs text-zinc-500">#{(order.id || '').toString().padStart(4, '0')}</TableCell>
                <TableCell className="font-bold text-zinc-900 text-xs md:text-sm whitespace-nowrap">{order.customer_name} {order.customer_last_name}</TableCell>
                <TableCell className="text-zinc-500 text-xs md:text-sm whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="font-bold text-zinc-900 text-xs md:text-sm whitespace-nowrap">S/ {order.total_amount.toLocaleString()}</TableCell>
                <TableCell>
                  {order.promotion_name ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-wider text-amber-600 whitespace-nowrap">
                      <Tag size={10} />
                      {order.promotion_name}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                      No aplicado
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
                    order.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-600'
                      : order.status === 'shipped'
                      ? 'bg-blue-50 text-blue-600'
                      : order.status === 'cancelled'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-yellow-50 text-yellow-600'
                  }`}>
                    {order.status === 'completed' ? <><CheckCircle size={11} /> Completado</> :
                    order.status === 'shipped'   ? <><Truck size={11} /> Enviado</> :
                    order.status === 'cancelled' ? <><X size={11} /> Cancelada</> :
                    <><Clock size={11} /> Pendiente</>}
                  </span>
                </TableCell>
                <TableCell align="right">
                  <div className="flex justify-end gap-1 md:gap-2">
                    {order.status === 'pending' && (
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => updateStatus(order.id, 'shipped')}
                        icon={Truck}
                        className="h-9 w-9 !p-0 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100"
                        title="Marcar como enviado"
                      />
                    )}
                    {order.status === 'shipped' && (
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => updateStatus(order.id, 'completed')}
                        icon={CheckCircle}
                        className="h-9 w-9 !p-0 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        title="Marcar como completado"
                      />
                    )}
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => viewOrderDetails(order.id)}
                      icon={Eye}
                      className="h-9 w-9 !p-0 text-zinc-400 hover:text-blue-600 hover:bg-blue-50"
                      title="Ver detalle"
                    />
                    {order.status !== 'cancelled' && (
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDeleteOrder(order.id)}
                        icon={Trash2}
                        className="h-9 w-9 !p-0 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                        title="Cancelar orden"
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </div>

        {/* Pagination */}
        <div className="px-4 md:px-6 py-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between bg-zinc-50/50 gap-4">
          <div className="text-xs md:text-sm text-zinc-500">
            Mostrando <span className="font-medium text-zinc-900">{orders.length}</span> de <span className="font-medium text-zinc-900">{totalOrders}</span> órdenes
          </div>
          <div className="flex gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => fetchOrders(currentPage - 1)}
              className="px-2 md:px-3"
            >
              Anterior
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => fetchOrders(page)}
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
              onClick={() => fetchOrders(currentPage + 1)}
              className="px-2 md:px-3"
            >
              Siguiente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

      {/* New Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeNewOrderModal}
        title={isEditing ? 'Editar Orden' : 'Nueva Orden'}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={closeNewOrderModal}
              size="sm"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveOrder}
              disabled={isSaving || !selectedCustomerId || orderItems.length === 0 || orderItems.some(i => !i.product_id || i.quantity <= 0)}
              loading={isSaving}
              icon={Save}
            >
              {isEditing ? 'Guardar Cambios' : 'Crear Orden'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Customer Selection */}
          <div>
            <Select
              label="Cliente"
              size="sm"
              value={selectedCustomerId}
              onChange={(val) => {
                setSelectedCustomerId(Number(val));
                setSelectedAddress(''); // Clear address so useEffect can set the default for the new customer
                setIsAddingNewAddress(false);
              }}
              options={[
                { value: '', label: 'Selecciona un cliente...' },
                ...(customers || []).map(c => ({
                  value: c.id,
                  label: `${c.name || ''} ${c.last_name || ''} ${c.trade_name ? `(${c.trade_name})` : ''}`.trim().replace(/\s+/g, ' '),
                  subLabel: c.document_id ? `DNI/RUC: ${c.document_id}` : undefined
                }))
              ]}
              icon={User}
            />
            
            {selectedCustomerId && (
              <div className="mt-4">
                <Select
                  label="Dirección de Entrega"
                  size="sm"
                  value={isAddingNewAddress ? 'new' : selectedAddress}
                  onChange={(val) => {
                    if (val === 'new') {
                      setIsAddingNewAddress(true);
                      setSelectedAddress('');
                    } else {
                      setIsAddingNewAddress(false);
                      setSelectedAddress(val);
                    }
                  }}
                  options={[
                    { value: '', label: 'Selecciona una dirección...' },
                    ...(customerAddresses || []).map(addr => ({
                      value: `addr_${addr.id}`,
                      label: `${addr.name ? `${addr.name} - ` : ''}${addr.address}${addr.district ? ` - ${addr.district}` : ''}${addr.is_favorite ? ' ⭐' : ''}`
                    })),
                    { value: 'new', label: '➕ Agregar nueva dirección' }
                  ]}
                />

                {isAddingNewAddress && (
                  <div className="mt-3 p-3 md:p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3 md:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="Departamento"
                        value={newAddressForm.department}
                        onChange={(e) => setNewAddressForm({...newAddressForm, department: e.target.value})}
                      />
                      <Input
                        label="Provincia"
                        value={newAddressForm.province}
                        onChange={(e) => setNewAddressForm({...newAddressForm, province: e.target.value})}
                      />
                      <Input
                        label="Distrito"
                        value={newAddressForm.district}
                        onChange={(e) => setNewAddressForm({...newAddressForm, district: e.target.value})}
                      />
                    </div>

                    <Input
                      label="Dirección *"
                      value={newAddressForm.address}
                      onChange={(e) => setNewAddressForm({...newAddressForm, address: e.target.value})}
                      placeholder="Ej. Av. Los Pinos 123"
                    />
                    
                    <Input
                      label="Referencia"
                      value={newAddressForm.reference}
                      onChange={(e) => setNewAddressForm({...newAddressForm, reference: e.target.value})}
                    />

                    <div className="pt-2 border-t border-zinc-200">
                      <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={newAddressForm.save}
                          onChange={(e) => setNewAddressForm({...newAddressForm, save: e.target.checked})}
                          className="w-4 h-4 text-amber-500 focus:ring-amber-500 rounded"
                        />
                        Guardar esta dirección para el cliente
                      </label>
                      
                      {newAddressForm.save && (
                        <div className="mt-3">
                          <Input
                            label="Nombre de la dirección (Opcional)"
                            value={newAddressForm.name}
                            onChange={(e) => setNewAddressForm({...newAddressForm, name: e.target.value})}
                            placeholder="Ej. Casa, Trabajo, Sucursal Norte"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                Productos
              </label>
              <Button 
                variant="ghost"
                size="sm"
                onClick={addOrderItem}
                icon={Plus}
                className="text-amber-600 hover:text-amber-700 bg-amber-50"
              >
                Agregar Producto
              </Button>
            </div>

            <div className="space-y-3">
              {(orderItems || []).map((item, index) => (
            <div key={index} className="flex flex-col gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-100 md:flex-row md:items-end md:bg-transparent md:p-0 md:border-0 md:gap-3">
              
              {/* Select — fila completa en móvil */}
              <div className="w-full md:flex-1 md:min-w-0">
                <Select
                  value={item.product_id || ''}
                  size="sm"
                  onChange={(val) => updateOrderItem(index, 'product_id', Number(val))}
                  options={[
                    { value: '', label: 'Selecciona un producto...' },
                    ...(products || []).map(p => ({
                      value: p.id,
                      label: `${p.name} - S/ ${p.price} (Stock: ${p.stock})`,
                      disabled: p.stock <= 0
                    }))
                  ]}
                />
              </div>

              {/* Cant + Precio + Eliminar — misma fila en móvil */}
              <div className="flex gap-2 items-end">
                <div className="w-20 shrink-0">
                  <Input
                    type="number"
                    min="1"
                    label="Cant."
                    size="sm"
                    value={item.quantity || ''}
                    onChange={(e) => updateOrderItem(index, 'quantity', Number(e.target.value))}
                  />
                </div>
                <div className="flex-1 md:w-28 md:flex-none shrink-0">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    label="Precio"
                    size="sm"
                    value={item.price || ''}
                    readOnly
                    icon={DollarSign}
                    className="bg-white md:bg-zinc-50"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOrderItem(index)}
                  icon={Trash2}
                  className="h-[42px] w-[42px] p-0 shrink-0 text-zinc-400 hover:text-red-500 hover:bg-red-50"
                />
              </div>
            </div>
          ))}
              
              {orderItems.length === 0 && (
                <div className="text-center py-8 bg-zinc-50 rounded-xl border border-dashed border-zinc-200 text-zinc-500 text-sm">
                  No hay productos en la orden. Haz clic en "Agregar Producto".
                </div>
              )}
            </div>
          </div>

          {/* Promotions */}
          <div className="pt-4 border-t border-zinc-100">
            <Select
              label="Promoción / Descuento (Opcional)"
              size="sm"
              value={selectedPromotionId}
              onChange={(val) => {
                const id = val === '' ? '' : Number(val);
                setSelectedPromotionId(id);
                if (id === '') {
                  setAppliedPromotion(null);
                } else {
                  const promo = promotions.find(p => p.id === id);
                  setAppliedPromotion(promo);
                }
              }}
              options={[
                { value: '', label: 'Sin promoción' },
                ...(promotions || []).map(p => ({
                  value: p.id,
                  label: `${p.name} (${p.type === 'percentage' ? `${p.value}%` : `S/ ${p.value}`})`
                }))
              ]}
              icon={Tag}
            />
            {appliedPromotion && (
              <p className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle size={12} /> 
                {appliedPromotion.name} aplicado: {appliedPromotion.type === 'percentage' ? `${appliedPromotion.value}%` : `S/ ${(appliedPromotion.value || 0).toFixed(2)}`} de descuento
              </p>
            )}
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-zinc-100 space-y-2">
            {appliedPromotion && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Subtotal:</span>
                <span className="font-bold text-zinc-900">S/ {(orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0).toFixed(2)}</span>
              </div>
            )}
            {appliedPromotion && (
              <div className="flex justify-between items-center text-sm text-emerald-600">
                <span>Descuento ({appliedPromotion.name}):</span>
                <span className="font-bold">
                  - S/ {((orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) - calculateTotal()) || 0).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-medium text-zinc-500">Total de la Orden:</span>
              <span className="text-2xl font-bold text-zinc-900">S/ {(calculateTotal() || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Order Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={
          <div className="flex items-center justify-between w-full pr-8">
            <span className="whitespace-nowrap">Detalle de Orden</span>
            <div className="flex gap-2">
              {orderDetails && (orderDetails.status === 'pending' || orderDetails.status === 'shipped') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadShippingLabel(orderDetails)}
                  icon={Download}
                  loading={isGeneratingImage}
                  className="text-amber-600 hover:bg-amber-50"
                  title="Descargar guía de envío"
                />
              )}
              {orderDetails && orderDetails.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateStatus(orderDetails.order_id, 'shipped')}
                  icon={Truck}
                  className="text-blue-600 hover:bg-blue-50"
                  title="Marcar como enviado"
                />
              )}
              {orderDetails && orderDetails.status === 'shipped' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateStatus(orderDetails.order_id, 'completed')}
                  icon={CheckCircle}
                  className="text-emerald-600 hover:bg-emerald-50"
                  title="Marcar como completado"
                />
              )}
            </div>
          </div>
        }
        footer={
  <div className="flex items-center justify-between w-full gap-2">
    {/* Izquierda: acciones secundarias */}
    <div className="flex items-center gap-1.5">
      {orderDetails && (orderDetails.status === 'pending' || orderDetails.status === 'shipped') && (
        <Button variant="ghost" size="sm" onClick={() => downloadShippingLabel(orderDetails)}
          icon={Download} loading={isGeneratingImage}
          className="text-zinc-500 hover:bg-zinc-100 text-xs px-3">
          {isGeneratingImage ? 'Generando...' : 'Guía'}
        </Button>
      )}
      {orderDetails && orderDetails.status === 'pending' && (
        <Button variant="ghost" size="sm"
          onClick={() => { const order = orders.find(o => o.id === orderDetails.order_id); if (order) { setIsDetailsModalOpen(false); openEditOrderModal(order); } }}
          icon={Edit2} className="text-zinc-500 hover:bg-zinc-100 text-xs px-3">
          Editar
        </Button>
      )}
    </div>

    {/* Derecha: cerrar + acción principal */}
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => setIsDetailsModalOpen(false)}
        className="text-xs px-3">
        Cerrar
      </Button>
      {orderDetails && orderDetails.status === 'pending' && (
        <Button size="sm" onClick={() => updateStatus(orderDetails.order_id, 'shipped')}
          icon={Truck} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-4">
          Enviar
        </Button>
      )}
      {orderDetails && orderDetails.status === 'shipped' && (
        <Button size="sm" onClick={() => updateStatus(orderDetails.order_id, 'completed')}
          icon={CheckCircle} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-4">
          Completar
        </Button>
      )}
    </div>
  </div>
}
      >
          {orderDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                
                {/* Columna izquierda */}
                <div className="space-y-3">
                  <div>
                    <Input
                      label="Cliente"
                      variant="view" icon={User} size="sm"
                      value={orderDetails.type === 'empresa' ? orderDetails.trade_name || orderDetails.customer_name : `${orderDetails.customer_name} ${orderDetails.last_name || ''}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div>
                      <Input label="Teléfono" variant="view" icon={Phone} size="sm" value={orderDetails.phone || 'No registrado'} />
                    </div>
                    <div>
                      <Input label="Correo" variant="view" icon={Mail} size="sm" value={orderDetails.email || 'No registrado'} />
                    </div>
                  </div>
                  <div>
                    <Input
                      label="Dirección de Entrega"
                      variant="view" icon={MapPin} size="sm"
                      value={orderDetails.delivery_address || 'Sin dirección'}
                    />
                    {orderDetails.delivery_reference && (
                      <p className="text-xs text-zinc-500 mt-1 ml-8 italic">Ref: {orderDetails.delivery_reference}</p>
                    )}
                  </div>
                </div>

                {/* Columna derecha */}
                <div className="space-y-3">
                  <div>
                    <Input label= "Fecha de Creacion" variant="view" icon={Clock} size="sm" 
                      value={`${new Date(orderDetails.created_at).toLocaleDateString()} ${new Date(orderDetails.created_at).toLocaleTimeString()}`}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 ml-1">Estado</p>
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold ${
                        orderDetails.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        orderDetails.status === 'shipped'   ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        orderDetails.status === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-100' :
                        'bg-yellow-50 text-yellow-700 border border-yellow-100'
                      }`}>
                        {orderDetails.status === 'completed' ? <><CheckCircle size={11} /> Completado</> :
                        orderDetails.status === 'shipped'   ? <><Truck size={11} /> Enviado</> :
                        orderDetails.status === 'cancelled' ? <><X size={11} /> Cancelada</> :
                        <><Clock size={11} /> Pendiente</>}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            {/* Desktop table */}
            <div className="hidden md:block border border-zinc-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="p-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Producto</th>
                    <th className="p-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Cant.</th>
                    <th className="p-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Precio</th>
                    <th className="p-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {(orderDetails.items || []).map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="p-4"><p className="font-bold text-zinc-900">{item.product_name}</p></td>
                      <td className="p-4 text-center font-medium text-zinc-600">{item.quantity}</td>
                      <td className="p-4 text-right font-medium text-zinc-600">S/ {Number(item.price || 0).toFixed(2)}</td>
                      <td className="p-4 text-right font-bold text-zinc-900">S/ {(Number(item.quantity * item.price) || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-zinc-50/50">
                  {orderDetails.discount_amount > 0 && (
                    <>
                      <tr>
                        <td colSpan={3} className="p-4 text-right text-sm text-zinc-500">Subtotal:</td>
                        <td className="p-4 text-right text-sm font-medium text-zinc-900">S/ {(Number(orderDetails.total_amount + orderDetails.discount_amount) || 0).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="p-4 text-right text-sm text-emerald-600">Descuento {orderDetails.promotion_name ? `(${orderDetails.promotion_name})` : ''}:</td>
                        <td className="p-4 text-right text-sm font-bold text-emerald-600">- S/ {Number(orderDetails.discount_amount || 0).toFixed(2)}</td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <td colSpan={3} className="p-4 text-right font-bold text-zinc-900">Total:</td>
                    <td className="p-4 text-right font-bold text-amber-600 text-lg">S/ {Number(orderDetails.total_amount || 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile — cards por producto */}
            <div className="md:hidden border border-zinc-100 rounded-2xl overflow-hidden divide-y divide-zinc-100">
              {(orderDetails.items || []).map((item: any, idx: number) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-900 text-sm leading-tight">{item.product_name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">S/ {Number(item.price || 0).toFixed(2)} × {item.quantity}</p>
                  </div>
                  <p className="font-bold text-zinc-900 text-sm shrink-0">
                    S/ {(Number(item.quantity * item.price) || 0).toFixed(2)}
                  </p>
                </div>
              ))}

              {/* Totales mobile */}
              <div className="p-4 bg-zinc-50/50 space-y-2">
                {orderDetails.discount_amount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Subtotal</span>
                      <span className="font-medium text-zinc-900">S/ {(Number(orderDetails.total_amount + orderDetails.discount_amount) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Descuento</span>
                      <span className="font-bold">- S/ {Number(orderDetails.discount_amount || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
                  <span className="font-bold text-zinc-900">Total</span>
                  <span className="font-bold text-amber-600 text-lg">S/ {Number(orderDetails.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOrderModalOpen}
        onClose={() => {
          setIsDeleteOrderModalOpen(false);
          setOrderToDelete(null);
        }}
        title="¿Cancelar orden?"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => {
                setIsDeleteOrderModalOpen(false);
                setOrderToDelete(null);
              }}
              className="flex-1"
            >
              No, mantener
            </Button>
            <Button
              variant="danger"
              onClick={deleteOrder}
              className="flex-1"
            >
              Sí, cancelar
            </Button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} />
          </div>
          <p className="text-zinc-500">
            Esta orden pasará al estado <strong>Cancelada</strong> y los productos serán devueltos al inventario.
          </p>
        </div>
      </Modal>

      {/* Hidden Shipping Label Template for Image Generation */}
      <div 
        className="fixed top-0 left-0 -z-50 pointer-events-none opacity-0"
        style={{ width: '600px', overflow: 'hidden' }}
        aria-hidden="true"
      >
        <div 
          ref={shippingLabelRef}
          className="w-[600px] bg-white p-10 font-sans"
          style={{ position: 'relative', display: 'block', color: '#18181b' }}
        >
          {/* Header */}
          <div 
            className="-m-10 p-10 mb-10 flex justify-between items-center"
            style={{ backgroundColor: '#fbbf24' }}
          >
            <h1 className="text-4xl font-black tracking-tighter">SANTO CERDO</h1>
            <span className="text-sm font-black uppercase tracking-widest opacity-60">Guía de Envío</span>
          </div>

          {orderDetails && (
            <div className="space-y-10">
              <div 
                className="flex justify-between items-end border-b pb-6"
                style={{ borderColor: '#f4f4f5' }}
              >
                <div>
                  <p 
                    className="text-[10px] font-black uppercase tracking-widest mb-1"
                    style={{ color: '#a1a1aa' }}
                  >
                    Número de Orden
                  </p>
                  <p className="text-2xl font-bold">#{(orderDetails.order_id || '').toString().padStart(4, '0')}</p>
                </div>
                <div className="text-right">
                  <p 
                    className="text-[10px] font-black uppercase tracking-widest mb-1"
                    style={{ color: '#a1a1aa' }}
                  >
                    Fecha de Emisión
                  </p>
                  <p className="text-lg font-medium">{new Date(orderDetails.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <section>
                  <h2 
                    className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2"
                    style={{ color: '#f59e0b' }}
                  >
                    <User size={12} /> Información del Cliente
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <p 
                        className="text-[10px] font-bold uppercase"
                        style={{ color: '#a1a1aa' }}
                      >
                        Nombre / Razón Social
                      </p>
                      <p className="text-xl font-bold">
                        {orderDetails.type === 'empresa' 
                          ? (orderDetails.trade_name || orderDetails.customer_name)
                          : `${orderDetails.customer_name} ${orderDetails.last_name || ''}`}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p 
                          className="text-[10px] font-bold uppercase"
                          style={{ color: '#a1a1aa' }}
                        >
                          {orderDetails.type === 'empresa' ? 'RUC' : 'DNI'}
                        </p>
                        <p className="font-bold">{orderDetails.document_id || 'N/A'}</p>
                      </div>
                      <div>
                        <p 
                          className="text-[10px] font-bold uppercase"
                          style={{ color: '#a1a1aa' }}
                        >
                          Celular
                        </p>
                        <p className="font-bold">{orderDetails.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 
                    className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2"
                    style={{ color: '#f59e0b' }}
                  >
                    <MapPin size={12} /> Detalles de Envío
                  </h2>
                                   <div className="grid grid-cols-3 gap-6">
                      <div>
                        <p 
                          className="text-[10px] font-bold uppercase"
                          style={{ color: '#a1a1aa' }}
                        >
                          Departamento
                        </p>
                        <p className="font-bold">{orderDetails.delivery_department || 'N/A'}</p>
                      </div>
                      <div>
                        <p 
                          className="text-[10px] font-bold uppercase"
                          style={{ color: '#a1a1aa' }}
                        >
                          Provincia
                        </p>
                        <p className="font-bold">{orderDetails.delivery_province || 'N/A'}</p>
                      </div>
                      <div>
                        <p 
                          className="text-[10px] font-bold uppercase"
                          style={{ color: '#a1a1aa' }}
                        >
                          Distrito
                        </p>
                        <p className="font-bold">{orderDetails.delivery_district || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <p 
                        className="text-[10px] font-bold uppercase"
                        style={{ color: '#a1a1aa' }}
                      >
                        Dirección Exacta
                      </p>
                      <p className="text-lg font-bold leading-tight">{orderDetails.delivery_address || 'Sin dirección'}</p>
                    </div>
                    <div>
                      <p 
                        className="text-[10px] font-bold uppercase"
                        style={{ color: '#a1a1aa' }}
                      >
                        Referencia
                      </p>
                      <p 
                        className="italic"
                        style={{ color: '#52525b' }}
                      >
                        {orderDetails.delivery_reference || 'Sin referencia'}
                      </p>
                    </div>
                  </section>
  
                  <section className="pt-6 border-t" style={{ borderColor: '#f4f4f5' }}>
                    <h2 
                      className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2"
                      style={{ color: '#f59e0b' }}
                    >
                      <Package size={12} /> Productos
                    </h2>
                    <div className="space-y-2">
                      {orderDetails.items?.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center border-b border-dashed pb-1" style={{ borderColor: '#e4e4e7' }}>
                          <p className="font-bold text-sm">{item.product_name}</p>
                          <p className="font-black text-lg">x {item.quantity}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

              <div 
                className="pt-10 border-t text-center"
                style={{ borderColor: '#f4f4f5' }}
              >
                <p 
                  className="text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{ color: '#d4d4d8' }}
                >
                  Santo Cerdo - Manteca Artesanal 100% Pura
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
    {/* Modal filtros — solo móvil */}
    <Modal
      isOpen={isFilterModalOpen}
      onClose={() => setIsFilterModalOpen(false)}
      title="Filtros"
      footer={
        <div className="flex gap-3 w-full">
          <Button variant="ghost" className="flex-1" onClick={() => {
            setFilterStatus('all');
            setFilterStartDate('');
            setFilterEndDate('');
          }}>
            Limpiar
          </Button>
          <Button className="flex-1" onClick={() => setIsFilterModalOpen(false)}>
            Aplicar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label="Estado"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: 'all', label: 'Todos los estados' },
            { value: 'pending', label: 'Pendiente' },
            { value: 'shipped', label: 'Enviado' },
            { value: 'completed', label: 'Completado' },
            { value: 'cancelled', label: 'Cancelada' }
          ]}
        />
        <DatePicker label="Desde" value={filterStartDate} onChange={setFilterStartDate} />
        <DatePicker label="Hasta" value={filterEndDate} onChange={setFilterEndDate} />
      </div>
    </Modal>
    </div>
  );
}
