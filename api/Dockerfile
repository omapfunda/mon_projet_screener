# Utiliser une image Python officielle comme base
FROM python:3.11-slim

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Installer les dépendances système, y compris Google Chrome
# Méthode moderne pour ajouter la clé GPG et le dépôt
RUN apt-get update && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/etc/apt/trusted.gpg.d/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Copier le fichier des dépendances et les installer
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste du code de l'application
COPY api/ .

# La commande pour lancer l'application avec Uvicorn seul (plus léger en ressources)
CMD uvicorn main:app --host 0.0.0.0 --port $PORT