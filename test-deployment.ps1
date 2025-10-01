# Script PowerShell de test pour valider le déploiement
# Usage: .\test-deployment.ps1 -ApiUrl "https://your-api.run.app" -FrontendUrl "https://your-frontend.onrender.com"

param(
    [string]$ApiUrl = "https://screener-api-xxxxxxxxx-ew.a.run.app",
    [string]$FrontendUrl = "https://screener-frontend.onrender.com"
)

Write-Host "🧪 Test de déploiement" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow
Write-Host "Frontend URL: $FrontendUrl" -ForegroundColor Yellow
Write-Host ""

# Fonction pour tester une URL
function Test-Url {
    param(
        [string]$Url,
        [string]$Description,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "🔍 Test: $Description" -ForegroundColor Blue
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing
        $status = $response.StatusCode
        
        if ($status -eq $ExpectedStatus) {
            Write-Host "✅ Succès (Status: $status)" -ForegroundColor Green
        } else {
            Write-Host "❌ Échec (Status: $status)" -ForegroundColor Red
            Write-Host "Réponse: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))" -ForegroundColor Red
            return $false
        }
    }
    catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -eq $ExpectedStatus) {
            Write-Host "✅ Succès (Status: $status - attendu)" -ForegroundColor Green
        } else {
            Write-Host "❌ Échec: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }
    
    Write-Host ""
    return $true
}

# Fonction pour tester un endpoint POST
function Test-Post {
    param(
        [string]$Url,
        [string]$Data,
        [string]$Description
    )
    
    Write-Host "🔍 Test POST: $Description" -ForegroundColor Blue
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-WebRequest -Uri $Url -Method POST -Body $Data -Headers $headers -UseBasicParsing
        $status = $response.StatusCode
        
        if ($status -eq 200) {
            Write-Host "✅ Succès (Status: $status)" -ForegroundColor Green
            $content = $response.Content
            if ($content.Length -gt 200) {
                $content = $content.Substring(0, 200) + "..."
            }
            Write-Host "Réponse: $content" -ForegroundColor Gray
        } else {
            Write-Host "❌ Échec (Status: $status)" -ForegroundColor Red
            Write-Host "Réponse: $($response.Content)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Échec: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    Write-Host ""
    return $true
}

Write-Host "🚀 Début des tests..." -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$totalTests = 0

# Tests de l'API Backend
Write-Host "=== TESTS BACKEND API ===" -ForegroundColor Magenta

# Test 1: Endpoint racine
$totalTests++
if (Test-Url -Url "$ApiUrl/" -Description "Endpoint racine de l'API") {
    $successCount++
}

# Test 2: Endpoint indices
$totalTests++
if (Test-Url -Url "$ApiUrl/indices" -Description "Liste des indices disponibles") {
    $successCount++
}

# Test 3: Endpoint screening (POST)
$screeningData = @{
    index_name = "CAC 40 (France)"
    pe_max = 15
    pb_max = 1.5
    de_max = 100
    roe_min = 0.12
} | ConvertTo-Json

$totalTests++
if (Test-Post -Url "$ApiUrl/screening" -Data $screeningData -Description "Screening avec critères") {
    $successCount++
}

# Test 4: Endpoint financials (exemple avec un ticker)
$totalTests++
if (Test-Url -Url "$ApiUrl/financials/AAPL" -Description "Données financières (peut échouer si ticker non trouvé)" -ExpectedStatus 404) {
    $successCount++
}

Write-Host "=== TESTS FRONTEND ===" -ForegroundColor Magenta

# Test 5: Page d'accueil du frontend
$totalTests++
if (Test-Url -Url "$FrontendUrl/" -Description "Page d'accueil du frontend") {
    $successCount++
}

Write-Host "=== TESTS DE CONNECTIVITÉ ===" -ForegroundColor Magenta

# Test 6: Vérifier CORS
Write-Host "🔍 Test: Communication Frontend → API" -ForegroundColor Blue
Write-Host "Vérification des CORS..." -ForegroundColor Gray

try {
    $headers = @{
        "Origin" = $FrontendUrl
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type"
    }
    
    $response = Invoke-WebRequest -Uri "$ApiUrl/screening" -Method OPTIONS -Headers $headers -UseBasicParsing
    $status = $response.StatusCode
    
    if ($status -eq 200 -or $status -eq 204) {
        Write-Host "✅ CORS configuré correctement" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "⚠️  CORS pourrait avoir des problèmes (Status: $status)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "⚠️  CORS pourrait avoir des problèmes: $($_.Exception.Message)" -ForegroundColor Yellow
}

$totalTests++
Write-Host ""

Write-Host "=== RÉSUMÉ DES TESTS ===" -ForegroundColor Magenta

Write-Host "📊 Tests réussis: $successCount/$totalTests" -ForegroundColor $(if ($successCount -eq $totalTests) { "Green" } else { "Yellow" })

# Test de performance simple
Write-Host "🚀 Test de performance basique..." -ForegroundColor Blue

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
try {
    Invoke-WebRequest -Uri "$ApiUrl/" -Method GET -UseBasicParsing | Out-Null
    $stopwatch.Stop()
    Write-Host "⏱️  Temps de réponse API: $($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Gray
}
catch {
    Write-Host "⚠️  Impossible de mesurer le temps de réponse API" -ForegroundColor Yellow
}

$stopwatch.Restart()
try {
    Invoke-WebRequest -Uri "$FrontendUrl/" -Method GET -UseBasicParsing | Out-Null
    $stopwatch.Stop()
    Write-Host "⏱️  Temps de réponse Frontend: $($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Gray
}
catch {
    Write-Host "⚠️  Impossible de mesurer le temps de réponse Frontend" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Tests terminés!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes recommandées:" -ForegroundColor Cyan
Write-Host "1. Tester manuellement l'interface utilisateur" -ForegroundColor White
Write-Host "2. Vérifier les logs des services" -ForegroundColor White
Write-Host "3. Effectuer un screening complet" -ForegroundColor White
Write-Host "4. Tester l'export CSV" -ForegroundColor White
Write-Host "5. Vérifier les graphiques Plotly" -ForegroundColor White

if ($successCount -lt $totalTests) {
    Write-Host ""
    Write-Host "⚠️  Certains tests ont échoué. Vérifiez les URLs et la configuration." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host ""
    Write-Host "✅ Tous les tests sont passés avec succès!" -ForegroundColor Green
    exit 0
}