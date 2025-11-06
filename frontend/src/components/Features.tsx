import { Card, CardContent } from "@/components/ui/card";
import { Heart, MapPin, ShoppingCart, Smartphone, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "100% Local",
    description: "Todos nuestros emprendedores están ubicados en el Parque El Espigón de Manta",
    gradient: "from-primary to-primary-glow",
    iconBg: "bg-primary/10"
  },
  {
    icon: Heart,
    title: "Apoya tu Comunidad",
    description: "Cada compra ayuda directamente a emprendedores locales y sus familias",
    gradient: "from-secondary to-[hsl(180_70%_50%)]",
    iconBg: "bg-secondary/10"
  },
  {
    icon: Smartphone,
    title: "Compra Digital",
    description: "Explora y compra productos únicos desde cualquier lugar, en cualquier momento",
    gradient: "from-accent to-[hsl(25_90%_60%)]",
    iconBg: "bg-accent/10"
  },
  {
    icon: Zap,
    title: "Entrega Rápida",
    description: "Recibe tus productos en tiempo récord con nuestro servicio de entrega local",
    gradient: "from-[hsl(280_70%_60%)] to-[hsl(300_70%_60%)]",
    iconBg: "bg-purple-100"
  },
  {
    icon: Shield,
    title: "Pago Seguro",
    description: "Transacciones protegidas con los más altos estándares de seguridad",
    gradient: "from-[hsl(140_70%_50%)] to-[hsl(160_70%_50%)]",
    iconBg: "bg-green-100"
  },
  {
    icon: ShoppingCart,
    title: "Fácil de Usar",
    description: "Interfaz intuitiva y proceso de compra simplificado para todos",
    gradient: "from-primary to-secondary",
    iconBg: "bg-blue-100"
  }
];

const Features = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            ¿Por qué elegir El Espigón?
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;