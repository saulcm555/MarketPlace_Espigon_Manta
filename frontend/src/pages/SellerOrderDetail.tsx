/**
 * Seller Order Detail Page
 * Vista detallada de un pedido para vendedores
 * Permite marcar pedidos como entregados
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrderById, markOrderAsDelivered } from '@/api/orders';
import { getProductsBySeller } from '@/api';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Package,
  Calendar,
  MapPin,
  CreditCard,
  User,
  Phone,
  CheckCircle,
  Clock,
  DollarSign,
  Truck,
  ShoppingBag,
} from 'lucide-react';
import type { Order } from '@/types/api';

const SellerOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Obtener orden
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(Number(id)),
    enabled: !!id,
  });

  // Obtener productos del vendedor
  const { data: myProducts = [] } = useQuery({
    queryKey: ['products', 'seller', user?.id_seller || user?.id],
    queryFn: () => getProductsBySeller(user?.id_seller || user?.id!),
    enabled: !!(user?.id_seller || user?.id),
  });

  // Mutation para marcar como entregado
  const markAsDeliveredMutation = useMutation({
    mutationFn: () => markOrderAsDelivered(Number(id)),
    onSuccess: () => {
      toast({
        title: "✅ Pedido marcado como entregado",
        description: "El cliente ha sido notificado sobre la entrega",
      });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'seller'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo marcar el pedido como entregado",
        variant: "destructive",
      });
    },
  });

  const handleMarkAsDelivered = () => {
    if (confirm('¿Confirmas que el pedido ha sido entregado al cliente?')) {
      markAsDeliveredMutation.mutate();
    }
  };

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calcular productos del vendedor en este pedido
  const sellerProducts = order?.productOrders?.filter(po => 
    myProducts.some(p => p.id_product === po.id_product)
  ) || [];

  const sellerTotal = sellerProducts.reduce((sum, item) => {
    const subtotal = item.subtotal || (item.price_unit * item.quantity);
    return sum + (Number(subtotal) || 0);
  }, 0);

  // Verificar si el método de pago es en efectivo
  const isEfectivo = order?.payment_method?.method_name?.toLowerCase().includes('efectivo');

  // Puede marcar como entregado si:
  // 1. El pago está confirmado (payment_confirmed, processing, shipped)
  // 2. O si el pago es en efectivo y está en estado pending
  const canMarkAsDelivered = order && 
    sellerProducts.length > 0 && (
      ['payment_confirmed', 'processing', 'shipped'].includes(order.status) ||
      (order.status === 'pending' && isEfectivo)
    );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-16"></div>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-16"></div>
        <div className="container mx-auto px-4 py-8">
          <p>Pedido no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-16"></div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/seller/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al dashboard
          </Button>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Pedido #{order.id_order}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(order.order_date)}
              </p>
            </div>
            <Badge 
              variant={
                order.status === 'delivered' ? 'default' :
                order.status === 'payment_confirmed' ? 'default' :
                order.status === 'processing' ? 'default' :
                order.status === 'shipped' ? 'default' :
                order.status === 'cancelled' ? 'destructive' :
                'secondary'
              } 
              className={`text-sm ${
                order.status === 'delivered' ? 'bg-green-600' :
                order.status === 'payment_confirmed' ? 'bg-blue-600' :
                order.status === 'processing' ? 'bg-purple-600' :
                order.status === 'shipped' ? 'bg-indigo-600' :
                ''
              }`}
            >
              {order.status === 'delivered' ? '✓ Entregado' :
               order.status === 'payment_confirmed' ? 'Pago Confirmado' :
               order.status === 'processing' ? 'En Proceso' :
               order.status === 'shipped' ? 'En Camino' :
               order.status === 'cancelled' ? 'Cancelado' :
               order.status}
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Información principal */}
          <div className="md:col-span-2 space-y-6">
            {/* Productos del vendedor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Tus productos en este pedido ({sellerProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sellerProducts.map((item) => (
                    <div key={item.id_product_order} className="flex gap-4">
                      {item.product?.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product.product_name}
                          className="w-20 h-20 object-cover rounded-md"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.product?.product_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity} × {formatPrice(item.price_unit)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatPrice(item.subtotal || (item.price_unit * item.quantity))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Tu ganancia total:</span>
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(sellerTotal)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Información del cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.client && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="font-medium">{(order.client as any).client_name || order.client.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{order.client.email}</p>
                    </div>
                    {order.client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{order.client.phone}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Dirección de entrega */}
            {order.delivery_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Dirección de entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{order.delivery_address}</p>
                  {order.delivery_type && (
                    <Badge variant="outline" className="mt-2">
                      {order.delivery_type === 'home_delivery' ? (
                        <>
                          <Truck className="h-3 w-3 mr-1" />
                          Entrega a domicilio
                        </>
                      ) : (
                        <>
                          <Package className="h-3 w-3 mr-1" />
                          Retiro en tienda
                        </>
                      )}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panel lateral - Acciones */}
          <div className="space-y-6">
            {/* Acción principal */}
            {canMarkAsDelivered && (
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <CheckCircle className="h-5 w-5" />
                    Marcar como entregado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEfectivo && order.status === 'pending' && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-3">
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                        💵 Pago en efectivo
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        El cliente pagará al recibir el pedido
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Confirma que el pedido ha sido entregado al cliente para que pueda valorar los productos.
                  </p>
                  <Button
                    onClick={handleMarkAsDelivered}
                    disabled={markAsDeliveredMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {markAsDeliveredMutation.isPending ? (
                      <>
                        <Clock className="mr-2 h-5 w-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        {isEfectivo && order.status === 'pending' 
                          ? 'Confirmar Entrega y Pago' 
                          : 'Pedido Entregado'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {order.status === 'delivered' && (
              <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-semibold">Pedido entregado</p>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    El cliente ya puede valorar los productos
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Mensaje cuando el pedido requiere verificación de pago */}
            {!canMarkAsDelivered && order.status === 'payment_pending_verification' && (
              <Card className="border-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 mb-2">
                    <Clock className="h-5 w-5" />
                    <p className="font-semibold">Verificación pendiente</p>
                  </div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-500">
                    Debes verificar el pago antes de marcar como entregado
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Resumen del pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tus productos</span>
                  <span className="font-medium">{formatPrice(sellerTotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Total del pedido</span>
                  <span className="font-bold text-primary">{formatPrice(order.total_amount)}</span>
                </div>

                {/* Método de pago */}
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>Método de pago</span>
                  </div>
                  {order.payment_method && (
                    <p className="font-medium">{order.payment_method.method_name}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerOrderDetail;
