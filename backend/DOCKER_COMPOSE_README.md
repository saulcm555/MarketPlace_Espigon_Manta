# 🐳 Docker Compose - MarketPlace Espigón Manta

Sistema de orquestación de contenedores para todos los microservicios del proyecto.

## 📋 Servicios Incluidos

| Servicio | Puerto | Tecnología | Descripción |
|----------|--------|------------|-------------|
| **auth-service** | 4001 | Node.js/TypeScript | Servicio de autenticación con JWT |
| **rest-service** | 3000 | Node.js/TypeScript | API REST principal con todas las entidades |
| **payment-service** | 3001 | Node.js/TypeScript | Servicio de pagos con webhooks B2B |
| **report-service** | 4000 | Python/FastAPI | Servicio de reportes con GraphQL |
| **realtime-service** | 8080 | Go | Servicio WebSocket para tiempo real |
| **mcp-service** | 3003 | Node.js/TypeScript | Servicio de chatbot con IA |
| **redis** | 6379 | Redis | Cache y pub/sub para comunicación |

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno

```bash
# En la carpeta backend/
cp .env.example .env
```

Edita el archivo `.env` y configura:
- Credenciales de Supabase (DB_HOST, DB_USERNAME, DB_PASSWORD, etc.)
- JWT_SECRET (genera uno con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- INTERNAL_API_KEY (genera uno con el mismo comando)
- Claves de API de servicios externos si las usas (Stripe, OpenAI, etc.)

### 2. Iniciar Todos los Servicios

```bash
cd backend
docker-compose up -d
```

El flag `-d` ejecuta los contenedores en segundo plano (detached mode).

### 3. Verificar Estado

```bash
docker-compose ps
```

Deberías ver todos los servicios con estado "Up (healthy)" después de unos segundos.

## 📝 Comandos Útiles

### Ver Logs

```bash
# Logs de todos los servicios
docker-compose logs -f

# Logs de un servicio específico
docker-compose logs -f auth-service
docker-compose logs -f rest-service
docker-compose logs -f payment-service
```

### Detener Servicios

```bash
# Detener todos los servicios (mantiene volúmenes)
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

### Reconstruir Imágenes

```bash
# Reconstruir todas las imágenes y reiniciar
docker-compose up -d --build

# Reconstruir solo un servicio
docker-compose up -d --build auth-service
```

### Reiniciar un Servicio Específico

```bash
docker-compose restart auth-service
```

### Ver Recursos Utilizados

```bash
docker-compose top
```

### Ejecutar Comandos Dentro de un Contenedor

```bash
# Abrir shell en un contenedor
docker-compose exec auth-service sh

# Ejecutar un comando
docker-compose exec rest-service npm run seed
```

## 🔗 URLs de Acceso

Una vez iniciados los servicios, puedes acceder a:

- **Auth Service**: http://localhost:4001
  - Health: http://localhost:4001/health
  
- **REST Service**: http://localhost:3000
  - Health: http://localhost:3000/health
  - Swagger: http://localhost:3000/api-docs
  
- **Payment Service**: http://localhost:3001
  - Health: http://localhost:3001/health
  
- **Report Service (GraphQL)**: http://localhost:4000
  - GraphQL Playground: http://localhost:4000/graphql
  
- **Realtime Service**: ws://localhost:8080
  - Health: http://localhost:8080/health
  
- **MCP Service**: http://localhost:3003
  - Health: http://localhost:3003/health
  
- **Redis**: localhost:6379

## 🏗️ Arquitectura de Red

Todos los servicios están conectados a una red interna de Docker llamada `marketplace-network`. Esto permite:

1. Comunicación entre servicios usando nombres de servicio como hostname
2. Aislamiento de la red del host
3. Mejor seguridad y control de tráfico

Ejemplo: El `auth-service` puede comunicarse con `rest-service` usando `http://rest-service:3000`

## 💾 Volúmenes Persistentes

Se crean dos volúmenes para datos persistentes:

- `redis-data`: Datos de Redis
- `postgres-data`: (Opcional) Si decides usar PostgreSQL local

## 🔧 Troubleshooting

### Los servicios no inician

1. Verifica que el archivo `.env` existe y está configurado correctamente
2. Verifica que los puertos no estén en uso:
   ```bash
   netstat -an | findstr "3000 3001 4000 4001 6379 8080"
   ```
3. Revisa los logs del servicio problemático:
   ```bash
   docker-compose logs servicio-con-problema
   ```

### Error de conexión a la base de datos

1. Verifica las credenciales de Supabase en el `.env`
2. Asegúrate de que tu IP está autorizada en Supabase
3. Verifica la conectividad:
   ```bash
   docker-compose exec auth-service ping -c 4 <DB_HOST>
   ```

### Healthcheck falla

Los healthchecks pueden tardar en pasar. Espera 30-60 segundos después de iniciar los servicios.

### Reconstruir desde cero

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## 🔐 Seguridad

### Mejores Prácticas en Producción

1. **Nunca uses valores por defecto en producción**
   - Cambia JWT_SECRET
   - Usa contraseñas fuertes
   - Genera nuevos INTERNAL_API_KEY

2. **Usa secrets de Docker**
   ```yaml
   secrets:
     db_password:
       external: true
   ```

3. **Limita recursos**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```

4. **Usa redes separadas**
   - Red frontend para servicios públicos
   - Red backend para servicios internos

## 📊 Monitoreo

### Healthchecks

Todos los servicios tienen healthchecks configurados. Docker los ejecuta automáticamente cada 30 segundos.

### Ver Estado de Salud

```bash
docker-compose ps
```

El estado "healthy" indica que el servicio está funcionando correctamente.

## 🔄 Desarrollo vs Producción

### Modo Desarrollo (actual)

```bash
NODE_ENV=development docker-compose up -d
```

- Hot reload habilitado
- Logs verbosos
- Sin optimizaciones de producción

### Modo Producción

```bash
NODE_ENV=production docker-compose up -d
```

- Código optimizado
- Logs reducidos
- Mayor rendimiento

## 📚 Recursos Adicionales

- [Documentación Backend](./ARQUITECTURA_BACKEND_EXPLICADA.md)
- [Guía NestJS](./GUIA_NESTJS_DESDE_CERO.md)
- [Docker Compose Docs](https://docs.docker.com/compose/)

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs -f`
2. Verifica el estado: `docker-compose ps`
3. Consulta la documentación de cada servicio en su carpeta respectiva

---

**Última actualización**: Enero 2026
