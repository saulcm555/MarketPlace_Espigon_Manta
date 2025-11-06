import { Card, CardContent } from "@/components/ui/card";
import { Shirt, Utensils, Palette, Gift, Coffee, Smartphone } from "lucide-react";

const categories = [
  {
    icon: Shirt,
    name: "Ropa & Accesorios",
    count: "45 productos",
    gradient: "from-primary to-primary-glow",
    bgColor: "bg-primary/10"
  },
  {
    icon: Utensils,
    name: "Comida & Bebidas",
    count: "38 productos",
    gradient: "from-accent to-[hsl(25_90%_60%)]",
    bgColor: "bg-accent/10"
  },
  {
    icon: Palette,
    name: "Arte & Artesanía",
    count: "52 productos",
    gradient: "from-secondary to-[hsl(180_70%_50%)]",
    bgColor: "bg-secondary/10"
  },
  {
    icon: Gift,
    name: "Regalos",
    count: "30 productos",
    gradient: "from-[hsl(280_70%_60%)] to-[hsl(300_70%_60%)]",
    bgColor: "bg-purple-100"
  },
  {
    icon: Coffee,
    name: "Café & Postres",
    count: "25 productos",
    gradient: "from-[hsl(30_80%_50%)] to-[hsl(40_90%_60%)]",
    bgColor: "bg-orange-100"
  },
  {
    icon: Smartphone,
    name: "Tecnología",
    count: "18 productos",
    gradient: "from-primary to-secondary",
    bgColor: "bg-blue-100"
  }
];

const Categories = () => {
  return (
    <section id="categorias" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Categorías Populares
          </h2>
          <p className="text-muted-foreground">
            Descubre productos únicos hechos por emprendedores locales
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <Card 
              key={index}
              className="group cursor-pointer hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6 text-center">
                <div className={`mx-auto w-16 h-16 rounded-lg bg-gradient-to-br ${category.gradient} flex items-center justify-center mb-3`}>
                  <category.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-1 text-sm">
                  {category.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {category.count}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;