#!/bin/bash

# Script de déploiement pour GCP Cloud Run
# Usage: ./deploy-gcp.sh [PROJECT_ID]

set -e

# Configuration par défaut
DEFAULT_PROJECT_ID="mon-projet-screener-api"
DEFAULT_REGION="europe-west1"
DEFAULT_SERVICE_NAME="screener-api"
DEFAULT_REPOSITORY="screener-api-repo"

# Utiliser les arguments ou les valeurs par défaut
PROJECT_ID=${1:-$DEFAULT_PROJECT_ID}
REGION=${2:-$DEFAULT_REGION}
SERVICE_NAME=${3:-$DEFAULT_SERVICE_NAME}
REPOSITORY=${4:-$DEFAULT_REPOSITORY}

echo "🚀 Déploiement du backend sur GCP Cloud Run"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo "Repository: $REPOSITORY"
echo ""

# 1. Vérifier que gcloud est installé et configuré
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI n'est pas installé. Installez-le depuis https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# 2. Configurer le projet
echo "📋 Configuration du projet GCP..."
gcloud config set project $PROJECT_ID

# 3. Activer les APIs nécessaires
echo "🔧 Activation des APIs GCP..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# 4. Créer le repository Artifact Registry s'il n'existe pas
echo "📦 Création du repository Artifact Registry..."
gcloud artifacts repositories create $REPOSITORY \
    --repository-format=docker \
    --location=$REGION \
    --description="Repository pour l'API Screener" \
    --quiet || echo "Repository déjà existant"

# 5. Configurer Docker pour Artifact Registry
echo "🐳 Configuration de Docker pour Artifact Registry..."
gcloud auth configure-docker $REGION-docker.pkg.dev --quiet

# 6. Lancer le build avec Cloud Build
echo "🏗️ Lancement du build avec Cloud Build..."
gcloud builds submit \
    --config cloudbuild.yaml \
    --substitutions _REGION=$REGION,_REPOSITORY=$REPOSITORY,_SERVICE_NAME=$SERVICE_NAME \
    .

# 7. Obtenir l'URL du service déployé
echo "🌐 Récupération de l'URL du service..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo ""
echo "✅ Déploiement terminé avec succès!"
echo "🔗 URL de l'API: $SERVICE_URL"
echo ""
echo "📝 Testez votre API avec:"
echo "curl $SERVICE_URL/"
echo ""
echo "🔧 Pour voir les logs:"
echo "gcloud logs tail --follow --resource-type=cloud_run_revision --resource-labels=service_name=$SERVICE_NAME"