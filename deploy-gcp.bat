@echo off
REM Script de déploiement batch pour GCP Cloud Run
REM Usage: deploy-gcp.bat [PROJECT_ID] [REGION] [SERVICE_NAME] [REPOSITORY]

setlocal enabledelayedexpansion

REM Configuration par défaut
set DEFAULT_PROJECT_ID=mon-projet-screener-api
set DEFAULT_REGION=europe-west1
set DEFAULT_SERVICE_NAME=screener-api
set DEFAULT_REPOSITORY=screener-api-repo

REM Utiliser les arguments ou les valeurs par défaut
if "%~1"=="" (
    set PROJECT_ID=%DEFAULT_PROJECT_ID%
) else (
    set PROJECT_ID=%~1
)

if "%~2"=="" (
    set REGION=%DEFAULT_REGION%
) else (
    set REGION=%~2
)

if "%~3"=="" (
    set SERVICE_NAME=%DEFAULT_SERVICE_NAME%
) else (
    set SERVICE_NAME=%~3
)

if "%~4"=="" (
    set REPOSITORY=%DEFAULT_REPOSITORY%
) else (
    set REPOSITORY=%~4
)

echo 🚀 Déploiement du backend sur GCP Cloud Run
echo Project ID: %PROJECT_ID%
echo Region: %REGION%
echo Service: %SERVICE_NAME%
echo Repository: %REPOSITORY%
echo.

REM 1. Vérifier que gcloud est installé
echo 🔍 Vérification de Google Cloud CLI...
gcloud version >nul 2>&1
if errorlevel 1 (
    echo ❌ Google Cloud CLI n'est pas installé ou configuré.
    echo 📥 Installez-le depuis: https://cloud.google.com/sdk/docs/install
    echo 🔧 Puis exécutez: gcloud auth login
    pause
    exit /b 1
)
echo ✅ Google Cloud CLI détecté

REM 2. Configurer le projet
echo 📋 Configuration du projet GCP...
gcloud config set project %PROJECT_ID%
if errorlevel 1 (
    echo ❌ Erreur lors de la configuration du projet
    pause
    exit /b 1
)

REM 3. Activer les APIs nécessaires
echo 🔧 Activation des APIs GCP...
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

REM 4. Créer le repository Artifact Registry
echo 📦 Création du repository Artifact Registry...
gcloud artifacts repositories create %REPOSITORY% --repository-format=docker --location=%REGION% --description="Repository pour l'API Screener" --quiet
REM Ignorer l'erreur si le repository existe déjà

REM 5. Configurer Docker pour Artifact Registry
echo 🐳 Configuration de Docker pour Artifact Registry...
gcloud auth configure-docker %REGION%-docker.pkg.dev --quiet

REM 6. Vérifier que cloudbuild.yaml existe
if not exist "cloudbuild.yaml" (
    echo ❌ Le fichier cloudbuild.yaml n'existe pas dans le répertoire courant
    echo 📁 Répertoire courant: %CD%
    pause
    exit /b 1
)

REM 7. Lancer le build avec Cloud Build
echo 🏗️ Lancement du build avec Cloud Build...
echo ⏳ Cette étape peut prendre plusieurs minutes...
gcloud builds submit --config cloudbuild.yaml --substitutions _REGION=%REGION%,_REPOSITORY=%REPOSITORY%,_SERVICE_NAME=%SERVICE_NAME% .
if errorlevel 1 (
    echo ❌ Erreur lors du build et déploiement
    pause
    exit /b 1
)

REM 8. Obtenir l'URL du service déployé
echo 🌐 Récupération de l'URL du service...
for /f "delims=" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(status.url)" 2^>nul') do set SERVICE_URL=%%i

if defined SERVICE_URL (
    echo.
    echo ✅ Déploiement terminé avec succès!
    echo 🔗 URL de l'API: %SERVICE_URL%
    echo.
    echo 📝 Testez votre API avec:
    echo curl %SERVICE_URL%/
    echo ou
    echo powershell "Invoke-WebRequest -Uri '%SERVICE_URL%/' -Method GET"
    echo.
    echo 🔧 Pour voir les logs:
    echo gcloud logs tail --follow --resource-type=cloud_run_revision --resource-labels=service_name=%SERVICE_NAME%
    echo.
    echo 🧪 Pour tester le déploiement complet:
    echo powershell ".\test-deployment.ps1 -ApiUrl '%SERVICE_URL%' -FrontendUrl 'https://your-frontend.onrender.com'"
) else (
    echo ⚠️ Service déployé mais impossible de récupérer l'URL
    echo 🔍 Vérifiez manuellement avec:
    echo gcloud run services list --region=%REGION%
)

echo.
echo 🎉 Script de déploiement terminé!
pause