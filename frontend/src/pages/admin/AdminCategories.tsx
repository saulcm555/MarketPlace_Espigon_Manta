import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import apiClient from '@/api/client';
import { Badge } from '@/components/ui/badge';

interface Category {
  id_category: number;
  category_name: string;
  category_description?: string;
  subcategories?: SubCategory[];
}

interface SubCategory {
  id_subcategory: number;
  subcategory_name: string;
  subcategory_description?: string;
  id_category: number;
}

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubcategoryMode, setIsSubcategoryMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentCategoryId: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const [categoriesRes, subCategoriesRes] = await Promise.all([
        apiClient.get('/categories'),
        apiClient.get('/subcategories')
      ]);
      
      const allSubcategories = subCategoriesRes.data || [];
      
      // Agrupar subcategorías por categoría
      const categoriesWithSubs = categoriesRes.data.map((cat: Category) => ({
        ...cat,
        subcategories: allSubcategories.filter((sub: any) => sub.id_category === cat.id_category)
      }));
      
      setCategories(categoriesWithSubs);
    } catch (error) {
      toast.error('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      if (isSubcategoryMode) {
        await apiClient.post('/subcategories', {
          subcategory_name: formData.name,
          subcategory_description: formData.description,
          id_category: formData.parentCategoryId,
        });
        toast.success('Subcategoría creada exitosamente');
      } else {
        await apiClient.post('/categories', {
          category_name: formData.name,
          description: formData.description,
        });
        toast.success('Categoría creada exitosamente');
      }
      
      setIsCreateDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear');
    }
  };

  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      if (isSubcategoryMode && selectedCategory) {
        await apiClient.put(`/subcategories/${selectedCategory.id_category}`, {
          subcategory_name: formData.name,
          subcategory_description: formData.description,
        });
        toast.success('Subcategoría actualizada');
      } else if (selectedCategory) {
        await apiClient.put(`/categories/${selectedCategory.id_category}`, {
          category_name: formData.name,
          description: formData.description,
        });
        toast.success('Categoría actualizada');
      }
      
      setIsEditDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      if (isSubcategoryMode) {
        await apiClient.delete(`/subcategories/${selectedCategory.id_category}`);
        toast.success('Subcategoría eliminada');
      } else {
        await apiClient.delete(`/categories/${selectedCategory.id_category}`);
        toast.success('Categoría eliminada');
      }
      
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error('No se puede eliminar: tiene subcategorías o productos asociados');
      } else {
        toast.error('Error al eliminar');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', parentCategoryId: 0 });
    setSelectedCategory(null);
    setIsSubcategoryMode(false);
  };

  const openCreateDialog = (parentId?: number) => {
    resetForm();
    if (parentId) {
      setIsSubcategoryMode(true);
      setFormData(prev => ({ ...prev, parentCategoryId: parentId }));
    }
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (item: Category | SubCategory, isSub: boolean) => {
    setSelectedCategory(item as Category);
    setIsSubcategoryMode(isSub);
    setFormData({
      name: isSub ? (item as SubCategory).subcategory_name : (item as Category).category_name,
      description: isSub ? (item as SubCategory).subcategory_description || '' : (item as Category).category_description || '',
      parentCategoryId: isSub ? (item as SubCategory).id_category : 0,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item: Category | SubCategory, isSub: boolean) => {
    setSelectedCategory(item as Category);
    setIsSubcategoryMode(isSub);
    setIsDeleteDialogOpen(true);
  };

  const totalSubcategories = categories.reduce((sum, cat) => sum + (cat.subcategories?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Categorías
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las categorías y subcategorías del marketplace
          </p>
        </div>
        <Button 
          onClick={() => openCreateDialog()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{categories.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Categorías Principales</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{totalSubcategories}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Subcategorías</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {categories.filter(c => (c.subcategories?.length || 0) > 0).length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Con Subcategorías</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        /* Lista de Categorías */
        <div className="grid gap-4">
          {categories.map((category) => (
            <Card key={category.id_category} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">
                        {category.category_name}
                      </CardTitle>
                      <Badge variant="secondary">
                        {category.subcategories?.length || 0} subcategorías
                      </Badge>
                    </div>
                    {category.category_description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {category.category_description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(category, false)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openDeleteDialog(category, false)}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Subcategorías */}
              {category.subcategories && category.subcategories.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Subcategorías
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCreateDialog(category.id_category)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar
                      </Button>
                    </div>

                    <div className="grid gap-2">
                      {category.subcategories.map((sub) => (
                        <div
                          key={sub.id_subcategory}
                          className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted/80 hover:to-muted/60 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{sub.subcategory_name}</p>
                              {sub.subcategory_description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {sub.subcategory_description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(sub, true)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(sub, true)}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}

              {/* Si no tiene subcategorías */}
              {(!category.subcategories || category.subcategories.length === 0) && (
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => openCreateDialog(category.id_category)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primera Subcategoría
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}

          {categories.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No hay categorías creadas todavía
                </p>
                <Button onClick={() => openCreateDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Categoría
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dialog Crear */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isSubcategoryMode ? 'Nueva Subcategoría' : 'Nueva Categoría'}
            </DialogTitle>
            <DialogDescription>
              {isSubcategoryMode 
                ? 'Crea una subcategoría dentro de la categoría seleccionada'
                : 'Crea una nueva categoría principal'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={isSubcategoryMode ? 'Ej: Laptops Gaming' : 'Ej: Electrónicos'}
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción opcional..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={!formData.name.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isSubcategoryMode ? 'Editar Subcategoría' : 'Editar Categoría'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={!formData.name.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la{' '}
              {isSubcategoryMode ? 'subcategoría' : 'categoría'}.
              {!isSubcategoryMode && ' Todas sus subcategorías y productos asociados perderán esta referencia.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
