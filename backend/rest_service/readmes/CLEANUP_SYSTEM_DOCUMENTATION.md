# 🗑️ SISTEMA DE LIMPIEZA AUTOMÁTICA DE COMPROBANTES

## 📋 Descripción

Sistema automatizado que elimina comprobantes de pago antiguos de Supabase Storage para optimizar el espacio y mantener solo los archivos necesarios.

---

## ⚙️ Configuración

### Variables de Entorno (`.env`)

```env
# Habilitar/deshabilitar limpieza automática
CLEANUP_ENABLED=true

# Horario de ejecución (formato cron)
CLEANUP_SCHEDULE=0 2 * * *

# Días de retención para comprobantes NO verificados
UNVERIFIED_RETENTION_DAYS=15

# Días de retención para comprobantes VERIFICADOS
VERIFIED_RETENTION_DAYS=60
```

---

## 🔄 Políticas de Retención

### 1. **Comprobantes NO Verificados** (15 días)

**¿Qué se elimina?**
- Comprobantes de órdenes con status `payment_pending_verification`
- Que fueron creadas hace más de **15 días**

**¿Por qué?**
- Órdenes abandonadas o con comprobantes inválidos
- Libera espacio de Supabase Storage
- Mantiene la base de datos limpia

**¿Qué sucede?**
- ✅ Se elimina la imagen de Supabase Storage
- ✅ Se limpia el campo `payment_receipt_url` (NULL)
- ✅ Se cambia el status a `expired`
- ✅ Se mantiene el registro de la orden para historial

---

### 2. **Comprobantes Verificados** (60 días)

**¿Qué se elimina?**
- Comprobantes de órdenes con status `delivered`
- Que fueron verificadas hace más de **60 días**
- Solo si `payment_verified_at` es mayor a 60 días

**¿Por qué?**
- Órdenes ya completadas y entregadas
- No es necesario mantener el comprobante indefinidamente
- Optimiza espacio en Supabase

**¿Qué sucede?**
- ✅ Se elimina la imagen de Supabase Storage
- ✅ Se limpia el campo `payment_receipt_url` (NULL)
- ⚠️ Se MANTIENE el status de la orden
- ✅ Se mantiene toda la información de la orden (fecha, monto, etc.)

---

## 🕐 Programación (Cron Job)

### Horario por Defecto
```
0 2 * * *
```
**Traducción:** Todos los días a las 2:00 AM (hora de Ecuador)

### Formato Cron
```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── día del mes (1 - 31)
│ │ │ ┌───────────── mes (1 - 12)
│ │ │ │ ┌───────────── día de la semana (0 - 6) (Domingo = 0)
│ │ │ │ │
* * * * *
```

### Ejemplos de Horarios

| Expresión | Descripción |
|-----------|-------------|
| `0 2 * * *` | Todos los días a las 2:00 AM |
| `0 3 * * 0` | Todos los domingos a las 3:00 AM |
| `0 1 1 * *` | El primer día de cada mes a la 1:00 AM |
| `*/30 * * * *` | Cada 30 minutos (solo para pruebas) |

---

## 📊 Estadísticas

El sistema proporciona estadísticas en tiempo real:

```typescript
const stats = await CleanupScheduler.getStats();

// Retorna:
{
  totalReceipts: 150,      // Total de comprobantes almacenados
  unverified: 25,          // Comprobantes pendientes de verificar
  verified: 125,           // Comprobantes ya verificados
  expiredSoon: 5           // Comprobantes que expirarán en 3 días
}
```

---

## 🚀 Uso

### Inicio Automático

El scheduler se inicia automáticamente al arrancar el servidor:

```typescript
// En main.ts
startCleanupScheduler();
```

### Ejecución Manual

Para ejecutar la limpieza inmediatamente (útil para pruebas):

```typescript
import { runCleanupNow } from './infrastructure/jobs/scheduler';

// Ejecutar ahora
await runCleanupNow();
```

### Detener el Scheduler

```typescript
import { stopCleanupScheduler } from './infrastructure/jobs/scheduler';

stopCleanupScheduler();
```

---

## 📝 Logs

El sistema genera logs detallados de cada ejecución:

