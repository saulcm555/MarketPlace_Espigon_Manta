import { useState, useEffect } from 'react';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ShoppingCart,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Search,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  DollarSign,
  User,
  Calendar,
  Truck,
  FileText,
  Image as ImageIcon,
  CheckSquare,
} from 'lucide-react';
import apiClient from '@/api/client';
import { toast } from 'sonner';

interface Client {
  client_name: string;
  client_email: string;
  phone: string;
  address?: string;
}

interface Product {
  id_product: number;
  product_name: string;
  image_url?: string;
}

interface ProductOrder {
  id_product_order: number;
  id_product: number;
  price_unit: number;
  subtotal: number;
  quantity?: number;
  product?: Product;
}

interface Delivery {
  id_delivery: number;
  delivery_name: string;
  delivery_status: string;
  address: string;
  estimated_delivery_date?: string;
}

interface PaymentMethod {
  id_payment_method: number;
  method_name: string;
}

interface Order {
  id_order: number;
  order_date: string;
  status: string;
  total_amount: number;
  delivery_type: string;
  payment_receipt_url?: string;
  payment_verified_at?: string;
  client?: Client;
  productOrders?: ProductOrder[];
  delivery?: Delivery;
  paymentMethod?: PaymentMethod;
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  
  const [newStatus, setNewStatus] = useState('');
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Cargar órdenes
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/orders');
      setOrders(response.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filtrar órdenes
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id_order.toString().includes(searchTerm) ||
      order.client?.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
    
    let matchesPayment = true;
    if (paymentFilter === 'verified') {
      matchesPayment = !!order.payment_verified_at;
    } else if (paymentFilter === 'pending') {
      matchesPayment = !!order.payment_receipt_url && !order.payment_verified_at;
    } else if (paymentFilter === 'no-receipt') {
      matchesPayment = !order.payment_receipt_url;
    }

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Calcular estadísticas
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status.toLowerCase() === 'pending' || o.status.toLowerCase() === 'pendiente').length,
    completed: orders.filter((o) => o.status.toLowerCase() === 'delivered' || o.status.toLowerCase() === 'completado').length,
    cancelled: orders.filter((o) => o.status.toLowerCase() === 'cancelled' || o.status.toLowerCase() === 'cancelado' || o.status.toLowerCase() === 'payment_rejected').length,
    pendingPayment: orders.filter((o) => !!o.payment_receipt_url && !o.payment_verified_at).length,
    inDelivery: orders.filter((o) => o.delivery && !['delivered', 'completado', 'cancelled', 'cancelado', 'payment_rejected'].includes(o.status.toLowerCase())).length,
  };

  // Ver detalles
  const handleViewDetails = async (order: Order) => {
    try {
      const response = await apiClient.get(`/orders/${order.id_order}`);
      setSelectedOrder(response.data);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Error al cargar los detalles de la orden');
    }
  };

  // Cambiar estado
  const handleChangeStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      await apiClient.put(`/orders/${selectedOrder.id_order}`, {
        status: newStatus,
      });
      toast.success('Estado de orden actualizado correctamente');
      setIsStatusDialogOpen(false);
      setNewStatus('');
      fetchOrders();
      if (isDetailsOpen) {
        handleViewDetails(selectedOrder);
      }
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar el estado');
    }
  };

  // Verificar pago
  const handleVerifyPayment = async (order: Order) => {
    try {
      await apiClient.patch(`/orders/${order.id_order}/verify-payment`);
      toast.success('Pago verificado correctamente');
      fetchOrders();
      if (isDetailsOpen && selectedOrder?.id_order === order.id_order) {
        handleViewDetails(order);
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      toast.error(error.response?.data?.message || 'Error al verificar el pago');
    }
  };

  // Eliminar orden
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      await apiClient.delete(`/orders/${orderToDelete.id_order}`);
      toast.success('Orden eliminada correctamente');
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
      fetchOrders();
    } catch (error: any) {
      console.error('Error deleting order:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar la orden');
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Badge de estado
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const statusConfig: Record<string, { variant: any; className: string; label: string }> = {
      pending: { variant: 'secondary', className: 'bg-yellow-500', label: 'Pendiente' },
      processing: { variant: 'default', className: 'bg-blue-500', label: 'En Proceso' },
      delivered: { variant: 'default', className: 'bg-green-500', label: 'Entregado' },
      payment_rejected: { variant: 'destructive', className: 'bg-red-500', label: 'Pago Rechazado' },
      cancelled: { variant: 'destructive', className: 'bg-red-500', label: 'Cancelado' },
    };

    const config = statusConfig[statusLower] || { variant: 'secondary', className: 'bg-gray-500', label: status };
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Badge de pago
  const getPaymentBadge = (order: Order) => {
    if (order.payment_verified_at) {
      return <Badge className="bg-green-500">Verificado</Badge>;
    }
    if (order.payment_receipt_url) {
      return <Badge className="bg-yellow-500">Pendiente Verificación</Badge>;
    }
    return <Badge variant="secondary">Sin Comprobante</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Gestión de Órdenes
        </h1>
        <p className="text-muted-foreground mt-2">
          Administra todas las órdenes del marketplace
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingPayment}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Entrega</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inDelivery}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Tabla */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Lista de Órdenes</CardTitle>
              <CardDescription>
                {filteredOrders.length} órdenes encontradas
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID o cliente..."
                  className="pl-8 w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="processing">En Proceso</SelectItem>
                  <SelectItem value="delivered">Completado</SelectItem>
                  <SelectItem value="payment_rejected">Rechazado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado de Pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="verified">Verificado</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="no-receipt">Sin Comprobante</SelectItem>
                </SelectContent>
              </Select>
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
          ) : filteredOrders.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Orden</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id_order}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono font-semibold">#{order.id_order}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{order.client?.client_name || 'Sin cliente'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(order.order_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">${Number(order.total_amount).toFixed(2)}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPaymentBadge(order)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{order.delivery_type}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(order);
                                setNewStatus(order.status);
                                setIsStatusDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Cambiar Estado
                            </DropdownMenuItem>
                            {order.payment_receipt_url && !order.payment_verified_at && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleVerifyPayment(order)}
                                  className="text-green-600"
                                >
                                  <CheckSquare className="mr-2 h-4 w-4" />
                                  Verificar Pago
                                </DropdownMenuItem>
                              </>
                            )}
                            {order.payment_receipt_url && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsImageDialogOpen(true);
                                }}
                              >
                                <ImageIcon className="mr-2 h-4 w-4" />
                                Ver Comprobante
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setOrderToDelete(order);
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
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No hay órdenes</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                  ? 'No se encontraron órdenes con los filtros aplicados'
                  : 'Aún no hay órdenes en el sistema'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalles */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Orden #{selectedOrder?.id_order}</DialogTitle>
            <DialogDescription>
              Información completa de la orden
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Información General */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información General</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">ID Orden</p>
                      <p className="font-mono font-semibold">#{selectedOrder.id_order}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha</p>
                      <p className="font-medium">{formatDate(selectedOrder.order_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado de Pago</p>
                      {getPaymentBadge(selectedOrder)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Entrega</p>
                      <p className="font-medium">{selectedOrder.delivery_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monto Total</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${Number(selectedOrder.total_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información del Cliente */}
              {selectedOrder.client && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información del Cliente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nombre</p>
                        <p className="font-medium">{selectedOrder.client.client_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedOrder.client.client_email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Teléfono</p>
                        <p className="font-medium">{selectedOrder.client.phone}</p>
                      </div>
                      {selectedOrder.client.address && (
                        <div>
                          <p className="text-sm text-muted-foreground">Dirección</p>
                          <p className="font-medium">{selectedOrder.client.address}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Productos */}
              {selectedOrder.productOrders && selectedOrder.productOrders.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Productos Ordenados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Precio Unitario</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.productOrders.map((po) => (
                          <TableRow key={po.id_product_order}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {po.product?.image_url && (
                                  <img
                                    src={po.product.image_url}
                                    alt={po.product.product_name}
                                    className="h-10 w-10 rounded object-cover"
                                  />
                                )}
                                <span>{po.product?.product_name || `Producto #${po.id_product}`}</span>
                              </div>
                            </TableCell>
                            <TableCell>${Number(po.price_unit).toFixed(2)}</TableCell>
                            <TableCell className="font-semibold">${Number(po.subtotal).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Información de Pago */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información de Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Método de Pago</p>
                      <p className="font-medium">
                        {selectedOrder.paymentMethod?.method_name || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Comprobante</p>
                      {selectedOrder.payment_receipt_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsImageDialogOpen(true)}
                        >
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Ver Comprobante
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">No subido</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado de Verificación</p>
                      {selectedOrder.payment_verified_at ? (
                        <p className="text-sm text-green-600 font-medium">
                          Verificado el {formatDate(selectedOrder.payment_verified_at)}
                        </p>
                      ) : selectedOrder.payment_receipt_url ? (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-yellow-600 font-medium">Pendiente de verificación</p>
                          <Button
                            size="sm"
                            onClick={() => handleVerifyPayment(selectedOrder)}
                          >
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Verificar Ahora
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Sin comprobante</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información de Entrega */}
              {selectedOrder.delivery && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información de Entrega</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Repartidor</p>
                        <p className="font-medium">{selectedOrder.delivery.delivery_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Estado</p>
                        <p className="font-medium">{selectedOrder.delivery.delivery_status}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Dirección</p>
                        <p className="font-medium">{selectedOrder.delivery.address}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Cambiar Estado */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Estado de Orden</DialogTitle>
            <DialogDescription>
              Selecciona el nuevo estado para la orden #{selectedOrder?.id_order}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="processing">En Proceso</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="payment_rejected">Pago Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsStatusDialogOpen(false);
                setNewStatus('');
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleChangeStatus}>Actualizar Estado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar Orden?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará la orden #
              {orderToDelete?.id_order} y toda su información asociada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setOrderToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Imagen de Comprobante */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Comprobante de Pago</DialogTitle>
            <DialogDescription>
              Orden #{selectedOrder?.id_order}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder?.payment_receipt_url && (
            <div className="flex justify-center">
              <img
                src={selectedOrder.payment_receipt_url}
                alt="Comprobante de pago"
                className="max-h-[70vh] rounded-lg object-contain"
              />
            </div>
          )}
          {selectedOrder?.payment_receipt_url && !selectedOrder.payment_verified_at && (
            <DialogFooter>
              <Button
                onClick={() => {
                  handleVerifyPayment(selectedOrder);
                  setIsImageDialogOpen(false);
                }}
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Verificar Pago
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
