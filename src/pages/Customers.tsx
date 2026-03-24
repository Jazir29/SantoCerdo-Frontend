import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Building2, User, Edit2, Map, Trash2, Star, Phone, Save, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { api } from '../services/api';
import { Customer, CustomerAddress } from '../types';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const limit = 12;

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressEditForm, setAddressEditForm] = useState<Partial<CustomerAddress>>({});
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState<Partial<CustomerAddress>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterType, setFilterType] = useState('');

  // Opciones para los filtros de ubicación — se obtienen de customer_addresses
  const [allDepartments, setAllDepartments] = useState<string[]>([]);
  const [allProvinces, setAllProvinces] = useState<string[]>([]);
  const [allDistricts, setAllDistricts] = useState<string[]>([]);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  useEffect(() => { fetchCustomers(true); }, [searchTerm, filterDepartment, filterProvince, filterDistrict, filterType]);

  // Cargar opciones de filtro desde customer_addresses
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        // Obtenemos todos los clientes con sus direcciones para extraer opciones únicas
        const data = await api.getAllCustomers();
        const depts = Array.from(new Set<string>(
          data.map((c: any) => c.primary_department).filter(Boolean)
        )).sort();
        setAllDepartments(depts);
      } catch (e) { console.error(e); }
    };
    loadFilterOptions();
  }, []);

  useEffect(() => {
    if (!filterDepartment) { setAllProvinces([]); setFilterProvince(''); return; }
    api.getCustomers({ limit: 1000, department: filterDepartment }).then(data => {
      const provinces = Array.from(new Set<string>(
        data.data.map((c: any) => c.primary_province).filter(Boolean)
      )).sort();
      setAllProvinces(provinces);
      if (filterProvince && !provinces.includes(filterProvince)) setFilterProvince('');
    }).catch(console.error);
  }, [filterDepartment]);

  useEffect(() => {
    if (!filterProvince) { setAllDistricts([]); setFilterDistrict(''); return; }
    api.getCustomers({ limit: 1000, department: filterDepartment, province: filterProvince }).then(data => {
      const districts = Array.from(new Set<string>(
        data.data.map((c: any) => c.primary_district).filter(Boolean)
      )).sort();
      setAllDistricts(districts);
      if (filterDistrict && !districts.includes(filterDistrict)) setFilterDistrict('');
    }).catch(console.error);
  }, [filterProvince]);

  const fetchCustomers = async (isInitial = true) => {
    if (isInitial) { setLoading(true); setOffset(0); }
    else setLoadingMore(true);

    try {
      const currentOffset = isInitial ? 0 : offset;
      const data = await api.getCustomers({
        limit, offset: currentOffset, search: searchTerm,
        type: filterType, department: filterDepartment,
        province: filterProvince, district: filterDistrict
      } as any);

      if (data?.data) {
        setCustomers(isInitial ? data.data : prev => [...prev, ...data.data]);
        setTotalCustomers(data.total);
        setHasMore(data.data.length === limit);
        setOffset(currentOffset + data.data.length);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setLoadingMore(false); }
  };

  const openModal = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditForm(customer);
    setIsEditing(false);
    setIsCreating(false);
    setIsAddingAddress(false);
    setNewAddressForm({});
    setEditingAddressId(null);
    try {
      const data = await api.getCustomerAddresses(customer.id);
      setCustomerAddresses(data);
    } catch (e) { setCustomerAddresses([]); }
  };

  const openNewModal = () => {
    const newCustomer: Customer = { id: 0, type: 'natural', document_id: '', name: '', last_name: '', trade_name: '', email: '', phone: '' };
    setSelectedCustomer(newCustomer);
    setEditForm(newCustomer);
    setCustomerAddresses([]);
    setIsEditing(true);
    setIsCreating(true);
    setIsAddingAddress(false);
    setNewAddressForm({});
    setEditingAddressId(null);
  };

  const closeModal = () => {
    setSelectedCustomer(null);
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!selectedCustomer) return;
    setIsSaving(true);
    try {
      if (isCreating) {
        await api.createCustomer(editForm);
      } else {
        await api.updateCustomer(selectedCustomer.id, editForm);
      }
      await fetchCustomers(true);
      if (isCreating) {
        closeModal();
      } else {
        setSelectedCustomer({ ...selectedCustomer, ...editForm } as Customer);
        setIsEditing(false);
      }
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const handleSaveAddress = async (addressId: number) => {
    if (!selectedCustomer) return;
    setIsSavingAddress(true);
    try {
      await api.updateCustomerAddress(selectedCustomer.id, addressId, addressEditForm);
      setCustomerAddresses(await api.getCustomerAddresses(selectedCustomer.id));
      setEditingAddressId(null);
    } catch (e) { console.error(e); }
    finally { setIsSavingAddress(false); }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!selectedCustomer || !confirm('¿Eliminar esta dirección?')) return;
    try {
      await api.deleteCustomerAddress(selectedCustomer.id, addressId);
      setCustomerAddresses(await api.getCustomerAddresses(selectedCustomer.id));
      await fetchCustomers(true);
    } catch (e) { console.error(e); }
  };

  const handleCreateAddress = async () => {
    if (!selectedCustomer) return;
    setIsSavingAddress(true);
    try {
      await api.addCustomerAddress(selectedCustomer.id, newAddressForm);
      setCustomerAddresses(await api.getCustomerAddresses(selectedCustomer.id));
      await fetchCustomers(true);
      setIsAddingAddress(false);
      setNewAddressForm({});
    } catch (e) { console.error(e); }
    finally { setIsSavingAddress(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await api.deleteCustomer(id);
      await fetchCustomers(true);
    } catch (e) { console.error(e); }
  };

  const handleSetFavoriteAddress = async (addressId: number) => {
    if (!selectedCustomer) return;
    try {
      await api.setFavoriteAddress(selectedCustomer.id, addressId);
      setCustomerAddresses(await api.getCustomerAddresses(selectedCustomer.id));
      await fetchCustomers(true);
      setSelectedCustomer({ ...selectedCustomer, favorite_address_id: addressId });
    } catch (e) { console.error(e); }
  };

  const renderField = (
    label: string, field: string, colSpan = 1,
    isEditMode = isEditing, form: any = editForm,
    setForm: (v: any) => void = setEditForm,
    options?: { value: string; label: string }[], placeholder?: string
  ) => {
    if (!form) return null;
    const value = form[field] || '';
    return (
      <div className={colSpan === 2 ? 'col-span-2' : ''}>
        {options ? (
          <Select label={label} value={value} onChange={(val) => setForm({ ...form, [field]: val })}
            options={options} placeholder={placeholder} variant={isEditMode ? 'default' : 'view'} />
        ) : (
          <Input label={label} value={value} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            placeholder={placeholder || label} variant={isEditMode ? 'default' : 'view'} />
        )}
      </div>
    );
  };

  const safeCustomers = Array.isArray(customers) ? customers : [];

  return (
    <div className="space-y-8 relative">
      <PageHeader
        title="Clientes"
        subtitle="Directorio de panaderías y restaurantes"
        action={
        <Button onClick={openNewModal} className="flex items-center gap-1.5 text-xs md:text-sm px-4 md:px-5 py-2 md:py-2.5 w-auto">
          <Plus size={14} className="md:hidden" />
          <Plus size={20} className="hidden md:block" />
          <span>Nuevo Cliente</span>
        </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex items-center bg-white px-2 py-1 md:p-3 rounded-xl md:rounded-[2rem] border border-zinc-200 shadow-sm">
        
        {/* Búsqueda — siempre visible */}
        <div className="relative flex-1">
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar clientes..." icon={Search}
            className="bg-transparent border-none focus:ring-0" variant="ghost" />
        </div>

        {/* Botón filtros — solo móvil */}
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-100 text-zinc-500 text-xs font-bold"
        >
          <Filter size={13} />
          Filtros
          {(filterDepartment || filterProvince || filterDistrict || filterType) && (
            <span className="w-2 h-2 rounded-full bg-amber-500 ml-0.5" />
          )}
        </button>

        {/* Filtros desktop — ocultos en móvil */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 rounded-xl border border-zinc-100">
            <Filter size={14} className="text-zinc-400" />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Filtros Activos</span>
          </div>
          <div className="w-px h-8 bg-zinc-100" />
          <Select value={filterDepartment} onChange={setFilterDepartment} placeholder="Departamento" icon={Map}
            options={[{ value: '', label: 'Todos' }, ...(allDepartments).map(d => ({ value: d, label: d }))]}
            className="min-w-[160px]" variant="ghost" />
          <div className="w-px h-8 bg-zinc-100" />
          <Select value={filterProvince} onChange={setFilterProvince} placeholder="Provincia"
            options={[{ value: '', label: 'Todas' }, ...(allProvinces).map(p => ({ value: p, label: p }))]}
            className="min-w-[160px]" variant="ghost" />
          <div className="w-px h-8 bg-zinc-100" />
          <Select value={filterDistrict} onChange={setFilterDistrict} placeholder="Distrito"
            options={[{ value: '', label: 'Todos' }, ...(allDistricts).map(d => ({ value: d, label: d }))]}
            className="min-w-[160px]" variant="ghost" />
          <div className="w-px h-8 bg-zinc-100" />
          <Select value={filterType} onChange={setFilterType} placeholder="Tipo" icon={User}
            options={[{ value: '', label: 'Todos' }, { value: 'natural', label: 'Persona Natural' }, { value: 'empresa', label: 'Empresa' }]}
            className="min-w-[160px]" variant="ghost" />
        </div>
      </div>

      {/* Modal de filtros — solo móvil */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filtros"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="ghost" className="flex-1" onClick={() => {
              setFilterDepartment('');
              setFilterProvince('');
              setFilterDistrict('');
              setFilterType('');
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
          <Select label="Tipo de Cliente" value={filterType} onChange={setFilterType} icon={User}
            options={[{ value: '', label: 'Todos' }, { value: 'natural', label: 'Persona Natural' }, { value: 'empresa', label: 'Empresa' }]} />
          <Select label="Departamento" value={filterDepartment} onChange={setFilterDepartment} icon={Map}
            options={[{ value: '', label: 'Todos' }, ...(allDepartments).map(d => ({ value: d, label: d }))]} />
          <Select label="Provincia" value={filterProvince} onChange={setFilterProvince}
            options={[{ value: '', label: 'Todas' }, ...(allProvinces).map(p => ({ value: p, label: p }))]} />
          <Select label="Distrito" value={filterDistrict} onChange={setFilterDistrict}
            options={[{ value: '', label: 'Todos' }, ...(allDistricts).map(d => ({ value: d, label: d }))]} />
        </div>
      </Modal>

      {/* Customer Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-zinc-500">Cargando clientes...</div>
        ) : safeCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-2xl p-3 md:p-6 border border-zinc-200 shadow-sm hover:border-amber-500/30 transition-all hover:shadow-md flex flex-col">

  {/* ── MÓVIL ── */}
<div className="md:hidden flex flex-col h-full">
  <div className="flex items-center justify-between mb-2">
    <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
      {customer.type === 'empresa' ? <Building2 size={16} /> : <User size={16} />}
    </div>
    <Button variant="ghost" size="icon" onClick={() => { openModal(customer); setIsEditing(true); }}
      className="text-zinc-400 hover:text-amber-600 h-7 w-7">
      <Edit2 size={14} />
    </Button>
  </div>

  <h3 className="font-bold text-zinc-900 text-sm leading-tight mb-1">
    {customer.type === 'empresa' ? (customer.trade_name || customer.name) : `${customer.name} ${customer.last_name || ''}`}
  </h3>

  <p className="text-[10px] text-zinc-400 font-mono mb-2">
    {customer.type === 'empresa' ? 'RUC' : 'DNI'}: {customer.document_id || 'N/A'}
  </p>

  <div className="space-y-1.5 mb-3">
    <div className="flex items-center gap-1.5 text-zinc-500 text-[10px]">
      <Map size={11} className="text-zinc-400 shrink-0" />
      <span className="line-clamp-1">{customer.primary_district || 'Sin ubicación'}</span>
    </div>
    <div className="flex items-center gap-1.5 text-zinc-500 text-[10px]">
      <Phone size={11} className="text-zinc-400 shrink-0" />
      <span>{customer.phone || 'Sin teléfono'}</span>
    </div>
  </div>

  <div className="flex-1" />

  <div className="flex gap-1.5 pt-2 border-t border-zinc-100">
    <Button variant="ghost" size="sm" onClick={() => handleDelete(customer.id)}
      className="flex-1 h-8 bg-zinc-50 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50"
      icon={Trash2} />
    <Button variant="ghost" onClick={() => openModal(customer)}
      className="flex-1 h-8 bg-amber-50 rounded-xl text-amber-600 text-[10px] font-bold">
      Ver
    </Button>
  </div>
</div>

  {/* ── DESKTOP ── */}
  <div className="hidden md:block">
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-xl shrink-0">
          {customer.type === 'empresa' ? <Building2 size={24} /> : <User size={24} />}
        </div>
        <div>
          <h3 className="font-bold text-zinc-900 text-lg line-clamp-1">
            {customer.type === 'empresa' ? (customer.trade_name || customer.name) : `${customer.name} ${customer.last_name || ''}`}
          </h3>
          <p className="text-sm text-zinc-500 font-mono">
            {customer.type === 'empresa' ? 'RUC' : 'DNI'}: {customer.document_id || 'N/A'}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => { openModal(customer); setIsEditing(true); }}
        className="text-zinc-400 hover:text-amber-600"><Edit2 size={18} /></Button>
    </div>
    <div className="space-y-3">
      <div className="flex items-start gap-3 text-zinc-600 text-sm">
        <Map size={16} className="text-zinc-400 mt-0.5 shrink-0" />
        <span className="line-clamp-1">{[customer.primary_department, customer.primary_province, customer.primary_district].filter(Boolean).join(' - ') || 'Ubicación no registrada'}</span>
      </div>
      <div className="flex items-start gap-3 text-zinc-600 text-sm">
        <MapPin size={16} className="text-zinc-400 mt-0.5 shrink-0" />
        <span className="line-clamp-2">{customer.primary_address || 'Sin dirección registrada'}</span>
      </div>
      <div className="flex items-center gap-3 text-zinc-600 text-sm">
        <Phone size={16} className="text-zinc-400 shrink-0" />
        <span>{customer.phone || 'Sin teléfono'}</span>
      </div>
    </div>
    <div className="mt-6 pt-6 border-t border-zinc-200 flex justify-end gap-2">
      <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)}
        className="text-zinc-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={18} /></Button>
      <Button variant="ghost" onClick={() => openModal(customer)}
        className="text-amber-600 bg-amber-50 hover:bg-amber-100">Ver Detalle</Button>
    </div>
  </div>

</div>
        ))}
      </div>

      {hasMore && safeCustomers.length > 0 && (
        <div className="flex justify-center py-8">
          <Button variant="secondary" onClick={() => fetchCustomers(false)} disabled={loadingMore} className="px-8">
            {loadingMore ? 'Cargando...' : 'Cargar más'}
          </Button>
        </div>
      )}
      {!hasMore && safeCustomers.length > 0 && (
        <div className="text-center py-8 text-zinc-400 text-sm">No hay más clientes para mostrar</div>
      )}
      <div className="flex justify-between items-center py-4 border-t border-zinc-100 mt-4 text-sm text-zinc-500">
        <div>Mostrando {safeCustomers.length} de {totalCustomers} clientes</div>
      </div>

      {/* Customer Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={closeModal}
        title={isCreating ? 'Nuevo Cliente' : isEditing ? 'Editar Cliente' : 'Detalles del Cliente'}
        footer={
          isEditing ? (
            <>
              <Button variant="ghost" onClick={() => isCreating ? closeModal() : (setIsEditing(false), setEditForm(selectedCustomer!))}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
                <Save size={18} />
                {isSaving ? 'Guardando...' : (isCreating ? 'Crear Cliente' : 'Guardar Cambios')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={closeModal}>Cerrar</Button>
              <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                <Edit2 size={18} /> Editar Cliente
              </Button>
            </>
          )
        }
      >
        {selectedCustomer && (
          <div className="space-y-8">
            {/* Tipo */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                {(editForm.type || selectedCustomer.type) === 'empresa' ? <Building2 size={32} /> : <User size={32} />}
              </div>
              <div>
                {isCreating ? (
                  <Select value={editForm.type || 'natural'}
                    onChange={(val) => setEditForm({ ...editForm, type: val as 'natural' | 'empresa' })}
                    options={[{ value: 'natural', label: 'Persona Natural' }, { value: 'empresa', label: 'Empresa' }]}
                    className="w-[200px]" />
                ) : (
                  <p className="text-sm font-bold text-amber-600 uppercase tracking-widest">
                    {selectedCustomer.type === 'empresa' ? 'Empresa' : 'Persona Natural'}
                  </p>
                )}
              </div>
            </div>

            {/* Identificación */}
            <div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-amber-500 rounded-full" /> Identificación
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField((editForm.type || selectedCustomer.type) === 'empresa' ? 'RUC' : 'DNI', 'document_id')}
                {(editForm.type || selectedCustomer.type) === 'empresa' ? (
                  <>{renderField('Razón Social', 'name')}{renderField('Nombre Comercial', 'trade_name', 2)}</>
                ) : (
                  <>{renderField('Nombres', 'name')}{renderField('Apellidos', 'last_name', 2)}</>
                )}
              </div>
            </div>

            {/* Contacto */}
            <div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-amber-500 rounded-full" /> Contacto
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField('Número de Contacto', 'phone')}
                {renderField('Correo Electrónico', 'email')}
              </div>
            </div>

            {/* Direcciones — solo desde customer_addresses */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1 h-4 bg-amber-500 rounded-full" /> Direcciones
                </h3>
                {isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsAddingAddress(true)}
                    className="text-amber-600 bg-amber-50 hover:bg-amber-100">
                    <Plus size={14} className="mr-1" /> Nueva Dirección
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {/* Formulario nueva dirección */}
                {isAddingAddress && (
                  <Card className="border-amber-200 shadow-sm overflow-hidden">
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-bold text-zinc-900">Agregar Nueva Dirección</p>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setIsAddingAddress(false); setNewAddressForm({}); }}>Cancelar</Button>
                          <Button size="sm" onClick={handleCreateAddress} disabled={isSavingAddress}>
                            {isSavingAddress ? 'Guardando...' : 'Guardar'}
                          </Button>
                        </div>
                      </div>
                      {renderField('Nombre de la dirección', 'name', 1, true, newAddressForm, setNewAddressForm, undefined, 'Ej. Casa, Trabajo')}
                      <div className="grid grid-cols-3 gap-4">
                        {renderField('Departamento', 'department', 1, true, newAddressForm, setNewAddressForm)}
                        {renderField('Provincia', 'province', 1, true, newAddressForm, setNewAddressForm)}
                        {renderField('Distrito', 'district', 1, true, newAddressForm, setNewAddressForm)}
                      </div>
                      {renderField('Dirección', 'address', 1, true, newAddressForm, setNewAddressForm)}
                      {renderField('Referencia', 'reference', 1, true, newAddressForm, setNewAddressForm)}
                    </div>
                  </Card>
                )}

                {/* Lista de direcciones */}
                {customerAddresses.length === 0 && !isAddingAddress && (
                  <div className="text-center py-6 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-zinc-400 text-sm">
                    {isEditing ? 'Agrega una dirección con el botón de arriba.' : 'Sin direcciones registradas.'}
                  </div>
                )}

                {customerAddresses.map((addr, index) => (
                  <div key={addr.id} className="p-4 rounded-2xl border bg-zinc-50 border-zinc-100">
                    {editingAddressId === addr.id ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-bold text-zinc-900">Editar Dirección</p>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingAddressId(null)}>Cancelar</Button>
                            <Button size="sm" onClick={() => handleSaveAddress(addr.id)} disabled={isSavingAddress}>
                              {isSavingAddress ? 'Guardando...' : 'Guardar'}
                            </Button>
                          </div>
                        </div>
                        {renderField('Nombre de la dirección', 'name', 1, true, addressEditForm, setAddressEditForm, undefined, 'Ej. Casa, Trabajo')}
                        <div className="grid grid-cols-3 gap-4">
                          {renderField('Departamento', 'department', 1, true, addressEditForm, setAddressEditForm)}
                          {renderField('Provincia', 'province', 1, true, addressEditForm, setAddressEditForm)}
                          {renderField('Distrito', 'district', 1, true, addressEditForm, setAddressEditForm)}
                        </div>
                        {renderField('Dirección', 'address', 1, true, addressEditForm, setAddressEditForm)}
                        {renderField('Referencia', 'reference', 1, true, addressEditForm, setAddressEditForm)}
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <MapPin size={20} className="text-amber-500 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-zinc-900">
                              {addr.name || `Dirección ${index + 1}`}
                            </p>
                            <button
                              onClick={() => handleSetFavoriteAddress(addr.id)}
                              className={`p-1 rounded-full transition-colors ${addr.is_favorite ? 'text-amber-500 bg-amber-50' : 'text-zinc-300 hover:text-amber-400'}`}
                              title={addr.is_favorite ? 'Dirección favorita' : 'Marcar como favorita'}
                            >
                              <Star size={16} fill={addr.is_favorite ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                          <p className="text-sm text-zinc-700 font-medium">{addr.address}</p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {[addr.department, addr.province, addr.district].filter(Boolean).join(' - ')}
                          </p>
                          {addr.reference && <p className="text-xs text-zinc-500 mt-1">Ref: {addr.reference}</p>}
                        </div>
                        {isEditing && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingAddressId(addr.id); setAddressEditForm(addr); }}
                              className="text-zinc-400 hover:text-amber-600"><Edit2 size={16} /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteAddress(addr.id)}
                              className="text-zinc-400 hover:text-red-600"><Trash2 size={16} /></Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}