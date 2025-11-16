import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  Calendar,
  FileText,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { generateSalesReportPDF, generateInventoryReportPDF } from '@/utils/pdfReports';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// GraphQL Queries
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

const CATEGORY_SALES = gql`
  query CategorySales($dateRange: DateRangeInput) {
    category_sales_report(date_range: $dateRange) {
      period_start
      period_end
      categories {
        category_id
        category_name
        total_sales
        total_orders
        products_count
      }
    }
  }
`;

const INVENTORY_REPORT = gql`
  query InventoryReport($threshold: Int!) {
    inventory_report(min_stock_threshold: $threshold) {
      total_products
      out_of_stock
      low_stock
      critical_products {
        product_id
        product_name
        seller_name
        current_stock
        min_stock_threshold
        status
      }
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

interface CategorySale {
  category_id: number;
  category_name: string;
  total_sales: number;
  total_orders: number;
  products_count: number;
}

interface CriticalProduct {
  product_id: number;
  product_name: string;
  seller_name: string;
  current_stock: number;
  min_stock_threshold: number;
  status: string;
}

export function AdminReports() {
  const { token } = useAuth();
  
  // Estado para el rango de fechas
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(1)).toISOString().split('T')[0] // Primer día del mes
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0] // Hoy
  );
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  // Handler para aplicar el filtro de fechas
  const applyDateFilter = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    
    // Refetch con las nuevas fechas
    refetchCategorySales({
      dateRange: {
        start_date: tempStartDate,
        end_date: tempEndDate,
      },
    });
  };

  // Queries
  const { data: statsData, loading: statsLoading, error: statsError, refetch: refetchStats } = useQuery<{
    dashboard_stats: DashboardStats;
  }>(DASHBOARD_STATS, {
    fetchPolicy: 'cache-and-network',
  });

  const {
    data: categorySalesData,
    loading: categorySalesLoading,
    error: categorySalesError,
    refetch: refetchCategorySales,
  } = useQuery<{
    category_sales_report: {
      period_start: string;
      period_end: string;
      categories: CategorySale[];
    };
  }>(CATEGORY_SALES, {
    variables: {
      dateRange: {
        start_date: startDate,
        end_date: endDate,
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  const {
    data: inventoryData,
    loading: inventoryLoading,
    error: inventoryError,
  } = useQuery<{
    inventory_report: {
      total_products: number;
      out_of_stock: number;
      low_stock: number;
      critical_products: CriticalProduct[];
    };
  }>(INVENTORY_REPORT, {
    variables: { threshold: 10 },
    fetchPolicy: 'cache-and-network',
  });

  // 🔔 WEBSOCKET: Conectar y escuchar eventos de actualización de estadísticas admin
  useWebSocket({
    token: token,
    onStatsUpdate: (event) => {
      console.log('📊 [AdminReports] Stats event received:', event.type);
      
      // Si el evento es para admin, refetch las queries
      if (event.type === 'ADMIN_STATS_UPDATED') {
        console.log('🔄 [AdminReports] Refetching admin data');
        refetchStats();
        refetchCategorySales();
      }
    },
    debug: true
  });

  // Stats Cards
  const statCards = [
    {
      title: 'Ventas del Mes',
      value: statsData?.dashboard_stats?.month_revenue || 0,
      icon: TrendingUp,
      description: `${statsData?.dashboard_stats?.month_orders || 0} órdenes`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Productos Activos',
      value: statsData?.dashboard_stats?.total_products || 0,
      icon: Package,
      description: `${statsData?.dashboard_stats?.low_stock_products || 0} bajo stock`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Usuarios Activos',
      value:
        (statsData?.dashboard_stats?.total_active_clients || 0) +
        (statsData?.dashboard_stats?.total_active_sellers || 0),
      icon: Users,
      description: `${statsData?.dashboard_stats?.total_active_clients || 0} clientes, ${
        statsData?.dashboard_stats?.total_active_sellers || 0
      } vendedores`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Reportes y Análisis
        </h1>
        <p className="text-muted-foreground mt-2">
          Vista general del rendimiento del marketplace
        </p>
      </div>

      {/* Error Alerts */}
      {(statsError || categorySalesError || inventoryError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar datos:{' '}
            {statsError?.message ||
              categorySalesError?.message ||
              inventoryError?.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsLoading
          ? Array(3)
              .fill(0)
              .map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </CardContent>
                </Card>
              ))
          : statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-full ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stat.title.includes('Ventas')
                        ? `$${stat.value.toFixed(2)}`
                        : stat.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">
            <BarChart3 className="h-4 w-4 mr-2" />
            Ventas por Categoría
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="h-4 w-4 mr-2" />
            Inventario
          </TabsTrigger>
          <TabsTrigger value="deliveries">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Entregas
          </TabsTrigger>
        </TabsList>

        {/* Ventas por Categoría */}
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ventas por Categoría</CardTitle>
                  <CardDescription className="mt-1.5">
                    Período: {startDate} - {endDate}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (categorySalesData?.category_sales_report.categories) {
                        generateSalesReportPDF(
                          categorySalesData.category_sales_report.categories,
                          startDate,
                          endDate
                        );
                      }
                    }}
                    disabled={
                      categorySalesLoading ||
                      !categorySalesData?.category_sales_report.categories.length
                    }
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Ver PDF
                  </Button>
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selector de Fechas */}
              <div className="flex items-end gap-4 p-4 bg-gray-50 rounded-lg border">
                <div className="flex-1">
                  <Label htmlFor="start-date" className="text-sm font-medium">
                    Fecha Inicio
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="end-date" className="text-sm font-medium">
                    Fecha Fin
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button onClick={applyDateFilter} className="whitespace-nowrap">
                  Aplicar Filtro
                </Button>
              </div>

              {categorySalesLoading ? (
                <div className="space-y-4">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
              ) : categorySalesData?.category_sales_report.categories.length ===
                0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No hay ventas en el período seleccionado ({startDate} - {endDate}). 
                    Las ventas aparecerán aquí cuando haya órdenes completadas.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Gráfico de Barras */}
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categorySalesData?.category_sales_report.categories || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category_name" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="total_sales" fill="#8b5cf6" name="Ventas ($)" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="total_orders" fill="#3b82f6" name="Órdenes" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Gráfico de Pastel */}
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySalesData?.category_sales_report.categories || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category_name, percent }: any) =>
                            `${category_name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="total_sales"
                          nameKey="category_name"
                        >
                          {categorySalesData?.category_sales_report.categories.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tabla de Datos */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Detalle por Categoría</h4>
                    {categorySalesData?.category_sales_report.categories.map(
                      (category) => (
                        <div
                          key={category.category_id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {category.category_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {category.total_orders} órdenes •{' '}
                              {category.products_count} productos
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              ${category.total_sales.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Total ventas
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventario */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Estado del Inventario</CardTitle>
                  <CardDescription>
                    Productos con stock crítico (menos de 10 unidades)
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (inventoryData?.inventory_report) {
                      generateInventoryReportPDF(inventoryData.inventory_report);
                    }
                  }}
                  disabled={inventoryLoading || !inventoryData?.inventory_report}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Ver PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <div className="space-y-4">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 border rounded-lg bg-green-50">
                      <p className="text-3xl font-bold text-green-600">
                        {inventoryData?.inventory_report.total_products || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total Productos
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg bg-red-50">
                      <p className="text-3xl font-bold text-red-600">
                        {inventoryData?.inventory_report.out_of_stock || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Sin Stock
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg bg-yellow-50">
                      <p className="text-3xl font-bold text-yellow-600">
                        {inventoryData?.inventory_report.low_stock || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Stock Bajo
                      </p>
                    </div>
                  </div>

                  {/* Gráfico de Estado de Inventario */}
                  <div className="mb-6">
                    <h4 className="font-semibold mb-4">Distribución de Stock</h4>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            {
                              estado: 'Stock OK',
                              cantidad:
                                (inventoryData?.inventory_report.total_products || 0) -
                                (inventoryData?.inventory_report.out_of_stock || 0) -
                                (inventoryData?.inventory_report.low_stock || 0),
                            },
                            {
                              estado: 'Stock Bajo',
                              cantidad: inventoryData?.inventory_report.low_stock || 0,
                            },
                            {
                              estado: 'Sin Stock',
                              cantidad: inventoryData?.inventory_report.out_of_stock || 0,
                            },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="estado" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="cantidad" radius={[8, 8, 0, 0]}>
                            {[
                              <Cell key="cell-0" fill="#10b981" />,
                              <Cell key="cell-1" fill="#f59e0b" />,
                              <Cell key="cell-2" fill="#ef4444" />,
                            ]}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Critical Products */}
                  {inventoryData?.inventory_report.critical_products.length ===
                  0 ? (
                    <Alert className="bg-green-50 border-green-200">
                      <AlertCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        ¡Excelente! No hay productos con stock crítico. Todos los productos tienen inventario saludable. 🎉
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        Productos Críticos
                      </h4>
                      {inventoryData?.inventory_report.critical_products.map(
                        (product) => (
                          <div
                            key={product.product_id}
                            className="flex items-center justify-between p-4 border rounded-lg bg-red-50"
                          >
                            <div className="flex-1">
                              <h3 className="font-semibold">
                                {product.product_name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Vendedor: {product.seller_name} • Estado:{' '}
                                {product.status}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-red-600">
                                {product.current_stock}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Mínimo: {product.min_stock_threshold}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entregas */}
        <TabsContent value="deliveries">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Entregas</CardTitle>
              <CardDescription>
                Próximamente: Reporte de entregas pendientes y completadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Esta sección estará disponible cuando haya datos de entregas.
                  Actualmente no hay entregas pendientes:{' '}
                  {statsData?.dashboard_stats?.pending_deliveries || 0}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
