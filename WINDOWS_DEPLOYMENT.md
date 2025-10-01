# Guide de Déploiement sur Windows

Ce guide explique comment exécuter les scripts de déploiement GCP sur Windows.

## Options Disponibles

### 1. Script PowerShell (Recommandé) 🚀

Le script PowerShell `deploy-gcp.ps1` est la meilleure option pour Windows :

```powershell
# Exécution basique
.\deploy-gcp.ps1

# Avec paramètres personnalisés
.\deploy-gcp.ps1 -ProjectId "mon-projet-custom" -Region "us-central1" -ServiceName "my-api" -Repository "my-repo"
```

**Avantages :**
- Gestion d'erreurs avancée
- Couleurs et formatage
- Paramètres nommés
- Messages détaillés

### 2. Script Batch (.bat) 🔧

Alternative simple avec `deploy-gcp.bat` :

```cmd
# Exécution basique
deploy-gcp.bat

# Avec paramètres
deploy-gcp.bat "mon-projet-custom" "us-central1" "my-api" "my-repo"
```

**Avantages :**
- Compatible avec tous les Windows
- Syntaxe simple
- Pas de restrictions d'exécution

### 3. Script Bash avec WSL/Git Bash 🐧

Si vous avez WSL ou Git Bash installé :

```bash
# Avec WSL
wsl ./deploy-gcp.sh

# Avec Git Bash
bash ./deploy-gcp.sh
```

## Prérequis

### 1. Google Cloud CLI
Installez Google Cloud CLI depuis : https://cloud.google.com/sdk/docs/install

```powershell
# Vérifier l'installation
gcloud version

# Se connecter
gcloud auth login

# Configurer le projet par défaut (optionnel)
gcloud config set project mon-projet-screener-api
```

### 2. Docker Desktop (Optionnel)
Pour les builds locaux : https://www.docker.com/products/docker-desktop/

### 3. Permissions PowerShell

Si vous obtenez une erreur d'exécution PowerShell :

```powershell
# Vérifier la politique d'exécution
Get-ExecutionPolicy

# Autoriser l'exécution (en tant qu'administrateur)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Ou pour un script spécifique
powershell -ExecutionPolicy Bypass -File .\deploy-gcp.ps1
```

## Utilisation Étape par Étape

### 1. Préparation

```powershell
# Naviguer vers le dossier du projet
cd C:\Apps\mon_projet_screener

# Vérifier que les fichiers nécessaires sont présents
ls cloudbuild.yaml, api/Dockerfile
```

### 2. Configuration GCP

```powershell
# Se connecter à GCP
gcloud auth login

# Lister les projets disponibles
gcloud projects list

# Créer un nouveau projet (si nécessaire)
gcloud projects create mon-projet-screener-api --name="Mon Projet Screener"
```

### 3. Déploiement

```powershell
# Option 1: PowerShell (Recommandé)
.\deploy-gcp.ps1

# Option 2: Batch
.\deploy-gcp.bat

# Option 3: Avec paramètres personnalisés
.\deploy-gcp.ps1 -ProjectId "votre-projet-id" -Region "europe-west1"
```

### 4. Test du Déploiement

```powershell
# Tester l'API déployée
.\test-deployment.ps1 -ApiUrl "https://votre-api-url.run.app"

# Ou manuellement
Invoke-WebRequest -Uri "https://votre-api-url.run.app/" -Method GET
```

## Résolution de Problèmes

### Erreur : "gcloud n'est pas reconnu"
```powershell
# Ajouter gcloud au PATH
$env:PATH += ";C:\Users\$env:USERNAME\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin"

# Ou redémarrer le terminal après installation
```

### Erreur : "Impossible d'exécuter des scripts"
```powershell
# Changer la politique d'exécution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Ou exécuter avec bypass
powershell -ExecutionPolicy Bypass -File .\deploy-gcp.ps1
```

### Erreur : "Project not found"
```powershell
# Vérifier les projets disponibles
gcloud projects list

# Créer un nouveau projet
gcloud projects create votre-projet-id

# Configurer le projet
gcloud config set project votre-projet-id
```

### Erreur : "Docker not configured"
```powershell
# Configurer Docker pour Artifact Registry
gcloud auth configure-docker europe-west1-docker.pkg.dev
```

## Variables d'Environnement

Vous pouvez définir des variables d'environnement pour éviter de répéter les paramètres :

```powershell
# Dans PowerShell
$env:GCP_PROJECT_ID = "mon-projet-screener-api"
$env:GCP_REGION = "europe-west1"
$env:GCP_SERVICE_NAME = "screener-api"

# Puis exécuter
.\deploy-gcp.ps1 -ProjectId $env:GCP_PROJECT_ID -Region $env:GCP_REGION
```

## Logs et Monitoring

```powershell
# Voir les logs du service
gcloud logs tail --follow --resource-type=cloud_run_revision --resource-labels=service_name=screener-api

# Lister les services Cloud Run
gcloud run services list

# Obtenir les détails d'un service
gcloud run services describe screener-api --region=europe-west1
```

## Nettoyage

```powershell
# Supprimer le service Cloud Run
gcloud run services delete screener-api --region=europe-west1

# Supprimer le repository Artifact Registry
gcloud artifacts repositories delete screener-api-repo --location=europe-west1

# Supprimer le projet (attention !)
gcloud projects delete mon-projet-screener-api
```

## Support

- **Documentation GCP :** https://cloud.google.com/run/docs
- **Google Cloud CLI :** https://cloud.google.com/sdk/docs
- **PowerShell :** https://docs.microsoft.com/powershell/