/**
 * Checkout Page
 * Página de proceso de pago con dirección, método de pago y confirmación
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { createOrder } from '@/api';
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
} from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, totalAmount, clear } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

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

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!cart || cart.products?.length === 0) {
      navigate('/products');
      return;
    }
  }, [isAuthenticated, cart, navigate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cart || !user) return;

    // Validaciones
    if (!deliveryAddress.street || !deliveryAddress.phone) {
      toast({
        title: "Faltan datos",
        description: "Por favor completa la dirección de entrega y teléfono",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const addressString = `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.province}${deliveryAddress.zipCode ? `, ${deliveryAddress.zipCode}` : ''}. Tel: ${deliveryAddress.phone}${deliveryAddress.notes ? `. Notas: ${deliveryAddress.notes}` : ''}`;

      const orderData = {
        id_client: user.id,
        id_cart: cart.id,
        id_payment_method: parseInt(paymentMethod),
        total_amount: totalAmount,
        delivery_address: addressString,
      };

      const newOrder = await createOrder(orderData);

      // Limpiar carrito después de crear orden
      await clear();

      toast({
        title: "¡Pedido realizado!",
        description: `Tu pedido #${newOrder.id} ha sido creado exitosamente`,
      });

      // Redirigir a la página de confirmación o historial
      navigate(`/orders/${newOrder.id}`);
    } catch (error: any) {
      console.error('Error al crear orden:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo procesar el pedido",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!cart) return null;

  const cartItems = cart.products || [];
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
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-3 space-y-0 border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="1" id="cash" />
                      <Label htmlFor="cash" className="flex-1 cursor-pointer">
                        <div className="font-medium">Efectivo</div>
                        <div className="text-sm text-muted-foreground">
                          Paga al recibir tu pedido
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 space-y-0 border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="2" id="card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer">
                        <div className="font-medium">Tarjeta de crédito/débito</div>
                        <div className="text-sm text-muted-foreground">
                          Paga de forma segura
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 space-y-0 border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="3" id="transfer" />
                      <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                        <div className="font-medium">Transferencia bancaria</div>
                        <div className="text-sm text-muted-foreground">
                          Coordina con el vendedor
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
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
                      'Procesando...'
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Confirmar pedido
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
