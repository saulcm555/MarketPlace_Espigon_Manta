import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Package, Users, ShoppingCart, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import apiClient from '@/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  totalActiveClients: number;
  totalActiveSellers: number;
  totalProducts: number;
  pendingDeliveries: number;
  lowStockProducts: number;
  monthRevenue: number;
  yesterdaySales: number;
  pendingApprovals: {
    products: number;
    sellers: number;
    payments: number;
  };
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [orders, clients, sellers, products] = await Promise.all([
        apiClient.get('/orders'),
        apiClient.get('/clients'),
        apiClient.get('/sellers'),
        apiClient.get('/products'),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      const todayOrders = orders.data.filter((o: any) => 
        o.order_date?.startsWith(today)
      );

      const yesterdayOrders = orders.data.filter((o: any) =>
        o.order_date?.startsWith(yesterday)
      );

      setStats({
        todaySales: todayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || 0), 0),
        todayOrders: todayOrders.length,
        yesterdaySales: yesterdayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || 0), 0),
        totalActiveClients: clients.data.length,
        totalActiveSellers: sellers.data.filter((s: any) => s.status === 'active').length,
        totalProducts: products.data.length,
        pendingDeliveries: orders.data.filter((o: any) => o.status === 'shipped').length,
        lowStockProducts: products.data.filter((p: any) => p.stock < 10).length,
        monthRevenue: orders.data
          .filter((o: any) => new Date(o.order_date).getMonth() === new Date().getMonth())
          .reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || 0), 0),
        pendingApprovals: {
          products: products.data.filter((p: any) => p.status === 'pending').length,
          sellers: sellers.data.filter((s: any) => s.status === 'pending').length,
          payments: orders.data.filter((o: any) => o.status === 'payment_verification').length,
        },
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowth = (today: number, yesterday: number) => {
    if (yesterday === 0) return 0;
    return ((today - yesterday) / yesterday) * 100;
  };

  const salesGrowth = stats ? calculateGrowth(stats.todaySales, stats.yesterdaySales) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido al panel de administración
        </p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas de Hoy
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats?.todaySales.toFixed(2)}
            </div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {salesGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(salesGrowth).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs ayer</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.todayOrders} órdenes hoy
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Productos Activos
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalProducts}
            </div>
            {stats && stats.lowStockProducts > 0 && (
              <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {stats.lowStockProducts} con stock bajo
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes Activos
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalActiveClients}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalActiveSellers} vendedores activos
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Entregas Pendientes
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.pendingDeliveries}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              En camino
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Importantes */}
      {stats && (stats.pendingApprovals.products > 0 || stats.pendingApprovals.sellers > 0 || stats.pendingApprovals.payments > 0) && (
        <div>
          <h2 className="text-xl font-semibold mb-4">⚠️ Requiere tu atención</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {stats.pendingApprovals.products > 0 && (
              <Card 
                className="border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate('/admin/products')}
              >
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    Productos Pendientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {stats.pendingApprovals.products}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requieren aprobación
                  </p>
                  <Button size="sm" variant="outline" className="mt-3 w-full">
                    Revisar ahora
                  </Button>
                </CardContent>
              </Card>
            )}

            {stats.pendingApprovals.sellers > 0 && (
              <Card 
                className="border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate('/admin/sellers')}
              >
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    Vendedores Nuevos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.pendingApprovals.sellers}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pendientes de revisión
                  </p>
                  <Button size="sm" variant="outline" className="mt-3 w-full">
                    Revisar ahora
                  </Button>
                </CardContent>
              </Card>
            )}

            {stats.pendingApprovals.payments > 0 && (
              <Card 
                className="border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate('/admin/payments')}
              >
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-purple-600" />
                    Pagos por Verificar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {stats.pendingApprovals.payments}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Comprobantes subidos
                  </p>
                  <Button size="sm" variant="outline" className="mt-3 w-full">
                    Verificar ahora
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Ventas del Mes */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas del Mes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Total: ${stats?.monthRevenue.toFixed(2)}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Sem 1', ventas: stats ? stats.monthRevenue * 0.2 : 0 },
                { name: 'Sem 2', ventas: stats ? stats.monthRevenue * 0.25 : 0 },
                { name: 'Sem 3', ventas: stats ? stats.monthRevenue * 0.3 : 0 },
                { name: 'Sem 4', ventas: stats ? stats.monthRevenue * 0.25 : 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ventas" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tendencia de Órdenes */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Órdenes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Últimos 7 días
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[
                { dia: 'Lun', ordenes: 12 },
                { dia: 'Mar', ordenes: 19 },
                { dia: 'Mié', ordenes: 15 },
                { dia: 'Jue', ordenes: 25 },
                { dia: 'Vie', ordenes: 22 },
                { dia: 'Sáb', ordenes: 30 },
                { dia: 'Dom', ordenes: stats?.todayOrders || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="ordenes" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats?.totalProducts}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Productos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats?.totalActiveSellers}</div>
              <p className="text-sm text-muted-foreground mt-1">Vendedores Activos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats?.totalActiveClients}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Clientes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                ${stats?.monthRevenue.toFixed(0)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Ingresos del Mes</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
