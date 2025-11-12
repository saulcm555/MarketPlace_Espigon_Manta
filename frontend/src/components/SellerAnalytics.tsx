/**
 * Componente de Análisis para Vendedores
 * Muestra estadísticas de ventas usando GraphQL
 */

import { useQuery } from '@apollo/client';
import { useAuth } from '@/context/AuthContext';
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
  AlertTriangle
} from 'lucide-react';
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
  const { user } = useAuth();
  
  // Obtener el seller_id del usuario autenticado
  const sellerId = user?.id_seller || user?.id;

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
  const { data: statsData, loading: statsLoading, error: statsError } = useQuery<SellerDashboardStats>(
    GET_SELLER_DASHBOARD_STATS,
    {
      variables: { sellerId },
      fetchPolicy: 'cache-and-network',
    }
  );

  // Query para productos más vendidos del vendedor (últimos 30 días, top 5)
  const { data: productsData, loading: productsLoading } = useQuery<SellerBestProductsReport>(
    GET_SELLER_BEST_PRODUCTS,
    {
      variables: {
        sellerId,
        limit: 5,
      },
      fetchPolicy: 'cache-and-network',
    }
  );

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
                  {stats?.today_orders || 0} pedido{stats?.today_orders !== 1 ? 's' : ''}
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
                  {stats?.month_orders || 0} pedidos
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
                  {stats?.total_orders || 0} pedidos totales
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Mis Productos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-purple-600">
                  {stats?.total_products || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  En tu inventario
                </p>
              </>
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

      {/* Resumen General */}
      {stats && (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Resumen de Rendimiento
            </CardTitle>
            <CardDescription>
              Métricas adicionales de tu tienda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Ventas de Hoy */}
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ventas de Hoy</p>
                  <p className="text-xl font-bold">
                    {formatPrice(stats.today_sales || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.today_orders || 0} pedido{stats.today_orders !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Ventas del Mes */}
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ventas del Mes</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatPrice(stats.month_revenue || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.month_orders || 0} pedido{stats.month_orders !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              {/* Promedio por Pedido */}
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-100 dark:bg-cyan-900 rounded-full">
                  <ArrowUp className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Promedio por Pedido</p>
                  <p className="text-xl font-bold">
                    {formatPrice(stats.month_orders > 0 ? stats.month_revenue / stats.month_orders : 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Del mes actual
                  </p>
                </div>
              </div>

              {/* Stock Bajo */}
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stock Bajo</p>
                  <p className="text-xl font-bold text-orange-600">
                    {stats.low_stock_products || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    producto{stats.low_stock_products !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
