import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FolderTree,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/admin/dashboard',
      description: 'Vista general'
    },
    { 
      icon: FolderTree, 
      label: 'Categorías', 
      path: '/admin/categories',
      description: 'Gestionar categorías'
    },
    { 
      icon: Package, 
      label: 'Productos', 
      path: '/admin/products',
      description: 'Aprobar productos'
    },
    { 
      icon: Users, 
      label: 'Vendedores', 
      path: '/admin/sellers',
      description: 'Gestionar vendedores'
    },
    { 
      icon: ShoppingCart, 
      label: 'Órdenes', 
      path: '/admin/orders',
      description: 'Gestionar pedidos'
    },
    { 
      icon: CreditCard, 
      label: 'Pagos', 
      path: '/admin/payments',
      description: 'Verificar pagos'
    },
    { 
      icon: BarChart3, 
      label: 'Reportes', 
      path: '/admin/reports',
      description: 'Análisis y reportes'
    },
    { 
      icon: Settings, 
      label: 'Configuración', 
      path: '/admin/settings',
      description: 'Ajustes del sistema'
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-white border-r flex flex-col transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Admin Panel
                  </h1>
                  <p className="text-xs text-muted-foreground mt-1">
                    Marketplace Espigón Manta
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="mx-auto"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3 transition-all',
                !sidebarOpen && 'justify-center px-2',
                isActive(item.path) && 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
              )}
              onClick={() => navigate(item.path)}
            >
              <item.icon className={cn('h-5 w-5', sidebarOpen ? '' : 'h-6 w-6')} />
              {sidebarOpen && (
                <div className="flex flex-col items-start">
                  <span className="font-medium">{item.label}</span>
                  {!isActive(item.path) && (
                    <span className="text-xs opacity-70">{item.description}</span>
                  )}
                </div>
              )}
            </Button>
          ))}
        </nav>

        <Separator />

        {/* Logout */}
        <div className="p-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            onClick={logout}
          >
            <LogOut className={cn('h-5 w-5', !sidebarOpen && 'h-6 w-6')} />
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
