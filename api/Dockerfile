# Utiliser une image Python officielle comme base
FROM python:3.11-slim

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Installer les dépendances système pour Chrome et Selenium
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    xvfb \
    libxi6 \
    libgconf-2-4 \
    libxss1 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxtst6 \
    libappindicator1 \
    libnss3 \
    libgbm1 \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/etc/apt/trusted.gpg.d/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Créer un utilisateur non-root pour la sécurité
RUN useradd --create-home --shell /bin/bash app

# Copier le fichier des dépendances et les installer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste du code de l'application
COPY . .

# Rendre le script de démarrage exécutable
RUN chmod +x start.sh

# Changer la propriété des fichiers vers l'utilisateur app
RUN chown -R app:app /app

# Basculer vers l'utilisateur non-root
USER app

# Exposer le port (Render utilise une variable d'environnement PORT)
EXPOSE 8080

# Variables d'environnement pour la production
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8080

# Variables d'environnement pour Chrome et Selenium
ENV DISPLAY=:99
ENV CHROME_BIN=/usr/bin/google-chrome-stable
ENV CHROME_PATH=/usr/bin/google-chrome-stable
ENV CHROMIUM_PATH=/usr/bin/google-chrome-stable
ENV GOOGLE_CHROME_BIN=/usr/bin/google-chrome-stable

# Variables d'environnement spécifiques pour stockdex et optimisation
ENV CHROME_NO_SANDBOX=1
ENV CHROME_DISABLE_DEV_SHM_USAGE=1
ENV CHROME_DISABLE_GPU=1
ENV SELENIUM_HEADLESS=1

# La commande pour lancer l'application avec le script de démarrage
CMD ["./start.sh"]