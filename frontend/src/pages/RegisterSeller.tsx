/**
 * Register Seller Page
 * Página de registro para nuevos vendedores
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { registerSeller, saveAuthData } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Store, Mail, Lock, Phone, MapPin, Building } from 'lucide-react';
import type { RegisterSellerRequest } from '@/types/api';

const RegisterSeller = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<RegisterSellerRequest>({
    seller_name: '',
    seller_email: '',
    seller_password: '',
    phone: '',
    bussines_name: '',
    location: '',
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const { mutate: register, isPending } = useMutation({
    mutationFn: registerSeller,
    onSuccess: (response) => {
      saveAuthData(response.token, response.user);
      navigate('/');
    },
    onError: (err: any) => {
      setError(err.message || 'Error al registrarse. Intenta de nuevo.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.seller_password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Validate password length
    if (formData.seller_password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    register(formData);
  };

  const handleChange = (field: keyof RegisterSellerRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Registrarse como Vendedor</CardTitle>
          <CardDescription>
            Únete al mercado del Espigón y vende tus productos
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {/* Nombre del vendedor */}
              <div className="space-y-2">
                <Label htmlFor="seller_name">Nombre completo *</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="seller_name"
                    type="text"
                    placeholder="Juan Pérez"
                    value={formData.seller_name}
                    onChange={(e) => handleChange('seller_name', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="seller_email">Correo electrónico *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="seller_email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.seller_email}
                    onChange={(e) => handleChange('seller_email', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0999999999"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Ubicación */}
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    type="text"
                    placeholder="Manta, Manabí"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            {/* Nombre del negocio */}
            <div className="space-y-2">
              <Label htmlFor="bussines_name">Nombre del negocio *</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="bussines_name"
                  type="text"
                  placeholder="Mi Tienda del Espigón"
                  value={formData.bussines_name}
                  onChange={(e) => handleChange('bussines_name', e.target.value)}
                  className="pl-10"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="seller_password">Contraseña *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="seller_password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.seller_password}
                    onChange={(e) => handleChange('seller_password', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Crear cuenta de vendedor'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm space-y-2">
            <p className="text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>
            <p className="text-muted-foreground">
              ¿Quieres registrarte como cliente?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Registro de cliente
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterSeller;
