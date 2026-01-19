/**
 * Reset Password Page
 * Página para restablecer la contraseña con el token recibido por email
 */

import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, CheckCircle2, KeyRound } from 'lucide-react';
import logoEspigon from '@/assets/logo.jpg';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!token) {
      setError('Token inválido o expirado');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implementar cuando el backend tenga el endpoint
      // await resetPassword(token, password);
      
      // Simulación por ahora
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al restablecer la contraseña. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Link to="/" className="inline-block mx-auto mb-4">
              <img src={logoEspigon} alt="El Espigón" className="h-16 w-16 rounded-full object-cover hover:opacity-80 transition-opacity" />
            </Link>
            <CardTitle className="text-2xl">Token inválido</CardTitle>
            <CardDescription>
              El enlace de recuperación no es válido o ha expirado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                Por favor solicita un nuevo enlace de recuperación de contraseña.
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Link to="/forgot-password">
                <Button>
                  Solicitar nuevo enlace
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Link to="/" className="inline-block mx-auto mb-4">
              <img src={logoEspigon} alt="El Espigón" className="h-16 w-16 rounded-full object-cover hover:opacity-80 transition-opacity" />
            </Link>
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">¡Contraseña actualizada!</CardTitle>
            <CardDescription>
              Tu contraseña ha sido restablecida exitosamente
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertDescription>
                Redirigiendo al inicio de sesión...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="inline-block mx-auto mb-4">
            <img src={logoEspigon} alt="El Espigón" className="h-16 w-16 rounded-full object-cover hover:opacity-80 transition-opacity" />
          </Link>
          <CardTitle className="text-2xl">Restablecer contraseña</CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Mínimo 6 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
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
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restableciendo...
                </>
              ) : (
                'Restablecer contraseña'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline font-medium">
                Volver al inicio de sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
