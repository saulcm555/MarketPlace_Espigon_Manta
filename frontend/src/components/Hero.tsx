import { Button } from "@/components/ui/button";
import { ShoppingBag, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/espigon-hero.jpg";

const Hero = () => {
  const navigate = useNavigate();

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
              onClick={() => navigate('/register-seller')}
            >
              <Store className="mr-2 h-5 w-5" />
              Vender mis Productos
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-12 max-w-2xl mx-auto">
            {[
              { value: "50+", label: "Emprendedores" },
              { value: "200+", label: "Productos" },
              { value: "100%", label: "Local" }
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