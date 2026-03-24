export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  image_url?: string;
}

export interface Customer {
  id: number;
  type: 'natural' | 'empresa';
  document_id: string;
  name: string;
  last_name?: string;
  trade_name?: string;
  email?: string;
  phone?: string;
  created_at?: string;
  favorite_address_id?: number | null;
  // Dirección principal — viene del JOIN con customer_addresses en el backend
  primary_address?: string;
  primary_department?: string;
  primary_province?: string;
  primary_district?: string;
  primary_reference?: string;
}

export interface CustomerAddress {
  id: number;
  customer_id: number;
  name: string;
  address: string;
  reference?: string;
  department: string;
  province: string;
  district: string;
  is_favorite: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product_name?: string;
}

export interface Order {
  id: number;
  order_id?: number;
  customer_id: number;
  total_amount: number;
  status: 'pending' | 'shipped' | 'completed' | 'cancelled';
  created_at: string;
  delivery_address: string;
  delivery_department: string;
  delivery_province: string;
  delivery_district: string;
  delivery_reference?: string;
  promotion_id?: number;
  discount_amount: number;
  customer_name?: string;
  customer_last_name?: string;
  trade_name?: string;
  document_id?: string;
  phone?: string;
  email?: string;
  promotion_name?: string;
  promotion_code?: string;
  items?: OrderItem[];
}

export interface Promotion {
  id: number;
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  start_date?: string;
  end_date?: string;
  active: number;
}

export interface DashboardStats {
  revenue: number;
  discounts: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  lowStock: number;
  topProduct: { name: string; total_sold: number; total_revenue: number };
  recentOrders: Order[];
  salesData: any[];
  salesByCustomerType: { name: string; value: number }[];
  topProductsList: { name: string; value: number }[];
  orderStatusDistribution: { name: string; value: number }[];
  revenueVsCost: { date: string; revenue: number; cost: number }[];
  topCustomers: { name: string; value: number }[];
  salesByDistrict: { name: string; value: number }[];
}