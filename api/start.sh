#!/bin/bash

# Script de démarrage pour l'application avec support Chrome/Selenium

echo "🚀 Démarrage de l'application avec support Chrome/Selenium..."

# Démarrer Xvfb (X Virtual Framebuffer) pour l'affichage virtuel
echo "📺 Configuration de l'affichage virtuel..."
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &

# Attendre que Xvfb soit prêt
sleep 2

# Vérifier que Chrome est disponible
echo "🔍 Vérification de Chrome..."
if command -v google-chrome-stable &> /dev/null; then
    echo "✅ Chrome trouvé: $(google-chrome-stable --version)"
else
    echo "❌ Chrome non trouvé!"
    exit 1
fi

# Tester Chrome en mode headless
echo "🧪 Test de Chrome en mode headless..."
google-chrome-stable --headless --disable-gpu --no-sandbox --disable-dev-shm-usage --version

# Test rapide de la configuration stockdx (optionnel)
echo "📊 Test rapide de la configuration stockdx..."
if python -c "from selenium_config import setup_stockdx_selenium; setup_stockdx_selenium(); print('✅ Configuration stockdx OK')" 2>/dev/null; then
    echo "✅ Configuration stockdx validée"
else
    echo "⚠️  Configuration stockdx non testée (continuons quand même)"
fi

# Lancer l'application
echo "🎯 Lancement de l'application..."
exec gunicorn main:app -w 1 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT