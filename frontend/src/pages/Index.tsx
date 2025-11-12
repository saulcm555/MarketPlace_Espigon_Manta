import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import Features from "@/components/Features";
import FeaturedProducts from "@/components/FeaturedProducts";
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Categories />
        <FeaturedProducts />
        <Features />
      </main>
      <footer className="bg-gradient-to-b from-muted/30 to-muted/50 border-t border-border">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  El Espigón
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Conectando emprendedores locales del Parque El Espigón con la comunidad de Manta
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 rounded-lg bg-primary/10 hover:bg-primary flex items-center justify-center text-primary hover:text-white transition-all">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-primary/10 hover:bg-primary flex items-center justify-center text-primary hover:text-white transition-all">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-primary/10 hover:bg-primary flex items-center justify-center text-primary hover:text-white transition-all">
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-foreground mb-4">Enlaces Rápidos</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#productos" className="hover:text-primary transition-colors">Todos los Productos</a></li>
                <li><a href="#categorias" className="hover:text-primary transition-colors">Categorías</a></li>
                <li><a href="#emprendedores" className="hover:text-primary transition-colors">Emprendedores</a></li>
                <li><a href="#ofertas" className="hover:text-primary transition-colors">Ofertas Especiales</a></li>
              </ul>
            </div>

            {/* Help */}
            <div>
              <h3 className="font-bold text-foreground mb-4">Ayuda</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Cómo Comprar</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cómo Vender</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Preguntas Frecuentes</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Términos y Condiciones</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-foreground mb-4">Contacto</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                  <span>Parque El Espigón, Manta, Ecuador</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>+593 99 123 4567</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>hola@elespigon.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 Marketplace El Espigón. Todos los derechos reservados. Apoyando emprendedores locales en Manta.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;