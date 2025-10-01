# 🚀 Guide de Déploiement : Backend GCP + Frontend Render

Ce guide vous accompagne pour déployer votre application de screening financier avec le backend sur Google Cloud Platform et le frontend sur Render.

## 📋 Prérequis

### Comptes et Outils
- ✅ Compte Google Cloud Platform avec facturation activée
- ✅ Compte Render (gratuit)
- ✅ Google Cloud CLI installé ([Installation](https://cloud.google.com/sdk/docs/install))
- ✅ Git configuré
- ✅ Node.js 18+ installé

### Vérifications
```bash
# Vérifier les installations
gcloud --version
node --version
npm --version
git --version
```

---

## 🔧 ÉTAPE 1 : Déploiement Backend sur GCP

### 1.1 Configuration initiale GCP

```bash
# 1. Se connecter à GCP
gcloud auth login

# 2. Créer un nouveau projet (optionnel)
gcloud projects create mon-projet-screener-api --name="Screener API"

# 3. Définir le projet par défaut
gcloud config set project mon-projet-screener-api

# 4. Activer la facturation (nécessaire pour Cloud Run)
# Suivre les instructions dans la console GCP
```

### 1.2 Déploiement automatisé

```bash
# Rendre le script exécutable (Linux/Mac)
chmod +x deploy-gcp.sh

# Lancer le déploiement
./deploy-gcp.sh mon-projet-screener-api

# Ou manuellement avec les paramètres
./deploy-gcp.sh [PROJECT_ID] [REGION] [SERVICE_NAME] [REPOSITORY]
```

### 1.3 Déploiement manuel (alternative)

```bash
# 1. Activer les APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# 2. Créer le repository Artifact Registry
gcloud artifacts repositories create screener-api-repo \
    --repository-format=docker \
    --location=europe-west1 \
    --description="Repository pour l'API Screener"

# 3. Configurer Docker
gcloud auth configure-docker europe-west1-docker.pkg.dev

# 4. Lancer le build
gcloud builds submit --config cloudbuild.yaml .

# 5. Récupérer l'URL de l'API
gcloud run services describe screener-api \
    --region=europe-west1 \
    --format="value(status.url)"
```

### 1.4 Configuration des variables d'environnement

```bash
# Définir l'URL du frontend (après déploiement Render)
gcloud run services update screener-api \
    --region=europe-west1 \
    --set-env-vars FRONTEND_URL=https://votre-app.onrender.com
```

---

## 🎨 ÉTAPE 2 : Déploiement Frontend sur Render

### 2.1 Préparation du repository

```bash
# 1. Pousser le code sur GitHub (si pas déjà fait)
git add .
git commit -m "Préparation pour déploiement Render"
git push origin main
```

### 2.2 Déploiement via l'interface Render

1. **Connectez-vous à [Render](https://render.com)**

2. **Créer un nouveau Web Service**
   - Cliquez sur "New +" → "Web Service"
   - Connectez votre repository GitHub
   - Sélectionnez votre projet

3. **Configuration du service**
   ```
   Name: screener-frontend
   Environment: Node
   Build Command: npm ci && npm run build
   Start Command: npm start
   ```

4. **Variables d'environnement**
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://votre-api-gcp.run.app
   ```

### 2.3 Déploiement via render.yaml (alternative)

```bash
# 1. Mettre à jour render.yaml avec l'URL de votre API GCP
# Remplacer "https://votre-api-gcp.run.app" par l'URL réelle

# 2. Pousser les changements
git add render.yaml
git commit -m "Configuration Render"
git push origin main

# 3. Dans Render, créer un service depuis le fichier render.yaml
```

---

## 🔗 ÉTAPE 3 : Configuration de la Communication

### 3.1 Mettre à jour l'URL de l'API

Une fois le backend déployé sur GCP, récupérez l'URL et mettez à jour :

```bash
# 1. Récupérer l'URL de l'API GCP
API_URL=$(gcloud run services describe screener-api \
    --region=europe-west1 \
    --format="value(status.url)")

echo "URL de l'API: $API_URL"
```

### 3.2 Configurer le frontend

1. **Dans Render Dashboard :**
   - Allez dans votre service frontend
   - Section "Environment"
   - Mettre à jour `NEXT_PUBLIC_API_URL` avec l'URL de votre API GCP

2. **Redéployer le frontend :**
   - Cliquez sur "Manual Deploy" → "Deploy latest commit"

### 3.3 Configurer le backend

```bash
# Mettre à jour les CORS avec l'URL du frontend Render
FRONTEND_URL=$(curl -s https://api.render.com/v1/services/YOUR_SERVICE_ID | jq -r '.service.serviceDetails.url')

gcloud run services update screener-api \
    --region=europe-west1 \
    --set-env-vars FRONTEND_URL=$FRONTEND_URL
```

---

## 🧪 ÉTAPE 4 : Tests et Validation

### 4.1 Test de l'API

```bash
# Test de base
curl https://votre-api-gcp.run.app/

# Test des indices
curl https://votre-api-gcp.run.app/indices

# Test de screening
curl -X POST https://votre-api-gcp.run.app/screening \
  -H "Content-Type: application/json" \
  -d '{
    "index_name": "CAC 40 (France)",
    "pe_max": 15,
    "pb_max": 1.5,
    "de_max": 100,
    "roe_min": 0.12
  }'
```

### 4.2 Test du Frontend

1. Ouvrez votre application Render : `https://votre-app.onrender.com`
2. Vérifiez que les indices se chargent
3. Lancez un screening test
4. Vérifiez les graphiques et l'export CSV

### 4.3 Vérification des logs

```bash
# Logs GCP Cloud Run
gcloud logs tail --follow \
    --resource-type=cloud_run_revision \
    --resource-labels=service_name=screener-api

# Logs Render (dans le dashboard)
# Render Dashboard → Votre service → Logs
```

---

## 🔧 Maintenance et Monitoring

### Mise à jour du Backend

```bash
# 1. Modifier le code
# 2. Pousser sur Git
git add .
git commit -m "Mise à jour backend"
git push origin main

# 3. Redéployer
gcloud builds submit --config cloudbuild.yaml .
```

### Mise à jour du Frontend

```bash
# 1. Modifier le code
# 2. Pousser sur Git
git add .
git commit -m "Mise à jour frontend"
git push origin main

# 3. Render redéploie automatiquement
```

### Monitoring

- **GCP :** Console Cloud Run → Métriques
- **Render :** Dashboard → Métriques
- **Logs :** Accessible via les interfaces respectives

---

## 🚨 Dépannage

### Problèmes courants

1. **CORS Error**
   ```bash
   # Vérifier les variables d'environnement
   gcloud run services describe screener-api \
       --region=europe-west1 \
       --format="export"
   ```

2. **Build Failed sur Render**
   - Vérifier les logs de build
   - S'assurer que `package.json` est correct
   - Vérifier les versions Node.js

3. **API non accessible**
   - Vérifier que le service Cloud Run est déployé
   - Vérifier les permissions IAM
   - Tester l'URL directement

### Commandes utiles

```bash
# Redémarrer le service Cloud Run
gcloud run services update screener-api --region=europe-west1

# Voir les révisions
gcloud run revisions list --service=screener-api --region=europe-west1

# Rollback vers une révision précédente
gcloud run services update-traffic screener-api \
    --to-revisions=REVISION_NAME=100 \
    --region=europe-west1
```

---

## 💰 Coûts Estimés

### GCP Cloud Run (Backend)
- **Plan gratuit :** 2 millions de requêtes/mois
- **Au-delà :** ~0.40$/million de requêtes
- **Compute :** ~0.000024$/vCPU-seconde

### Render (Frontend)
- **Plan gratuit :** 750h/mois, sleep après 15min d'inactivité
- **Plan payant :** 7$/mois pour un service toujours actif

---

## 📞 Support

En cas de problème :
1. Vérifiez les logs des deux services
2. Testez les endpoints individuellement
3. Vérifiez les variables d'environnement
4. Consultez la documentation officielle :
   - [GCP Cloud Run](https://cloud.google.com/run/docs)
   - [Render](https://render.com/docs)

---

**🎉 Félicitations ! Votre application est maintenant déployée en production !**