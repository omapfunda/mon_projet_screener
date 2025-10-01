# Script de déploiement PowerShell pour GCP Cloud Run
# Usage: .\deploy-gcp.ps1 [-ProjectId "mon-projet-screener-api"] [-Region "europe-west1"] [-ServiceName "screener-api"] [-Repository "screener-api-repo"]

param(
    [string]$ProjectId = "mon-projet-screener-api",
    [string]$Region = "europe-west1", 
    [string]$ServiceName = "screener-api",
    [string]$Repository = "screener-api-repo"
)

# Configuration des couleurs pour une meilleure lisibilité
$Host.UI.RawUI.ForegroundColor = "White"

Write-Host "🚀 Déploiement du backend sur GCP Cloud Run" -ForegroundColor Cyan
Write-Host "Project ID: $ProjectId" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Service: $ServiceName" -ForegroundColor Yellow
Write-Host "Repository: $Repository" -ForegroundColor Yellow
Write-Host ""

# Fonction pour exécuter une commande et vérifier le résultat
function Invoke-GCloudCommand {
    param(
        [string]$Command,
        [string]$Description,
        [bool]$IgnoreError = $false
    )
    
    Write-Host "🔧 $Description..." -ForegroundColor Blue
    
    try {
        $result = Invoke-Expression $Command
        if ($LASTEXITCODE -eq 0 -or $IgnoreError) {
            Write-Host "✅ $Description terminé" -ForegroundColor Green
            return $result
        } else {
            Write-Host "❌ Erreur lors de: $Description" -ForegroundColor Red
            Write-Host "Commande: $Command" -ForegroundColor Gray
            if (-not $IgnoreError) {
                exit 1
            }
        }
    }
    catch {
        Write-Host "❌ Exception lors de: $Description" -ForegroundColor Red
        Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
        if (-not $IgnoreError) {
            exit 1
        }
    }
}

# 1. Vérifier que gcloud est installé et configuré
Write-Host "🔍 Vérification de Google Cloud CLI..." -ForegroundColor Blue

try {
    $gcloudVersion = gcloud version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "gcloud non trouvé"
    }
    Write-Host "✅ Google Cloud CLI détecté" -ForegroundColor Green
}
catch {
    Write-Host "❌ Google Cloud CLI n'est pas installé ou configuré." -ForegroundColor Red
    Write-Host "📥 Installez-le depuis: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    Write-Host "🔧 Puis exécutez: gcloud auth login" -ForegroundColor Yellow
    exit 1
}

# 2. Configurer le projet
Invoke-GCloudCommand -Command "gcloud config set project $ProjectId" -Description "Configuration du projet GCP"

# 3. Activer les APIs nécessaires
Write-Host "🔧 Activation des APIs GCP..." -ForegroundColor Blue
$apis = @(
    "cloudbuild.googleapis.com",
    "run.googleapis.com", 
    "artifactregistry.googleapis.com"
)

foreach ($api in $apis) {
    Invoke-GCloudCommand -Command "gcloud services enable $api" -Description "Activation de $api"
}

# 4. Créer le repository Artifact Registry s'il n'existe pas
$createRepoCommand = @"
gcloud artifacts repositories create $Repository --repository-format=docker --location=$Region --description="Repository pour l'API Screener" --quiet
"@

Invoke-GCloudCommand -Command $createRepoCommand -Description "Création du repository Artifact Registry" -IgnoreError $true

# 5. Configurer Docker pour Artifact Registry
Invoke-GCloudCommand -Command "gcloud auth configure-docker $Region-docker.pkg.dev --quiet" -Description "Configuration de Docker pour Artifact Registry"

# 6. Vérifier que le fichier cloudbuild.yaml existe
if (-not (Test-Path "cloudbuild.yaml")) {
    Write-Host "❌ Le fichier cloudbuild.yaml n'existe pas dans le répertoire courant" -ForegroundColor Red
    Write-Host "📁 Répertoire courant: $(Get-Location)" -ForegroundColor Gray
    exit 1
}

# 7. Lancer le build avec Cloud Build
$buildCommand = @"
gcloud builds submit --config cloudbuild.yaml --substitutions _REGION=$Region,_REPOSITORY=$Repository,_SERVICE_NAME=$ServiceName .
"@

Write-Host "🏗️ Lancement du build avec Cloud Build..." -ForegroundColor Blue
Write-Host "⏳ Cette étape peut prendre plusieurs minutes..." -ForegroundColor Yellow

Invoke-GCloudCommand -Command $buildCommand -Description "Build et déploiement avec Cloud Build"

# 8. Obtenir l'URL du service déployé
Write-Host "🌐 Récupération de l'URL du service..." -ForegroundColor Blue

try {
    $serviceUrl = gcloud run services describe $ServiceName --region=$Region --format="value(status.url)" 2>$null
    if ($LASTEXITCODE -eq 0 -and $serviceUrl) {
        Write-Host ""
        Write-Host "✅ Déploiement terminé avec succès!" -ForegroundColor Green
        Write-Host "🔗 URL de l'API: $serviceUrl" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📝 Testez votre API avec:" -ForegroundColor Yellow
        Write-Host "curl $serviceUrl/" -ForegroundColor Gray
        Write-Host "ou" -ForegroundColor Gray
        Write-Host "Invoke-WebRequest -Uri '$serviceUrl/' -Method GET" -ForegroundColor Gray
        Write-Host ""
        Write-Host "🔧 Pour voir les logs:" -ForegroundColor Yellow
        Write-Host "gcloud logs tail --follow --resource-type=cloud_run_revision --resource-labels=service_name=$ServiceName" -ForegroundColor Gray
        Write-Host ""
        Write-Host "🧪 Pour tester le déploiement complet:" -ForegroundColor Yellow
        Write-Host ".\test-deployment.ps1 -ApiUrl '$serviceUrl' -FrontendUrl 'https://your-frontend.onrender.com'" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ Service déployé mais impossible de récupérer l'URL" -ForegroundColor Yellow
        Write-Host "🔍 Vérifiez manuellement avec:" -ForegroundColor Gray
        Write-Host "gcloud run services list --region=$Region" -ForegroundColor Gray
    }
}
catch {
    Write-Host "⚠️ Erreur lors de la récupération de l'URL: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Script de déploiement terminé!" -ForegroundColor Green