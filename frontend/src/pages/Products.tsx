/**
 * Products Page
 * Página de listado de productos con filtros, búsqueda y paginación
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAllProducts, getAllCategories, getSubCategoriesByCategory } from '@/api';
import Navbar from '@/components/Navbar';
import ProductRating from '@/components/ProductRating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  SlidersHorizontal,
  X,
  ShoppingCart,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Product, Category } from '@/types/api';

const Products = () => {

  const [searchParams, setSearchParams] = useSearchParams();

  // Estados de filtros
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedSubCategory, setSelectedSubCategory] = useState(searchParams.get('subcategory') || 'all');
  const [selectedSeller, setSelectedSeller] = useState(searchParams.get('seller') || 'all');
  const [priceRange, setPriceRange] = useState([0, 10000]); // Aumentado el rango máximo
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Queries
  const { data: allProducts = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: getAllProducts,
  });
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories,
  });

  // Obtener subcategorías cuando se selecciona una categoría
  const { data: subCategories = [], isLoading: isLoadingSubCategories } = useQuery({
    queryKey: ['subcategories', selectedCategory],
    queryFn: () => getSubCategoriesByCategory(Number(selectedCategory)),
    enabled: selectedCategory !== 'all',
  });
  // Aplicar filtros
  const filteredProducts = allProducts
    .filter((product: Product) => {
      // IMPORTANTE: Solo filtrar productos rechazados o inactivos
      // Mostrar productos: active, pending (y los que no tienen status definido)
      if (product.status === 'rejected' || product.status === 'inactive') return false;

      // Filtro de búsqueda
      const matchesSearch = searchQuery === '' ||
        product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      // Filtro de categoría
      const matchesCategory = selectedCategory === 'all' ||
        product.id_category.toString() === selectedCategory;
      // Filtro de subcategoría
      const matchesSubCategory = selectedSubCategory === 'all' ||
        product.id_sub_category?.toString() === selectedSubCategory;
      // Filtro de vendedor
      const matchesSeller = selectedSeller === 'all' ||
        product.id_seller?.toString() === selectedSeller;
      // Filtro de precio
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      return matchesSearch && matchesCategory && matchesSubCategory && matchesSeller && matchesPrice;
    })
    .sort((a: Product, b: Product) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return a.product_name.localeCompare(b.product_name);
        case 'name-desc':
          return b.product_name.localeCompare(a.product_name);
        case 'newest':
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Actualizar URL cuando cambian los filtros
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchQuery) params.search = searchQuery;
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (selectedSeller !== 'all') params.seller = selectedSeller;
    if (sortBy !== 'newest') params.sort = sortBy;
    setSearchParams(params);
  }, [searchQuery, selectedCategory, selectedSeller, sortBy, setSearchParams]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSubCategory('all');
    setSelectedSeller('all');
    setPriceRange([0, 10000]); // Aumentado el rango máximo
    setSortBy('newest');
    setCurrentPage(1);
    setSearchParams({});
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const activeFiltersCount = 
    (searchQuery ? 1 : 0) + 
    (selectedCategory !== 'all' ? 1 : 0) + 
    (selectedSubCategory !== 'all' ? 1 : 0) +
    (selectedSeller !== 'all' ? 1 : 0) +
    (priceRange[0] !== 0 || priceRange[1] !== 10000 ? 1 : 0); // Aumentado el rango máximo

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Espaciador para el navbar fixed */}
      <div className="h-16"></div>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Productos</h1>
          <p className="text-muted-foreground">Descubre los mejores productos del Parque El Espigón</p>
        </div>
        {/* Barra de búsqueda y controles */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            {/* Ordenar */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="price-asc">Precio: menor a mayor</SelectItem>
                <SelectItem value="price-desc">Precio: mayor a menor</SelectItem>
                <SelectItem value="name-asc">Nombre: A-Z</SelectItem>
                <SelectItem value="name-desc">Nombre: Z-A</SelectItem>
              </SelectContent>
            </Select>
            {/* Toggle filtros */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            {/* Toggle vista */}
            <div className="hidden md:flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Filtros activos */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filtros activos:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Búsqueda: {searchQuery}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSearchQuery('')}
                  />
                </Badge>
              )}
              {selectedCategory !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Categoría
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedSubCategory('all');
                    }}
                  />
                </Badge>
              )}
              {selectedSubCategory !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Subcategoría
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedSubCategory('all')}
                  />
                </Badge>
              )}
              {selectedSeller !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Vendedor específico
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedSeller('all')}
                  />
                </Badge>
              )}
              {(priceRange[0] !== 0 || priceRange[1] !== 10000) && (
                <Badge variant="secondary" className="gap-1">
                  Precio: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setPriceRange([0, 10000])}
                  />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7"
              >
                Limpiar todo
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar de filtros */}
          {showFilters && (
            <aside className="w-full lg:w-64 space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  {/* Categorías - Select Dropdown */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Categoría</Label>
                    {isLoadingCategories ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select 
                        value={selectedCategory} 
                        onValueChange={(value) => {
                          setSelectedCategory(value);
                          setSelectedSubCategory('all'); // Resetear subcategoría al cambiar categoría
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las categorías</SelectItem>
                          {categories.map((category: any) => (
                            <SelectItem 
                              key={category.id_category} 
                              value={category.id_category?.toString()}
                            >
                              {category.category_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Subcategorías - Solo se muestra si hay una categoría seleccionada */}
                  {selectedCategory !== 'all' && (
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Subcategoría</Label>
                      {isLoadingSubCategories ? (
                        <Skeleton className="h-10 w-full" />
                      ) : subCategories.length > 0 ? (
                        <Select 
                          value={selectedSubCategory} 
                          onValueChange={(value) => {
                            setSelectedSubCategory(value);
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una subcategoría" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas las subcategorías</SelectItem>
                            {subCategories.map((subCategory: any) => (
                              <SelectItem 
                                key={subCategory.id_sub_category} 
                                value={subCategory.id_sub_category?.toString()}
                              >
                                {subCategory.sub_category_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No hay subcategorías disponibles
                        </p>
                      )}
                    </div>
                  )}
                  {/* Rango de precio */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Rango de precio</Label>
                    <div className="pt-2">
                      <Slider
                        min={0}
                        max={10000}
                        step={100}
                        value={priceRange}
                        onValueChange={(value) => {
                          setPriceRange(value as [number, number]);
                          setCurrentPage(1);
                        }}
                        className="mb-4"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span>{formatPrice(priceRange[0])}</span>
                        <span>{formatPrice(priceRange[1])}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          )}
          {/* Grid de productos */}
          <main className="flex-1">
            {/* Contador de resultados */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isLoadingProducts ? (
                  'Cargando productos...'
                ) : (
                  <>
                    Mostrando {paginatedProducts.length} de {filteredProducts.length} productos
                  </>
                )}
              </p>
            </div>
            {/* Loading state */}
            {isLoadingProducts ? (
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6`}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card key={i}>
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              /* Empty state */
              <Card className="p-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No se encontraron productos</h3>
                <p className="text-muted-foreground mb-4">Intenta ajustar los filtros o búsqueda</p>
                <Button onClick={handleResetFilters}>Limpiar filtros</Button>
              </Card>
            ) : (
              <>
                {/* Grid/List de productos */}
                <div
                  className={`grid gap-6 ${
                    viewMode === 'grid'
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                      : 'grid-cols-1'
                  }`}
                >
                  {paginatedProducts.map((product: Product) => (
                    <ProductCard
                      key={product.id_product}
                      product={product}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'outline'}
                              onClick={() => setCurrentPage(page)}
                              className="w-10"
                            >
                              {page}
                            </Button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-2">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

// Componente ProductCard
interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
}

const ProductCard = ({ product, viewMode }: ProductCardProps) => {
  const navigate = useNavigate();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleProductClick = () => {
    navigate(`/products/${product.id_product}`);
  };

  if (viewMode === 'list') {
    return (
      <Card 
        className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        onClick={handleProductClick}
      >
        <div className="flex flex-col sm:flex-row">
          <div className="relative w-full sm:w-48 h-48 overflow-hidden bg-muted">
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop'}
              alt={product.product_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge variant="destructive">Agotado</Badge>
              </div>
            )}
          </div>

          <CardContent className="flex-1 p-4">
            <div className="flex flex-col h-full justify-between">
              <div>
                {/* Badges de Categoría y Subcategoría */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {product.category && (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                      {product.category.category_name}
                    </Badge>
                  )}
                  {(product.subcategory || (product as any).subCategory) && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                      {product.subcategory?.sub_category_name || (product as any).subCategory?.sub_category_name}
                    </Badge>
                  )}
                </div>

                <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                  {product.product_name}
                </h3>
                {product.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}
                
                {/* Rating del producto */}
                <ProductRating product={product} className="mb-3" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                <Button 
                  disabled={product.stock === 0} 
                  className="gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Agregar al carrito
                  }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {product.stock === 0 ? 'Agotado' : 'Agregar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleProductClick}
    >
      <div className="relative overflow-hidden aspect-square bg-muted">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop'}
          alt={product.product_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge variant="destructive">Agotado</Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Badges de Categoría y Subcategoría */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {product.category && (
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              {product.category.category_name}
            </Badge>
          )}
          {(product.subcategory || (product as any).subCategory) && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
              {product.subcategory?.sub_category_name || (product as any).subCategory?.sub_category_name}
            </Badge>
          )}
        </div>

        <h3 className="font-semibold mb-2 line-clamp-2 min-h-[3rem]">
          {product.product_name}
        </h3>
        {product.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.description}
          </p>
        )}
        
        {/* Rating del producto */}
        <ProductRating product={product} className="mb-3" />
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          <Button 
            size="sm" 
            disabled={product.stock === 0} 
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Agregar al carrito
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            {product.stock === 0 ? 'Agotado' : 'Agregar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Products;
