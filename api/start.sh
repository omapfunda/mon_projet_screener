#!/bin/bash

echo "🚀 Démarrage de l'application avec support Chromium/Selenium..."

# Configuration de l'affichage virtuel
echo "📺 Configuration de l'affichage virtuel..."
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
export DISPLAY=:99

# Attendre que Xvfb soit prêt
sleep 2

# Vérifier que Chromium est disponible
echo "🔍 Vérification de Chromium..."
CHROMIUM_PATHS=(
    "/usr/bin/chromium"
    "/usr/bin/chromium-browser"
    "/snap/bin/chromium"
)

CHROMIUM_FOUND=false
for chromium_path in "${CHROMIUM_PATHS[@]}"; do
    if [ -f "$chromium_path" ]; then
        echo "✅ Chromium trouvé: $chromium_path"
        echo "✅ Version: $($chromium_path --version 2>/dev/null || echo 'Version non disponible')"
        export CHROME_BIN="$chromium_path"
        CHROMIUM_FOUND=true
        break
    fi
done

if [ "$CHROMIUM_FOUND" = false ]; then
    echo "❌ Chromium non trouvé dans les emplacements standards!"
    echo "🔍 Recherche de Chromium dans le système..."
    find /usr -name "*chromium*" -type f 2>/dev/null | head -5
    echo "📋 Packages Chromium installés:"
    dpkg -l | grep -i chromium || echo "Aucun package Chromium trouvé"
    exit 1
fi

# Test rapide de Chromium en mode headless
echo "🧪 Test de Chromium en mode headless..."
if $CHROME_BIN --headless --disable-gpu --no-sandbox --disable-dev-shm-usage --dump-dom about:blank > /dev/null 2>&1; then
    echo "✅ Test Chromium réussi"
else
    echo "⚠️  Test Chromium échoué, mais on continue..."
fi

# Test rapide de la configuration stockdx
echo "🧪 Test de la configuration stockdx..."
python3 -c "
try:
    from selenium_config import setup_stockdx_selenium
    setup_stockdx_selenium()
    print('✅ Configuration stockdx validée')
except Exception as e:
    print(f'⚠️  Erreur de configuration stockdx: {e}')
    print('🔄 L\'application va quand même démarrer...')
"

# Démarrer l'application
echo "🚀 Lancement de l'application..."
exec gunicorn main:app --host 0.0.0.0 --port 8080 --workers 1 --timeout 120