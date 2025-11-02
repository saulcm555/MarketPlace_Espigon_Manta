# Sistema de Manejo de Errores Centralizado

## 📋 Descripción

El REST service implementa un sistema de manejo de errores centralizado que proporciona:
- Respuestas de error consistentes en toda la aplicación
- Errores tipados con códigos HTTP apropiados
- Captura automática de errores sin bloques try-catch repetitivos
- Logging estructurado de errores
- Manejo de rutas no encontradas (404)

## 🏗️ Arquitectura

### 1. Clases de Error Personalizadas (`AppError.ts`)

**AppError (Base)**
```typescript
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}
```

**Errores Predefinidos:**
- `NotFoundError` - 404: Recurso no encontrado
- `BadRequestError` - 400: Solicitud inválida
- `UnauthorizedError` - 401: No autenticado
- `ForbiddenError` - 403: Sin permisos
- `ConflictError` - 409: Conflicto (ej: email duplicado)
- `ValidationError` - 422: Validación fallida

### 2. Middlewares de Manejo de Errores (`errorHandler.ts`)

**errorHandler**
- Middleware global que captura todos los errores
- Distingue entre errores operacionales y de programación
- Oculta stack traces en producción
- Registra errores en consola con contexto (path, method, etc.)

**notFoundHandler**
- Captura rutas no existentes
- Genera automáticamente error 404

**asyncHandler**
- Wrapper para funciones async en controladores
- Elimina la necesidad de try-catch en cada función
- Pasa automáticamente errores al middleware de errores

## 🔧 Uso

### En Controladores

**ANTES (sin manejo centralizado):**
```typescript
export const getClientById = async (req: Request, res: Response) => {
  try {
    const client = await clientService.getClientById(id);
    
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.json(client);
  } catch (error: any) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};
```

**DESPUÉS (con manejo centralizado):**
```typescript
export const getClientById = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientService.getClientById(id);
  
  if (!client) {
    throw new NotFoundError("Cliente");
  }
  res.json(client);
});
```

### Lanzar Errores

```typescript
// Error 404
throw new NotFoundError("Cliente");  // "Cliente not found"

// Error 400
throw new BadRequestError("Email es requerido");

// Error 401
throw new UnauthorizedError("Token inválido");

// Error 403
throw new ForbiddenError("No tienes acceso a este recurso");

// Error 409
throw new ConflictError("El email ya está registrado");

// Error 422
throw new ValidationError("Los datos no son válidos");

// Error personalizado
throw new AppError("Mensaje personalizado", 418);
```

## 📡 Formato de Respuesta de Error

```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Cliente not found",
  "stack": "Error: Cliente not found\n    at getClientById..." // Solo en desarrollo
}
```

## 🔌 Integración en main.ts

```typescript
import { errorHandler, notFoundHandler } from "./middlewares/errors";

// ... Registrar todas las rutas ...

// Middlewares de error (DEBEN IR AL FINAL)
app.use(notFoundHandler);      // Captura 404
app.use(errorHandler);         // Manejo global de errores
```

**⚠️ IMPORTANTE:** Los middlewares de error deben registrarse DESPUÉS de todas las rutas.

## ✅ Controladores Refactorizados

Los siguientes controladores ya implementan el manejo de errores centralizado:

### Auth Controller (`authController.ts`)
- ✅ `loginClient` - Maneja credenciales inválidas con UnauthorizedError
- ✅ `loginSeller` - Maneja credenciales inválidas con UnauthorizedError
- ✅ `loginAdmin` - Maneja credenciales inválidas con UnauthorizedError
- ✅ `verifyToken` - Maneja token faltante con UnauthorizedError
- ✅ `registerClient` - Maneja email duplicado con ConflictError

### Client Controller (`clientController.ts`)
- ✅ `getClients` - Lista todos sin try-catch
- ✅ `getClientById` - Usa NotFoundError si no existe
- ✅ `createClient` - Errores automáticos de use case
- ✅ `updateClient` - Errores automáticos de use case
- ✅ `deleteClient` - Usa NotFoundError si no existe

## 🎯 Beneficios

1. **Código más limpio**: No más bloques try-catch repetitivos
2. **Consistencia**: Todas las respuestas de error tienen el mismo formato
3. **Mantenibilidad**: Cambios en formato de error se hacen en un solo lugar
4. **Debugging**: Stack traces y logging estructurado
5. **Tipado**: Errores específicos con códigos HTTP correctos
6. **Seguridad**: Stack traces ocultos en producción

## 🔄 Próximos Pasos

Para completar la implementación en toda la aplicación:

1. Refactorizar controladores restantes:
   - productController.ts
   - orderController.ts
   - cartController.ts
   - sellerController.ts
   - adminController.ts
   - categoryController.ts
   - subCategoryController.ts
   - paymentMethodController.ts
   - deliveryController.ts
   - inventoryController.ts

2. Patrón a seguir:
   - Importar `asyncHandler` y clases de error necesarias
   - Envolver funciones con `asyncHandler`
   - Reemplazar `return res.status(4xx)` con `throw new XxxError()`
   - Eliminar bloques try-catch
   - Dejar que el middleware global maneje los errores

## 📚 Recursos

- **Archivos de error**: `src/infrastructure/middlewares/errors/`
- **Ejemplos**: `authController.ts`, `clientController.ts`
- **Configuración**: `src/main/main.ts` (líneas finales)
