import { useQuery } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, Users, ShoppingCart, AlertTriangle, TrendingUp, Store, FileText, BarChart3, UsersRound, Wifi, WifiOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DASHBOARD_STATS, SALES_REPORT, CLIENTS_REPORT } from '@/graphql/adminDashboard';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';

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

interface SalesReportItem {
  period: string;
  total_sales: number;
  total_orders: number;
  average_order_value: number;
}

interface ClientsReportData {
  period_start: string;
  period_end: string;
  total_clients: number;
  new_clients: number;
  active_clients: number;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  // GraphQL Queries
  const { data, loading, error, refetch: refetchStats } = useQuery<{ dashboard_stats: DashboardStats }>(DASHBOARD_STATS, {
    pollInterval: 30000,
  });

  // Sales report for last 7 days
  const { data: salesData, loading: salesLoading, refetch: refetchSales } = useQuery<{
    sales_report: {
      total_revenue: number;
      total_orders: number;
      sales_by_period: SalesReportItem[];
    };
  }>(SALES_REPORT, {
    variables: {
      period: 'DAILY',
    },
  });

  // Clients report
  const { data: clientsData, loading: clientsLoading, refetch: refetchClients } = useQuery<{
    clients_report: ClientsReportData;
  }>(CLIENTS_REPORT);

  // 🔔 WEBSOCKET: Conectar y escuchar eventos de actualización de estadísticas
  const { isConnected } = useWebSocket({
    token: token,
    onStatsUpdate: (event) => {
      console.log('📊 Admin stats update received:', event);
      
      // Si el evento es para administradores, refetch todas las queries
      if (event.type === 'ADMIN_STATS_UPDATED') {
        console.log('🔄 Refetching admin dashboard stats...');
        refetchStats();
        refetchSales();
        refetchClients();
      }
    },
    onConnect: () => {
      console.log('✅ Admin WebSocket connected');
    },
    onDisconnect: () => {
      console.log('❌ Admin WebSocket disconnected');
    },
    debug: true
  });

  const stats = data?.dashboard_stats;
  const salesByPeriod = salesData?.sales_report?.sales_by_period || [];
  const clientsReport = clientsData?.clients_report;

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
          Dashboard Administrativo
        </h1>
        <p className="text-muted-foreground mt-2">
          Panel de control y estadísticas globales del marketplace
        </p>
      </div>

      {/* Indicador de conexión WebSocket */}
      <Card className={isConnected ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' : 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20'}>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-green-700 dark:text-green-400 font-medium">
                  Actualizaciones en tiempo real activadas
                </span>
                <Badge variant="outline" className="ml-auto bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-300">
                  Conectado
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-yellow-600" />
                <span className="text-yellow-700 dark:text-yellow-400 font-medium">
                  Reconectando al servidor en tiempo real...
                </span>
                <Badge variant="outline" className="ml-auto bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-300">
                  Desconectado
                </Badge>
              </>
            )}
          </div>
          {isConnected && (
            <p className="text-xs text-muted-foreground mt-1">
              Las estadísticas globales se actualizarán automáticamente cuando ocurran cambios en el sistema
            </p>
          )}
        </CardContent>
      </Card>

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

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Ventas */}
        <Card className="shadow-lg border-blue-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Ventas Últimos 7 Días
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Evolución de ingresos diarios
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : salesByPeriod.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesByPeriod}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="period" 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ventas']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '10px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total_sales" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Ventas Totales"
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay datos de ventas disponibles
              </div>
            )}
            {salesData && (
              <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Período</p>
                  <p className="text-lg font-bold text-blue-600">
                    ${salesData.sales_report.total_revenue.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Órdenes Totales</p>
                  <p className="text-lg font-bold">
                    {salesData.sales_report.total_orders}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Usuarios */}
        <Card className="shadow-lg border-purple-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UsersRound className="h-5 w-5 text-purple-600" />
                  Usuarios Registrados
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Distribución de la comunidad
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {clientsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : clientsReport ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={[
                      {
                        name: 'Clientes',
                        Totales: clientsReport.total_clients,
                        Activos: clientsReport.active_clients,
                        Nuevos: clientsReport.new_clients,
                      },
                      {
                        name: 'Vendedores',
                        Totales: stats?.total_active_sellers || 0,
                        Activos: stats?.total_active_sellers || 0,
                        Nuevos: 0,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '10px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Totales" fill="#8b5cf6" name="Totales" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Activos" fill="#a78bfa" name="Activos" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Nuevos" fill="#c4b5fd" name="Nuevos" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Clientes</p>
                    <p className="text-lg font-bold text-purple-600">
                      {clientsReport.total_clients}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Clientes Activos</p>
                    <p className="text-lg font-bold">
                      {clientsReport.active_clients}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nuevos (Mes)</p>
                    <p className="text-lg font-bold text-green-600">
                      {clientsReport.new_clients}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay datos de usuarios disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
