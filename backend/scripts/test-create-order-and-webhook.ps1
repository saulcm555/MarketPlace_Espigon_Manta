# Script para crear un pedido de prueba y verificar que se envía webhook al Gym
# Este script simula el flujo completo: crear pedido → enviar webhook al Gym

$BASE_URL = "http://localhost:3000"
$AUTH_SERVICE_URL = "http://localhost:3002"

Write-Host "`n🔐 Iniciando sesión como cliente de prueba..." -ForegroundColor Cyan

# 1. Login como cliente de prueba (este usuario debe existir)
$loginPayload = @{
    email = "test@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$AUTH_SERVICE_URL/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $loginPayload
    
    $token = $loginResponse.access_token
    Write-Host "✅ Token obtenido exitosamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en login. Asegúrate de tener un usuario con email: test@example.com" -ForegroundColor Red
    Write-Host "Puedes crear uno desde el frontend o usando el auth-service directamente" -ForegroundColor Yellow
    exit 1
}

# 2. Obtener perfil del cliente para tener id_client
Write-Host "`n📋 Obteniendo perfil del cliente..." -ForegroundColor Cyan
try {
    $clientProfile = Invoke-RestMethod -Uri "$BASE_URL/api/clients/profile" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
    
    $id_client = $clientProfile.id_client
    Write-Host "✅ Cliente ID: $id_client" -ForegroundColor Green
    Write-Host "   Nombre: $($clientProfile.client_name)" -ForegroundColor Gray
    Write-Host "   Email: $($clientProfile.client_email)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error obteniendo perfil del cliente" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# 3. Crear orden de prueba
Write-Host "`n🛒 Creando orden de prueba..." -ForegroundColor Cyan
$orderPayload = @{
    id_client = $id_client
    id_cart = 1  # Asume que existe un carrito con ID 1
    id_payment_method = 1  # Método de pago de prueba
    delivery_type = "pickup"
    total_amount = 180.00  # Monto que califica para 20% descuento en Gym
    products = @(
        @{
            id_product = 1
            quantity = 2
            unit_price = 90.00
        }
    )
} | ConvertTo-Json -Depth 10

try {
    Write-Host "Payload: $orderPayload" -ForegroundColor Gray
    
    $orderResponse = Invoke-RestMethod -Uri "$BASE_URL/api/orders" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $orderPayload
    
    Write-Host "`n✅ ORDEN CREADA EXITOSAMENTE" -ForegroundColor Green
    Write-Host "   Order ID: $($orderResponse.id_order)" -ForegroundColor Cyan
    Write-Host "   Total: `$$($orderResponse.total_amount)" -ForegroundColor Cyan
    Write-Host "   Status: $($orderResponse.status)" -ForegroundColor Cyan
    
    Write-Host "`n🎁 WEBHOOK AL GYM:" -ForegroundColor Yellow
    Write-Host "   • El sistema debería haber enviado un webhook al Gym" -ForegroundColor Yellow
    Write-Host "   • Cupón generado: 20% descuento (total: `$$($orderResponse.total_amount))" -ForegroundColor Yellow
    Write-Host "   • Revisa los logs del rest-service para confirmar" -ForegroundColor Yellow
    
    Write-Host "`n📊 Verificar logs:" -ForegroundColor Cyan
    Write-Host "   docker logs rest-service --tail 20" -ForegroundColor Gray
    
} catch {
    Write-Host "`n❌ Error creando orden" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "`nDetalles:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
    }
}

Write-Host "`n✅ PRUEBA COMPLETADA" -ForegroundColor Green
Write-Host "Revisa los logs del Gym (puerto 3004) para verificar si recibieron el webhook" -ForegroundColor Yellow
