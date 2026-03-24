import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, Calculator, LogOut, Tag, X } from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  onClose?: () => void;
}

export function Sidebar({ user, onLogout, onClose }: SidebarProps) {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/orders', label: 'Órdenes', icon: ShoppingCart },
    { path: '/products', label: 'Productos', icon: Package },
    { path: '/customers', label: 'Clientes', icon: Users },
    { path: '/promotions', label: 'Promociones', icon: Tag },
    { path: '/pricing', label: 'Calculadora de Precios', icon: Calculator },
  ];

  return (
    <div className="w-full lg:w-64 bg-white border-r border-zinc-200 h-screen flex flex-col shadow-2xl lg:shadow-none">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center border-2 border-zinc-900">
            <span className="text-xl">🐷</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-900 tracking-tight">SANTO CERDO</h1>
            <p className="text-amber-500 text-[10px] font-bold tracking-widest uppercase">Extra Pura</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400"
          >
            <X size={20} />
          </button>
        )}
      </div>
      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive 
                  ? 'bg-amber-50 text-amber-600 shadow-sm' 
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-zinc-100">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 font-bold text-xs">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-900 truncate">{user?.name}</p>
            <p className="text-[10px] text-zinc-400 truncate uppercase tracking-wider">Administrador</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-medium"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
