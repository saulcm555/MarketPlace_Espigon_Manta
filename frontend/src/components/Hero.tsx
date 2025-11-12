import { Button } from "@/components/ui/button";
import { ShoppingBag, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStatistics } from "@/api";
import { useAuth } from "@/context/AuthContext";
import heroImage from "@/assets/espigon-hero.jpg";

const Hero = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  // Obtener estadísticas reales del marketplace
  const { data: stats } = useQuery({
    queryKey: ['statistics'],
    queryFn: getStatistics,
    // Valores por defecto mientras carga
    placeholderData: {
      sellers: 0,
      products: 0,
      local: 100
    }
  });

  const handleSellerClick = () => {
    // Si el usuario ya es vendedor, llevarlo al dashboard
    if (isAuthenticated && user?.role === 'seller') {
      navigate('/seller/dashboard');
    } else {
      // Si no es vendedor, llevarlo a registrarse
      navigate('/register-seller');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white">
            Marketplace del Espigón
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Conectando emprendedores locales del Parque El Espigón con compradores digitales
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              className="px-8 py-6 text-base"
              onClick={() => navigate('/products')}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Explorar Productos
            </Button>
            <Button 
              size="lg" 
              className="px-8 py-6 text-base bg-white text-primary border-2 border-white hover:bg-transparent hover:text-white transition-all"
              onClick={handleSellerClick}
            >
              <Store className="mr-2 h-5 w-5" />
              {isAuthenticated && user?.role === 'seller' ? 'Mi Tienda' : 'Vender mis Productos'}
            </Button>
          </div>

          {/* Stats - Ahora con datos reales */}
          <div className="grid grid-cols-3 gap-4 pt-12 max-w-2xl mx-auto">
            {[
              { 
                value: stats?.sellers ? `${stats.sellers}+` : "0", 
                label: "Emprendedores" 
              },
              { 
                value: stats?.products ? `${stats.products}+` : "0", 
                label: "Productos" 
              },
              { 
                value: "100%", 
                label: "Local" 
              }
            ].map((stat, index) => (
              <div 
                key={index}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4"
              >
                <div className="text-3xl md:text-4xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-white/80 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;