# Test con URLs locales (sin ngrok)
Write-Host "=== Prueba de Webhooks n8n (Local) ===" -ForegroundColor Cyan
Write-Host ""

# URLs locales de n8n
$paymentUrl = "http://localhost:5678/webhook-test/webhook/payment"
$partnerUrl = "http://localhost:5678/webhook-test/webhook/partner"

Write-Host "=== Test 1: Payment Handler ===" -ForegroundColor Yellow
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

Write-Host "Enviando a: $paymentUrl" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri $paymentUrl -Method POST -Body $paymentBody -ContentType "application/json"
    Write-Host "✅ ÉXITO - Respuesta:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test 2: Partner Handler ===" -ForegroundColor Yellow
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

Write-Host "Enviando a: $partnerUrl" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri $partnerUrl -Method POST -Body $partnerBody -Headers $headers
    Write-Host "✅ ÉXITO - Respuesta:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Verificar Logs ===" -ForegroundColor Cyan
Write-Host "Ejecuta: docker logs rest-service --tail 30 | Select-String 'payment-handler|partner-handler|InternalAuth'" -ForegroundColor Gray
