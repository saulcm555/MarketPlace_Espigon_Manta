/**
 * Seller Payment Verification Component
 * Panel para que los vendedores verifiquen pagos pendientes
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingPaymentOrders, verifyPayment } from '@/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  CheckCircle,
  XCircle,
  Package,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { Order } from '@/types/api';

const SellerPaymentVerification = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Helper para obtener el ID de la orden (backend usa id_order)
  const getOrderId = (order: any): number => {
    return order.id_order || order.id;
  };

  const { data: pendingOrders = [], isLoading } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: getPendingPaymentOrders,
    refetchInterval: 30000, // Refetch cada 30 segundos
  });

  const verifyMutation = useMutation({
    mutationFn: ({ orderId, approved }: { orderId: number; approved: boolean }) =>
      verifyPayment(orderId, approved),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      toast({
        title: variables.approved ? "Pago aprobado" : "Pago rechazado",
        description: variables.approved
          ? "El pedido continuará su proceso"
          : "El cliente podrá subir un nuevo comprobante",
      });
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo verificar el pago",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleApprove = (orderId: number) => {
    verifyMutation.mutate({ orderId, approved: true });
  };

  const handleReject = (orderId: number) => {
    verifyMutation.mutate({ orderId, approved: false });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pagos Pendientes de Verificación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pagos Pendientes de Verificación
            {pendingOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                {pendingOrders.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Revisa y aprueba los comprobantes de transferencia. Una vez aprobados, los pedidos pasarán a "Pedidos Activos".
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingOrders.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <p className="text-muted-foreground">
                No hay pagos pendientes de verificación
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map((order: Order) => {
                const orderId = getOrderId(order);
                return (
                <Card key={orderId} className="border-2">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">Pedido #{orderId}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(order.order_date)}
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendiente
                        </Badge>
                      </div>

                      <Separator />

                      {/* Client Info */}
                      {order.client && (
                        <div className="flex items-start gap-2 text-sm">
                          <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{order.client.name}</p>
                            <p className="text-xs text-muted-foreground">{order.client.email}</p>
                          </div>
                        </div>
                      )}

                      {/* Delivery Address */}
                      {order.delivery_address && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <p className="text-muted-foreground text-xs line-clamp-2">
                            {order.delivery_address}
                          </p>
                        </div>
                      )}

                      {/* Products */}
                      {order.cart?.products && order.cart.products.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            Productos ({order.cart.products.length})
                          </div>
                          <div className="ml-6 space-y-1">
                            {order.cart.products.map((item) => (
                              <div key={item.id} className="text-xs text-muted-foreground">
                                • {item.product?.product_name} x{item.quantity}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Total */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total:</span>
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(order.total_amount)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowReceiptModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver comprobante
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(orderId)}
                          disabled={verifyMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApprove(orderId)}
                          disabled={verifyMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Comprobante de pago - Pedido #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Verifica que el comprobante sea válido antes de aprobar
            </DialogDescription>
          </DialogHeader>

          {selectedOrder?.payment_receipt_url && (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Cliente</p>
                  <p className="font-medium">{selectedOrder.client?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Total</p>
                  <p className="font-medium text-primary">
                    {formatPrice(selectedOrder.total_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Fecha</p>
                  <p className="font-medium">{formatDate(selectedOrder.order_date)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Método de pago</p>
                  <p className="font-medium">{selectedOrder.payment_method?.method_name}</p>
                </div>
              </div>

              {/* Receipt Image */}
              <div className="border rounded-lg overflow-hidden">
                {selectedOrder.payment_receipt_url.toLowerCase().endsWith('.pdf') ? (
                  <div className="aspect-video bg-muted flex flex-col items-center justify-center p-8">
                    <FileText className="h-20 w-20 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Archivo PDF - Haz clic para abrir
                    </p>
                    <Button
                      onClick={() => window.open(selectedOrder.payment_receipt_url, '_blank')}
                    >
                      Abrir PDF
                    </Button>
                  </div>
                ) : (
                  <img
                    src={selectedOrder.payment_receipt_url}
                    alt="Comprobante de pago"
                    className="max-w-[350px] max-h-[350px] w-auto h-auto mx-auto rounded-lg border"
                    style={{ display: 'block' }}
                  />
                )}
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Importante
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Verifica que el monto, fecha y datos coincidan antes de aprobar el pago
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowReceiptModal(false)}
                >
                  Cerrar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleReject(getOrderId(selectedOrder));
                    setShowReceiptModal(false);
                  }}
                  disabled={verifyMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar pago
                </Button>
                <Button
                  onClick={() => {
                    handleApprove(getOrderId(selectedOrder));
                    setShowReceiptModal(false);
                  }}
                  disabled={verifyMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprobar pago
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SellerPaymentVerification;
