# Dockerfile pour Render avec Google Chrome
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système de base
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    xvfb \
    jq \
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
    && rm -rf /var/lib/apt/lists/*

# Ajouter la clé Google Chrome et installer Chrome (méthode moderne sans apt-key)
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /etc/apt/trusted.gpg.d/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/etc/apt/trusted.gpg.d/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Vérifier l'installation de Chrome
RUN echo "=== Vérification de Google Chrome ===" \
    && google-chrome-stable --version \
    && which google-chrome-stable \
    && ls -la /usr/bin/google-chrome*

# Installer ChromeDriver (méthode moderne et robuste pour Chrome 115+)
RUN CHROMEDRIVER_URL=$(curl -s https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json | jq -r '.channels.Stable.downloads.chromedriver[] | select(.platform=="linux64") | .url') \
    && echo "ChromeDriver download URL: $CHROMEDRIVER_URL" \
    && wget --quiet -O /tmp/chromedriver.zip "$CHROMEDRIVER_URL" \
    && unzip /tmp/chromedriver.zip -d /usr/local/bin/ \
    && chmod +x /usr/local/bin/chromedriver-linux64/chromedriver \
    && mv /usr/local/bin/chromedriver-linux64/chromedriver /usr/local/bin/chromedriver \
    && rm -rf /usr/local/bin/chromedriver-linux64 \
    && rm /tmp/chromedriver.zip \
    && echo "ChromeDriver installed at: $(which chromedriver)" \
    && chromedriver --version

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

# Variables d'environnement Python
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Variables d'environnement Chrome/Selenium optimisées pour Render
ENV CHROME_BIN=/usr/bin/google-chrome-stable
ENV CHROME_PATH=/usr/bin/google-chrome-stable
ENV CHROMIUM_PATH=/usr/bin/google-chrome-stable
ENV GOOGLE_CHROME_BIN=/usr/bin/google-chrome-stable
ENV DISPLAY=:99
ENV CHROME_OPTIONS="--headless --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-extensions --disable-plugins --disable-images --disable-javascript --window-size=1920,1080"

# Commande de démarrage
CMD ["./start.sh"]