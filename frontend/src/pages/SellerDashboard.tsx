/**
 * Seller Dashboard Page
 * Panel principal del vendedor con estadísticas y resumen
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { getProductsBySeller } from '@/api';
import Navbar from '@/components/Navbar';
import SellerPaymentVerification from '@/components/SellerPaymentVerification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { Product } from '@/types/api';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Obtener ID del vendedor actual
  const sellerId = user?.id_seller || user?.id;
  
  // Obtener productos del vendedor
  const { data: myProducts = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', 'seller', sellerId],
    queryFn: () => getProductsBySeller(sellerId!),
    enabled: !!sellerId && isAuthenticated && user?.role === 'seller',
  });

  // Productos destacados (últimos 6)
  const featuredProducts = myProducts.slice(0, 6);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Verificar que el usuario sea vendedor
  if (!isAuthenticated || user?.role !== 'seller') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-16"></div>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-bold mb-2">Acceso Denegado</h2>
              <p className="text-muted-foreground mb-4">
                Esta sección es solo para vendedores
              </p>
              <Button onClick={() => navigate('/')}>
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Mock data - En producción, esto vendría de la API
  const stats = {
    totalProducts: myProducts.length,
    totalOrders: 45,
    totalRevenue: 1250.50,
    pendingOrders: 8,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Espaciador para el navbar fixed */}
      <div className="h-16"></div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al perfil
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Mi Tienda</h1>
              <p className="text-muted-foreground">
                Gestiona tus productos y pedidos
              </p>
            </div>
            <Button onClick={() => navigate('/seller/products/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Productos
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                En tu inventario
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Pedidos
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOrders} pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ingresos Totales
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Este mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Crecimiento
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12.5%</div>
              <p className="text-xs text-muted-foreground">
                vs mes anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="analytics">Análisis</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mis Productos</CardTitle>
                    <CardDescription>
                      Gestiona tu inventario de productos
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => navigate('/seller/products')}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Todos
                    </Button>
                    <Button onClick={() => navigate('/seller/products/new')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Producto
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingProducts ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : myProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      No tienes productos aún
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Comienza agregando tu primer producto
                    </p>
                    <Button onClick={() => navigate('/seller/products/new')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Primer Producto
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {featuredProducts.map((product: Product) => (
                        <Card key={product.id_product} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="aspect-video bg-muted relative">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.product_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-1 line-clamp-1">
                              {product.product_name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {product.description || 'Sin descripción'}
                            </p>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(product.price)}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Stock: {product.stock}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => navigate(`/seller/products/${product.id_product}/edit`)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {myProducts.length > 6 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" onClick={() => navigate('/seller/products')}>
                          Ver todos los {myProducts.length} productos
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            {/* Payment Verification */}
            <SellerPaymentVerification />

            {/* Orders List */}
            <Card>
              <CardHeader>
                <CardTitle>Todos los Pedidos</CardTitle>
                <CardDescription>
                  Gestiona los pedidos de tus clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    Lista de pedidos
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Revisa y actualiza el estado de los pedidos
                  </p>
                  <Button onClick={() => navigate('/seller/orders')}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Todos los Pedidos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análisis y Estadísticas</CardTitle>
                <CardDescription>
                  Próximamente: Gráficos y análisis detallados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    En desarrollo
                  </h3>
                  <p className="text-muted-foreground">
                    Pronto podrás ver análisis detallados de tus ventas
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SellerDashboard;
