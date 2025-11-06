import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Heart } from "lucide-react";

const products = [
  {
    name: "Artesanía Marina",
    vendor: "María's Crafts",
    price: "$25.00",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&h=500&fit=crop",
    badge: "Nuevo"
  },
  {
    name: "Café Manabita",
    vendor: "Café del Puerto",
    price: "$12.50",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500&h=500&fit=crop",
    badge: "Popular"
  },
  {
    name: "Joyería Artesanal",
    vendor: "Tesoros del Espigón",
    price: "$35.00",
    rating: 5.0,
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop",
    badge: "Destacado"
  },
  {
    name: "Camiseta Playera",
    vendor: "Manta Style",
    price: "$18.00",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
    badge: "Oferta"
  }
];

const FeaturedProducts = () => {
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {products.map((product, index) => (
            <Card key={index} className="group overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative overflow-hidden aspect-square">
                <img 
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                  {product.badge}
                </Badge>
              </div>

              <CardContent className="p-4">
                <p className="text-sm text-primary font-medium mb-1">
                  {product.vendor}
                </p>
                <h3 className="font-semibold mb-2">
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold">{product.rating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary">{product.price}</span>
                  <Button size="sm">
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" size="lg">
            Ver Todos los Productos
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;