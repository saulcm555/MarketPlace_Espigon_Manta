# Script de Prueba del Auth Service
# Ejecutar desde PowerShell: .\test_auth_service.ps1

$BaseUrl = "http://localhost:4001"
$TestEmail = "test_$(Get-Date -Format 'yyyyMMddHHmmss')@test.com"
$TestPassword = "TestPassword123!"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Auth Service - Pruebas Manuales" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Health Check
Write-Host "[1/7] Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
    Write-Host "  ✓ Servicio saludable: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Asegurate de que el servicio este corriendo en $BaseUrl" -ForegroundColor Red
    exit 1
}

# 2. Registro
Write-Host "`n[2/7] Registrando usuario de prueba..." -ForegroundColor Yellow
$registerBody = @{
    email = $TestEmail
    password = $TestPassword
    role = "customer"
    reference_id = "test_ref_$(Get-Date -Format 'HHmmss')"
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "  ✓ Usuario registrado: $($register.user.email)" -ForegroundColor Green
    $AccessToken = $register.tokens.accessToken
    $RefreshToken = $register.tokens.refreshToken
    Write-Host "  ✓ Access Token recibido (primeros 50 chars): $($AccessToken.Substring(0,50))..." -ForegroundColor Green
} catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Si falla, intentar login (usuario ya existe)
    Write-Host "  Intentando login..." -ForegroundColor Yellow
    $loginBody = @{
        email = $TestEmail
        password = $TestPassword
    } | ConvertTo-Json
    
    try {
        $login = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
        $AccessToken = $login.tokens.accessToken
        $RefreshToken = $login.tokens.refreshToken
        Write-Host "  ✓ Login exitoso" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Login tambien fallo: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# 3. Verificar Token
Write-Host "`n[3/7] Verificando token..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $AccessToken"
    }
    $verify = Invoke-RestMethod -Uri "$BaseUrl/api/auth/verify" -Method Get -Headers $headers
    Write-Host "  ✓ Token valido: $($verify.valid)" -ForegroundColor Green
    Write-Host "  ✓ Usuario: $($verify.user.email)" -ForegroundColor Green
    Write-Host "  ✓ Rol: $($verify.user.role)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Validar Token (endpoint interno)
Write-Host "`n[4/7] Validando token (endpoint interno)..." -ForegroundColor Yellow
$validateBody = @{
    token = $AccessToken
} | ConvertTo-Json

try {
    $validate = Invoke-RestMethod -Uri "$BaseUrl/api/auth/validate" -Method Post -Body $validateBody -ContentType "application/json"
    Write-Host "  ✓ Token valido: $($validate.valid)" -ForegroundColor Green
    Write-Host "  ✓ Payload - jti: $($validate.payload.jti)" -ForegroundColor Green
    Write-Host "  ✓ Payload - sub: $($validate.payload.sub)" -ForegroundColor Green
    Write-Host "  ✓ Payload - iss: $($validate.payload.iss)" -ForegroundColor Green
    Write-Host "  ✓ Payload - aud: $($validate.payload.aud)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Refresh Token
Write-Host "`n[5/7] Refrescando tokens..." -ForegroundColor Yellow
$refreshBody = @{
    refreshToken = $RefreshToken
} | ConvertTo-Json

try {
    $refresh = Invoke-RestMethod -Uri "$BaseUrl/api/auth/refresh" -Method Post -Body $refreshBody -ContentType "application/json"
    Write-Host "  ✓ Tokens refrescados exitosamente" -ForegroundColor Green
    $AccessToken = $refresh.tokens.accessToken
    $RefreshToken = $refresh.tokens.refreshToken
    Write-Host "  ✓ Nuevo Access Token (primeros 50 chars): $($AccessToken.Substring(0,50))..." -ForegroundColor Green
} catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Login con credenciales invalidas (debe fallar)
Write-Host "`n[6/7] Probando login con credenciales invalidas (debe fallar)..." -ForegroundColor Yellow
$badLoginBody = @{
    email = $TestEmail
    password = "WrongPassword!"
} | ConvertTo-Json

try {
    $badLogin = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $badLoginBody -ContentType "application/json"
    Write-Host "  ✗ Error: Login deberia haber fallado!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "  ✓ Login rechazado correctamente (401 Unauthorized)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Error inesperado: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 7. Logout
Write-Host "`n[7/7] Cerrando sesion (logout)..." -ForegroundColor Yellow
$logoutBody = @{
    refreshToken = $RefreshToken
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $AccessToken"
    }
    $logout = Invoke-RestMethod -Uri "$BaseUrl/api/auth/logout" -Method Post -Body $logoutBody -ContentType "application/json" -Headers $headers
    Write-Host "  ✓ Sesion cerrada: $($logout.message)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Resumen
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Pruebas Completadas" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nUsuario de prueba: $TestEmail" -ForegroundColor White
Write-Host "Password: $TestPassword" -ForegroundColor White
Write-Host "`nPara mas pruebas, importa la coleccion de Postman:" -ForegroundColor White
Write-Host "  docs/Auth_Service.postman_collection.json" -ForegroundColor Yellow
