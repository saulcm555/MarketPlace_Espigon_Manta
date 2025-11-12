/**
 * Entrepreneurs Page
 * Muestra todos los vendedores/emprendedores registrados
 */

import { useQuery } from '@tanstack/react-query';
import { getAllSellers } from '@/api';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  User,
  MapPin, 
  Phone, 
  Mail, 
  ShoppingBag,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Entrepreneurs = () => {
  // Fetch sellers
  const { data: sellers = [], isLoading, error } = useQuery({
    queryKey: ['sellers'],
    queryFn: getAllSellers,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Nuestros Emprendedores</h1>
          <p className="text-muted-foreground">
            Conoce a los vendedores locales del Parque El Espigón
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Cargando emprendedores...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Error al cargar</h2>
            <p className="text-muted-foreground">
              No se pudieron cargar los emprendedores. Intenta nuevamente.
            </p>
          </div>
        )}

        {/* Sellers Grid */}
        {!isLoading && !error && sellers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Store className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No hay emprendedores aún</h2>
            <p className="text-muted-foreground mb-6">
              Sé el primero en registrarte como vendedor
            </p>
            <Link to="/register-seller">
              <Button>
                <Store className="mr-2 h-4 w-4" />
                Registrarse como Vendedor
              </Button>
            </Link>
          </div>
        )}

        {!isLoading && !error && sellers.length > 0 && (
          <>
            {/* Stats */}
            <div className="mb-6">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {sellers.length} {sellers.length === 1 ? 'Emprendedor' : 'Emprendedores'}
              </Badge>
            </div>

            {/* Grid de vendedores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sellers.map((seller) => (
                <Card key={seller.id_seller} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">
                          {seller.bussines_name ? (
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-muted-foreground" />
                              <span>{seller.bussines_name}</span>
                            </div>
                          ) : (
                            <span>{seller.seller_name}</span>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          Vendedor #{seller.id_seller}
                        </CardDescription>
                      </div>
                      <Badge variant="default">Activo</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Nombre del vendedor */}
                    {seller.bussines_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">{seller.seller_name}</span>
                      </div>
                    )}

                    {/* Teléfono */}
                    {seller.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <a 
                          href={`tel:${seller.phone}`}
                          className="hover:underline text-primary"
                        >
                          {seller.phone}
                        </a>
                      </div>
                    )}

                    {/* Email */}
                    {seller.seller_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <a 
                          href={`mailto:${seller.seller_email}`}
                          className="hover:underline text-primary truncate"
                        >
                          {seller.seller_email}
                        </a>
                      </div>
                    )}

                    {/* Ubicación */}
                    {seller.location && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{seller.location}</span>
                      </div>
                    )}

                    {/* Botón ver productos */}
                    <div className="pt-4">
                      <Link to={`/products?seller=${seller.id_seller}`}>
                        <Button className="w-full" variant="outline">
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          Ver Productos
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Entrepreneurs;
