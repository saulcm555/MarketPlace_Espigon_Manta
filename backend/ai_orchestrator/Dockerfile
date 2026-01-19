# ============================================
# Dockerfile - AI Orchestrator
# Cerebro del Chatbot Multimodal - Pilar 3
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
    adduser -S aiservice -u 1001

# Copiar dependencias de producción
COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps && npm cache clean --force

# Copiar código compilado desde builder
COPY --from=builder /app/dist ./dist

# Cambiar a usuario no-root
USER aiservice

# Exponer puerto
EXPOSE 3004

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3004/health || exit 1

# Comando de inicio
CMD ["node", "dist/main.js"]