```
🕐 [SCHEDULER] Configurando limpieza automática de comprobantes...
   - Horario: 0 2 * * * (Todos los días a las 2:00)
   - Retención no verificados: 15 días
   - Retención verificados: 60 días
✅ [SCHEDULER] Limpieza automática iniciada correctamente

⏰ [SCHEDULER] Ejecutando limpieza programada...
🧹 [CLEANUP] Iniciando limpieza de comprobantes de pago...
📋 [CLEANUP] Buscando comprobantes no verificados (> 15 días)...
   ✓ Orden #123: Comprobante eliminado (15+ días sin verificar)
   ✓ Orden #124: Comprobante eliminado (15+ días sin verificar)
📋 [CLEANUP] Buscando comprobantes verificados (> 60 días)...
   ✓ Orden #50: Comprobante archivado (60+ días verificado)
✅ [CLEANUP] Limpieza completada exitosamente
   - Comprobantes no verificados eliminados: 2
   - Comprobantes verificados eliminados: 1
   - Total eliminados: 3
✅ [SCHEDULER] Limpieza completada
```

---

## 🔐 Seguridad

### Validaciones
- ✅ Solo elimina si Supabase está configurado
- ✅ Verifica que exista `payment_receipt_url`
- ✅ Valida fechas antes de eliminar
- ✅ Maneja errores individualmente (si falla uno, continúa con el resto)

### Respaldo
- ✅ Se mantiene el registro completo de la orden
- ✅ Solo se elimina la imagen física
- ✅ El campo `payment_verified_at` queda como evidencia de verificación

---

## 🧪 Pruebas

### Probar Limpieza Inmediata

```bash
# Desde el servidor Node.js (con ts-node)
ts-node -e "import('./src/infrastructure/jobs/scheduler').then(m => m.runCleanupNow())"
```

### Cambiar Horario para Pruebas

```env
# Ejecutar cada minuto (solo para pruebas)
CLEANUP_SCHEDULE=* * * * *
```

**⚠️ IMPORTANTE:** Cambiar de vuelta a `0 2 * * *` en producción

---

## 📈 Optimización de Espacio

### Cálculo de Ahorro

**Sin limpieza:**
- 1000 órdenes/mes × 300 KB/comprobante = **300 MB/mes**
- 12 meses = **3.6 GB/año**

**Con limpieza (15/60 días):**
- Solo últimos 60 días activos ≈ **600 MB máximo**
- **Ahorro: ~85%** de espacio

### Plan Gratuito Supabase
- Límite: 1 GB
- Con limpieza: ~**1,500-2,000 órdenes** antes de llenar
- Sin limpieza: ~**300-400 órdenes**

---

## ⚠️ Consideraciones

### NO se elimina:
- ❌ Comprobantes de órdenes en proceso (`payment_confirmed`, `processing`)
- ❌ Órdenes canceladas recientes (< 15 días)
- ❌ Registros de la base de datos

### SÍ se elimina:
- ✅ Imágenes de Supabase Storage
- ✅ URLs del campo `payment_receipt_url`

---

## 🛠️ Solución de Problemas

### El scheduler no inicia
```typescript
// Verificar si está habilitado
console.log(process.env.CLEANUP_ENABLED);

// Verificar si hay errores en la expresión cron
console.log(process.env.CLEANUP_SCHEDULE);
```

### No se eliminan archivos
- Verificar que `SUPABASE_URL` y `SUPABASE_ANON_KEY` estén configurados
- Verificar permisos del bucket `payment-receipts`
- Revisar logs para errores específicos

### Desactivar temporalmente
```env
CLEANUP_ENABLED=false
```

---

## 📞 Comandos Útiles

```bash
# Ver estadísticas actuales
node -e "require('./dist/infrastructure/jobs/scheduler').CleanupScheduler.getStats().then(console.log)"

# Ejecutar limpieza manual
node -e "require('./dist/infrastructure/jobs/scheduler').runCleanupNow()"

# Verificar si está corriendo
node -e "console.log(require('./dist/infrastructure/jobs/scheduler').CleanupScheduler.isRunning())"
```

---

## 🎯 Resumen

| Característica | Valor |
|---------------|-------|
| **Frecuencia** | Diaria (2:00 AM) |
| **Retención no verificados** | 15 días |
| **Retención verificados** | 60 días |
| **Ahorro de espacio** | ~85% |
| **Impacto en BD** | Ninguno (solo Storage) |
| **Reversible** | No (archivos eliminados permanentemente) |

---

**✅ Sistema de Limpieza Implementado y Documentado**
