import { Button } from "@/components/ui/button";
import { ShoppingBag, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold">
            ¿Listo para Comenzar?
          </h2>
          <p className="text-lg opacity-90">
            Únete a nuestra comunidad de emprendedores y compradores locales
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              variant="secondary"
              className="px-8"
              onClick={() => navigate('/login')}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Comenzar a Comprar
            </Button>
            <Button 
              size="lg" 
              className="px-8 bg-white text-primary border-2 border-white hover:bg-transparent hover:text-white transition-all"
              onClick={() => navigate('/register-seller')}
            >
              <Store className="mr-2 h-5 w-5" />
              Vender mis Productos
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;