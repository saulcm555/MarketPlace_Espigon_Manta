/**
 * Product Form Page (Create/Edit)
 * Formulario para crear o editar productos del vendedor
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { getAllCategories, getProductById, createProduct, updateProduct, uploadProductImage } from '@/api';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Upload,
  X,
} from 'lucide-react';

const ProductForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    price: '',
    stock: '',
    id_category: '',
    image_url: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Obtener categorías
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories,
  });

  // Obtener producto si estamos editando
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(Number(id)),
    enabled: isEditing && !!id,
  });

  // Mutation para crear producto
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      toast({
        title: "Producto creado",
        description: "El producto ha sido creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/seller/products');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo crear el producto",
        variant: "destructive",
      });
    },
  });

  // Mutation para actualizar producto
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateProduct(id, data),
    onSuccess: () => {
      toast({
        title: "Producto actualizado",
        description: "El producto ha sido actualizado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      navigate('/seller/products');
    },
    onError: (error: any) => {
      console.error('❌ Error al actualizar producto:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      
      let errorMessage = "No se pudo actualizar el producto";
      
      if (error.response?.data?.errors) {
        // Si hay errores de validación
        errorMessage = error.response.data.errors.map((e: any) => 
          `${e.path || e.field}: ${e.msg || e.message}`
        ).join(', ');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error al actualizar",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Cargar datos del producto al editar
  useEffect(() => {
    if (product && isEditing) {
      console.log('📦 Cargando producto para editar:', product);
      setFormData({
        product_name: product.product_name,
        description: product.description || '',
        price: product.price.toString(),
        stock: product.stock.toString(),
        id_category: product.id_category.toString(),
        image_url: product.image_url || '',
      });
      if (product.image_url) {
        setImagePreview(product.image_url);
      }
    }
  }, [product, isEditing]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Archivo inválido",
          description: "Por favor selecciona una imagen válida",
          variant: "destructive",
        });
        return;
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "La imagen no debe superar los 5MB",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.product_name || !formData.price || !formData.stock || !formData.id_category) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl = formData.image_url;

      // Si hay un archivo nuevo, subirlo primero
      if (imageFile) {
        setIsUploadingImage(true);
        try {
          imageUrl = await uploadProductImage(imageFile);
        } catch (error: any) {
          toast({
            title: "Error al subir imagen",
            description: error.response?.data?.message || "No se pudo subir la imagen",
            variant: "destructive",
          });
          setIsUploadingImage(false);
          return;
        }
        setIsUploadingImage(false);
      }

      const productData = {
        product_name: formData.product_name,
        product_description: formData.description || undefined,
        product_price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        id_category: parseInt(formData.id_category),
        id_seller: user?.id_seller || user?.id || 0,
        product_image: imageUrl || undefined,
      };

      console.log('📦 Enviando datos del producto:', productData);
      console.log('🔧 Modo:', isEditing ? 'Editar' : 'Crear');

      if (isEditing) {
        updateMutation.mutate({ id: Number(id), data: productData });
      } else {
        createMutation.mutate(productData);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    }
  };

  // Verificar permisos
  if (!isAuthenticated || user?.role !== 'seller') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-16"></div>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-bold mb-2">Acceso Denegado</h2>
              <p className="text-muted-foreground mb-4">
                Esta sección es solo para vendedores
              </p>
              <Button onClick={() => navigate('/')}>Volver al inicio</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isEditing && isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-16"></div>
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Cargando producto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Espaciador para el navbar fixed */}
      <div className="h-16"></div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/seller/products')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a productos
          </Button>

          <h1 className="text-3xl font-bold mb-2">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Actualiza la información del producto' : 'Agrega un nuevo producto a tu inventario'}
          </p>
        </div>

        {/* Form */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Información del Producto</CardTitle>
            <CardDescription>
              Completa los detalles del producto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="product_name">Nombre del producto *</Label>
                <Input
                  id="product_name"
                  placeholder="Ej: Ceviche de camarón"
                  value={formData.product_name}
                  onChange={(e) => handleChange('product_name', e.target.value)}
                  required
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe tu producto..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              {/* Precio y Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio (USD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock (unidades) *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => handleChange('stock', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Categoría */}
              <div className="space-y-2">
                <Label htmlFor="id_category">Categoría *</Label>
                <Select
                  value={formData.id_category}
                  onValueChange={(value) => handleChange('id_category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id_category} value={cat.id_category.toString()}>
                        {cat.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Imagen del producto */}
              <div className="space-y-2">
                <Label htmlFor="image">Imagen del producto</Label>
                <div className="space-y-4">
                  {!imagePreview ? (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="image"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <div className="text-sm">
                          <span className="font-semibold text-primary">Haz clic para subir</span>
                          {' '}o arrastra una imagen
                        </div>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, GIF o WEBP (máx. 5MB)
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      {imageFile && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Archivo: {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending || isUploadingImage}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isUploadingImage 
                    ? 'Subiendo imagen...' 
                    : (createMutation.isPending || updateMutation.isPending 
                      ? 'Guardando...' 
                      : (isEditing ? 'Actualizar' : 'Crear Producto'))
                  }
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/seller/products')}
                  disabled={createMutation.isPending || updateMutation.isPending || isUploadingImage}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductForm;
