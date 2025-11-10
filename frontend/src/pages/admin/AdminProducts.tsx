import { useEffect, useState } from 'react';
import { Search, Filter, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import apiClient from '@/api/client';

interface Product {
  id_product: number;
  product_name: string;
  product_description: string;
  price: number;
  stock: number;
  image_url: string;
  status?: 'pending' | 'active' | 'inactive' | 'rejected';
  id_seller: number;
  id_category: number;
  created_at: string;
}

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, sellersRes, categoriesRes] = await Promise.all([
        apiClient.get('/products?limit=100'), // Máximo permitido por el backend
        apiClient.get('/sellers'),
        apiClient.get('/categories'),
      ]);

      // El endpoint /products devuelve un objeto con { products: [], pagination: {} }
      const productsData = productsRes.data?.products || productsRes.data;
      const sellersData = sellersRes.data?.sellers || sellersRes.data;
      const categoriesData = categoriesRes.data?.categories || categoriesRes.data;

      // Asegurar que los datos sean arrays
      setProducts(Array.isArray(productsData) ? productsData : []);
      setSellers(Array.isArray(sellersData) ? sellersData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos');
      // Inicializar con arrays vacíos en caso de error
      setProducts([]);
      setSellers([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    // Proteger contra valores no-array
    if (!Array.isArray(products)) {
      setFilteredProducts([]);
      return;
    }

    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(p => {
        const seller = sellers.find(s => s.id_seller === p.id_seller);
        return (
          p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          seller?.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => (p.status || 'active') === statusFilter);
    }

    setFilteredProducts(filtered);
  };

  const handleApprove = async (productId: number) => {
    try {
      await apiClient.put(`/products/${productId}`, { status: 'active' });
      toast.success('Producto aprobado exitosamente');
      fetchData();
      setIsDetailOpen(false);
    } catch (error) {
      toast.error('Error al aprobar producto');
    }
  };

  const handleReject = async () => {
    if (!selectedProduct || !rejectionReason.trim()) {
      toast.error('Debes especificar un motivo de rechazo');
      return;
    }

    try {
      await apiClient.put(`/products/${selectedProduct.id_product}`, {
        status: 'rejected',
        rejection_reason: rejectionReason,
      });
      toast.success('Producto rechazado');
      fetchData();
      setIsRejectDialogOpen(false);
      setIsDetailOpen(false);
      setRejectionReason('');
    } catch (error) {
      toast.error('Error al rechazar producto');
    }
  };

  const openDetailDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const openRejectDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsRejectDialogOpen(true);
  };

  const getStatusBadge = (status?: string) => {
    const actualStatus = status || 'active';
    const variants: Record<string, { variant: any; label: string; class: string }> = {
      pending: { variant: 'secondary', label: '⏳ Pendiente', class: 'bg-yellow-100 text-yellow-800' },
      active: { variant: 'default', label: '✅ Activo', class: 'bg-green-100 text-green-800' },
      inactive: { variant: 'outline', label: '⏸️ Inactivo', class: 'bg-gray-100 text-gray-800' },
      rejected: { variant: 'destructive', label: '❌ Rechazado', class: 'bg-red-100 text-red-800' },
    };

    const config = variants[actualStatus] || variants.active;
    return (
      <Badge variant={config.variant} className={config.class}>
        {config.label}
      </Badge>
    );
  };

  const getSellerInfo = (sellerId: number) => {
    return sellers.find(s => s.id_seller === sellerId);
  };

  const getCategoryInfo = (categoryId: number) => {
    return categories.find(c => c.id_category === categoryId);
  };

  const pendingCount = Array.isArray(products) 
    ? products.filter(p => (p.status || 'active') === 'pending').length 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Productos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona y aprueba los productos del marketplace
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="text-lg px-4 py-2 bg-yellow-100 text-yellow-800">
            {pendingCount} pendientes de aprobación
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{products.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Productos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {products.filter(p => (p.status || 'active') === 'pending').length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Pendientes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {products.filter(p => (p.status || 'active') === 'active').length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Activos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {products.filter(p => (p.status || 'active') === 'rejected').length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Rechazados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o vendedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos ({products.length})</SelectItem>
                <SelectItem value="pending">
                  Pendientes ({products.filter(p => (p.status || 'active') === 'pending').length})
                </SelectItem>
                <SelectItem value="active">
                  Activos ({products.filter(p => (p.status || 'active') === 'active').length})
                </SelectItem>
                <SelectItem value="rejected">
                  Rechazados ({products.filter(p => (p.status || 'active') === 'rejected').length})
                </SelectItem>
                <SelectItem value="inactive">
                  Inactivos ({products.filter(p => (p.status || 'active') === 'inactive').length})
                </SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchData}>
              <Filter className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const seller = getSellerInfo(product.id_seller);
          const category = getCategoryInfo(product.id_category);

          return (
            <Card key={product.id_product} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative">
                <img
                  src={product.image_url || '/placeholder-product.png'}
                  alt={product.product_name}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-product.png';
                  }}
                />
                <div className="absolute top-2 right-2">
                  {getStatusBadge(product.status)}
                </div>
              </div>

              <CardHeader>
                <CardTitle className="text-lg line-clamp-1">
                  {product.product_name}
                </CardTitle>
                <CardDescription className="flex justify-between text-sm">
                  <span>Por: {seller?.business_name || 'Desconocido'}</span>
                  <span className="font-bold text-primary">
                    ${Number(product.price).toFixed(2)}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock:</span>
                    <span className={product.stock < 10 ? 'text-orange-600 font-medium' : ''}>
                      {product.stock} unidades
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoría:</span>
                    <span>{category?.category_name || 'Sin categoría'}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openDetailDialog(product)}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    Ver
                  </Button>

                  {(product.status || 'active') === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(product.id_product)}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Aprobar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openRejectDialog(product)}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No se encontraron productos con los filtros seleccionados
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog Detalle */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProduct.product_name}</DialogTitle>
                <DialogDescription>
                  Publicado por {getSellerInfo(selectedProduct.id_seller)?.business_name || 'Desconocido'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.product_name}
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-product.png';
                  }}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Precio</Label>
                    <p className="text-2xl font-bold">${Number(selectedProduct.price).toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Stock</Label>
                    <p className="text-2xl">{selectedProduct.stock}</p>
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <p>{getCategoryInfo(selectedProduct.id_category)?.category_name || 'Sin categoría'}</p>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    {getStatusBadge(selectedProduct.status)}
                  </div>
                </div>

                <div>
                  <Label>Descripción</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedProduct.product_description}
                  </p>
                </div>

                <div>
                  <Label>Vendedor</Label>
                  <Card className="mt-2">
                    <CardContent className="pt-4">
                      <p className="font-medium">{getSellerInfo(selectedProduct.id_seller)?.business_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getSellerInfo(selectedProduct.id_seller)?.seller_name}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {(selectedProduct.status || 'active') === 'pending' && (
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailOpen(false)}
                  >
                    Cerrar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => openRejectDialog(selectedProduct)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                  <Button 
                    onClick={() => handleApprove(selectedProduct.id_product)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprobar
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Rechazar */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Producto</DialogTitle>
            <DialogDescription>
              Especifica el motivo del rechazo para notificar al vendedor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Motivo del rechazo *</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ej: La descripción no coincide con la imagen, precio muy elevado, información incompleta..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectionReason('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Rechazar Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
