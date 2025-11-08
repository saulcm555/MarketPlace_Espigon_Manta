import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, ShoppingCart, User, LogOut, Settings, Package, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAllCategories } from "@/api";
import CartDrawer from "@/components/CartDrawer";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount, openCart } = useCart();
  const navigate = useNavigate();

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories,
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold">El Espigón</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/products" className="text-foreground/80 hover:text-foreground transition-colors">
              Productos
            </Link>
            
            {/* Categorías Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors">
                  Categorías
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Categorías</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/products" className="cursor-pointer">
                    Ver todas las categorías
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {categories.map((category: any) => (
                  <DropdownMenuItem key={category.id_category} asChild>
                    <Link 
                      to={`/products?category=${category.id_category}`}
                      className="cursor-pointer"
                    >
                      {category.category_name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <a href="/#emprendedores" className="text-foreground/80 hover:text-foreground transition-colors">
              Emprendedores
            </a>

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
            {isAuthenticated && (
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
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/register-seller" className="hidden md:block">
                  <Button variant="outline" size="sm">
                    Vender
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost" size="icon" className="hidden md:flex">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button className="hidden md:inline-flex">
                    Comenzar
                  </Button>
                </Link>
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