import {
  Customer,
  Order,
  Product,
  Promotion,
  DashboardStats,
  CustomerAddress,
  ProductionBatch,
  User
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://santocerdo-backend-0z22.onrender.com/api';

// Wrapper que lanza el error si la respuesta no es ok
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('user');
    window.location.href = '/';
    throw new Error('Sesión expirada');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Error ${res.status}`);
  }

  return res.json();
}

// ─────────────────────────────────────────────────────────────

export const api = {
  // ── Auth ────────────────────────────────────────────────────
  login: async (credentials: { username: string; password: string }) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Credenciales invalidas');
    return data;
  },

  logout: async (): Promise<void> => {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
  },

  // ── Stats ───────────────────────────────────────────────────
  getStats: async (params: {
    range?: string;
    status?: string;
    customerType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<DashboardStats> => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch(`${API_BASE}/stats?${query}`);
  },

  // ── Products ────────────────────────────────────────────────
  getProducts: async (
    page = 1,
    limit = 10,
    search = ''
  ): Promise<{ data: Product[]; total: number; totalPages: number; page: number }> =>
    apiFetch(`${API_BASE}/products?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),

  getAllProducts: async (): Promise<Product[]> => {
    const data = await apiFetch<{ data: Product[] }>(
      `${API_BASE}/products?page=1&limit=1000`
    );
    return data.data || [];
  },

  createProduct: async (product: Partial<Product>): Promise<Product> =>
    apiFetch(`${API_BASE}/products`, { method: 'POST', body: JSON.stringify(product) }),

  updateProduct: async (id: number, product: Partial<Product>): Promise<void> =>
    apiFetch(`${API_BASE}/products/${id}`, { method: 'PUT', body: JSON.stringify(product) }),

  deleteProduct: async (id: number): Promise<void> =>
    apiFetch(`${API_BASE}/products/${id}`, { method: 'DELETE' }),

  // ── Customers ───────────────────────────────────────────────
  getCustomers: async (params: {
    page?: number;
    limit?: number;
    offset?: number;
    search?: string;
    type?: string;
    department?: string;
    province?: string;
    district?: string;
  }): Promise<{ data: Customer[]; total: number; totalPages: number; page: number }> => {
    const limit  = params.limit || 10;
    const page   = params.page || (params.offset !== undefined ? Math.floor(params.offset / limit) + 1 : 1);
    const { search, type, department, province, district } = params;
    const queryParams: any = { page, limit, search, type, department, province, district };
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(queryParams).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string>
    ).toString();
    return apiFetch(`${API_BASE}/customers?${query}`);
  },

  getAllCustomers: async (): Promise<Customer[]> => {
    const data = await apiFetch<{ data: Customer[] }>(
      `${API_BASE}/customers?page=1&limit=1000`
    );
    return data.data || [];
  },

  createCustomer: async (customer: Partial<Customer>): Promise<Customer> =>
    apiFetch(`${API_BASE}/customers`, { method: 'POST', body: JSON.stringify(customer) }),

  updateCustomer: async (id: number, customer: Partial<Customer>): Promise<void> =>
    apiFetch(`${API_BASE}/customers/${id}`, { method: 'PUT', body: JSON.stringify(customer) }),

  deleteCustomer: async (id: number): Promise<void> =>
    apiFetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' }),

  getCustomerAddresses: async (customerId: number): Promise<CustomerAddress[]> =>
    apiFetch(`${API_BASE}/customers/${customerId}/addresses`),

  addCustomerAddress: async (
    customerId: number,
    address: Partial<CustomerAddress>
  ): Promise<CustomerAddress> =>
    apiFetch(`${API_BASE}/customers/${customerId}/addresses`, {
      method: 'POST',
      body: JSON.stringify(address),
    }),

  updateCustomerAddress: async (
    customerId: number,
    addressId: number,
    address: Partial<CustomerAddress>
  ): Promise<void> =>
    apiFetch(`${API_BASE}/customers/${customerId}/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(address),
    }),

  deleteCustomerAddress: async (customerId: number, addressId: number): Promise<void> =>
    apiFetch(`${API_BASE}/customers/${customerId}/addresses/${addressId}`, {
      method: 'DELETE',
    }),

  setFavoriteAddress: async (customerId: number, addressId: number): Promise<void> =>
    apiFetch(`${API_BASE}/customers/${customerId}/favorite-address`, {
      method: 'PUT',
      body: JSON.stringify({ addressId }),
    }),

  // ── Orders ──────────────────────────────────────────────────
  getOrders: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: Order[]; total: number; totalPages: number; page: number }> => {
    const { page = 1, limit = 10, search, status, startDate, endDate } = params;
    const queryParams: any = { page, limit, search, status, startDate, endDate };
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(queryParams).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string>
    ).toString();
    return apiFetch(`${API_BASE}/orders?${query}`);
  },

  getOrderById: async (id: string): Promise<Order> =>
    apiFetch(`${API_BASE}/orders/${id}`),

  createOrder: async (order: any): Promise<{ success: boolean; orderId: number }> =>
    apiFetch(`${API_BASE}/orders`, { method: 'POST', body: JSON.stringify(order) }),

  updateOrder: async (id: number, order: any): Promise<void> =>
    apiFetch(`${API_BASE}/orders/${id}`, { method: 'PUT', body: JSON.stringify(order) }),

  updateOrderStatus: async (id: number, status: string): Promise<void> =>
    apiFetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  updateOrderPayment: async (
    id: number,
    data: { payment_status: string; payment_method?: string | null }
  ): Promise<void> =>
    apiFetch(`${API_BASE}/orders/${id}/payment`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  cancelOrder: async (id: number): Promise<void> =>
    apiFetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' }),

  // ── Promotions ──────────────────────────────────────────────
  getPromotions: async (
    page = 1,
    limit = 10,
    search = ''
  ): Promise<{ data: Promotion[]; total: number; totalPages: number; page: number }> =>
    apiFetch(
      `${API_BASE}/promotions?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
    ),

  createPromotion: async (promotion: Partial<Promotion>): Promise<Promotion> =>
    apiFetch(`${API_BASE}/promotions`, { method: 'POST', body: JSON.stringify(promotion) }),

  updatePromotion: async (id: number, promotion: Partial<Promotion>): Promise<void> =>
    apiFetch(`${API_BASE}/promotions/${id}`, { method: 'PUT', body: JSON.stringify(promotion) }),

  deletePromotion: async (id: number): Promise<void> =>
    apiFetch(`${API_BASE}/promotions/${id}`, { method: 'DELETE' }),

  validatePromotion: async (
    code: string
  ): Promise<{ valid: boolean; promotion?: Promotion; message?: string }> =>
    apiFetch(`${API_BASE}/promotions/validate/${code}`),

  // ── Production Batches ───────────────────────────────────────
  createProductWithBatch: async (data: any): Promise<Product> =>
    apiFetch(`${API_BASE}/products/batches/new-product`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createBatch: async (productId: number, data: any): Promise<any> =>
    apiFetch(`${API_BASE}/products/${productId}/batches`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProductBatches: async (productId: number): Promise<any[]> =>
    apiFetch(`${API_BASE}/products/${productId}/batches`),

  // ── Production Registry ──────────────────────────────────────
  getProductionBatches: async (
    page = 1,
    limit = 10,
    search = ''
  ): Promise<{ data: ProductionBatch[]; total: number; totalPages: number; page: number }> =>
    apiFetch(
      `${API_BASE}/batches?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
    ),

  // ── Users / Profile ─────────────────────────────────────────
updateProfile: async (data: {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<{ success: boolean; user: User; message?: string }> =>
  apiFetch(`${API_BASE}/users/${data.id}/profile`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

getUsers: async (): Promise<User[]> =>
  apiFetch(`${API_BASE}/users`),

createUser: async (data: {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
}): Promise<{ success: boolean; user: User }> =>
  apiFetch(`${API_BASE}/users`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

updateUser: async (id: number, data: {
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  password?: string;
}): Promise<{ success: boolean; user: User }> =>
  apiFetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

deleteUser: async (id: number): Promise<{ success: boolean }> =>
  apiFetch(`${API_BASE}/users/${id}`, { method: 'DELETE' }),

  // ── Stock Movements ──────────────────────────────────────────
  getStockMovements: async (params: {
    page?: number;
    limit?: number;
    productId?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: any[]; total: number; totalPages: number; page: number }> => {
    const { page = 1, limit = 20, productId, type, startDate, endDate } = params;
    const queryParams: any = { page, limit, productId, type, startDate, endDate };
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(queryParams).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string>
    ).toString();
    return apiFetch(`${API_BASE}/stock-movements?${query}`);
  },
};