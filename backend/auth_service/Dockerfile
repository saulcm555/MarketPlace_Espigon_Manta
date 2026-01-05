# ============================================
# Dockerfile - Auth Service
# Microservicio de Autenticación (Pilar 1)
# ============================================

# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# ============================================
# Etapa 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Crear usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S authservice -u 1001

# Copiar dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código compilado desde builder
COPY --from=builder /app/dist ./dist

# Cambiar a usuario no-root
USER authservice

# Exponer puerto
EXPOSE 4001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4001/health || exit 1

# Comando de inicio
CMD ["node", "dist/main.js"]
