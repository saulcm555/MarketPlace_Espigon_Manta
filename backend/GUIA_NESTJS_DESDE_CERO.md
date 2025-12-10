# 🚀 GUÍA NESTJS DESDE CERO

> **Guía Conceptual** - Cómo organizar un proyecto NestJS profesional y prompts para trabajar con IA

---

## 📋 TABLA DE CONTENIDOS

1. [¿Qué es NestJS?](#-qué-es-nestjs)
2. [Estructura de Proyecto](#-estructura-de-proyecto-nestjs)
3. [Conceptos Clave](#-conceptos-clave)
4. [Organización Recomendada](#-organización-recomendada)
5. [Ejemplo con Entidades Básicas](#-ejemplo-con-entidades-básicas)
6. [Flujo de Datos](#-flujo-de-datos-en-nestjs)
7. [Comparación con Express](#-comparación-con-express)
8. [Prompts para IA](#-prompts-para-trabajar-con-ia)

---

## 🎯 ¿QUÉ ES NESTJS?

NestJS es un framework de Node.js que usa **TypeScript** y está inspirado en **Angular**.

### Características principales:

✅ **Arquitectura modular**: Todo se organiza en módulos  
✅ **Decoradores**: `@Controller()`, `@Injectable()`, `@Get()`  
✅ **Inyección de dependencias**: Automática y poderosa  
✅ **TypeScript nativo**: Tipado fuerte desde el inicio  
✅ **CLI potente**: Genera código automáticamente  
✅ **Opinado**: Te guía en buenas prácticas  

### ¿Por qué usar NestJS?

| Express (tradicional) | NestJS |
|----------------------|--------|
| Estructura libre | Estructura definida |
| Configuración manual | CLI + decoradores |
| DI manual | DI automática |
| Sin opiniones | Opinado (buenas prácticas) |
| Flexible pero caótico | Escalable y organizado |

---

## 📁 ESTRUCTURA DE PROYECTO NESTJS

### Estructura básica generada:

```
my-nestjs-project/
├── src/
│   ├── app.module.ts           # Módulo raíz
│   ├── app.controller.ts       # Controller raíz
│   ├── app.service.ts          # Service raíz
│   └── main.ts                 # Entry point
│
├── test/                       # Tests e2e
├── node_modules/
├── nest-cli.json              # Configuración CLI
├── package.json
├── tsconfig.json
└── README.md
```

### Estructura recomendada para producción:

```
src/
├── main.ts                     # Punto de entrada
├── app.module.ts               # Módulo principal
│
├── modules/                    # Módulos de dominio
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   └── interfaces/
│   │       └── user.interface.ts
│   │
│   ├── products/
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── entities/
│   │   ├── dto/
│   │   └── interfaces/
│   │
│   └── orders/
│       ├── orders.module.ts
│       ├── orders.controller.ts
│       ├── orders.service.ts
│       ├── entities/
│       ├── dto/
│       └── interfaces/
│
├── common/                     # Compartido entre módulos
│   ├── decorators/            # Decoradores personalizados
│   ├── filters/               # Filtros de excepciones
│   ├── guards/                # Guards de autenticación
│   ├── interceptors/          # Interceptores
│   ├── middlewares/           # Middlewares
│   ├── pipes/                 # Pipes de validación
│   └── utils/                 # Utilidades
│
├── config/                     # Configuración
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── app.config.ts
│
└── database/                   # Base de datos
    ├── database.module.ts
    ├── migrations/
    └── seeds/
```

---

## 🧩 CONCEPTOS CLAVE

### 1. **Módulos** (`@Module()`)

Un módulo **agrupa funcionalidad relacionada**.

```typescript
@Module({
  imports: [],       // Módulos que necesitas
  controllers: [],   // Controladores del módulo
  providers: [],     // Servicios, repositorios, etc.
  exports: []        // Qué expones a otros módulos
})
export class UsersModule {}
```

**Analogía:** Es como una carpeta que contiene todo lo relacionado con "usuarios"

### 2. **Controllers** (`@Controller()`)

Los controllers **manejan las peticiones HTTP**.

```typescript
@Controller('users')  // Ruta base: /users
export class UsersController {
  
  @Get()              // GET /users
  findAll() {
    return 'Lista de usuarios';
  }
  
  @Get(':id')         // GET /users/:id
  findOne(@Param('id') id: string) {
    return `Usuario ${id}`;
  }
  
  @Post()             // POST /users
  create(@Body() createUserDto: CreateUserDto) {
    return 'Usuario creado';
  }
}
```

**Analogía:** Es el mesero que recibe tu orden

### 3. **Services** (`@Injectable()`)

Los services **contienen la lógica de negocio**.

```typescript
@Injectable()
export class UsersService {
  private users = [];
  
  findAll() {
    return this.users;
  }
  
  findOne(id: string) {
    return this.users.find(user => user.id === id);
  }
  
  create(createUserDto: CreateUserDto) {
    const user = { id: Date.now(), ...createUserDto };
    this.users.push(user);
    return user;
  }
}
```

**Analogía:** Es el chef que prepara tu comida

### 4. **DTOs** (Data Transfer Objects)

DTOs **definen la estructura de datos** que entran/salen.

```typescript
export class CreateUserDto {
  @IsString()
  @MinLength(3)
  name: string;
  
  @IsEmail()
  email: string;
  
  @IsString()
  @MinLength(6)
  password: string;
}
```

**Analogía:** Es el formulario que debes llenar correctamente

### 5. **Entities**

Entities **representan tablas de la base de datos**.

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  name: string;
  
  @Column({ unique: true })
  email: string;
  
  @Column()
  password: string;
  
  @CreateDateColumn()
  createdAt: Date;
}
```

**Analogía:** Es el plano de una tabla en la base de datos

### 6. **Pipes**

Pipes **transforman o validan datos**.

```typescript
// Uso automático con class-validator
@Post()
create(@Body() createUserDto: CreateUserDto) {
  // Si el DTO no es válido, NestJS automáticamente
  // rechaza la petición con error 400
}
```

### 7. **Guards**

Guards **controlan el acceso** (autenticación/autorización).

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return validateToken(request.headers.authorization);
  }
}

// Uso:
@UseGuards(AuthGuard)
@Get('profile')
getProfile() {
  return 'Perfil protegido';
}
```

**Analogía:** Es el guardia de seguridad que verifica tu ID

---

## 🎨 ORGANIZACIÓN RECOMENDADA

### Opción 1: Por Módulos de Dominio (Recomendado)

```
src/
├── users/          # Todo sobre usuarios
├── products/       # Todo sobre productos
├── orders/         # Todo sobre órdenes
└── auth/           # Todo sobre autenticación
```

**Ventaja:** Fácil de encontrar todo relacionado con un tema

### Opción 2: Por Capas (Tipo Clean Architecture)

```
src/
├── domain/
│   └── entities/
├── application/
│   ├── use-cases/
│   └── dto/
├── infrastructure/
│   ├── database/
│   └── http/
└── presentation/
    └── controllers/
```

**Ventaja:** Separación clara de responsabilidades

### Opción 3: Híbrida (La mejor)

```
src/
├── modules/
│   ├── users/
│   │   ├── domain/
│   │   │   └── user.entity.ts
│   │   ├── application/
│   │   │   ├── dto/
│   │   │   └── use-cases/
│   │   ├── infrastructure/
│   │   │   └── user.repository.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   │
│   └── products/
│       └── (misma estructura)
│
└── common/
    └── (código compartido)
```

**Ventaja:** Lo mejor de ambos mundos

---

### Diagrama de relación:

```
┌─────────────────────────────────┐
│        App Module               │
│  (Módulo raíz del sistema)      │
└────────┬───────────┬────────────┘
         │           │
         │           │
    ┌────▼────┐  ┌───▼──────┐
    │  Posts  │  │Comments  │
    │ Module  │  │  Module  │
    └────┬────┘  └───┬──────┘
         │           │
         │           │ imports
         │           └──────────┐
         │                      │
    ┌────▼──────────┐      ┌────▼──────────┐
    │Posts          │      │Comments       │
    │Controller     │      │Controller     │
    └────┬──────────┘      └────┬──────────┘
         │                      │
         │                      │
    ┌────▼──────────┐      ┌────▼──────────┐
    │Posts          │◀─────┤Comments       │
    │Service        │ usa  │Service        │
    └───────────────┘      └───────────────┘
```

---

## 🌊 FLUJO DE DATOS EN NESTJS

### Ejemplo: Crear un post

```
1. Cliente hace: POST /posts
   Body: { "title": "Mi Post", "content": "...", "author": "Juan" }
                    ↓
                    
2. NestJS recibe petición
   → Enrutador identifica: PostsController.create()
                    ↓
                    
3. Validación automática
   → Pipes validan CreatePostDto
   → Si hay errores: 400 Bad Request
                    ↓
                    
4. Guards (si existen)
   → AuthGuard verifica token
   → Si no autorizado: 401 Unauthorized
                    ↓
                    
5. Controller recibe datos válidos
   → @Body() createPostDto: CreatePostDto
   → Llama: this.postsService.create(createPostDto)
                    ↓
                    
6. Service ejecuta lógica
   → Crea objeto Post
   → Guarda en array (o DB)
   → Retorna post creado
                    ↓
                    
7. Interceptors (si existen)
   → Transforman respuesta
   → Agregan metadata
                    ↓
                    
8. Respuesta al cliente
   → 201 Created
   → Body: { "id": 1, "title": "Mi Post", ... }
```

### Flujo visual completo:

```
   Request
      ↓
  Middleware (global)
      ↓
    Guard (autenticación)
      ↓
  Interceptor (antes)
      ↓
    Pipe (validación)
      ↓
   Controller
      ↓
    Service
      ↓
  Repository (DB)
      ↓
    Service
      ↓
   Controller
      ↓
  Interceptor (después)
      ↓
    Filter (manejo errores)
      ↓
   Response
```

---

### NestJS:

```typescript
// posts.controller.ts
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }
}

// posts.service.ts
@Injectable()
export class PostsService {
  constructor(private postsRepository: PostsRepository) {}

  findAll() {
    return this.postsRepository.findAll();
  }

  create(createPostDto: CreatePostDto) {
    return this.postsRepository.create(createPostDto);
  }
}
```

### Diferencias clave:

| Aspecto | Express | NestJS |
|---------|---------|--------|
| **Estructura** | Libre | Modular y organizada |
| **Validación** | Manual | Automática (DTOs + pipes) |
| **Inyección** | Manual | Automática |
| **Separación** | Mixta | Clara (controller/service/repository) |
| **Testing** | Complejo | Sencillo (DI facilita mocks) |
| **Escalabilidad** | Difícil | Natural |

---

## 💡 PROMPTS PARA TRABAJAR CON IA

### 🎯 Prompts Básicos

#### 1. Crear proyecto desde cero
```
Crea un proyecto NestJS con la siguiente funcionalidad:
- Módulo de [ENTIDAD]
- CRUD completo
- Validación con class-validator
- Documentación Swagger
- Manejo de errores global

Entidades: [Usuario, Producto, Orden, etc.]
```

#### 2. Generar módulo completo
```
Genera un módulo NestJS para [ENTIDAD] con:
- Entity con campos: [campo1: tipo1, campo2: tipo2]
- DTOs de creación y actualización con validaciones
- Service con métodos CRUD
- Controller con endpoints REST
- Incluye decoradores apropiados
```

#### 3. Agregar autenticación
```
Implementa autenticación JWT en mi proyecto NestJS:
- AuthModule con registro y login
- JWT Guard para proteger rutas
- Estrategia Passport JWT
- Decorador @CurrentUser() personalizado
```

### 🎯 Prompts Intermedios

#### 4. Relaciones entre entidades
```
Tengo dos entidades en NestJS con TypeORM:
- [Entidad1] con campos [...]
- [Entidad2] con campos [...]

Implementa relación [OneToMany/ManyToOne/ManyToMany] entre ellas:
- Actualiza entities con decoradores de relación
- Modifica DTOs para incluir IDs relacionados
- Ajusta services para cargar relaciones
```

#### 5. Validaciones complejas
```
Crea un DTO para [ENTIDAD] con las siguientes validaciones:
- [campo1]: string, mínimo 3 caracteres, máximo 50
- [campo2]: email válido
- [campo3]: número entre 0 y 100
- [campo4]: enum con valores [A, B, C]
- [campo5]: fecha mayor a hoy
- Validación personalizada: [regla de negocio]
```

#### 6. Manejo de errores
```
Implementa manejo de errores global en NestJS:
- HttpExceptionFilter para errores HTTP
- AllExceptionsFilter para errores no controlados
- Formato de respuesta consistente con:
  - statusCode
  - message
  - timestamp
  - path
```

### 🎯 Prompts Avanzados

#### 7. Arquitectura limpia
```
Organiza mi módulo [ENTIDAD] siguiendo Clean Architecture:

Estructura deseada:
- domain/ (entities, interfaces)
- application/ (use-cases, dto)
- infrastructure/ (repositories, controllers)

Entidad: [descripción]
Casos de uso: [listar casos de uso]
```

#### 8. Integración con base de datos
```
Integra TypeORM en mi proyecto NestJS:
- Configuración en app.module
- DatabaseModule separado
- Entities de: [lista de entidades]
- Relaciones: [describir relaciones]
- Migraciones automáticas en desarrollo
```

#### 9. Testing
```
Genera tests para [SERVICE/CONTROLLER] en NestJS:
- Tests unitarios con Jest
- Mocks de dependencias
- Casos de prueba:
  - Happy path
  - Validaciones
  - Errores
- Coverage mayor al 80%
```

#### 10. WebSockets
```
Implementa WebSocket en NestJS para [caso de uso]:
- Gateway con eventos: [listar eventos]
- Autenticación de sockets con JWT
- Rooms para [criterio de agrupación]
- Broadcast selectivo según [condición]
```

### 🎯 Prompts Específicos

#### 11. Paginación y filtros
```
Implementa paginación y filtros en el endpoint GET /[entidades]:
- Query params: page, limit, sortBy, order
- Filtros por: [campo1, campo2, campo3]
- Búsqueda por texto en campos: [lista]
- Respuesta con metadata: totalItems, totalPages, currentPage
```

#### 12. Subida de archivos
```
Implementa subida de archivos en NestJS:
- Endpoint POST /[entidad]/upload
- Validación: tipos permitidos [jpg, png], tamaño máximo [5MB]
- Almacenamiento en [local/S3/Cloudinary]
- Retornar URL del archivo
```

#### 13. Caché con Redis
```
Implementa caché con Redis en NestJS:
- CacheModule configurado
- Cache en métodos: [método1, método2]
- TTL: [tiempo] segundos
- Invalidación al: [crear/actualizar/eliminar]
```

#### 14. Rate limiting
```
Implementa rate limiting en mi API NestJS:
- Límite: [número] requests por [tiempo]
- Aplicar a rutas: [listar rutas]
- Headers de respuesta con límite restante
- Respuesta 429 Too Many Requests
```

#### 15. Documentación Swagger
```
Agrega documentación Swagger a mi API NestJS:
- Configuración en main.ts
- Decoradores @ApiTags, @ApiOperation en controllers
- DTOs documentados con @ApiProperty
- Ejemplos de request/response
- Autenticación JWT documentada
```

### 🎯 Prompts de Refactoring

#### 16. Migrar de Express a NestJS
```
Tengo este código Express:
[pegar código]

Conviértelo a NestJS siguiendo mejores prácticas:
- Separar en controller/service
- Agregar DTOs con validación
- Inyección de dependencias
- Manejo de errores apropiado
```

#### 17. Optimización
```
Optimiza este [controller/service] de NestJS:
[pegar código]

Mejoras deseadas:
- Performance
- Manejo de errores
- Código limpio
- Principios SOLID
```

#### 18. Agregar funcionalidad
```
A mi módulo [ENTIDAD] existente:
[descripción del módulo]

Agrega la siguiente funcionalidad:
[describir nueva feature]

Manteniendo la estructura actual y mejores prácticas.
```

---

## 📊 DIAGRAMA DE DECISIONES

### ¿Cuándo usar qué?

```
¿Necesitas organizar código?
    → @Module()

¿Manejas peticiones HTTP?
    → @Controller()

¿Tienes lógica de negocio?
    → @Injectable() + Service

¿Necesitas validar datos de entrada?
    → DTO + class-validator

¿Quieres proteger rutas?
    → @UseGuards(AuthGuard)

¿Necesitas transformar datos?
    → @UsePipes() o Interceptors

¿Manejas errores específicos?
    → ExceptionFilter

¿Necesitas código antes/después de handler?
    → Interceptor

¿Código compartido entre módulos?
    → common/ folder

¿Configuración?
    → config/ folder + ConfigModule
```

---

## 🚀 COMANDOS CLI ESENCIALES

```bash
# Crear proyecto
nest new nombre-proyecto

# Generar módulo completo (CRUD)
nest g resource nombre

# Generar partes individuales
nest g module nombre
nest g controller nombre
nest g service nombre

# Generar otros elementos
nest g guard auth
nest g interceptor logging
nest g filter http-exception
nest g pipe validation
nest g middleware logger

# Ejecutar proyecto
npm run start:dev    # Modo desarrollo
npm run start:prod   # Modo producción

# Tests
npm run test         # Tests unitarios
npm run test:e2e     # Tests end-to-end
npm run test:cov     # Coverage
```

---

## 💡 TIPS IMPORTANTES

### 1. **Siempre usa DTOs**
❌ No hagas esto:
```typescript
@Post()
create(@Body() body: any) { }
```

✅ Haz esto:
```typescript
@Post()
create(@Body() createDto: CreateDto) { }
```

### 2. **No pongas lógica en Controllers**
❌ No:
```typescript
@Get()
findAll() {
  return this.database.query('SELECT * FROM users');
}
```

✅ Sí:
```typescript
@Get()
findAll() {
  return this.usersService.findAll();
}
```

### 3. **Usa inyección de dependencias**
❌ No:
```typescript
export class UsersController {
  service = new UsersService();
}
```

✅ Sí:
```typescript
export class UsersController {
  constructor(private service: UsersService) {}
}
```

### 4. **Exporta servicios que otros necesiten**
```typescript
@Module({
  providers: [UsersService],
  exports: [UsersService]  // ← Importante
})
```

### 5. **Usa pipes globales para validación**
```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

---

## 🎓 RECURSOS PARA APRENDER

### Documentación Oficial
- **NestJS Docs**: https://docs.nestjs.com
- **NestJS DevTools**: https://devtools.nestjs.com

### Cursos Recomendados
- NestJS Zero to Hero (Udemy)
- NestJS Fundamentals (NestJS oficial)

### Repositorios de Ejemplo
- https://github.com/nestjs/nest (ejemplos oficiales)
- Busca en GitHub: "nestjs boilerplate"

### Comunidad
- Discord oficial de NestJS
- Stack Overflow tag: nestjs

---

## ✅ CHECKLIST PARA PROYECTO NESTJS

Antes de empezar tu proyecto, asegúrate de:

- [ ] Instalar Node.js (v16+)
- [ ] Instalar NestJS CLI globalmente
- [ ] Decidir arquitectura (modular/clean/híbrida)
- [ ] Elegir base de datos (PostgreSQL, MongoDB, etc.)
- [ ] Configurar TypeORM o Mongoose
- [ ] Implementar autenticación (JWT)
- [ ] Agregar validación global (ValidationPipe)
- [ ] Configurar manejo de errores
- [ ] Documentar con Swagger
- [ ] Escribir tests
- [ ] Configurar CI/CD

---

## 🎯 DIFERENCIAS CLAVE VS TU PROYECTO ACTUAL

| Aspecto | Tu Proyecto Actual | NestJS |
|---------|-------------------|--------|
| **Estructura** | Clean Architecture manual | Modular por defecto |
| **DI** | Manual con constructores | Automática con decoradores |
| **Validación** | DTOs + validación manual | class-validator automático |
| **Routing** | Express rutas manuales | Decoradores @Get/@Post |
| **Testing** | Setup manual | Built-in con Jest |
| **Documentación** | Swagger manual | @nestjs/swagger automático |

---

## 🎉 RESUMEN FINAL

**NestJS te da:**
- ✅ Estructura organizada desde el inicio
- ✅ Menos código boilerplate
- ✅ Validación automática
- ✅ DI potente y simple
- ✅ Testing fácil
- ✅ Escalabilidad natural
- ✅ TypeScript first-class

**Usa NestJS cuando:**
- Proyecto mediano a grande
- Equipo de varios desarrolladores
- Necesitas estructura clara
- Quieres buenas prácticas forzadas

**No uses NestJS cuando:**
- Proyecto muy pequeño (API de 3 endpoints)
- Prototipo rápido
- Ya dominas otro framework y el proyecto es simple


## 📝 NOTAS FINALES

Esta guía te da los **conceptos** sin saturarte con código. NestJS tiene mucho más (GraphQL, Microservicios, WebSockets, Testing avanzado, etc.), pero con esto tienes la base sólida para:

1. ✅ Entender cómo se organiza un proyecto NestJS
2. ✅ Saber qué va en cada capa
3. ✅ Poder pedirle a la IA que te ayude efectivamente
4. ✅ Leer código de otros proyectos NestJS
5. ✅ Arrancar tu propio proyecto con confianza

**¡Recuerda usar los prompts! La IA puede ayudarte muchísimo si le pides correctamente.**




🛠️ INSTALACIÓN Y CONFIGURACIÓN DE NESTJS

### Prerrequisitos

Antes de instalar NestJS, asegúrate de tener:

- **Node.js**: v16 o superior (recomendado v18+)
- **npm**: v7 o superior (incluido con Node.js)
- **Editor de código**: VS Code recomendado

Verifica tu instalación:
``````bash
node --version
npm --version
``````

### Instalación del CLI de NestJS

El CLI de NestJS es fundamental para crear proyectos y generar recursos rápidamente.

``````bash
# Instalar globalmente
npm install -g @nestjs/cli


## 1. Generar un recurso completo (CRUD)

``````bash
# Genera: module, controller, service, entity, dto
nest generate resource nombre

# Alias corto
nest g resource nombre

# Ejemplo: generar recurso "users"
nest g resource users
``````

**El CLI preguntará:**
- **Transport layer**: REST API, GraphQL, Microservices, WebSocket
  - Selecciona: **REST API**
- **¿Generar puntos de entrada CRUD?**: Yes/No
  - Selecciona: **Yes** para CRUD completo

**Genera:**
``````
src/users/
├── dto/
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
├── entities/
│   └── user.entity.ts
├── users.controller.spec.ts
├── users.controller.ts
├── users.module.ts
├── users.service.spec.ts
└── users.service.ts
``````

### 2. Generar componentes individuales

#### Generar un módulo
``````bash
nest g module nombre

# Ejemplo
nest g module productos
``````

#### Generar un controller
``````bash
nest g controller nombre

# Con carpeta específica
nest g controller productos

# Sin generar tests
nest g controller productos --no-spec
``````