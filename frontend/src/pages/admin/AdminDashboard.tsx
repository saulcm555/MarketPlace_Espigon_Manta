import { useQuery, gql } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, Users, ShoppingCart, AlertTriangle, TrendingUp, Store, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

// GraphQL Query
const DASHBOARD_STATS = gql`
  query DashboardStats {
    dashboard_stats {
      today_sales
      today_orders
      total_active_clients
      total_active_sellers
      total_products
      pending_deliveries
      low_stock_products
      month_revenue
      month_orders
    }
  }
`;

interface DashboardStats {
  today_sales: number;
  today_orders: number;
  total_active_clients: number;
  total_active_sellers: number;
  total_products: number;
  pending_deliveries: number;
  low_stock_products: number;
  month_revenue: number;
  month_orders: number;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  
  // GraphQL Query
  const { data, loading, error } = useQuery<{ dashboard_stats: DashboardStats }>(DASHBOARD_STATS, {
    pollInterval: 30000,
  });

  const stats = data?.dashboard_stats;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Panel de administración</p>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar el dashboard: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard General
        </h1>
        <p className="text-muted-foreground mt-2">
          Vista estratégica del marketplace • Actualización en tiempo real
        </p>
      </div>

      {/* Acciones Rápidas */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Acciones Rápidas
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card 
            className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 border-blue-200 bg-gradient-to-br from-blue-50 to-white"
            onClick={() => navigate('/admin/products')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-sm">Productos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.total_products || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Gestionar catálogo</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 border-purple-200 bg-gradient-to-br from-purple-50 to-white"
            onClick={() => navigate('/admin/sellers')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Store className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-sm">Vendedores</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats?.total_active_sellers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Revisar vendedores</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 border-green-200 bg-gradient-to-br from-green-50 to-white"
            onClick={() => navigate('/admin/orders')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-sm">Órdenes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.month_orders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Gestionar pedidos</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 border-orange-200 bg-gradient-to-br from-orange-50 to-white"
            onClick={() => navigate('/admin/reports')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <CardTitle className="text-sm">Reportes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${stats?.month_revenue.toFixed(0) || '0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ver análisis</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alertas - Stock Bajo */}
      {stats && stats.low_stock_products > 0 && (
        <Alert className="border-orange-200 bg-gradient-to-r from-orange-50 to-white">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>{stats.low_stock_products} productos</strong> necesitan reabastecimiento
            </span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => navigate('/admin/products')}
              className="ml-4"
            >
              Ver productos
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Resumen de Actividad */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad del Marketplace</CardTitle>
          <p className="text-sm text-muted-foreground">
            Resumen general del estado actual
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>Catálogo</span>
              </div>
              <div className="text-2xl font-bold">{stats?.total_products || 0} productos</div>
              {stats && stats.low_stock_products > 0 && (
                <p className="text-sm text-orange-600">
                  {stats.low_stock_products} con stock bajo
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Comunidad</span>
              </div>
              <div className="text-2xl font-bold">
                {(stats?.total_active_clients || 0) + (stats?.total_active_sellers || 0)} usuarios
              </div>
              <p className="text-sm text-muted-foreground">
                {stats?.total_active_clients || 0} compradores • {stats?.total_active_sellers || 0} vendedores
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Ingresos del Mes</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                ${stats?.month_revenue.toFixed(2) || '0.00'}
              </div>
              <p className="text-sm text-muted-foreground">
                {stats?.month_orders || 0} órdenes completadas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
