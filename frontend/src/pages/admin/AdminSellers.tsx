import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Store,
  Users,
  CheckCircle,
  XCircle,
  MoreVertical,
  Search,
  Eye,
  Trash2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from 'lucide-react';
import apiClient from '@/api/client';
import { toast } from 'sonner';
import { GET_ALL_SELLERS } from '@/graphql/adminSellers';

interface Seller {
  id_seller: number;
  seller_name: string;
  seller_email: string;
  phone: string;
  bussines_name: string;
  location: string;
  created_at: string;
}

interface SellerDetails extends Seller {
  products_count?: number;
  active_products?: number;
  total_sales?: number;
  orders_count?: number;
}

export function AdminSellers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeller, setSelectedSeller] = useState<SellerDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sellerToDelete, setSellerToDelete] = useState<Seller | null>(null);

  // GraphQL Query
  const { data, loading, error, refetch } = useQuery<{ all_sellers: Seller[] }>(
    GET_ALL_SELLERS
  );

  // Filtrar vendedores por búsqueda
  const filteredSellers = data?.all_sellers.filter(
    (seller) =>
      seller.seller_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.bussines_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.seller_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estadísticas
  const stats = {
    total: data?.all_sellers.length || 0,
    active: data?.all_sellers.length || 0,
    pending: 0,
    inactive: 0,
  };

  // Ver detalles del vendedor
  const handleViewDetails = async (seller: Seller) => {
    try {
      const productsResponse = await apiClient.get('/products', {
        params: { id_seller: seller.id_seller, limit: 100 },
      });

      const products = productsResponse.data.products || [];
      const activeProducts = products.filter((p: any) => p.status === 'active').length;

      const sellerDetails: SellerDetails = {
        ...seller,
        products_count: products.length,
        active_products: activeProducts,
        total_sales: 0,
        orders_count: 0,
      };

      setSelectedSeller(sellerDetails);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching seller details:', error);
      toast.error('Error al cargar los detalles del vendedor');
    }
  };

  // Eliminar vendedor
  const handleDeleteSeller = async () => {
    if (!sellerToDelete) return;

    try {
      await apiClient.delete(`/sellers/${sellerToDelete.id_seller}`);
      toast.success(`Vendedor ${sellerToDelete.seller_name} eliminado correctamente`);
      setIsDeleteDialogOpen(false);
      setSellerToDelete(null);
      refetch();
    } catch (error: any) {
      console.error('Error deleting seller:', error);
      toast.error(
        error.response?.data?.message || 'Error al eliminar el vendedor'
      );
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Gestión de Vendedores
        </h1>
        <p className="text-muted-foreground mt-2">
          Administra los vendedores de tu marketplace
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar vendedores: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendedores</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Registrados en la plataforma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Pueden vender</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Esperando aprobación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Desactivados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Vendedores */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Vendedores</CardTitle>
              <CardDescription>
                {filteredSellers?.length || 0} vendedores encontrados
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar vendedor..."
                  className="pl-8 w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
          ) : filteredSellers && filteredSellers.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Negocio</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSellers.map((seller) => (
                    <TableRow key={seller.id_seller}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {seller.seller_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{seller.seller_name}</p>
                            <p className="text-sm text-muted-foreground">
                              ID: {seller.id_seller}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{seller.bussines_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{seller.seller_email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{seller.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{seller.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(seller.created_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-500">
                          Activo
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(seller)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSellerToDelete(seller);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No hay vendedores</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'No se encontraron vendedores con ese criterio de búsqueda'
                  : 'Aún no hay vendedores registrados'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalles del Vendedor */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Vendedor</DialogTitle>
            <DialogDescription>
              Información completa sobre el vendedor y su actividad
            </DialogDescription>
          </DialogHeader>

          {selectedSeller && (
            <div className="space-y-6">
              {/* Información Personal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="font-medium">{selectedSeller.seller_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedSeller.seller_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{selectedSeller.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ubicación</p>
                      <p className="font-medium">{selectedSeller.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Fecha de Registro
                      </p>
                      <p className="font-medium">
                        {formatDate(selectedSeller.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <Badge variant="default" className="bg-green-500">
                        Activo
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información del Negocio */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información del Negocio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre del Negocio</p>
                      <p className="font-medium">{selectedSeller.bussines_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Productos</p>
                      <p className="font-medium">{selectedSeller.products_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Productos Activos</p>
                      <p className="font-medium text-green-600">
                        {selectedSeller.active_products || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Estadísticas de Ventas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estadísticas de Ventas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Ventas</p>
                      <p className="text-2xl font-bold">
                        ${selectedSeller.total_sales?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Órdenes Completadas</p>
                      <p className="text-2xl font-bold">
                        {selectedSeller.orders_count || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmación de Eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar Vendedor?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará el vendedor{' '}
              <span className="font-semibold">{sellerToDelete?.seller_name}</span> y
              toda su información asociada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSellerToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteSeller}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
