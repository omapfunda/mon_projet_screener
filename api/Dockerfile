# Dockerfile alternatif pour Render avec Chromium
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système pour Chromium et Selenium
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    xvfb \
    chromium \
    chromium-driver \
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
    && rm -rf /var/lib/apt/lists/*

# Vérifier l'installation de Chromium
RUN echo "=== Vérification de Chromium ===" \
    && chromium --version \
    && which chromium \
    && ls -la /usr/bin/chromium*

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
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROME_NO_SANDBOX=1
ENV CHROME_DISABLE_DEV_SHM_USAGE=1
ENV CHROME_DISABLE_GPU=1
ENV SELENIUM_HEADLESS=1

# Commande de démarrage
CMD ["./start.sh"]