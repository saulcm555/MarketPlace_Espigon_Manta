# Script de prueba para webhooks de n8n
# Asegúrate de reemplazar las URLs con las URLs reales de tus webhooks

Write-Host "=== Prueba de Webhooks n8n ===" -ForegroundColor Cyan
Write-Host ""

# IMPORTANTE: Obtén estas URLs desde n8n UI
# 1. Abre http://localhost:5678
# 2. Abre cada workflow
# 3. Click en el nodo webhook
# 4. Copia la "Production URL" o "Webhook URL"

Write-Host "PASO 1: Obtener URLs de webhooks" -ForegroundColor Yellow
Write-Host "Abre http://localhost:5678 en tu navegador" -ForegroundColor White
Write-Host "Para cada workflow, click en el nodo webhook y copia la URL" -ForegroundColor White
Write-Host ""

# Pedir al usuario las URLs
$paymentWebhookUrl = Read-Host "Pega la URL del webhook de Payment Handler"
$partnerWebhookUrl = Read-Host "Pega la URL del webhook de Partner Handler"

Write-Host ""
Write-Host "=== Probando Payment Handler ===" -ForegroundColor Cyan

# Test 1: Pago exitoso
$paymentBody = @{
    type = "payment_intent.succeeded"
    data = @{
        object = @{
            id = "pi_test_" + (Get-Date -Format "yyyyMMddHHmmss")
            amount = 5000
            currency = "usd"
            metadata = @{
                orderId = "1"
            }
        }
    }
} | ConvertTo-Json -Depth 10

Write-Host "Enviando evento de pago exitoso..." -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri $paymentWebhookUrl -Method POST -Body $paymentBody -ContentType "application/json"
    Write-Host "✅ Respuesta recibida:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "=== Probando Partner Handler ===" -ForegroundColor Cyan

# Test 2: Entrega completada
$partnerBody = @{
    event = "delivery.completed"
    data = @{
        orderId = "1"
        deliveredAt = (Get-Date).ToString("o")
    }
} | ConvertTo-Json -Depth 10

$headers = @{
    "Content-Type" = "application/json"
    "X-Partner-Id" = "test-partner"
    "X-Webhook-Signature" = "test-signature"
}

Write-Host "Enviando evento de entrega completada..." -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri $partnerWebhookUrl -Method POST -Body $partnerBody -Headers $headers
    Write-Host "✅ Respuesta recibida:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "=== Verificar Logs ===" -ForegroundColor Cyan
Write-Host "Ejecuta estos comandos para ver los logs:" -ForegroundColor White
Write-Host "docker logs rest-service --tail 20" -ForegroundColor Gray
Write-Host "docker logs realtime-service --tail 20" -ForegroundColor Gray
Write-Host "docker logs marketplace-n8n --tail 20" -ForegroundColor Gray
