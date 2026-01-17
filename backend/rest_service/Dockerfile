# ============================================
# Dockerfile - REST Service
# Microservicio Principal REST API
# ============================================

# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --legacy-peer-deps

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
    adduser -S restservice -u 1001

# Copiar dependencias de producción
COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps && npm cache clean --force

# Copiar código compilado desde builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/swagger ./swagger

# Crear directorio uploads con permisos correctos
RUN mkdir -p /app/uploads/products /app/uploads/users /app/uploads/temp && \
    chown -R restservice:nodejs /app/uploads && \
    chmod -R 755 /app/uploads

# Cambiar a usuario no-root
USER restservice

# Exponer puerto
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Comando de inicio
CMD ["node", "dist/main/main.js"]
