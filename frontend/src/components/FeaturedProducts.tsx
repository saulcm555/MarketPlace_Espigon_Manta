import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAllProducts, formatPrice } from "@/api/products";
import { Link, useNavigate } from "react-router-dom";
import type { Product } from "@/types/api";

const FeaturedProducts = () => {
  const navigate = useNavigate();
  
  // Fetch products from API
  const { data: products, isLoading, isError, error } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: getAllProducts,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Loading state
  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Productos Destacados
            </h2>
            <p className="text-muted-foreground">
              Los favoritos de nuestra comunidad
            </p>
          </div>
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (isError) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Productos Destacados
            </h2>
            <p className="text-muted-foreground">
              Los favoritos de nuestra comunidad
            </p>
          </div>
          <div className="flex flex-col justify-center items-center min-h-[400px] gap-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-muted-foreground">
              Error al cargar los productos. Por favor intenta de nuevo más tarde.
            </p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Error desconocido'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Get featured products (limit to 4-8)
  const featuredProducts = products?.slice(0, 8) || [];
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Productos Destacados
          </h2>
          <p className="text-muted-foreground">
            Los favoritos de nuestra comunidad
          </p>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hay productos disponibles en este momento.
            </p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {featuredProducts.map((product) => (
                <Card 
                  key={product.id_product} 
                  className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/products/${product.id_product}`)}
                >
                  <div className="relative overflow-hidden aspect-square">
                    <img 
                      src={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop"}
                      alt={product.product_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.stock < 5 && product.stock > 0 && (
                      <Badge className="absolute top-3 right-3 bg-orange-500 text-white">
                        Últimas unidades
                      </Badge>
                    )}
                    {product.stock === 0 && (
                      <Badge className="absolute top-3 right-3 bg-red-500 text-white">
                        Agotado
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <p className="text-sm text-primary font-medium mb-1">
                      {product.seller?.seller_name || 'Vendedor'}
                    </p>
                    <h3 className="font-semibold mb-2 line-clamp-2 min-h-[48px]">
                      {product.product_name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">4.5</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({product.stock} disponibles)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">
                        {formatPrice(product.price)}
                      </span>
                      <Button 
                        size="sm" 
                        disabled={product.stock === 0}
                        className="gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Agregar al carrito
                        }}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {product.stock === 0 ? 'Agotado' : 'Agregar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Link to="/products">
                <Button variant="outline" size="lg">
                  Ver Todos los Productos ({products?.length || 0})
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;