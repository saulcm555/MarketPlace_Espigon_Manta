# ============================================
# SCRIPT DE VERIFICACION DEL BACKEND
# ============================================
# Verifica que todos los servicios funcionen
# ============================================

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host " VERIFICACION DEL BACKEND" -ForegroundColor White
Write-Host "============================================`n" -ForegroundColor Cyan

$allOk = $true

# ============================================
# 1. VERIFICAR DOCKER
# ============================================
Write-Host "[1/5] Verificando Docker..." -ForegroundColor Yellow

try {
    $containers = docker compose ps --format json | ConvertFrom-Json
    $runningContainers = ($containers | Where-Object { $_.State -eq "running" }).Count
    
    if ($runningContainers -eq 3) {
        Write-Host "      OK - 3 contenedores corriendo" -ForegroundColor Green
        Write-Host "         - realtime_service-api1-1" -ForegroundColor Gray
        Write-Host "         - realtime_service-api2-1" -ForegroundColor Gray
        Write-Host "         - realtime_service-redis-1" -ForegroundColor Gray
    } else {
        Write-Host "      ERROR - Solo $runningContainers contenedores corriendo" -ForegroundColor Red
        Write-Host "      Ejecuta: docker compose up -d" -ForegroundColor Yellow
        $allOk = $false
    }
} catch {
    Write-Host "      ERROR - Docker no disponible" -ForegroundColor Red
    Write-Host "      Asegurate de que Docker Desktop este corriendo" -ForegroundColor Yellow
    $allOk = $false
}

# ============================================
# 2. VERIFICAR REDIS
# ============================================
Write-Host "`n[2/5] Verificando Redis..." -ForegroundColor Yellow

try {
    $redisPing = docker exec realtime_service-redis-1 redis-cli PING 2>&1
    if ($redisPing -eq "PONG") {
        Write-Host "      OK - Redis respondiendo" -ForegroundColor Green
    } else {
        Write-Host "      ERROR - Redis no responde" -ForegroundColor Red
        $allOk = $false
    }
} catch {
    Write-Host "      ERROR - No se puede conectar a Redis" -ForegroundColor Red
    $allOk = $false
}

# ============================================
# 3. VERIFICAR REALTIME SERVICE
# ============================================
Write-Host "`n[3/5] Verificando Realtime Service..." -ForegroundColor Yellow

try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/health" -TimeoutSec 3 -ErrorAction Stop
    if ($health.status -eq "healthy") {
        Write-Host "      OK - Realtime Service funcionando" -ForegroundColor Green
        Write-Host "         Puerto 8080: api1" -ForegroundColor Gray
    } else {
        Write-Host "      WARN - Realtime Service respondio pero no esta healthy" -ForegroundColor Yellow
    }
    
    # Verificar segunda instancia
    $health2 = Invoke-RestMethod -Uri "http://localhost:8081/health" -TimeoutSec 3 -ErrorAction Stop
    if ($health2.status -eq "healthy") {
        Write-Host "         Puerto 8081: api2" -ForegroundColor Gray
    }
} catch {
    Write-Host "      ERROR - Realtime Service no responde" -ForegroundColor Red
    Write-Host "      Verifica: docker logs realtime_service-api1-1" -ForegroundColor Yellow
    $allOk = $false
}

# ============================================
# 4. VERIFICAR REST SERVICE
# ============================================
Write-Host "`n[4/5] Verificando REST Service..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "      OK - REST Service funcionando" -ForegroundColor Green
    Write-Host "         Puerto 3000" -ForegroundColor Gray
    Write-Host "         Swagger: http://localhost:3000/api-docs" -ForegroundColor Gray
} catch {
    Write-Host "      ERROR - REST Service no responde" -ForegroundColor Red
    Write-Host "      Asegurate de ejecutar: npm run dev" -ForegroundColor Yellow
    $allOk = $false
}

# ============================================
# 5. PROBAR SISTEMA DE NOTIFICACIONES
# ============================================
Write-Host "`n[5/5] Probando sistema de notificaciones..." -ForegroundColor Yellow

$testMessage = @{
    event = "test"
    data = @{
        message = "Prueba de verificacion"
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
} | ConvertTo-Json -Compress

$channel = "ws:room:test"

try {
    $result = docker exec realtime_service-redis-1 redis-cli PUBLISH $channel $testMessage 2>&1
    
    if ($result -ge 0) {
        Write-Host "      OK - Sistema de notificaciones operativo" -ForegroundColor Green
        Write-Host "         Mensaje publicado en: $channel" -ForegroundColor Gray
        Write-Host "         Suscriptores que recibieron: $result" -ForegroundColor Gray
        
        if ($result -eq 2) {
            Write-Host "         (2 instancias de Realtime Service escuchando)" -ForegroundColor Gray
        }
    } else {
        Write-Host "      WARN - Mensaje publicado pero sin suscriptores" -ForegroundColor Yellow
    }
} catch {
    Write-Host "      ERROR - No se pudo publicar mensaje" -ForegroundColor Red
    $allOk = $false
}

# ============================================
# RESUMEN
# ============================================
Write-Host "`n============================================" -ForegroundColor Cyan

if ($allOk) {
    Write-Host " RESULTADO: TODO FUNCIONANDO" -ForegroundColor Green
    Write-Host "============================================`n" -ForegroundColor Cyan
    
    Write-Host "SERVICIOS ACTIVOS:" -ForegroundColor Green
    Write-Host "  • Realtime Service: http://localhost:8080" -ForegroundColor White
    Write-Host "  • REST Service: http://localhost:3000" -ForegroundColor White
    Write-Host "  • Redis: localhost:6379" -ForegroundColor White
    
    Write-Host "`nPROXIMOS PASOS:" -ForegroundColor Yellow
    Write-Host "  1. Ver documentacion: GUIA_COMPLETA_PRUEBAS.md" -ForegroundColor White
    Write-Host "  2. Probar WebSocket: go run token_gen.go" -ForegroundColor White
    Write-Host "  3. Crear orden de prueba desde Postman/Insomnia" -ForegroundColor White
    
} else {
    Write-Host " RESULTADO: HAY PROBLEMAS ⚠️" -ForegroundColor Red
    Write-Host "============================================`n" -ForegroundColor Cyan
    
    Write-Host "COMANDOS UTILES:" -ForegroundColor Yellow
    Write-Host "  Ver logs Docker:" -ForegroundColor White
    Write-Host "    docker logs realtime_service-api1-1" -ForegroundColor Gray
    Write-Host "    docker logs realtime_service-redis-1" -ForegroundColor Gray
    Write-Host "`n  Reiniciar Docker:" -ForegroundColor White
    Write-Host "    docker compose down" -ForegroundColor Gray
    Write-Host "    docker compose up -d" -ForegroundColor Gray
    Write-Host "`n  Iniciar REST Service:" -ForegroundColor White
    Write-Host "    cd ..\rest_service" -ForegroundColor Gray
    Write-Host "    npm run dev" -ForegroundColor Gray
}

Write-Host "`n"
