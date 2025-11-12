import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  CreditCard, 
  Mail, 
  Bell, 
  Shield, 
  Truck, 
  DollarSign,
  Save,
  RefreshCw,
  Settings as SettingsIcon,
  Lock,
  Moon,
  Sun
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/context/ThemeContext';

export function AdminSettings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  // Estados para las configuraciones
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Marketplace El Espigón',
    siteDescription: 'Plataforma de comercio electrónico para emprendedores locales',
    contactEmail: 'contacto@espigon.com',
    contactPhone: '+593 99 123 4567',
    address: 'Manta, Manabí, Ecuador',
    currency: 'USD',
    language: 'es',
    timezone: 'America/Guayaquil',
  });

  const [paymentSettings, setPaymentSettings] = useState({
    enableTransfer: true,
    enableCash: true,
    enablePaypal: false,
    enableStripe: false,
    paypalEmail: '',
    stripeKey: '',
  });

  const [emailSettings, setEmailSettings] = useState({
    enableEmailNotifications: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@espigon.com',
    fromName: 'Marketplace El Espigón',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    notifyNewOrder: true,
    notifyOrderStatusChange: true,
    notifyLowStock: true,
    notifyNewSeller: true,
    notifyPaymentVerification: true,
    notifyNewProduct: false,
  });

  const [deliverySettings, setDeliverySettings] = useState({
    enableDelivery: true,
    deliveryCost: '2.50',
    freeDeliveryMinAmount: '50.00',
    deliveryTimeMin: '30',
    deliveryTimeMax: '60',
    deliveryRadius: '10',
  });

  const [securitySettings, setSecuritySettings] = useState(() => {
    const saved = localStorage.getItem('security_settings');
    return saved ? JSON.parse(saved) : {
      enableTwoFactor: false,
      sessionTimeout: '30',
      maxLoginAttempts: '5',
      passwordMinLength: '8',
      requireStrongPassword: true,
      enableCaptcha: false,
    };
  });

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
      // Aquí iría la llamada a la API para guardar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configuración guardada",
        description: "La configuración general se ha actualizado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePayments = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configuración guardada",
        description: "La configuración de pagos se ha actualizado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configuración guardada",
        description: "La configuración de correo se ha actualizado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configuración guardada",
        description: "Las preferencias de notificaciones se han actualizado.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDelivery = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configuración guardada",
        description: "La configuración de entregas se ha actualizado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Guardar en localStorage
      localStorage.setItem('security_settings', JSON.stringify(securitySettings));
      
      toast({
        title: "Configuración guardada",
        description: "La configuración de seguridad se ha actualizado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Configuración del Sistema
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra la configuración general de la plataforma
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          <SettingsIcon className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      </div>

      {/* Tabs de Configuración */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span className="hidden sm:inline">Apariencia</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Pagos</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Correo</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            <span className="hidden sm:inline">Entregas</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Seguridad</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: General */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Información General
              </CardTitle>
              <CardDescription>
                Configura la información básica de tu marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nombre del Sitio</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                    placeholder="Marketplace El Espigón"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email de Contacto</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })}
                    placeholder="contacto@espigon.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Descripción del Sitio</Label>
                <Textarea
                  id="siteDescription"
                  value={generalSettings.siteDescription}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                  placeholder="Descripción breve de tu marketplace"
                  rows={3}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Teléfono de Contacto</Label>
                  <Input
                    id="contactPhone"
                    value={generalSettings.contactPhone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, contactPhone: e.target.value })}
                    placeholder="+593 99 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={generalSettings.address}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                    placeholder="Manta, Manabí, Ecuador"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select
                    value={generalSettings.currency}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, currency: value })}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                      <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={generalSettings.language}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, language: value })}
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select
                    value={generalSettings.timezone}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, timezone: value })}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Guayaquil">Ecuador (GMT-5)</SelectItem>
                      <SelectItem value="America/Bogota">Colombia (GMT-5)</SelectItem>
                      <SelectItem value="America/Lima">Perú (GMT-5)</SelectItem>
                      <SelectItem value="America/Mexico_City">México (GMT-6)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Apariencia */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                Apariencia
              </CardTitle>
              <CardDescription>
                Personaliza la apariencia del panel de administración
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Modo Oscuro</Label>
                  <p className="text-sm text-muted-foreground">
                    Cambia entre tema claro y oscuro para el panel de administración
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sun className="w-4 h-4" />
                    Claro
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => {
                      setTheme(checked ? 'dark' : 'light');
                      toast({
                        title: "Tema actualizado",
                        description: `Modo ${checked ? 'oscuro' : 'claro'} activado`,
                      });
                    }}
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Moon className="w-4 h-4" />
                    Oscuro
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-muted/50 border rounded-lg p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Sun className="w-4 h-4 text-yellow-500" />
                      Modo Claro
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Interfaz brillante y clara, ideal para entornos bien iluminados. Reduce la fatiga visual durante el día.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Moon className="w-4 h-4 text-blue-500" />
                      Modo Oscuro
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Interfaz oscura que reduce el brillo de la pantalla. Perfecto para trabajar de noche o en lugares con poca luz.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 Consejo:</strong> El tema seleccionado se aplica automáticamente y se guarda en tu navegador.
                  Puedes cambiarlo en cualquier momento desde esta sección.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pagos */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Métodos de Pago
              </CardTitle>
              <CardDescription>
                Configura los métodos de pago disponibles en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Métodos de pago habilitados */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Transferencia Bancaria</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite pagos mediante transferencia
                    </p>
                  </div>
                  <Switch
                    checked={paymentSettings.enableTransfer}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, enableTransfer: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pago en Efectivo</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite pago en efectivo contra entrega
                    </p>
                  </div>
                  <Switch
                    checked={paymentSettings.enableCash}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, enableCash: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>PayPal</Label>
                    <p className="text-sm text-muted-foreground">
                      Integración con PayPal (próximamente)
                    </p>
                  </div>
                  <Switch
                    checked={paymentSettings.enablePaypal}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, enablePaypal: checked })}
                    disabled
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Stripe</Label>
                    <p className="text-sm text-muted-foreground">
                      Integración con Stripe (próximamente)
                    </p>
                  </div>
                  <Switch
                    checked={paymentSettings.enableStripe}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, enableStripe: checked })}
                    disabled
                  />
                </div>
              </div>

              <Separator />

              {/* Nota sobre datos bancarios */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Nota:</strong> Los datos bancarios para transferencias son configurados por cada vendedor individualmente
                  en su perfil. Los clientes verán los datos bancarios del vendedor correspondiente al momento de pagar.
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSavePayments} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Email */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Configuración de Correo
              </CardTitle>
              <CardDescription>
                Configura el servidor SMTP para el envío de correos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar envío de correos automáticos
                  </p>
                </div>
                <Switch
                  checked={emailSettings.enableEmailNotifications}
                  onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, enableEmailNotifications: checked })}
                />
              </div>

              {emailSettings.enableEmailNotifications && (
                <>
                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">Servidor SMTP</Label>
                      <Input
                        id="smtpHost"
                        value={emailSettings.smtpHost}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">Puerto SMTP</Label>
                      <Input
                        id="smtpPort"
                        value={emailSettings.smtpPort}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                        placeholder="587"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">Usuario SMTP</Label>
                      <Input
                        id="smtpUser"
                        type="email"
                        value={emailSettings.smtpUser}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                        placeholder="tu-email@gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">Contraseña SMTP</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={emailSettings.smtpPassword}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                        placeholder="••••••••••••"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fromEmail">Email Remitente</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={emailSettings.fromEmail}
                        onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                        placeholder="noreply@espigon.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fromName">Nombre Remitente</Label>
                      <Input
                        id="fromName"
                        value={emailSettings.fromName}
                        onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                        placeholder="Marketplace El Espigón"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Nota:</strong> Para Gmail, necesitas usar una "Contraseña de aplicación" en lugar de tu contraseña normal.
                      Puedes generarla en la configuración de seguridad de tu cuenta de Google.
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" disabled={isSaving}>
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar Email de Prueba
                </Button>
                <Button onClick={handleSaveEmail} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notificaciones */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Preferencias de Notificaciones
              </CardTitle>
              <CardDescription>
                Configura qué eventos generan notificaciones para administradores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nuevas Órdenes</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar cuando se cree una nueva orden
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.notifyNewOrder}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, notifyNewOrder: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cambios de Estado de Órdenes</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar cuando cambie el estado de una orden
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.notifyOrderStatusChange}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, notifyOrderStatusChange: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Stock Bajo</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar cuando un producto tenga poco inventario
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.notifyLowStock}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, notifyLowStock: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nuevos Vendedores</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar cuando se registre un nuevo vendedor
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.notifyNewSeller}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, notifyNewSeller: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Verificaciones de Pago</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar cuando se requiera verificar un pago
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.notifyPaymentVerification}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, notifyPaymentVerification: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nuevos Productos</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar cuando un vendedor publique un producto
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.notifyNewProduct}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, notifyNewProduct: checked })}
                />
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Entregas */}
        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Configuración de Entregas
              </CardTitle>
              <CardDescription>
                Configura las opciones de entrega y envío
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Habilitar Entregas</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir entregas a domicilio
                  </p>
                </div>
                <Switch
                  checked={deliverySettings.enableDelivery}
                  onCheckedChange={(checked) => setDeliverySettings({ ...deliverySettings, enableDelivery: checked })}
                />
              </div>

              {deliverySettings.enableDelivery && (
                <>
                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="deliveryCost">Costo de Entrega (USD)</Label>
                      <Input
                        id="deliveryCost"
                        type="number"
                        step="0.01"
                        value={deliverySettings.deliveryCost}
                        onChange={(e) => setDeliverySettings({ ...deliverySettings, deliveryCost: e.target.value })}
                        placeholder="2.50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="freeDeliveryMinAmount">Entrega Gratis desde (USD)</Label>
                      <Input
                        id="freeDeliveryMinAmount"
                        type="number"
                        step="0.01"
                        value={deliverySettings.freeDeliveryMinAmount}
                        onChange={(e) => setDeliverySettings({ ...deliverySettings, freeDeliveryMinAmount: e.target.value })}
                        placeholder="50.00"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="deliveryTimeMin">Tiempo Mínimo (min)</Label>
                      <Input
                        id="deliveryTimeMin"
                        type="number"
                        value={deliverySettings.deliveryTimeMin}
                        onChange={(e) => setDeliverySettings({ ...deliverySettings, deliveryTimeMin: e.target.value })}
                        placeholder="30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryTimeMax">Tiempo Máximo (min)</Label>
                      <Input
                        id="deliveryTimeMax"
                        type="number"
                        value={deliverySettings.deliveryTimeMax}
                        onChange={(e) => setDeliverySettings({ ...deliverySettings, deliveryTimeMax: e.target.value })}
                        placeholder="60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryRadius">Radio de Entrega (km)</Label>
                      <Input
                        id="deliveryRadius"
                        type="number"
                        value={deliverySettings.deliveryRadius}
                        onChange={(e) => setDeliverySettings({ ...deliverySettings, deliveryRadius: e.target.value })}
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Configuración Actual:</strong> Entregas de ${deliverySettings.deliveryCost} USD • 
                      Gratis desde ${deliverySettings.freeDeliveryMinAmount} USD • 
                      Tiempo estimado: {deliverySettings.deliveryTimeMin}-{deliverySettings.deliveryTimeMax} min
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button onClick={handleSaveDelivery} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Seguridad */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Configuración de Seguridad
              </CardTitle>
              <CardDescription>
                Configura las opciones de seguridad y autenticación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autenticación de Dos Factores</Label>
                  <p className="text-sm text-muted-foreground">
                    Requiere 2FA para administradores (próximamente)
                  </p>
                </div>
                <Switch
                  checked={securitySettings.enableTwoFactor}
                  onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, enableTwoFactor: checked })}
                  disabled
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Contraseñas Seguras</Label>
                  <p className="text-sm text-muted-foreground">
                    Requiere mayúsculas, números y caracteres especiales
                  </p>
                </div>
                <Switch
                  checked={securitySettings.requireStrongPassword}
                  onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireStrongPassword: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>CAPTCHA</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar CAPTCHA en formularios (próximamente)
                  </p>
                </div>
                <Switch
                  checked={securitySettings.enableCaptcha}
                  onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, enableCaptcha: checked })}
                  disabled
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout de Sesión (min)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Intentos de Login Máx.</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: e.target.value })}
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Long. Mín. Contraseña</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: e.target.value })}
                    placeholder="8"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex gap-2">
                  <Lock className="w-5 h-5 text-yellow-700 dark:text-yellow-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Recomendaciones de Seguridad
                    </p>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1 list-disc list-inside">
                      <li>Usa contraseñas de al menos 8 caracteres</li>
                      <li>Limita los intentos de inicio de sesión a 5</li>
                      <li>Configura un timeout de sesión de 30 minutos</li>
                      <li>Habilita 2FA cuando esté disponible</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSecurity} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
