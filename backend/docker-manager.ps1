# ============================================
# Script de Inicio - MarketPlace Espigón Manta
# Facilita el manejo de Docker Compose
# ============================================

param(
    [Parameter(Position=0)]
    [string]$Action = "help"
)

$ErrorActionPreference = "Stop"

function Show-Banner {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║     MarketPlace Espigón Manta - Docker Manager        ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Help {
    Show-Banner
    Write-Host "Uso: .\docker-manager.ps1 [acción]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Acciones disponibles:" -ForegroundColor Green
    Write-Host "  start        - Iniciar todos los servicios" -ForegroundColor White
    Write-Host "  stop         - Detener todos los servicios" -ForegroundColor White
    Write-Host "  restart      - Reiniciar todos los servicios" -ForegroundColor White
    Write-Host "  rebuild      - Reconstruir imágenes y reiniciar" -ForegroundColor White
    Write-Host "  logs         - Ver logs de todos los servicios" -ForegroundColor White
    Write-Host "  status       - Ver estado de los servicios" -ForegroundColor White
    Write-Host "  clean        - Limpiar contenedores y volúmenes" -ForegroundColor White
    Write-Host "  help         - Mostrar esta ayuda" -ForegroundColor White
    Write-Host ""
    Write-Host "Ejemplos:" -ForegroundColor Green
    Write-Host "  .\docker-manager.ps1 start" -ForegroundColor Gray
    Write-Host "  .\docker-manager.ps1 logs" -ForegroundColor Gray
    Write-Host "  .\docker-manager.ps1 rebuild" -ForegroundColor Gray
    Write-Host ""
}

function Test-DockerRunning {
    try {
        docker ps | Out-Null
        return $true
    } catch {
        Write-Host "❌ Error: Docker no está ejecutándose" -ForegroundColor Red
        Write-Host "   Por favor, inicia Docker Desktop y vuelve a intentar" -ForegroundColor Yellow
        return $false
    }
}

function Test-EnvFile {
    if (-not (Test-Path ".env")) {
        Write-Host "⚠️  Advertencia: No se encontró archivo .env" -ForegroundColor Yellow
        Write-Host "   Copiando .env.example a .env..." -ForegroundColor Yellow
        
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "✅ Archivo .env creado" -ForegroundColor Green
            Write-Host "   ⚠️  IMPORTANTE: Edita .env con tus credenciales antes de continuar" -ForegroundColor Yellow
            Write-Host ""
            Read-Host "Presiona Enter cuando hayas configurado el archivo .env"
        } else {
            Write-Host "❌ Error: No se encontró .env.example" -ForegroundColor Red
            return $false
        }
    }
    return $true
}

function Start-Services {
    Show-Banner
    Write-Host "🚀 Iniciando servicios..." -ForegroundColor Green
    Write-Host ""
    
    if (-not (Test-DockerRunning)) { return }
    if (-not (Test-EnvFile)) { return }
    
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Servicios iniciados correctamente" -ForegroundColor Green
        Write-Host ""
        Show-ServiceUrls
    } else {
        Write-Host ""
        Write-Host "❌ Error al iniciar los servicios" -ForegroundColor Red
    }
}

function Stop-Services {
    Show-Banner
    Write-Host "🛑 Deteniendo servicios..." -ForegroundColor Yellow
    Write-Host ""
    
    if (-not (Test-DockerRunning)) { return }
    
    docker-compose down
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Servicios detenidos correctamente" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Error al detener los servicios" -ForegroundColor Red
    }
}

function Restart-Services {
    Show-Banner
    Write-Host "🔄 Reiniciando servicios..." -ForegroundColor Cyan
    Write-Host ""
    
    Stop-Services
    Start-Sleep -Seconds 2
    Start-Services
}

function Rebuild-Services {
    Show-Banner
    Write-Host "🔨 Reconstruyendo imágenes..." -ForegroundColor Magenta
    Write-Host ""
    
    if (-not (Test-DockerRunning)) { return }
    if (-not (Test-EnvFile)) { return }
    
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Servicios reconstruidos e iniciados" -ForegroundColor Green
        Write-Host ""
        Show-ServiceUrls
    } else {
        Write-Host ""
        Write-Host "❌ Error al reconstruir los servicios" -ForegroundColor Red
    }
}

function Show-Logs {
    Show-Banner
    Write-Host "📋 Mostrando logs..." -ForegroundColor Cyan
    Write-Host "   Presiona Ctrl+C para salir" -ForegroundColor Gray
    Write-Host ""
    
    if (-not (Test-DockerRunning)) { return }
    
    docker-compose logs -f
}

function Show-Status {
    Show-Banner
    Write-Host "📊 Estado de los servicios:" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not (Test-DockerRunning)) { return }
    
    docker-compose ps
    
    Write-Host ""
    Show-ServiceUrls
}

function Clean-Services {
    Show-Banner
    Write-Host "🧹 Limpiando contenedores y volúmenes..." -ForegroundColor Red
    Write-Host ""
    
    $confirmation = Read-Host "¿Estás seguro? Esto eliminará todos los datos (y/N)"
    
    if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
        if (-not (Test-DockerRunning)) { return }
        
        docker-compose down -v
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Limpieza completada" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ Error durante la limpieza" -ForegroundColor Red
        }
    } else {
        Write-Host "Operación cancelada" -ForegroundColor Yellow
    }
}

function Show-ServiceUrls {
    Write-Host "🌐 URLs de acceso:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Auth Service:      " -NoNewline -ForegroundColor White
    Write-Host "http://localhost:4001" -ForegroundColor Green
    Write-Host "  REST Service:      " -NoNewline -ForegroundColor White
    Write-Host "http://localhost:3000" -ForegroundColor Green
    Write-Host "  Payment Service:   " -NoNewline -ForegroundColor White
    Write-Host "http://localhost:3001" -ForegroundColor Green
    Write-Host "  Report Service:    " -NoNewline -ForegroundColor White
    Write-Host "http://localhost:4000" -ForegroundColor Green
    Write-Host "  Realtime Service:  " -NoNewline -ForegroundColor White
    Write-Host "ws://localhost:8080" -ForegroundColor Green
    Write-Host "  MCP Service:       " -NoNewline -ForegroundColor White
    Write-Host "http://localhost:3003" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Swagger Docs:      " -NoNewline -ForegroundColor White
    Write-Host "http://localhost:3000/api-docs" -ForegroundColor Blue
    Write-Host "  GraphQL Playground:" -NoNewline -ForegroundColor White
    Write-Host "http://localhost:4000/graphql" -ForegroundColor Blue
    Write-Host ""
}

# ============================================
# Ejecutar acción
# ============================================

switch ($Action.ToLower()) {
    "start"   { Start-Services }
    "stop"    { Stop-Services }
    "restart" { Restart-Services }
    "rebuild" { Rebuild-Services }
    "logs"    { Show-Logs }
    "status"  { Show-Status }
    "clean"   { Clean-Services }
    "help"    { Show-Help }
    default   { 
        Write-Host "❌ Acción desconocida: $Action" -ForegroundColor Red
        Write-Host ""
        Show-Help 
    }
}
