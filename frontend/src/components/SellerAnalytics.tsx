/**
 * Componente de Análisis para Vendedores
 * Muestra estadísticas de ventas usando GraphQL
 */

import { useQuery } from '@apollo/client';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  Calendar,
  ArrowUp,
  Activity,
  Loader2,
  AlertTriangle,
  Wifi,
  WifiOff,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GET_SELLER_DASHBOARD_STATS, GET_SELLER_BEST_PRODUCTS } from '@/graphql/sellerAnalytics';

interface SellerDashboardStats {
  seller_dashboard_stats: {
    seller_id: number;
    today_sales: number;
    today_orders: number;
    month_revenue: number;
    month_orders: number;
    total_products: number;
    low_stock_products: number;
    total_revenue: number;
    total_orders: number;
    pending_orders?: number;
  };
}

interface SellerBestProductsReport {
  seller_best_products: {
    period_start: string;
    period_end: string;
    best_products: Array<{
      product_name: string;
      units_sold: number;
      total_revenue: number;
    }>;
  };
}

export function SellerAnalytics() {
  const { user, token } = useAuth();

  // Obtener el seller_id del usuario autenticado
  // PRIORIDAD: Usar id_seller numérico si existe, sino intentar con UUID
  const sellerId = user?.id_seller ? String(user.id_seller) : user?.id;

  console.log('🔍 [SellerAnalytics] user:', user);
  console.log('🔍 [SellerAnalytics] sellerId:', sellerId);

  if (!sellerId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            No se pudo identificar el vendedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No se encontró información del vendedor. Por favor, intenta cerrar sesión y volver a iniciarla.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Query para estadísticas del dashboard del vendedor
  const { data: statsData, loading: statsLoading, error: statsError, refetch: refetchStats } = useQuery<SellerDashboardStats>(
    GET_SELLER_DASHBOARD_STATS,
    {
      variables: { sellerId },
      fetchPolicy: 'cache-and-network', // ⚡ Mostrar caché mientras actualiza
      notifyOnNetworkStatusChange: true, // Notificar cambios de red
    }
  );

  // Query para productos más vendidos del vendedor (últimos 30 días, top 5)
  const { data: productsData, loading: productsLoading, refetch: refetchProducts } = useQuery<SellerBestProductsReport>(
    GET_SELLER_BEST_PRODUCTS,
    {
      variables: {
        sellerId,
        limit: 5,
      },
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    }
  );

  // 🔔 WEBSOCKET: Conectar y escuchar eventos de actualización de estadísticas
  const { isConnected } = useWebSocket({
    token: token,
    onStatsUpdate: (event) => {
      console.log('📊 [SellerAnalytics] Stats event received:', {
        type: event.type,
        seller_id: event.seller_id,
        my_seller_id: sellerId,
        match: event.seller_id === sellerId?.toString()
      });

      // Si el evento es para este vendedor, refetch las queries
      if (event.type === 'SELLER_STATS_UPDATED' && event.seller_id === sellerId?.toString()) {
        console.log('🔄 [SellerAnalytics] Refetching data for seller', sellerId);
        console.log('📊 [BEFORE REFETCH] Current stats:', statsData?.seller_dashboard_stats);

        refetchStats().then((result) => {
          console.log('✅ Stats refetched successfully');
          console.log('📊 [AFTER REFETCH] New stats:', result.data?.seller_dashboard_stats);
        }).catch((err) => {
          console.error('❌ Error refetching stats:', err);
        });

        refetchProducts().then(() => {
          console.log('✅ Products refetched');
        }).catch((err) => {
          console.error('❌ Error refetching products:', err);
        });
      }
    },
    debug: false
  });

  const stats = statsData?.seller_dashboard_stats;
  const bestProducts = productsData?.seller_best_products;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price || 0);
  };

  if (statsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            Error al cargar análisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No se pudieron cargar las estadísticas. Por favor, intenta nuevamente.
          </p>
          <p className="text-xs text-red-500 mt-2">
            {statsError.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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
              Las estadísticas se actualizarán automáticamente cuando cambien tus ventas
            </p>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Ventas de Hoy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatPrice(stats?.today_sales || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.today_orders === 0 && 'Aún no hay ventas hoy'}
                  {stats?.today_orders === 1 && '1 pedido realizado'}
                  {stats && stats.today_orders > 1 && `${stats.today_orders} pedidos realizados`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ventas del Mes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(stats?.month_revenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.month_orders === 0 && 'Sin ventas este mes'}
                  {stats?.month_orders === 1 && '1 pedido este mes'}
                  {stats && stats.month_orders > 1 && `${stats.month_orders} pedidos este mes`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ingresos Totales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(stats?.total_revenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.total_orders === 0 && 'Comienza a vender'}
                  {stats?.total_orders === 1 && 'Desde tu primer pedido'}
                  {stats && stats.total_orders > 1 && `Total de ${stats.total_orders} pedidos`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pedidos Pendientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendientes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">
                  {stats?.pending_orders || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  En proceso de entrega
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Ventas */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Ventas del Mes */}
        <Card className="shadow-lg border-green-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Ventas del Mes
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Comparación mensual
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : stats ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      {
                        name: 'Hoy',
                        Ventas: stats.today_sales,
                      },
                      {
                        name: 'Mes',
                        Ventas: stats.month_revenue,
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
                    <Bar dataKey="Ventas" fill="#10b981" name="Ventas ($)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Ventas Hoy</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatPrice(stats.today_sales)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.today_orders} {stats.today_orders === 1 ? 'orden' : 'órdenes'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ventas del Mes</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatPrice(stats.month_revenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.month_orders} {stats.month_orders === 1 ? 'orden' : 'órdenes'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Ventas Totales */}
        <Card className="shadow-lg border-blue-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5 text-blue-600" />
                  Historial de Ventas
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Evolución de ingresos
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : stats ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={[
                      { periodo: 'Inicio', ventas: 0 },
                      { periodo: 'Acumulado', ventas: stats.total_revenue },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="periodo"
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ventas Totales']}
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
                      dataKey="ventas"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Ingresos Acumulados"
                      dot={{ fill: '#3b82f6', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Ingresos Totales</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatPrice(stats.total_revenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Órdenes Totales</p>
                    <p className="text-lg font-bold">
                      {stats.total_orders}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productos Más Vendidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-green-600" />
            Productos Más Vendidos
          </CardTitle>
          <CardDescription>
            Top 5 productos del último mes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : bestProducts && bestProducts.best_products.length > 0 ? (
            <div className="space-y-3">
              {bestProducts.best_products.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </Badge>
                    <div>
                      <h4 className="font-semibold text-sm">{product.product_name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {product.units_sold} unidades vendidas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatPrice(product.total_revenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ingresos
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No hay ventas registradas aún
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
