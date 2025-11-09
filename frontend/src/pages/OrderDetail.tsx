/**
 * Order Detail Page
 * Detalle completo de un pedido específico
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrderById, getOrderStatusColor, getOrderStatusText, uploadPaymentReceipt, updateOrderPaymentReceipt } from '@/api';
import { compressImage, validateImageFile, formatFileSize } from '@/lib/imageCompression';
import { useState } from 'react';
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
  FileText,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Image as ImageIcon,
} from 'lucide-react';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(Number(id)),
    enabled: !!id,
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !order) throw new Error('No file selected');
      
      const uploadResult = await uploadPaymentReceipt(selectedFile);
      await updateOrderPaymentReceipt(order.id, uploadResult.url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast({
        title: "Comprobante actualizado",
        description: "El comprobante ha sido subido exitosamente",
      });
      setSelectedFile(null);
      setFilePreview(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo subir el comprobante",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "Archivo inválido",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCompressing(true);

      let processedFile = file;
      if (file.type.startsWith('image/')) {
        processedFile = await compressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
        });
        
        toast({
          title: "Imagen comprimida",
          description: `Tamaño: ${formatFileSize(file.size)} → ${formatFileSize(processedFile.size)}`,
        });
      }

      setSelectedFile(processedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(processedFile);

    } catch (error) {
      console.error('Error al procesar archivo:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el archivo",
        variant: "destructive",
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleUploadReceipt = () => {
    uploadReceiptMutation.mutate();
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-16"></div>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-6" />
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-full mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-16"></div>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-bold mb-2">Pedido no encontrado</h2>
              <p className="text-muted-foreground mb-4">
                No pudimos encontrar este pedido
              </p>
              <Button onClick={() => navigate('/orders')}>
                Ver todos los pedidos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const cartItems = order.cart?.products || [];

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
            onClick={() => navigate('/orders')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a pedidos
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Pedido #{order.id}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(order.order_date)}
              </p>
            </div>
            <Badge variant={getOrderStatusColor(order.status) as any} className="text-sm">
              {getOrderStatusText(order.status)}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="w-20 h-20 bg-background rounded-md overflow-hidden flex-shrink-0">
                        {item.product?.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate mb-1">
                          {item.product?.product_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-primary mt-1">
                          {formatPrice(item.product?.price || 0)} × {item.quantity}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">
                          {formatPrice((item.product?.price || 0) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
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
                </CardContent>
              </Card>
            )}

            {/* Payment Receipt Section */}
            {(order.payment_receipt_url || order.status === 'payment_rejected') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Comprobante de pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status Badge */}
                  {order.status === 'payment_pending_verification' && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Esperando verificación
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                          Tu comprobante está siendo revisado por el vendedor
                        </p>
                      </div>
                    </div>
                  )}

                  {order.payment_verified_at && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Pago verificado
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          Verificado el {formatDate(order.payment_verified_at)}
                        </p>
                      </div>
                    </div>
                  )}

                  {order.status === 'payment_rejected' && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          Pago rechazado
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300">
                          Por favor, sube un nuevo comprobante válido
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Receipt Image */}
                  {order.payment_receipt_url && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="relative group">
                        {order.payment_receipt_url.toLowerCase().endsWith('.pdf') ? (
                          <div className="aspect-video bg-muted flex items-center justify-center">
                            <FileText className="h-16 w-16 text-muted-foreground" />
                          </div>
                        ) : (
                          <img
                            src={order.payment_receipt_url}
                            alt="Comprobante de pago"
                            className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setShowReceiptModal(true)}
                          />
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute bottom-2 right-2"
                          onClick={() => window.open(order.payment_receipt_url, '_blank')}
                        >
                          Ver completo
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Upload new receipt if rejected */}
                  {order.status === 'payment_rejected' && (
                    <div className="space-y-3">
                      <Separator />
                      <p className="text-sm font-medium">Subir nuevo comprobante:</p>
                      
                      {!selectedFile ? (
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          <input
                            id="new-receipt"
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFileChange}
                            disabled={isCompressing}
                            className="hidden"
                          />
                          <label htmlFor="new-receipt" className="cursor-pointer">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              {isCompressing ? 'Comprimiendo...' : 'Seleccionar archivo'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              JPG, PNG, WEBP o PDF (máx. 5 MB)
                            </p>
                          </label>
                        </div>
                      ) : (
                        <div className="border rounded-lg p-3 space-y-3">
                          <div className="flex items-start gap-3">
                            {filePreview && selectedFile.type.startsWith('image/') ? (
                              <img
                                src={filePreview}
                                alt="Preview"
                                className="w-16 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{selectedFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(selectedFile.size)}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={removeFile}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            onClick={handleUploadReceipt}
                            disabled={uploadReceiptMutation.isPending}
                            className="w-full"
                          >
                            {uploadReceiptMutation.isPending ? 'Subiendo...' : 'Actualizar comprobante'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Resumen del pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Method */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CreditCard className="h-4 w-4" />
                    Método de pago
                  </div>
                  <p className="font-medium">
                    {order.payment_method?.method_name || 'No especificado'}
                  </p>
                </div>

                <Separator />

                {/* Client Info */}
                {order.client && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <User className="h-4 w-4" />
                      Cliente
                    </div>
                    <p className="font-medium">{order.client.name}</p>
                    <p className="text-sm text-muted-foreground">{order.client.email}</p>
                  </div>
                )}

                <Separator />

                {/* Total */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {formatPrice(order.total_amount - 3)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Envío</span>
                    <span className="font-medium">{formatPrice(3)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(order.total_amount)}</span>
                  </div>
                </div>

                {/* Actions */}
                {order.status === 'pending' && (
                  <>
                    <Separator />
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        // TODO: Implementar cancelación
                      }}
                    >
                      Cancelar pedido
                    </Button>
                  </>
                )}

                {order.status === 'completed' && (
                  <>
                    <Separator />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // TODO: Implementar reseña
                      }}
                    >
                      Dejar reseña
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
