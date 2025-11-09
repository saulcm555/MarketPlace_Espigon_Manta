/**
 * Checkout Page
 * Página de proceso de pago con dirección, método de pago y confirmación
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { createOrder, uploadPaymentReceipt, updateOrderPaymentReceipt, getPaymentMethods } from '@/api';
import { compressImage, validateImageFile, formatFileSize } from '@/lib/imageCompression';
import type { PaymentMethod } from '@/types/api';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Package,
  CreditCard,
  MapPin,
  Phone,
  CheckCircle,
  Truck,
  Upload,
  X,
  FileText,
  Building2,
  User,
} from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, totalAmount, clear } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);

  // Form states
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: 'Manta',
    province: 'Manabí',
    zipCode: '',
    phone: '',
    notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('1'); // 1 = Efectivo por defecto
  
  // Payment receipt states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const products = cart?.products || cart?.productCarts || [];
    if (!cart || products.length === 0) {
      navigate('/products');
      return;
    }

    // Cargar métodos de pago
    loadPaymentMethods();
  }, [isAuthenticated, cart, navigate]);

  const loadPaymentMethods = async () => {
    try {
      setIsLoadingMethods(true);
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error al cargar métodos de pago:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los métodos de pago",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMethods(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar archivo
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

      // Comprimir solo si es imagen (no PDF)
      let processedFile = file;
      if (file.type.startsWith('image/')) {
        processedFile = await compressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
        });
        
        toast({
          title: "Imagen comprimida",
          description: `Tamaño original: ${formatFileSize(file.size)} → Comprimido: ${formatFileSize(processedFile.size)}`,
        });
      }

      setSelectedFile(processedFile);

      // Crear preview
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cart || !user) return;

    // Validaciones básicas
    if (!deliveryAddress.street || !deliveryAddress.phone) {
      toast({
        title: "Faltan datos",
        description: "Por favor completa la dirección de entrega y teléfono",
        variant: "destructive",
      });
      return;
    }

    // Validar que el carrito tenga productos
    if (!cartItems || cartItems.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "No hay productos en tu carrito para procesar",
        variant: "destructive",
      });
      return;
    }

    // Validar que todos los productos tengan precio
    const invalidProducts = cartItems.filter(item => !item.product?.price || item.product.price <= 0);
    if (invalidProducts.length > 0) {
      toast({
        title: "Error en productos",
        description: "Algunos productos no tienen precio válido",
        variant: "destructive",
      });
      return;
    }

    // Si seleccionó transferencia bancaria, validar que tenga comprobante
    const selectedMethod = paymentMethods.find(m => m.id === parseInt(paymentMethod));
    const isTransfer = selectedMethod?.method_name?.toLowerCase().includes('transferencia');
    
    if (isTransfer && !selectedFile) {
      toast({
        title: "Falta comprobante",
        description: "Por favor sube el comprobante de transferencia",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      let receiptUrl: string | undefined;

      // 1. Si hay archivo, subirlo primero
      if (selectedFile) {
        toast({
          title: "Subiendo comprobante...",
          description: "Por favor espera",
        });

        const uploadResult = await uploadPaymentReceipt(selectedFile);
        receiptUrl = uploadResult.url;
      }

      // 2. Crear la orden
      const addressString = `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.province}${deliveryAddress.zipCode ? `, ${deliveryAddress.zipCode}` : ''}. Tel: ${deliveryAddress.phone}${deliveryAddress.notes ? `. Notas: ${deliveryAddress.notes}` : ''}`;

      // Construir productOrders desde el carrito
      const productOrders = cartItems.map(item => ({
        id_product: item.product?.id_product || 0,
        quantity: item.quantity,
        price_unit: item.product?.price || 0
      }));

      const orderData = {
        id_client: user.id,
        id_cart: cart.id_cart,
        id_payment_method: parseInt(paymentMethod),
        total_amount: total,
        delivery_type: 'home_delivery', // Por defecto entrega a domicilio
        delivery_address: addressString,
        payment_receipt_url: receiptUrl,
        productOrders: productOrders
      };

      const newOrder = await createOrder(orderData);

      // Limpiar carrito después de crear orden
      await clear();

      // Mostrar mensaje según el método de pago
      if (isTransfer) {
        toast({
          title: "¡Pedido creado!",
          description: `Tu pedido #${newOrder.id} está esperando verificación del pago`,
        });
      } else {
        toast({
          title: "¡Pedido realizado!",
          description: `Tu pedido #${newOrder.id} ha sido creado exitosamente`,
        });
      }

      // Redirigir a la página de éxito (tu compañero creó esta página)
      navigate(`/order-success/${newOrder.id}`);
    } catch (error: any) {
      console.error('Error al crear orden:', error);
      
      // Determinar el mensaje de error específico
      let errorMessage = "No se pudo procesar el pedido";
      let errorTitle = "Error al procesar pedido";
      
      if (error.response?.data?.message) {
        const message = error.response.data.message;
        
        // Casos específicos de error
        if (message.includes('Stock insuficiente')) {
          errorTitle = "Stock insuficiente";
          errorMessage = message.replace('⚠️ ', '');
        } else if (message.includes('no encontrado')) {
          errorTitle = "Producto no disponible";
          errorMessage = "Algunos productos ya no están disponibles";
        } else if (message.includes('carrito')) {
          errorTitle = "Problema con el carrito";
          errorMessage = message;
        } else {
          errorMessage = message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!cart) return null;

  const cartItems = cart.products || cart.productCarts || [];
  const shipping = 3; // $3 de envío fijo
  const total = totalAmount + shipping;

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
            onClick={() => navigate('/products')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a productos
          </Button>

          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground">
            Completa tu pedido
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Dirección de entrega
                  </CardTitle>
                  <CardDescription>
                    ¿Dónde quieres recibir tu pedido?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Calle y número *</Label>
                    <Input
                      id="street"
                      placeholder="Av. Principal 123"
                      value={deliveryAddress.street}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        value={deliveryAddress.city}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province">Provincia</Label>
                      <Input
                        id="province"
                        value={deliveryAddress.province}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, province: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Código Postal (opcional)</Label>
                      <Input
                        id="zipCode"
                        placeholder="130101"
                        value={deliveryAddress.zipCode}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, zipCode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="0999999999"
                        value={deliveryAddress.phone}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas de entrega (opcional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Ej: Casa color azul, tocar el timbre"
                      value={deliveryAddress.notes}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Método de pago
                  </CardTitle>
                  <CardDescription>
                    Selecciona cómo deseas pagar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingMethods ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Cargando métodos de pago...
                    </div>
                  ) : (
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      {paymentMethods.map((method) => {
                        const isTransfer = method.method_name?.toLowerCase().includes('transferencia');
                        
                        return (
                          <div key={method.id} className="space-y-3">
                            <div className="flex items-center space-x-3 space-y-0 border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                              <RadioGroupItem value={method.id.toString()} id={`method-${method.id}`} />
                              <Label htmlFor={`method-${method.id}`} className="flex-1 cursor-pointer">
                                <div className="font-medium">{method.method_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {method.description}
                                </div>
                              </Label>
                            </div>

                            {/* Mostrar detalles bancarios si es transferencia y está seleccionado */}
                            {isTransfer && paymentMethod === method.id.toString() && method.details && (
                              <div className="ml-9 border-l-2 border-primary pl-4 space-y-3">
                                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                  <p className="text-sm font-semibold text-primary mb-3">
                                    Realiza la transferencia a esta cuenta:
                                  </p>
                                  
                                  {method.details.banco && (
                                    <div className="flex items-start gap-2">
                                      <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">Banco</p>
                                        <p className="text-sm font-medium">{method.details.banco}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {method.details.tipo_cuenta && (
                                    <div className="flex items-start gap-2">
                                      <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">Tipo de cuenta</p>
                                        <p className="text-sm font-medium">{method.details.tipo_cuenta}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {method.details.numero_cuenta && (
                                    <div className="flex items-start gap-2">
                                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">Número de cuenta</p>
                                        <p className="text-sm font-mono font-bold">{method.details.numero_cuenta}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {method.details.titular && (
                                    <div className="flex items-start gap-2">
                                      <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">Titular</p>
                                        <p className="text-sm font-medium">{method.details.titular}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Upload del comprobante */}
                                <div className="space-y-2">
                                  <Label htmlFor="receipt">
                                    Comprobante de pago *
                                  </Label>
                                  
                                  {!selectedFile ? (
                                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                                      <input
                                        id="receipt"
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={handleFileChange}
                                        disabled={isCompressing}
                                        className="hidden"
                                      />
                                      <Label htmlFor="receipt" className="cursor-pointer">
                                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                        <p className="text-sm font-medium">
                                          {isCompressing ? 'Comprimiendo...' : 'Haz clic para subir el comprobante'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          JPG, PNG, WEBP o PDF (máx. 5 MB)
                                        </p>
                                      </Label>
                                    </div>
                                  ) : (
                                    <div className="border rounded-lg p-4 space-y-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                          {filePreview && selectedFile.type.startsWith('image/') ? (
                                            <img
                                              src={filePreview}
                                              alt="Preview"
                                              className="w-20 h-20 object-cover rounded border"
                                            />
                                          ) : (
                                            <div className="w-20 h-20 bg-muted rounded border flex items-center justify-center">
                                              <FileText className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                              {selectedFile.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {formatFileSize(selectedFile.size)}
                                            </p>
                                            <Badge variant="secondary" className="mt-1">
                                              Listo para subir
                                            </Badge>
                                          </div>
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
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </RadioGroup>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Resumen del pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Products */}
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                          {item.product?.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.product?.product_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Cantidad: {item.quantity}
                          </p>
                        </div>
                        <div className="text-sm font-semibold">
                          {formatPrice((item.product?.price || 0) * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Envío</span>
                      <span className="font-medium">{formatPrice(shipping)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Procesando pedido...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Confirmar pedido por {formatPrice(total)}
                      </>
                    )}
                  </Button>

                  {/* Info */}
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                    <Truck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Tu pedido será preparado y enviado en las próximas 24-48 horas
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
