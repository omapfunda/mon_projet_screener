# Test script pour valider les nouvelles fonctionnalites

Write-Host "=== Test des nouvelles fonctionnalites ===" -ForegroundColor Green

$baseUrl = "http://localhost:8000"

Write-Host "`n1. Test de l'endpoint /cache/stats" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/cache/stats" -Method GET
    Write-Host "Cache stats recuperees avec succes" -ForegroundColor Green
    Write-Host "  - Screenings en base: $($response.database_stats.total_screenings)" -ForegroundColor Cyan
    Write-Host "  - Entrees de cache: $($response.database_stats.cache_entries)" -ForegroundColor Cyan
    Write-Host "  - Type de cache: $($response.cache_type)" -ForegroundColor Cyan
} catch {
    Write-Host "Erreur lors de la recuperation des stats du cache: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n2. Test de l'endpoint /screening/history" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/screening/history" -Method GET
    Write-Host "Historique des screenings recupere avec succes" -ForegroundColor Green
    Write-Host "  - Nombre de screenings: $($response.Count)" -ForegroundColor Cyan
    if ($response.Count -gt 0) {
        $latest = $response[0]
        Write-Host "  - Dernier screening: $($latest.index_name) a $($latest.created_at)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Erreur lors de la recuperation de l'historique: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. Test d'un screening pour generer des donnees" -ForegroundColor Yellow
try {
    $screeningData = @{
        index_name = "CAC 40 (France)"
        pe_max = 15.0
        pb_max = 1.5
        de_max = 100.0
        roe_min = 0.12
    }
    
    $jsonBody = $screeningData | ConvertTo-Json
    Write-Host "  Lancement du screening..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/screening" -Method POST -Body $jsonBody -ContentType "application/json"
    Write-Host "Screening execute avec succes" -ForegroundColor Green
    Write-Host "  - Nombre de resultats: $($response.results.Count)" -ForegroundColor Cyan
    Write-Host "  - Temps d'execution: $($response.execution_time_seconds)s" -ForegroundColor Cyan
} catch {
    Write-Host "Erreur lors du screening: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. Verification de l'historique apres screening" -ForegroundColor Yellow
try {
    Start-Sleep -Seconds 1
    $response = Invoke-RestMethod -Uri "$baseUrl/screening/history" -Method GET
    Write-Host "Historique mis a jour recupere" -ForegroundColor Green
    Write-Host "  - Nombre total de screenings: $($response.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "Erreur lors de la verification de l'historique: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test termine ===" -ForegroundColor Green
Write-Host "Vous pouvez maintenant tester l'interface web a http://localhost:3000" -ForegroundColor Cyan