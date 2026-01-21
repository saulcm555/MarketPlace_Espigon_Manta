# Script de prueba para el Payment Handler Workflow
# Simula la verificación de pago por parte del vendedor

Write-Host "=== Prueba del Payment Handler Workflow ===" -ForegroundColor Cyan
Write-Host ""

# URL del webhook de n8n
$n8nUrl = "http://localhost:5678/webhook/payment-verification"

Write-Host "📋 Este script simula cuando un vendedor aprueba o rechaza un pago" -ForegroundColor Yellow
Write-Host ""

# Solicitar ID de orden
$orderId = Read-Host "Ingresa el ID de la orden a verificar (ejemplo: 1)"

# Solicitar decisión
Write-Host ""
Write-Host "¿El pago fue aprobado o rechazado?" -ForegroundColor Yellow
Write-Host "1. Aprobado (✅)"
Write-Host "2. Rechazado (❌)"
$decision = Read-Host "Selecciona (1 o 2)"

$approved = $decision -eq "1"
$status = if ($approved) { "APROBADO" } else { "RECHAZADO" }

Write-Host ""
Write-Host "=== Enviando evento a n8n ===" -ForegroundColor Cyan
Write-Host "URL: $n8nUrl" -ForegroundColor Gray
Write-Host "Orden ID: $orderId" -ForegroundColor Gray
Write-Host "Estado: $status" -ForegroundColor $(if ($approved) { "Green" } else { "Red" })
Write-Host ""

# Preparar payload
$payload = @{
    orderId = $orderId
    approved = $approved
    verifiedBy = "seller-test"
    verifiedAt = (Get-Date).ToString("o")
    orderStatus = if ($approved) { "payment_confirmed" } else { "payment_rejected" }
} | ConvertTo-Json

# Enviar webhook
try {
    $response = Invoke-RestMethod -Uri $n8nUrl -Method POST -Body $payload -ContentType "application/json"
    
    Write-Host "✅ ÉXITO - Webhook enviado correctamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "Respuesta de n8n:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3 | Write-Host
    
    Write-Host ""
    Write-Host "=== Qué debería pasar ahora ===" -ForegroundColor Yellow
    if ($approved) {
        Write-Host "1. ✅ La orden se actualizó a 'payment_confirmed'" -ForegroundColor Green
        Write-Host "2. 🔔 Se envió notificación WebSocket al cliente" -ForegroundColor Green
        Write-Host "3. 📝 Se registró un log en el sistema" -ForegroundColor Green
    } else {
        Write-Host "1. ❌ La orden se actualizó a 'payment_rejected'" -ForegroundColor Red
        Write-Host "2. 🔔 Se notificó al cliente del rechazo" -ForegroundColor Red
        Write-Host "3. 📝 Se registró un log de advertencia" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ ERROR al enviar webhook" -ForegroundColor Red
    Write-Host ""
    Write-Host "Detalles del error:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "1. n8n no está corriendo (verifica con: docker ps | Select-String 'n8n')" -ForegroundColor White
    Write-Host "2. El workflow no está activado en n8n" -ForegroundColor White
    Write-Host "3. La URL del webhook es incorrecta" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Verificar Resultados ===" -ForegroundColor Cyan
Write-Host "1. Abre n8n: http://localhost:5678" -ForegroundColor White
Write-Host "2. Ve a 'Executions' (menú izquierdo)" -ForegroundColor White
Write-Host "3. Busca la ejecución del workflow 'Payment Handler'" -ForegroundColor White
Write-Host ""
Write-Host "También puedes verificar los logs:" -ForegroundColor White
Write-Host "docker logs marketplace-n8n --tail 30" -ForegroundColor Gray
Write-Host "docker logs rest-service --tail 30" -ForegroundColor Gray
