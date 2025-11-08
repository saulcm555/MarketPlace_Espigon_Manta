/**
 * Seller Products Management Page
 * Página para que el vendedor gestione sus productos (CRUD)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { getProductsBySeller, deleteProduct } from '@/api';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertCircle,
} from 'lucide-react';
import type { Product } from '@/types/api';

const SellerProducts = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Obtener ID del vendedor actual
  const sellerId = user?.id_seller || user?.id;
  
  // Obtener solo los productos de este vendedor
  const { data: myProducts = [], isLoading } = useQuery({
    queryKey: ['products', 'seller', sellerId],
    queryFn: () => getProductsBySeller(sellerId!),
    enabled: !!sellerId, // Solo ejecutar si hay un seller ID
  });

  // Filtrar por búsqueda local
  const filteredProducts = myProducts.filter((product: Product) =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mutation para eliminar producto
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ['products', 'seller', sellerId] });
      setProductToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo eliminar el producto",
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

  const handleDelete = () => {
    if (!productToDelete) return;
    deleteMutation.mutate(productToDelete.id_product);
  };

  // Verificar permisos
  if (!isAuthenticated || user?.role !== 'seller') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-16"></div>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-bold mb-2">Acceso Denegado</h2>
              <p className="text-muted-foreground mb-4">
                Esta sección es solo para vendedores
              </p>
              <Button onClick={() => navigate('/')}>Volver al inicio</Button>
            </CardContent>
          </Card>
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
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/seller/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al dashboard
          </Button>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Mis Productos</h1>
              <p className="text-muted-foreground">
                Gestiona tu inventario de productos
              </p>
            </div>
            <Button onClick={() => navigate('/seller/products/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Products List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando productos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {myProducts.length === 0 ? 'No tienes productos aún' : 'No se encontraron productos'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {myProducts.length === 0 
                  ? 'Comienza agregando tu primer producto'
                  : 'Intenta con otra búsqueda'
                }
              </p>
              {myProducts.length === 0 && (
                <Button onClick={() => navigate('/seller/products/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Producto
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product: Product) => (
              <Card key={product.id_product} className="overflow-hidden">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {product.stock === 0 && (
                    <Badge variant="destructive" className="absolute top-2 right-2">
                      Agotado
                    </Badge>
                  )}
                  {product.stock > 0 && product.stock <= 5 && (
                    <Badge variant="secondary" className="absolute top-2 right-2">
                      Poco stock
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1 truncate">
                    {product.product_name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(product.price)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stock: {product.stock} unidades
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/seller/products/${product.id_product}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setProductToDelete(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        {myProducts.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{myProducts.length}</div>
                <p className="text-xs text-muted-foreground">Total productos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {myProducts.filter((p: Product) => p.stock > 0).length}
                </div>
                <p className="text-xs text-muted-foreground">En stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {myProducts.filter((p: Product) => p.stock === 0).length}
                </div>
                <p className="text-xs text-muted-foreground">Agotados</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar "{productToDelete?.product_name}"? 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SellerProducts;
