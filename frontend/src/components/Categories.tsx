import { Card, CardContent } from "@/components/ui/card";
import { Shirt, Utensils, Palette, Gift, Coffee, Smartphone, Package, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAllCategories } from "@/api/categories";
import type { Category } from "@/types/api";

// Icon mapping for categories
const categoryIcons: Record<string, any> = {
  "ropa": Shirt,
  "comida": Utensils,
  "arte": Palette,
  "artesanía": Palette,
  "regalo": Gift,
  "café": Coffee,
  "tecnología": Smartphone,
  "default": Package
};

// Gradient mapping for variety
const gradients = [
  "from-primary to-primary-glow",
  "from-accent to-[hsl(25_90%_60%)]",
  "from-secondary to-[hsl(180_70%_50%)]",
  "from-[hsl(280_70%_60%)] to-[hsl(300_70%_60%)]",
  "from-[hsl(30_80%_50%)] to-[hsl(40_90%_60%)]",
  "from-primary to-secondary"
];

const getIconForCategory = (categoryName: string) => {
  const lowerName = categoryName.toLowerCase();
  const key = Object.keys(categoryIcons).find(k => lowerName.includes(k));
  return categoryIcons[key || 'default'];
};

const Categories = () => {
  // Fetch categories from API
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getAllCategories,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  if (isLoading) {
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
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }
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

        {!categories || categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hay categorías disponibles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => {
              const IconComponent = getIconForCategory(category.category_name);
              const gradient = gradients[index % gradients.length];
              
              return (
                <Card 
                  key={category.id}
                  className="group cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6 text-center">
                    <div className={`mx-auto w-16 h-16 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1 text-sm">
                      {category.category_name}
                    </h3>
                    {category.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Categories;