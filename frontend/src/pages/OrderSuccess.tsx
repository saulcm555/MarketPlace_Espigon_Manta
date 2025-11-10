/**
 * Order Success Page
 * Página de confirmación después de realizar un pedido exitosamente
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrderById } from '@/api';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Package,
  Calendar,
  MapPin,
  ArrowRight,
  Home,
  Receipt,
  CreditCard
} from 'lucide-react';

const OrderSuccess = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(Number(id)),
    enabled: !!id,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Redirigir si no hay ID de orden
  useEffect(() => {
    if (!id) {
      navigate('/');
    }
  }, [id, navigate]);

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-16"></div>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Cargando información del pedido...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Espaciador para el navbar fixed */}
      <div className="h-16"></div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header de éxito */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">
              ¡Pedido realizado con éxito!
            </h1>
            <p className="text-muted-foreground">
              Tu pedido #{(order as any).id_order || order.id} ha sido confirmado y está siendo procesado
            </p>
          </div>

          {/* Resumen del pedido */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Resumen del pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Fecha:</span>
                </div>
                <span className="font-medium">
                  {new Date(order.order_date).toLocaleDateString('es-EC')}
                </span>

                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Estado:</span>
                </div>
                <Badge variant="secondary" className="w-fit">
                  Pendiente
                </Badge>

                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Método de pago:</span>
                </div>
                <span className="font-medium">
                  {order.payment_method?.method_name || 'No especificado'}
                </span>

                {order.delivery_address && (
                  <>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Entrega:</span>
                    </div>
                    <span className="font-medium text-sm">
                      {order.delivery_address.split('.')[0]}
                    </span>
                  </>
                )}
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total pagado:</span>
                <span className="text-primary">{formatPrice(order.total_amount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Productos del pedido */}
          {order.productOrders && order.productOrders.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Productos pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.productOrders.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{item.product?.product_name || 'Producto'}</p>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity} × {formatPrice(item.price_unit)}
                        </p>
                      </div>
                      <span className="font-medium">
                        {formatPrice(item.subtotal || (item.quantity * item.price_unit))}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información importante */}
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-semibold text-blue-900 mb-2">
                  ¿Qué sigue ahora?
                </h3>
                <p className="text-blue-800 text-sm mb-4">
                  {order.delivery_type === 'pickup' ? (
                    <>
                      Hemos notificado al vendedor sobre tu pedido. Te contactaremos pronto 
                      para coordinar el retiro en el puesto.
                    </>
                  ) : (
                    <>
                      Hemos notificado al vendedor sobre tu pedido. Te contactaremos pronto 
                      para coordinar la entrega.
                    </>
                  )}
                </p>
                <p className="text-blue-700 text-xs">
                  Tiempo estimado de preparación: 24-48 horas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => navigate(`/orders/${(order as any).id_order || order.id}`)}
              className="flex-1"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Ver detalles completos
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/orders')}
              className="flex-1"
            >
              <Package className="w-4 h-4 mr-2" />
              Mis pedidos
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Inicio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;