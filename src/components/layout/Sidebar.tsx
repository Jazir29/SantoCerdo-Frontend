import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Calculator,
  LogOut, Tag, History, User as UserIcon, Shield,X,
  ChevronLeft, Settings as SettingsIcon
} from 'lucide-react';
import { User } from '../../types';
import { useState, useEffect } from 'react';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  onClose?: () => void; // ← agrega esto
}

export function Sidebar({ user, onLogout, onClose}: SidebarProps) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [isSettingsMode, setIsSettingsMode] = useState(false);

  useEffect(() => {
    setIsSettingsMode(location.pathname.startsWith('/settings'));
  }, [location.pathname]);

  const navItems = [
    { path: '/',                    label: 'Dashboard',              icon: LayoutDashboard },
    { path: '/orders',              label: 'Órdenes',                icon: ShoppingCart },
    { path: '/products',            label: 'Productos',              icon: Package },
    { path: '/customers',           label: 'Clientes',               icon: Users },
    { path: '/promotions',          label: 'Promociones',            icon: Tag },
    { path: '/pricing',             label: 'Calculadora de Precios', icon: Calculator },
    { path: '/production-registry', label: 'Registro de Producción', icon: History },
  ];

  const settingsItems = [
    { path: '/settings/profile', label: 'Configuración de Perfil', icon: UserIcon },
    { path: '/settings/users',   label: 'Gestión de Usuarios',     icon: Shield },
  ];

  return (
    <div className="w-full lg:w-64 bg-white border-r border-zinc-200 h-screen flex flex-col shadow-2xl lg:shadow-none">
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center border-2 border-zinc-900 shadow-sm">
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

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
        {isSettingsMode ? (
          <>
            <div className="px-4 mb-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Configuración</p>
            </div>
            {settingsItems.map((item) => {
              const Icon     = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={onClose} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                    isActive
                      ? 'bg-amber-50 text-amber-600 shadow-sm shadow-amber-100'
                      : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}>
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
            <button onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-red-500 hover:bg-red-50 hover:text-red-600">
              <LogOut size={18} />
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </button>
          </>
        ) : (
          navItems.map((item) => {
            const Icon     = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={onClose} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive
                    ? 'bg-amber-50 text-amber-600 shadow-sm shadow-amber-100'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                }`}>
                <Icon size={18} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-100 space-y-2">
        {isSettingsMode && (
          <button
            onClick={() => { setIsSettingsMode(false); navigate('/'); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 group"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold uppercase tracking-wider text-xs">Volver al Menú</span>
          </button>
        )}
        <button
          onClick={() => { setIsSettingsMode(true); navigate('/settings/profile'); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
            isSettingsMode ? 'bg-amber-50 border border-amber-100' : 'hover:bg-zinc-50'
          }`}
        >
          {/* ← FIX: inicial con first_name */}
          <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 font-bold text-xs border border-zinc-200">
            {user?.first_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            {/* ← FIX: nombre con first_name + last_name */}
            <p className="text-sm font-bold text-zinc-900 truncate">
              {user?.first_name
                ? `${user.first_name} ${user.last_name || ''}`.trim()
                : user?.name}
            </p>
            <p className="text-[10px] text-zinc-400 truncate uppercase tracking-wider">
              {user?.role || 'Administrador'}
            </p>
          </div>
          {!isSettingsMode && <SettingsIcon size={14} className="text-zinc-300 shrink-0" />}
        </button>
      </div>
    </div>
  );
}