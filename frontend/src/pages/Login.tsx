/**
 * Login Page
 * Página de inicio de sesión para clientes, vendedores y admins
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, Store, Shield, AlertTriangle } from 'lucide-react';
import type { UserRole } from '@/types/api';
import logoEspigon from '@/assets/logo.jpg';
import { 
  isUserBlocked, 
  recordFailedAttempt, 
  clearLoginAttempts, 
  getSecuritySettings 
} from '@/utils/securityConfig';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

  // Verificar si el usuario está bloqueado al cargar y cuando cambia el email
  useEffect(() => {
    if (!email) {
      setIsBlocked(false);
      return;
    }

    const checkBlock = () => {
      const blockStatus = isUserBlocked(email);
      setIsBlocked(blockStatus.blocked);
      if (blockStatus.blocked && blockStatus.remainingTime) {
        setBlockTimeRemaining(blockStatus.remainingTime);
      } else {
        setBlockTimeRemaining(0);
      }
    };

    checkBlock();
    
    // Revisar cada segundo si sigue bloqueado
    const interval = setInterval(checkBlock, 1000);
    return () => clearInterval(interval);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar que haya email
    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }

    // Verificar si está bloqueado
    const blockStatus = isUserBlocked(email);
    if (blockStatus.blocked) {
      setError(`Demasiados intentos fallidos. Espera ${blockStatus.remainingTime} minutos antes de intentar nuevamente.`);
      return;
    }

    setIsLoading(true);

    try {
      await login({ email, password }, selectedRole);
      
      // Login exitoso - limpiar intentos fallidos para este email
      clearLoginAttempts(email);
      
      // Redirect based on role
      navigate('/');
    } catch (err: any) {
      // Registrar intento fallido para este email
      const attemptResult = recordFailedAttempt(email);
      
      if (attemptResult.blocked) {
        setIsBlocked(true);
        setBlockTimeRemaining(attemptResult.blockedMinutes || 15);
        setError(`Demasiados intentos fallidos para ${email}. Tu cuenta ha sido bloqueada por ${attemptResult.blockedMinutes} minutos.`);
      } else {
        const settings = getSecuritySettings();
        const maxAttempts = parseInt(settings.maxLoginAttempts);
        setError(
          `Error al iniciar sesión. Verifica tus credenciales. ${attemptResult.attemptsLeft} ${
            attemptResult.attemptsLeft === 1 ? 'intento' : 'intentos'
          } restantes de ${maxAttempts} para ${email}.`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="inline-block mx-auto mb-4">
            <img src={logoEspigon} alt="El Espigón" className="h-16 w-16 rounded-full object-cover hover:opacity-80 transition-opacity" />
          </Link>
          <CardTitle className="text-2xl">Bienvenido de nuevo</CardTitle>
          <CardDescription>
            Inicia sesión para acceder a tu cuenta
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="client" className="gap-2">
                <User className="w-4 h-4" />
                Cliente
              </TabsTrigger>
              <TabsTrigger value="seller" className="gap-2">
                <Store className="w-4 h-4" />
                Vendedor
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-2">
                <Shield className="w-4 h-4" />
                Admin
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isBlocked && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Cuenta bloqueada temporalmente por seguridad. Espera {blockTimeRemaining} minuto(s).
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
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
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isBlocked}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : isBlocked ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Bloqueado ({blockTimeRemaining} min)
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>
            </form>
          </Tabs>

          <div className="mt-6 text-center text-sm space-y-2">
            <p className="text-muted-foreground">
              <Link to="/forgot-password" className="text-primary hover:underline font-medium">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
            <p className="text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Regístrate como cliente
              </Link>
            </p>
            <p className="text-muted-foreground">
              ¿Eres vendedor?{' '}
              <Link to="/register-seller" className="text-primary hover:underline font-medium">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
