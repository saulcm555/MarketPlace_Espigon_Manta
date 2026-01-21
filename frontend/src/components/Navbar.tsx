import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Menu, ShoppingCart, User, LogOut, Settings, Package, Receipt, Clock, Cog, MessageCircle, Ticket, Gift, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMyOrders, getMyCoupons } from "@/api";
import type { Coupon } from "@/api/coupons";
import CartDrawer from "@/components/CartDrawer";
import logoEspigon from "@/assets/logo.jpg";

const Navbar = () => {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount, openCart } = useCart();
  const navigate = useNavigate();

  // Fetch recent orders (últimos 5 pedidos)
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: getMyOrders,
    enabled: isAuthenticated && user?.role === 'client',
  });

  // Fetch cupones del usuario (cupones ganados del Gym)
  const { data: couponsData } = useQuery({
    queryKey: ['my-coupons'],
    queryFn: getMyCoupons,
    enabled: isAuthenticated && user?.role === 'client',
  });

  const myCoupons = couponsData?.coupons || [];
  const activeCoupons = myCoupons.filter((c: Coupon) => c.is_active && !c.used);

  // Obtener solo los últimos 5 pedidos ordenados por fecha (más recientes primero)
  const recentOrders = [...orders]
    .sort((a: any, b: any) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
    .slice(0, 5);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-EC', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  };

  const formatExpiryDate = (dateString?: string) => {
    if (!dateString) return 'Sin expiración';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Expirado';
    if (diffDays === 1) return 'Expira mañana';
    if (diffDays <= 7) return `Expira en ${diffDays} días`;
    return formatDate(dateString);
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { variant: 'secondary' as const, text: 'Pendiente' };
      case 'payment_pending_verification':
        return { variant: 'default' as const, text: 'Verificando pago' };
      case 'payment_confirmed':
        return { variant: 'default' as const, text: 'Pago confirmado' };
      case 'payment_rejected':
        return { variant: 'destructive' as const, text: 'Pago rechazado' };
      case 'processing':
        return { variant: 'default' as const, text: 'Procesando' };
      case 'shipped':
        return { variant: 'default' as const, text: 'Enviado' };
      case 'delivered':
        return { variant: 'default' as const, text: 'Entregado' };
      case 'completed':
        return { variant: 'default' as const, text: 'Completado' };
      case 'cancelled':
        return { variant: 'destructive' as const, text: 'Cancelado' };
      case 'expired':
        return { variant: 'destructive' as const, text: 'Expirado' };
      default:
        return { variant: 'secondary' as const, text: status };
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src={logoEspigon} alt="El Espigón" className="h-10 w-10 rounded-full object-cover" />
            <span className="text-xl font-bold">El Espigón</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors">
              Inicio
            </Link>

            <Link to="/products" className="text-foreground/80 hover:text-foreground transition-colors">
              Productos
            </Link>

            {/* Categorías eliminado por petición del usuario */}

            <Link to="/entrepreneurs" className="text-foreground/80 hover:text-foreground transition-colors">
              Emprendedores
            </Link>

            {/* Mis Pedidos - Solo para clientes */}
            {isAuthenticated && user?.role === 'client' && (
              <Link to="/orders" className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors">
                <Receipt className="h-4 w-4" />
                Mis Pedidos
              </Link>
            )}

            {/* Mi Tienda - Solo para vendedores */}
            {isAuthenticated && user?.role === 'seller' && (
              <Link to="/seller/dashboard" className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors">
                <Package className="h-4 w-4" />
                Mi Tienda
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user?.role === 'client' && (
              <>
                {/* Menú de Cupones del Gym */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Ticket className="h-5 w-5" />
                      {activeCoupons.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                          {activeCoupons.length}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-green-500" />
                      <span>Cupones del Gym</span>
                      {activeCoupons.length > 0 && (
                        <Badge variant="secondary" className="ml-auto text-xs bg-green-100 text-green-700">
                          {activeCoupons.length} activos
                        </Badge>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {activeCoupons.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No tienes cupones activos</p>
                        <p className="text-xs mt-1 text-muted-foreground/70">
                          ¡Compra más de $5 y gana cupones para el Gym!
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="max-h-72 overflow-y-auto">
                          {activeCoupons.slice(0, 5).map((coupon: Coupon) => (
                            <DropdownMenuItem
                              key={coupon.id_coupon}
                              className="cursor-default flex-col items-start p-3 h-auto hover:bg-green-50"
                            >
                              <div className="w-full flex items-center justify-between mb-1">
                                <code className="font-mono text-sm font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                                  {coupon.code}
                                </code>
                                <Badge variant="default" className="bg-green-500 text-xs">
                                  {coupon.discount_percent}% OFF
                                </Badge>
                              </div>
                              <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatExpiryDate(coupon.expires_at)}
                                </span>
                                <span className="text-green-600 font-medium">
                                  Válido en Gym
                                </span>
                              </div>
                              {coupon.minimum_purchase > 0 && (
                                <div className="w-full text-xs text-amber-600 mt-1">
                                  Compra mínima: {formatPrice(coupon.minimum_purchase)}
                                </div>
                              )}
                            </DropdownMenuItem>
                          ))}
                        </div>
                        <DropdownMenuSeparator />
                        <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30">
                          <p>🏋️ Usa estos cupones en la app del Gym</p>
                        </div>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Menú de Pedidos Recientes */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Receipt className="h-5 w-5" />
                      {recentOrders.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                          {recentOrders.length}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel className="flex items-center justify-between">
                      <span>Pedidos recientes</span>
                      {orders.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          {orders.length} total
                        </Badge>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {recentOrders.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No tienes pedidos aún</p>
                      </div>
                    ) : (
                      <>
                        <div className="max-h-96 overflow-y-auto">
                          {recentOrders.map((order: any) => {
                            const statusInfo = getOrderStatusBadge(order.status);
                            return (
                              <DropdownMenuItem
                                key={order.id_order}
                                className="cursor-pointer flex-col items-start p-3 h-auto"
                                onClick={() => navigate(`/orders/${order.id_order}`)}
                              >
                                <div className="w-full flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold">Pedido #{order.id_order}</span>
                                  </div>
                                  <Badge variant={statusInfo.variant} className="text-xs">
                                    {statusInfo.text}
                                  </Badge>
                                </div>
                                <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(order.order_date)}
                                  </div>
                                  <span className="font-semibold text-foreground">
                                    {formatPrice(order.total_amount)}
                                  </span>
                                </div>
                              </DropdownMenuItem>
                            );
                          })}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer justify-center text-primary font-medium"
                          onClick={() => navigate('/orders')}
                        >
                          Ver todos los pedidos
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Carrito */}
                <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Button>
              </>
            )}

            {isAuthenticated && user?.role !== 'client' && (
              <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            )}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:flex">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold">{user?.name}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                      <span className="text-xs text-primary capitalize mt-1">{user?.role}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {user?.role === 'seller' && (
                    <DropdownMenuItem onClick={() => navigate('/seller/dashboard')}>
                      <Package className="mr-2 h-4 w-4" />
                      Mi tienda
                    </DropdownMenuItem>
                  )}

                  {user?.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Panel Admin
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Mi perfil
                  </DropdownMenuItem>

                  {/* Configuración para clientes y vendedores */}
                  {(user?.role === 'client' || user?.role === 'seller') && (
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Cog className="mr-2 h-4 w-4" />
                      Configuración
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Iniciar sesión
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      Registrarse
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel>Registrarse como...</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/register')}>
                      Cliente
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/register-seller')}>
                      Vendedor
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer />
    </nav>
  );
};

export default Navbar;