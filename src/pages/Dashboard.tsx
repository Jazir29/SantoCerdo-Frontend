import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, ComposedChart, Line } from 'recharts';
import { DollarSign, ShoppingCart, Users, TrendingUp, AlertTriangle, Award, Package, PieChart as PieChartIcon, BarChart3, Wallet, MapPin, Star, ArrowUpRight, ArrowDownRight, Activity, Calendar, Filter, ChevronDown, Tag, X,CheckCircle, Truck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { PageHeader } from '../components/ui/PageHeader';
import { api } from '../services/api';
import { DashboardStats } from '../types';

const COLORS_CUSTOMER_TYPE = ['#18181b', '#f59e0b']; // zinc-900, amber-500
const COLORS_ORDER_STATUS = ['#10b981', '#eab308']; // emerald-500, yellow-500
const COLORS_DISTRICTS = ['#18181b', '#27272a', '#3f3f46', '#52525b', '#71717a']; // zinc shades

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 text-white p-4 rounded-xl shadow-2xl border border-zinc-800 backdrop-blur-md bg-opacity-90">
        <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
          let name = entry.name;
          if (name === 'amount' || name === 'revenue') name = 'Ingresos';
          if (name === 'orderCount') name = 'Órdenes';
          if (name === 'cost') name = 'Costos';
          
          const isCurrency = ['amount', 'revenue', 'cost'].includes(entry.name);
          
          return (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs font-medium text-zinc-300">{name}</span>
              </div>
              <span className="text-xs font-bold">
                {isCurrency ? `S/ ${entry.value.toLocaleString()}` : entry.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    range: '30days',
    status: 'all',
    customerType: 'all',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    setLoading(true);
    api.getStats(filters)
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching stats:', err);
        setLoading(false);
      });
  }, [filters]);

  if (loading && !stats) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        <p className="text-zinc-500 text-xs uppercase tracking-widest">Sincronizando Datos...</p>
      </div>
    </div>
  );

  if (!stats) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <AlertTriangle size={48} className="text-amber-500" />
        <p className="text-zinc-500 text-xs uppercase tracking-widest">No se pudieron cargar las estadísticas.</p>
        <button 
          onClick={() => setFilters({ ...filters })}
          className="text-xs font-black text-zinc-900 uppercase tracking-widest border-b-2 border-orange-500 pb-1"
        >
          Reintentar
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12 relative">
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[2px] flex items-start justify-center pt-40 pointer-events-none"
          >
            <div className="bg-zinc-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest">Actualizando Métricas...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-orange-500">
            <Activity size={10} strokeWidth={3} />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]">Sistema de Control v2.4</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-zinc-900 tracking-tight">Panel de Control</h1>
          <p className="text-zinc-500 text-[10px] md:text-sm font-medium max-w-2xl">
            Métricas operativas y financieras en tiempo real para la gestión de producción artesanal.
          </p>
        </div>
        <div className="flex flex-row items-center gap-3 md:gap-6">
          <div className="text-left hidden sm:block">
            <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Última Actualización</p>
            <p className="text-xs md:text-sm font-bold text-zinc-800">13 MAR 2026 — 15:36</p>
          </div>
          <button className="flex-1 sm:flex-none bg-zinc-900 text-white px-5 md:px-8 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg border border-zinc-700">
            Exportar Reporte
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-white p-2 md:p-3 rounded-2xl md:rounded-[2rem] border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-100 shrink-0">
          <Filter size={12} className="text-zinc-400" />
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Filtros</span>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 md:gap-3 flex-1">
          <Select 
            icon={Calendar}
            options={[
              { value: '7days', label: 'Últimos 7 días' },
              { value: '30days', label: 'Últimos 30 días' },
              { value: '90days', label: 'Últimos 90 días' },
              { value: 'thisMonth', label: 'Este Mes' },
              { value: 'thisYear', label: 'Este Año' },
              { value: 'custom', label: 'Personalizado' }
            ]}
            value={filters.range}
            onChange={(val) => setFilters(prev => ({ ...prev, range: val }))}
            className="w-full sm:w-auto min-w-[140px]"
            variant="ghost"
          />

          <AnimatePresence>
            {filters.range === 'custom' && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center gap-2 w-full sm:w-auto overflow-hidden"
              >
                <DatePicker 
                  value={filters.startDate}
                  onChange={(val) => setFilters(prev => ({ ...prev, startDate: val }))}
                  placeholder="Desde"
                  className="flex-1 sm:w-28"
                  variant="ghost"
                />
                <span className="text-zinc-300 text-[9px] font-black uppercase">al</span>
                <DatePicker 
                  value={filters.endDate}
                  onChange={(val) => setFilters(prev => ({ ...prev, endDate: val }))}
                  placeholder="Hasta"
                  className="flex-1 sm:w-28"
                  variant="ghost"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="hidden sm:block w-px h-5 bg-zinc-100" />

          <Select 
            icon={Activity}
            options={[
              { value: 'all', label: 'Todos los Estados' },
              { value: 'pending', label: 'Pendientes' },
              { value: 'shipped', label: 'Enviados' },
              { value: 'completed', label: 'Completados' },
              { value: 'cancelled', label: 'Cancelados' }
            ]}
            value={filters.status}
            onChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
            className="w-full sm:w-auto min-w-[140px]"
            variant="ghost"
          />

          <div className="hidden sm:block w-px h-5 bg-zinc-100" />

          <Select 
            icon={Users}
            options={[
              { value: 'all', label: 'Todos los Clientes' },
              { value: 'natural', label: 'Persona Natural' },
              { value: 'empresa', label: 'Empresa' }
            ]}
            value={filters.customerType}
            onChange={(val) => setFilters(prev => ({ ...prev, customerType: val }))}
            className="w-full sm:w-auto min-w-[140px]"
            variant="ghost"
          />
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-4 px-2 lg:px-0 border-t lg:border-t-0 border-zinc-100 pt-2 lg:pt-0">
          <button 
            onClick={() => setFilters({
              range: '30days',
              status: 'all',
              customerType: 'all',
              startDate: '',
              endDate: ''
            })}
            className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors bg-zinc-50 lg:bg-transparent rounded-lg"
            title="Limpiar Filtros"
          >
            <X size={14} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>

{/* Main Stats Row */}
<div className="bg-white border border-zinc-200 rounded-2xl md:rounded-[2rem] shadow-sm overflow-hidden grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-zinc-100">
  {[
    { label: 'Ingresos Totales',  labelShort: 'Ingresos',     value: `S/ ${(stats.revenue || 0).toLocaleString()}`,           icon: DollarSign,   trend: '+12.5%',      trendIcon: ArrowUpRight, color: 'text-emerald-500' },
    { label: 'Descuentos',        labelShort: 'Descuentos',   value: `S/ ${(stats.discounts || 0).toLocaleString()}`,         icon: Tag,          trend: 'Promociones', trendIcon: Activity,     color: 'text-amber-500'  },
    { label: 'Órdenes Totales',   labelShort: 'Órdenes',      value: stats.orders || 0,                                       icon: ShoppingCart, trend: '+5.2%',       trendIcon: ArrowUpRight, color: 'text-emerald-500' },
    { label: 'Ticket Promedio',   labelShort: 'Ticket Prom.', value: `S/ ${Number(stats.avgOrderValue || 0).toFixed(2)}`,     icon: TrendingUp,   trend: 'Estable',     trendIcon: Activity,     color: 'text-zinc-400'   },
    { label: 'Clientes Activos',  labelShort: 'Clientes',     value: stats.customers || 0,                                    icon: Users,        trend: '+2',          trendIcon: ArrowUpRight, color: 'text-emerald-500' },
  ].map((stat, i) => (
    <motion.div
      key={i}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: i * 0.1 }}
      className={`p-4 md:p-6 flex flex-col items-center md:items-start min-h-[120px] md:min-h-[160px] ${
        i === 0 ? 'order-5 md:order-1 col-span-2 sm:col-span-1' :
        i === 1 ? 'order-3 md:order-2' :
        i === 2 ? 'order-2 md:order-3' :
        i === 3 ? 'order-1 md:order-4' :
                  'order-4 md:order-5'
      }`}
    >
      <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-start">
        <div className="p-1.5 bg-zinc-50 rounded-lg shrink-0">
          <stat.icon size={13} className="text-zinc-400" />
        </div>
        <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase tracking-[0.15em] leading-tight">
          <span className="md:hidden">{stat.labelShort}</span>
          <span className="hidden md:inline">{stat.label}</span>
        </p>
      </div>

      <h3 className="text-xl md:text-3xl font-bold text-zinc-900 tracking-tight leading-none mt-3 md:mt-5 md:self-center">
        {stat.value}
      </h3>

      <div className="flex items-center gap-2 mt-2 md:mt-3 md:self-center">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] font-black ${
          stat.color.replace('text-', 'bg-').replace('500', '50')
        } ${stat.color}`}>
          <stat.trendIcon size={8} />
          {stat.trend}
        </span>
        <span className="hidden md:block text-[8px] font-bold text-zinc-300 uppercase tracking-widest whitespace-nowrap">
          VS PERIODO ANTERIOR
        </span>
      </div>
    </motion.div>
  ))}
</div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Sales Evolution */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="lg:col-span-2 bg-white p-6 md:p-10 rounded-2xl md:rounded-[2rem] border border-zinc-200 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 md:mb-10">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-zinc-900">Evolución de Rendimiento</h3>
              <p className="text-[9px] md:text-[10px] text-zinc-400 mt-1 uppercase tracking-[0.2em] font-black">Ingresos vs Volumen de Órdenes</p>
            </div>
            <div className="flex gap-4 md:gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-zinc-900" />
                <span className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Órdenes</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] md:h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats?.salesData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f4" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 9, fontWeight: 700 }} 
                  dy={10} 
                />
                <YAxis 
                  yAxisId="left" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 9, fontWeight: 700 }} 
                  dx={-5} 
                  tickFormatter={(value) => `S/ ${value}`} 
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 9, fontWeight: 700 }} 
                  dx={5} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#f97316" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="orderCount" 
                  stroke="#18181b" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#18181b', strokeWidth: 1, stroke: '#fff' }} 
                  activeDot={{ r: 5 }} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Order Status Distribution */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[2rem] border border-zinc-200 shadow-sm flex flex-col"
        >
          <div className="flex items-start gap-4 mb-8 md:mb-10">
            <div className="p-3 bg-zinc-50 border border-zinc-100 text-zinc-900 rounded-2xl">
              <PieChartIcon size={18} />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-zinc-900">Estado Operativo</h3>
              <p className="text-[9px] md:text-[10px] text-zinc-400 mt-1 uppercase tracking-[0.2em] font-black">Distribución de Órdenes</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-60 md:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.orderStatusDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {(stats?.orderStatusDistribution || []).map((entry, index) => {
                      const colors: Record<string, string> = {
                        'pending': '#f97316',   // Orange
                        'shipped': '#3b82f6',   // Blue
                        'completed': '#10b981', // Emerald
                        'cancelled': '#ef4444'  // Red
                      };
                      return <Cell key={`cell-${index}`} fill={colors[entry.name] || '#94a3b8'} />;
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4 mt-8 md:mt-10">
              {(stats?.orderStatusDistribution || []).map((item, i) => {
                const labels: Record<string, string> = {
                  'pending': 'Pendiente',
                  'shipped': 'Enviado',
                  'completed': 'Completado',
                  'cancelled': 'Cancelado'
                };
                return (
                  <div key={i} className="bg-zinc-50 p-3 md:p-5 rounded-xl md:rounded-2xl border border-zinc-100">
                    <p className="text-[8px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                      {labels[item.name] || item.name}
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-zinc-900">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profitability Bar Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-zinc-100 text-zinc-900 rounded-lg">
              <Wallet size={18} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900">Análisis de Rentabilidad</h3>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Ingresos Brutos vs Costos Operativos</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.revenueVsCost || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f1f4" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 600 }} 
                  dy={15} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 600 }} 
                  dx={-10} 
                  tickFormatter={(value) => `S/ ${value}`} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8f8f9' }} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="cost" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by District */}
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-zinc-100 text-zinc-900 rounded-lg">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900">Cobertura Geográfica</h3>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Distribución de Ventas por Distrito</p>
            </div>
          </div>
          <div className="space-y-4">
            {(stats?.salesByDistrict || []).sort((a, b) => b.value - a.value).map((district, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-zinc-600">{district.name}</span>
                  <span className="text-zinc-900 font-bold">S/ {district.value.toLocaleString()}</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(district.value / Math.max(...(stats?.salesByDistrict || []).map(d => d.value), 1)) * 100}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full bg-zinc-900"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Table & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl md:rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-10 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-zinc-900">Registro de Transacciones</h3>
              <p className="text-[9px] md:text-[10px] text-zinc-400 mt-1 uppercase tracking-[0.2em] font-black">Últimas Órdenes Procesadas</p>
            </div>
            <button className="text-[9px] md:text-[10px] font-black text-zinc-900 uppercase tracking-widest border-b-2 border-orange-500 pb-1 hover:text-orange-600 transition-colors">Ver Historial</button>
          </div>
          <div className="hidden sm:block overflow-x-auto">
            <Table 
              headers={['Cliente', 'Fecha', 'Monto', 'Estado']}
            >
              {(stats?.recentOrders || []).map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] md:text-xs font-bold shadow-md">
                        {(order.customer_name || 'U').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-900 text-xs md:text-sm truncate">{order.customer_name}</p>
                        <p className="text-[9px] text-zinc-400 font-bold">#{(order.id || '').toString().slice(-4)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-[10px] md:text-xs font-bold text-zinc-500">{new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs md:text-sm font-bold text-zinc-900">S/ {order.total_amount.toLocaleString()}</p>
                  </TableCell>
                  <TableCell align="right">
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
    order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
    order.status === 'shipped'   ? 'bg-blue-50 text-blue-600' :
    order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
    'bg-yellow-50 text-yellow-600'
  }`}>
    {order.status === 'completed' ? <><CheckCircle size={11} /> Completado</> :
     order.status === 'shipped'   ? <><Truck size={11} /> Enviado</> :
     order.status === 'cancelled' ? <><X size={11} /> Cancelada</> :
     <><Clock size={11} /> Pendiente</>}
  </span>
