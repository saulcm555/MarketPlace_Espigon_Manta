/**
 * Checkout Page
 * Página de proceso de pago con dirección, método de pago y confirmación
 */

import { useState, useEffect, useRef } from 'react';
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
  const { cart, totalAmount, clear, closeCart, isLoading: isLoadingCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  const hasLoadedMethods = useRef(false);

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
  const [deliveryType, setDeliveryType] = useState('home_delivery'); // Opciones: home_delivery, pickup
  
  // Payment receipt states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Card payment states (visual only)
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  // Efecto para verificar autenticación
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Efecto para verificar carrito y cargar métodos de pago
  useEffect(() => {
    if (!isAuthenticated || isLoadingCart) {
      return;
    }

    const products = cart?.products || cart?.productCarts || [];
    
    if (!cart || products.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "No tienes productos en tu carrito",
        variant: "destructive",
      });
      navigate('/products');
      return;
    }

    // Cargar métodos de pago solo una vez
    if (!hasLoadedMethods.current) {
      hasLoadedMethods.current = true;
      loadPaymentMethods();
    }
  }, [isAuthenticated, cart, isLoadingCart]);

  const loadPaymentMethods = async () => {
    try {
      setIsLoadingMethods(true);
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
      
      // Si no hay métodos de pago, usar uno por defecto
      if (methods.length === 0) {
        toast({
          title: "Aviso",
          description: "No hay métodos de pago disponibles. Contacta al administrador.",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los métodos de pago",
        variant: "destructive",
      });
      // Continuar aunque falle, permitir que el usuario vea el checkout
      setPaymentMethods([]);
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

    // Validaciones básicas - Solo requerir dirección si es envío a domicilio
    if (deliveryType === 'home_delivery') {
      if (!deliveryAddress.street || !deliveryAddress.phone) {
        toast({
          title: "Faltan datos",
          description: "Por favor completa la dirección de entrega y teléfono",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Para retiro en el puesto, solo validar teléfono
      if (!deliveryAddress.phone) {
        toast({
          title: "Falta teléfono",
          description: "Por favor ingresa un número de contacto",
          variant: "destructive",
        });
        return;
      }
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
    const selectedMethod = paymentMethods.find(m => 
      (m.id_payment_method || m.id) === parseInt(paymentMethod)
    );
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
        try {
          toast({
            title: "Subiendo comprobante...",
            description: "Por favor espera",
          });

          const uploadResult = await uploadPaymentReceipt(selectedFile);
          receiptUrl = uploadResult.url;
        } catch (uploadError: any) {
          console.error('Error al subir comprobante:', uploadError);
          
          // Si falla la subida del comprobante, informar al usuario
          toast({
            title: "Error al subir comprobante",
            description: uploadError.response?.data?.message || 
                        "No se pudo subir el comprobante. Verifica tu conexión o intenta con otro archivo.",
            variant: "destructive",
          });
          
          setIsProcessing(false);
          return; // Detener el proceso si falla la subida
        }
      }

      // 2. Crear la orden
      // Construir la dirección según el tipo de entrega
      let addressString: string;
      if (deliveryType === 'pickup') {
        // Para retiro en el puesto, solo incluir teléfono y notas
        addressString = `Retiro en el puesto. Tel: ${deliveryAddress.phone}${deliveryAddress.notes ? `. Notas: ${deliveryAddress.notes}` : ''}`;
      } else {
        // Para envío a domicilio, incluir dirección completa
        addressString = `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.province}${deliveryAddress.zipCode ? `, ${deliveryAddress.zipCode}` : ''}. Tel: ${deliveryAddress.phone}${deliveryAddress.notes ? `. Notas: ${deliveryAddress.notes}` : ''}`;
      }

      // Construir productOrders desde el carrito
      const productOrders = cartItems.map((item) => {
        const priceUnit = typeof item.product?.price === 'string' 
          ? parseFloat(item.product.price) 
          : (item.product?.price || 0);
        return {
          id_product: item.product?.id_product || 0,
          quantity: item.quantity,
          price_unit: priceUnit
        };
      });

      const orderData = {
        id_client: user.id,
        id_cart: cart.id_cart,
        id_payment_method: parseInt(paymentMethod),
        delivery_type: deliveryType,
        delivery_address: addressString,
        payment_receipt_url: receiptUrl,
        productOrders: productOrders
      };

      const newOrder = await createOrder(orderData);
      const orderId = (newOrder as any).id_order || newOrder.id;
      const paymentStatus = (newOrder as any).payment_status;
      const transactionId = (newOrder as any).transaction_id;

      // Limpiar el carrito antes de mostrar el mensaje de éxito
      await clear();
      closeCart();

      // Mostrar mensaje según el estado del pago
      if (paymentStatus === 'paid') {
        toast({
          title: "💳 ¡Pago exitoso!",
          description: `Pedido #${orderId} confirmado. Transacción: ${transactionId?.slice(0, 20)}...`,
        });
      } else if (paymentStatus === 'failed') {
        toast({
          title: "❌ Pago fallido",
          description: `Pedido #${orderId} creado pero el pago no pudo procesarse. Intenta nuevamente.`,
          variant: "destructive",
        });
      } else if (isTransfer) {
        toast({
          title: "¡Pedido creado!",
          description: `Tu pedido #${orderId} está esperando verificación del pago`,
        });
      } else {
        toast({
          title: "¡Pedido realizado!",
          description: `Tu pedido #${orderId} ha sido creado exitosamente`,
        });
      }
      
      navigate(`/order-success/${orderId}`);
    } catch (error: any) {
      let errorMessage = "No se pudo procesar el pedido";
      let errorTitle = "Error al procesar pedido";
      const errors = error.response?.data?.errors || error.errors;
      if (errors && Array.isArray(errors)) {
        errorTitle = "Errores de validación";
        errorMessage = errors.map((err: any) => 
          `${err.path || err.field || err.param || ''}: ${err.msg || err.message || JSON.stringify(err)}`
        ).join('\n');
      } else if (error.response?.data?.message) {
        const message = error.response.data.message;
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

  // Mostrar loading mientras carga el carrito
  if (isLoadingCart) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-16"></div>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-muted-foreground">Cargando checkout...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si después de cargar no hay carrito, mostrar mensaje
  if (!cart) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-16"></div>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Carrito vacío</h2>
              <p className="text-muted-foreground mb-4">No tienes productos en tu carrito</p>
              <Button onClick={() => navigate('/products')}>
                Ver Productos
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cartItems = cart.products || cart.productCarts || [];
  
  // Calcular costo de envío basado en el tipo de entrega
  const shipping = deliveryType === 'pickup' ? 0 : 3; // $0 para retiro, $3 para envío a domicilio
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
              {/* Delivery Type Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Tipo de entrega
                  </CardTitle>
                  <CardDescription>
                    Elige cómo recibirás tu pedido
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
                    <div className="flex items-center space-x-3 border rounded-lg p-4 mb-2">
                      <RadioGroupItem value="home_delivery" id="delivery-home" />
                      <Label htmlFor="delivery-home" className="flex-1 cursor-pointer">
                        Envío a domicilio
                        <span className="block text-xs text-muted-foreground">Recibe tu pedido en la dirección que indiques</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 border rounded-lg p-4">
                      <RadioGroupItem value="pickup" id="delivery-pickup" />
                      <Label htmlFor="delivery-pickup" className="flex-1 cursor-pointer">
                        Retiro en el puesto
                        <span className="block text-xs text-muted-foreground">Retira tu pedido directamente en el local del emprendimiento</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
              
              {/* Teléfono de contacto - Mostrar siempre para retiro en el puesto */}
              {deliveryType === 'pickup' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Información de contacto
                    </CardTitle>
                    <CardDescription>
                      Ingresa un teléfono para coordinar el retiro
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone-pickup">Teléfono de contacto *</Label>
                      <Input
                        id="phone-pickup"
                        type="tel"
                        placeholder="0999999999"
                        value={deliveryAddress.phone}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes-pickup">Notas adicionales (opcional)</Label>
                      <Textarea
                        id="notes-pickup"
                        placeholder="Ej: Prefiero retirar en la tarde"
                        value={deliveryAddress.notes}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Delivery Address - Solo mostrar si es envío a domicilio */}
              {deliveryType === 'home_delivery' && (
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
              )}

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
                        const methodId = method.id_payment_method || method.id;
                        const isTransfer = method.method_name?.toLowerCase().includes('transferencia');
                        
                        // Parsear details_payment si viene como string JSON
                        let details = method.details;
                        if (typeof method.details_payment === 'string' && method.details_payment) {
                          try {
                            // Intentar parsear solo si parece ser JSON (empieza con { o [)
                            const trimmed = method.details_payment.trim();
                            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                              details = JSON.parse(method.details_payment);
                            } else {
                              // Si no es JSON, usar como descripción
                              details = { description: method.details_payment };
                            }
                          } catch (e) {
                            console.error('Error parsing details_payment for method:', method.method_name, e);
                            // Si falla el parseo, usar el texto como descripción
                            details = { description: method.details_payment };
                          }
                        }
                        
                        return (
                          <div key={methodId} className="space-y-3">
                            <div className="flex items-center space-x-3 space-y-0 border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                              <RadioGroupItem value={methodId?.toString() || ''} id={`method-${methodId}`} />
                              <Label htmlFor={`method-${methodId}`} className="flex-1 cursor-pointer">
                                <div className="font-medium">{method.method_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {method.description}
                                </div>
                              </Label>
                            </div>

                            {/* Formulario visual de tarjeta (solo para estética) */}
                            {method.method_name?.toLowerCase().includes('tarjeta') && 
                             paymentMethod === methodId?.toString() && (
                              <div className="ml-9 border-l-2 border-primary pl-4 space-y-3">
                                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 space-y-4">
                                  <p className="text-sm font-semibold text-primary mb-3">
                                    💳 Información de la tarjeta
                                  </p>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="cardNumber" className="text-xs">Número de tarjeta</Label>
                                    <Input
                                      id="cardNumber"
                                      placeholder="1234 5678 9012 3456"
                                      value={cardData.cardNumber}
                                      onChange={(e) => {
                                        let value = e.target.value.replace(/\s/g, '');
                                        if (value.length <= 16 && /^\d*$/.test(value)) {
                                          value = value.match(/.{1,4}/g)?.join(' ') || value;
                                          setCardData({ ...cardData, cardNumber: value });
                                        }
                                      }}
                                      maxLength={19}
                                      className="font-mono"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="cardName" className="text-xs">Nombre en la tarjeta</Label>
                                    <Input
                                      id="cardName"
                                      placeholder="JUAN PÉREZ"
                                      value={cardData.cardName}
                                      onChange={(e) => setCardData({ ...cardData, cardName: e.target.value.toUpperCase() })}
                                      className="uppercase"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="expiryDate" className="text-xs">Fecha de vencimiento</Label>
                                      <Input
                                        id="expiryDate"
                                        placeholder="MM/AA"
                                        value={cardData.expiryDate}
                                        onChange={(e) => {
                                          let value = e.target.value.replace(/\D/g, '');
                                          if (value.length <= 4) {
                                            if (value.length >= 2) {
                                              value = value.slice(0, 2) + '/' + value.slice(2);
                                            }
                                            setCardData({ ...cardData, expiryDate: value });
                                          }
                                        }}
                                        maxLength={5}
                                        className="font-mono"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="cvv" className="text-xs">CVV</Label>
                                      <Input
                                        id="cvv"
                                        placeholder="123"
                                        type="password"
                                        value={cardData.cvv}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/\D/g, '');
                                          if (value.length <= 4) {
                                            setCardData({ ...cardData, cvv: value });
                                          }
                                        }}
                                        maxLength={4}
                                        className="font-mono"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Pago procesado de forma segura</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Mostrar detalles bancarios si es transferencia y está seleccionado */}
                            {isTransfer && paymentMethod === methodId?.toString() && details && (
                              <div className="ml-9 border-l-2 border-primary pl-4 space-y-3">
                                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                  <p className="text-sm font-semibold text-primary mb-3">
                                    Realiza la transferencia a esta cuenta:
                                  </p>
                                  
                                  {details.banco && (
                                    <div className="flex items-start gap-2">
                                      <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">Banco</p>
                                        <p className="text-sm font-medium">{details.banco}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {details.tipo_cuenta && (
                                    <div className="flex items-start gap-2">
                                      <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">Tipo de cuenta</p>
                                        <p className="text-sm font-medium">{details.tipo_cuenta}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {details.numero_cuenta && (
                                    <div className="flex items-start gap-2">
                                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">Número de cuenta</p>
                                        <p className="text-sm font-mono font-bold">{details.numero_cuenta}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {details.titular && (
                                    <div className="flex items-start gap-2">
                                      <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">Titular</p>
                                        <p className="text-sm font-medium">{details.titular}</p>
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
                      <span className="text-muted-foreground">
                        Envío {deliveryType === 'pickup' && '(Retiro en el puesto)'}
                      </span>
                      <span className="font-medium">
                        {shipping === 0 ? (
                          <span className="text-green-600">Gratis</span>
                        ) : (
                          formatPrice(shipping)
                        )}
                      </span>
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
                      {deliveryType === 'pickup' ? (
                        'Tu pedido será preparado en las próximas 24-48 horas y podrás retirarlo en el puesto'
                      ) : (
                        'Tu pedido será preparado y enviado en las próximas 24-48 horas'
                      )}
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
