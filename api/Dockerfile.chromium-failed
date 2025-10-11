# Dockerfile fallback avec Google Chrome pour Render
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système et Google Chrome
RUN echo "=== Mise à jour des packages ===" \
    && apt-get update \
    && echo "=== Installation des dépendances de base ===" \
    && apt-get install -y --no-install-recommends \
        wget \
        gnupg \
        unzip \
        curl \
        xvfb \
        fonts-liberation \
        libappindicator3-1 \
        libasound2 \
        libatk-bridge2.0-0 \
        libdrm2 \
        libxcomposite1 \
        libxdamage1 \
        libxrandr2 \
        libgbm1 \
        libxss1 \
        libnss3 \
        ca-certificates \
    && echo "=== Ajout de la clé Google Chrome ===" \
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && echo "=== Installation de Google Chrome ===" \
    && apt-get update \
    && apt-get install -y --no-install-recommends google-chrome-stable \
    && echo "=== Vérification de l'installation ===" \
    && google-chrome-stable --version \
    && which google-chrome-stable \
    && echo "=== Installation de ChromeDriver ===" \
    && CHROME_VERSION=$(google-chrome-stable --version | cut -d " " -f3 | cut -d "." -f1) \
    && CHROMEDRIVER_VERSION=$(curl -s "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_VERSION}") \
    && wget -O /tmp/chromedriver.zip "https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip" \
    && unzip /tmp/chromedriver.zip -d /tmp/ \
    && mv /tmp/chromedriver /usr/local/bin/chromedriver \
    && chmod +x /usr/local/bin/chromedriver \
    && echo "=== Nettoyage ===" \
    && rm -rf /var/lib/apt/lists/* /tmp/chromedriver.zip \
    && echo "=== Installation terminée ==="

# Créer un utilisateur non-root pour la sécurité
RUN useradd --create-home --shell /bin/bash app

# Copier les fichiers de dépendances
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste du code de l'application
COPY . .

# Rendre le script de démarrage exécutable
RUN chmod +x start.sh

# Définir les permissions appropriées
RUN chown -R app:app /app

# Passer à l'utilisateur non-root
USER app

# Exposer le port
EXPOSE 8080

# Variables d'environnement pour Python
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Variables d'environnement pour Chrome/Selenium optimisées pour Render
ENV DISPLAY=:99
ENV CHROME_BIN=/usr/bin/google-chrome-stable
ENV CHROME_NO_SANDBOX=1
ENV CHROME_DISABLE_DEV_SHM_USAGE=1
ENV CHROME_DISABLE_GPU=1
ENV SELENIUM_HEADLESS=1

# Commande de démarrage
CMD ["./start.sh"]