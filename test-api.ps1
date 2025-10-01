# Script de test simple pour l'API déployée
param(
    [string]$ApiUrl = "https://screener-api-430748435623.europe-west1.run.app"
)

Write-Host "🧪 Test de l'API déployée" -ForegroundColor Cyan
Write-Host "URL: $ApiUrl" -ForegroundColor Gray
Write-Host ""

# Test 1: Endpoint racine
Write-Host "1. Test de l'endpoint racine..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/" -Method GET
    Write-Host "✅ Succès: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Échec: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Endpoint indices
Write-Host "2. Test de l'endpoint indices..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/indices" -Method GET
    Write-Host "✅ Succès: $($response.indices.Count) indices disponibles" -ForegroundColor Green
} catch {
    Write-Host "❌ Échec: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Test de screening
Write-Host "3. Test de screening..." -ForegroundColor Yellow
try {
    $body = @{
        index_name = "CAC 40 (France)"
        pe_max = 20
        pb_max = 3
        debt_to_equity_max = 1
        roe_min = 0.1
        dividend_yield_min = 0.02
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$ApiUrl/screening" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Succès: $($response.results.Count) résultats trouvés" -ForegroundColor Green
} catch {
    Write-Host "❌ Échec: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Tests terminés!" -ForegroundColor Cyan