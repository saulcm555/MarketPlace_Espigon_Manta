/**
 * Profile Page
 * Página de perfil de usuario para ver y editar datos
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { updateClient } from '@/api/clients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Shield, ArrowLeft, Save, Package, ShoppingBag } from 'lucide-react';
import Navbar from '@/components/Navbar';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone?.toString() || '',
    address: user?.address || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (!user?.id) {
        throw new Error('Usuario no encontrado');
      }

      // Validar datos antes de enviar
      if (formData.name && formData.name.trim().length < 3) {
        throw new Error('El nombre debe tener al menos 3 caracteres');
      }

      if (formData.phone && formData.phone.trim().length > 0 && !/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
        throw new Error('El teléfono solo puede contener números, espacios y símbolos (+, -, (, ))');
      }

      if (formData.address && formData.address.trim().length > 0 && formData.address.trim().length < 3) {
        throw new Error('La dirección debe tener al menos 3 caracteres');
      }

      // Preparar datos para enviar - solo incluir campos que tienen valor
      const dataToUpdate: any = {};
      
      if (formData.name && formData.name.trim()) {
        dataToUpdate.client_name = formData.name.trim();
      }
      
      if (formData.phone && formData.phone.trim()) {
        dataToUpdate.phone = formData.phone.trim(); // Enviar como string
      }
      
      if (formData.address && formData.address.trim()) {
        dataToUpdate.address = formData.address.trim();
      }

      // Verificar que hay algo que actualizar
      if (Object.keys(dataToUpdate).length === 0) {
        throw new Error('No hay cambios para guardar');
      }

      // Actualizar en el backend
      const updatedClient = await updateClient(user.id, dataToUpdate);

      // Actualizar el contexto de autenticación con los nuevos datos
      updateUser({
        ...user,
        name: updatedClient.client_name,
        phone: updatedClient.phone,
        address: updatedClient.address,
      });

      setSuccess('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error al actualizar perfil:', err);
      setError(err.message || err.response?.data?.message || 'No se pudo actualizar el perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'seller':
        return 'default';
      case 'client':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'seller':
        return 'Vendedor';
      case 'client':
        return 'Cliente';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Espaciador para el navbar fixed */}
      <div className="h-16"></div>
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{user?.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" />
                      {user?.email}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={getRoleBadgeVariant(user?.role || '')}>
                  <Shield className="w-3 h-3 mr-1" />
                  {getRoleLabel(user?.role || '')}
                </Badge>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="mt-6">
              {/* Quick Links */}
              {user?.role === 'client' && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3">Acceso rápido</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => navigate('/orders')}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Mis Pedidos
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => navigate('/products')}
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Productos
                    </Button>
                  </div>
                  <Separator className="mt-6" />
                </div>
              )}

              {user?.role === 'seller' && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3">Mi Tienda</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => navigate('/seller/dashboard')}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => navigate('/seller/products')}
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Mis Productos
                    </Button>
                  </div>
                  <Separator className="mt-6" />
                </div>
              )}

              {success && (
                <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información de la cuenta */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Información de la cuenta</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        className="pl-10"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      El correo electrónico no se puede modificar
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="pl-10"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Información de contacto */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Información de contacto</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="0999999999"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="pl-10"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="address"
                        type="text"
                        placeholder="Manta, Manabí"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        className="pl-10"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 pt-4">
                  {!isEditing ? (
                    <Button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex-1"
                    >
                      Editar perfil
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: user?.name || '',
                            email: user?.email || '',
                            phone: user?.phone?.toString() || '',
                            address: user?.address || '',
                          });
                          setError('');
                          setSuccess('');
                        }}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 gap-2"
                        disabled={isSubmitting}
                      >
                        <Save className="w-4 h-4" />
                        {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Información de la cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID de usuario:</span>
                <span className="font-mono">{user?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo de cuenta:</span>
                <span className="font-medium">{getRoleLabel(user?.role || '')}</span>
              </div>
              {user?.created_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Miembro desde:</span>
                  <span>{new Date(user.created_at).toLocaleDateString('es-EC')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
