/**
 * Product Detail Page
 * Página de detalle completo de un producto
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProductById, getProductReviews, getMyOrders } from '@/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import ReviewDialog from '@/components/ReviewDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Minus,
  Plus,
  Store,
  Package,
  Truck,
  Shield,
  ChevronRight,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Product } from '@/types/api';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedProductOrderId, setSelectedProductOrderId] = useState<number | null>(null);
  const [hoverStar, setHoverStar] = useState(0);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(Number(id)),
    enabled: !!id,
  });

  // Obtener reseñas del producto
  const { data: reviews = [] } = useQuery({
    queryKey: ['product-reviews', id],
    queryFn: () => getProductReviews(Number(id)),
    enabled: !!id,
  });

  // Obtener órdenes del usuario para verificar si compró este producto
  const { data: myOrders = [] } = useQuery({
    queryKey: ['myOrders'],
    queryFn: getMyOrders,
    enabled: isAuthenticated && user?.role === 'client',
  });

  // Verificar si el usuario compró este producto y si ya lo valoró
  const purchaseInfo = useMemo(() => {
    if (!isAuthenticated || !product || !myOrders.length) {
      return { hasPurchased: false, canReview: false, productOrderId: null, alreadyReviewed: false };
    }

    // Buscar si el usuario compró este producto
    let productOrderId: number | null = null;
    let alreadyReviewed = false;

    for (const order of myOrders) {
      // Solo considerar órdenes completadas
      if (order.status === 'completed' && order.productOrders) {
        for (const productOrder of order.productOrders) {
          if (productOrder.id_product === product.id_product) {
            // Encontramos que el usuario compró este producto
            productOrderId = productOrder.id_product_order;
            
            // Verificar si ya tiene rating
            if (productOrder.rating && productOrder.rating > 0) {
              alreadyReviewed = true;
            }
            break;
          }
        }
      }
      if (productOrderId) break;
    }

    return {
      hasPurchased: productOrderId !== null,
      canReview: productOrderId !== null && !alreadyReviewed,
      productOrderId,
      alreadyReviewed,
    };
  }, [isAuthenticated, product, myOrders]);

  // Calcular promedio de rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 1)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para agregar productos al carrito",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!product) return;

    try {
      await addItem(product.id_product, quantity);
      toast({
        title: "¡Producto agregado!",
        description: `${quantity} ${quantity === 1 ? 'producto agregado' : 'productos agregados'} al carrito`,
      });
      setQuantity(1); // Reset quantity
    } catch (error: any) {
      console.error('Error agregando al carrito:', error);
      
      let errorMessage = "No se pudo agregar el producto al carrito";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleReviewClick = () => {
    // 1. Verificar autenticación
    if (!isAuthenticated) {
      toast({
        title: "⭐ Inicia sesión para valorar",
        description: "Debes tener una cuenta para dejar tu opinión sobre este producto",
        variant: "destructive",
      });
      // Esperar un poco antes de redirigir para que se vea el mensaje
      setTimeout(() => navigate('/login'), 1000);
      return;
    }

    // 2. Verificar que sea un cliente
    if (user?.role !== 'client') {
      toast({
        title: "Solo clientes pueden valorar",
        description: "Las valoraciones solo están disponibles para cuentas de cliente",
        variant: "destructive",
      });
      return;
    }

    // 3. Verificar que haya comprado el producto
    if (!purchaseInfo.hasPurchased) {
      toast({
        title: "🛒 Compra requerida",
        description: "Solo puedes valorar productos que hayas comprado y recibido",
        variant: "destructive",
      });
      return;
    }

    // 4. Verificar que no haya valorado ya
    if (purchaseInfo.alreadyReviewed) {
      toast({
        title: "✅ Ya valoraste este producto",
        description: "Solo puedes dejar una valoración por compra. ¡Gracias por tu opinión!",
      });
      return;
    }

    // 5. Todo OK - Abrir el diálogo
    if (purchaseInfo.productOrderId) {
      setSelectedProductOrderId(purchaseInfo.productOrderId);
      setReviewDialogOpen(true);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Producto no encontrado</h3>
            <p className="text-muted-foreground mb-4">
              El producto que buscas no existe o fue eliminado
            </p>
            <Button onClick={() => navigate('/products')}>
              Ver todos los productos
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Mock images (ya que solo tenemos una)
  const productImages = [
    product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Espaciador para el navbar fixed */}
      <div className="h-16"></div>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Inicio</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/products" className="hover:text-foreground">Productos</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{product.product_name}</span>
        </div>

        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 -ml-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images Gallery */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="relative aspect-square bg-muted">
                <img
                  src={productImages[selectedImage]}
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                />
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Badge variant="destructive" className="text-lg py-2 px-4">
                      Agotado
                    </Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* Thumbnail images - Solo mostramos si hay más de 1 */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === idx ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt={`${product.product_name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and stock badge */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-3xl font-bold">{product.product_name}</h1>
                <Badge variant="secondary">
                  {product.stock} disponibles
                </Badge>
              </div>
              
              {/* Sección de valoración interactiva */}
              <div className="space-y-3">
                <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">
                          {purchaseInfo.canReview 
                            ? '¿Qué te pareció este producto?' 
                            : purchaseInfo.alreadyReviewed
                              ? 'Ya valoraste este producto'
                              : !isAuthenticated
                                ? 'Inicia sesión para valorar'
                                : 'Compra este producto para valorar'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {purchaseInfo.canReview 
                            ? 'Haz clic para dejar tu calificación' 
                            : !isAuthenticated
                              ? 'Solo usuarios registrados pueden valorar'
                              : purchaseInfo.hasPurchased
                                ? 'Gracias por tu opinión'
                                : 'Solo puedes valorar productos que hayas comprado'}
                        </p>
                      </div>
                      
                      {/* Estrellas interactivas */}
                      <div 
                        className="flex items-center gap-1"
                        onMouseLeave={() => setHoverStar(0)}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={handleReviewClick}
                            onMouseEnter={() => purchaseInfo.canReview && setHoverStar(star)}
                            disabled={!purchaseInfo.canReview && isAuthenticated && purchaseInfo.hasPurchased}
                            className={`transition-all focus:outline-none focus:ring-2 focus:ring-primary rounded ${
                              purchaseInfo.canReview 
                                ? 'hover:scale-125 cursor-pointer animate-pulse' 
                                : isAuthenticated && purchaseInfo.hasPurchased
                                  ? 'cursor-not-allowed opacity-50'
                                  : 'cursor-pointer hover:scale-110'
                            }`}
                            title={
                              purchaseInfo.canReview 
                                ? 'Haz clic para valorar' 
                                : !isAuthenticated
                                  ? 'Inicia sesión para valorar'
                                  : purchaseInfo.alreadyReviewed
                                    ? 'Ya valoraste este producto'
                                    : 'Compra este producto para valorar'
                            }
                          >
                            <Star
                              className={`h-7 w-7 transition-all ${
                                purchaseInfo.canReview
                                  ? hoverStar >= star
                                    ? 'fill-yellow-400 text-yellow-400 drop-shadow-lg'
                                    : 'text-primary'
                                  : purchaseInfo.alreadyReviewed
                                    ? 'fill-green-500 text-green-500'
                                    : 'text-muted-foreground'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Impuestos incluidos</p>
            </div>

            <Separator />

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Descripción</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Cantidad</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (product.stock || 0)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  Total: {formatPrice(product.price * quantity)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="h-5 w-5" />
                {product.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="lg" className="gap-2">
                  <Heart className="h-5 w-5" />
                  Favorito
                </Button>
                <Button variant="outline" size="lg" className="gap-2">
                  <Share2 className="h-5 w-5" />
                  Compartir
                </Button>
              </div>
            </div>

            {/* Features */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <span>Envío disponible en Manta</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span>Compra protegida</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Store className="h-5 w-5 text-muted-foreground" />
                  <span>Vendido por emprendedor local</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-12">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="seller">Vendedor</TabsTrigger>
              <TabsTrigger value="reviews">Reseñas ({reviews.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Información del Producto</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Stock disponible:</span>
                      <p className="font-medium">{product.stock} unidades</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">ID del producto:</span>
                      <p className="font-medium">#{product.id_product}</p>
                    </div>
                    {product.created_at && (
                      <div>
                        <span className="text-sm text-muted-foreground">Publicado:</span>
                        <p className="font-medium">
                          {new Date(product.created_at).toLocaleDateString('es-EC', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seller" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        <Store className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">
                        {product.seller?.seller_name || 'Emprendedor del Espigón'}
                      </h3>
                      {product.seller?.bussines_name && (
                        <p className="text-sm text-muted-foreground mb-3">
                          <Store className="h-4 w-4 inline mr-1" />
                          {product.seller.bussines_name}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mb-4">
                        Vendedor verificado del Parque El Espigón en Manta, Ecuador. 
                        Ofrecemos productos de calidad con atención personalizada.
                      </p>
                      <Button variant="outline">Ver perfil del vendedor</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">
                      Reseñas de clientes ({reviews.length})
                    </h3>
                    
                    {/* Botón para valorar */}
                    {isAuthenticated && user?.role === 'client' && (
                      <Button 
                        onClick={handleReviewClick}
                        disabled={!purchaseInfo.canReview}
                        className="gap-2"
                      >
                        <Star className="h-4 w-4" />
                        {purchaseInfo.alreadyReviewed 
                          ? 'Ya valoraste' 
                          : purchaseInfo.hasPurchased 
                            ? 'Valorar producto'
                            : 'Compra para valorar'}
                      </Button>
                    )}
                    
                    {!isAuthenticated && (
                      <Button 
                        onClick={handleReviewClick}
                        variant="outline"
                        className="gap-2"
                      >
                        <Star className="h-4 w-4" />
                        Inicia sesión para valorar
                      </Button>
                    )}
                  </div>

                  {/* Mensaje informativo */}
                  {isAuthenticated && user?.role === 'client' && !purchaseInfo.hasPurchased && (
                    <Alert className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Compra este producto para poder dejar una valoración
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <MessageSquare className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        No hay reseñas todavía. ¡Sé el primero en dejar una!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((review, index) => (
                        <div key={review.id_product_order}>
                          {index > 0 && <Separator />}
                          <div className="space-y-2 pt-4">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${
                                      i < (review.rating || 0)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-medium">
                                {review.rating === 5 && 'Excelente'}
                                {review.rating === 4 && 'Bueno'}
                                {review.rating === 3 && 'Regular'}
                                {review.rating === 2 && 'Malo'}
                                {review.rating === 1 && 'Muy malo'}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                • {review.reviewed_at && new Date(review.reviewed_at).toLocaleDateString('es-EC', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            {review.review_comment && (
                              <p className="text-sm text-muted-foreground pl-1">
                                {review.review_comment}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Review Dialog */}
      {selectedProductOrderId && product && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          productOrderId={selectedProductOrderId}
          productId={product.id_product}
          productName={product.product_name}
        />
      )}
    </div>
  );
};

export default ProductDetail;