</TableCell>
                </TableRow>
              ))}
            </Table>
          </div>

          {/* Mobile Card List for Recent Orders */}
          <div className="sm:hidden divide-y divide-zinc-100">
            {(stats?.recentOrders || []).map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {(order.customer_name || 'U').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-900 text-xs truncate">{order.customer_name}</p>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                      {new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-zinc-900">S/ {order.total_amount.toLocaleString()}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest mt-1 ${
                    order.status === 'completed' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                  }`}>
                    {order.status === 'completed' ? 'OK' : 'PND'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highlights Column */}
        <div className="space-y-8">
          {/* Top Product Card */}
          <div className="bg-zinc-900 p-8 md:p-10 rounded-2xl md:rounded-[2rem] shadow-xl border border-zinc-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 md:p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Award size={100} className="text-orange-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <div className="p-2 bg-orange-500/20 text-orange-500 rounded-xl">
                  <Star size={18} />
                </div>
                <h3 className="font-black text-white uppercase tracking-[0.2em] text-[9px] md:text-[10px]">Producto Estrella</h3>
              </div>
              <div className="space-y-2">
                <p className="text-zinc-500 text-[9px] md:text-[10px] uppercase tracking-widest font-black">Líder en Ventas</p>
                <h4 className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight">{stats.topProduct.name}</h4>
              </div>
              <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-zinc-800 flex justify-between items-end">
                <div>
                  <p className="text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-widest font-black mb-1">Unidades Vendidas</p>
                  <p className="text-3xl md:text-4xl font-bold text-orange-500 tracking-tighter">
                    {stats.topProduct.total_sold}<span className="text-xs ml-1 font-black">UND</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-widest font-black mb-1">Total en Ventas</p>
                  <p className="text-xl md:text-2xl font-bold text-amber-400 tracking-tighter">
                    S/ {Number(stats.topProduct.total_revenue || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Alert Card */}
          <div className={`p-8 md:p-10 rounded-2xl md:rounded-[2rem] border shadow-sm ${stats.lowStock > 0 ? 'bg-white border-red-200' : 'bg-white border-zinc-200'}`}>
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className={`p-2 rounded-xl ${stats.lowStock > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <Package size={18} />
              </div>
              <h3 className="font-black text-zinc-900 uppercase tracking-[0.2em] text-[9px] md:text-[10px]">Estado de Almacén</h3>
            </div>
            
            <div className="space-y-6 md:space-y-8">
              <div className="flex items-center justify-between">
                <p className="text-xs md:text-sm font-bold text-zinc-600">Productos Críticos</p>
                <span className={`font-bold text-2xl md:text-3xl tracking-tighter ${stats.lowStock > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {stats.lowStock}
                </span>
              </div>
              
              <div className={`p-4 md:p-6 rounded-xl md:rounded-2xl border flex items-start gap-3 md:gap-4 ${stats.lowStock > 0 ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                {stats.lowStock > 0 ? <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" /> : <Activity size={18} className="text-emerald-600 shrink-0 mt-0.5" />}
                <div>
                  <p className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest ${stats.lowStock > 0 ? 'text-red-900' : 'text-emerald-900'}`}>
                    {stats.lowStock > 0 ? 'Acción Requerida' : 'Operación Normal'}
                  </p>
                  <p className={`text-[9px] md:text-[10px] mt-2 leading-relaxed font-medium ${stats.lowStock > 0 ? 'text-red-700/80' : 'text-emerald-700/80'}`}>
                    {stats.lowStock > 0 
                      ? 'Revisar stock de seguridad.' 
                      : 'Niveles óptimos.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
