#!/bin/bash

echo "🚀 Démarrage de l'application avec support Google Chrome/Selenium..."

# Configuration de l'affichage virtuel
echo "📺 Configuration de l'affichage virtuel..."
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
export DISPLAY=:99

# Attendre que Xvfb soit prêt
sleep 2

# Vérifier que Google Chrome est disponible
echo "🔍 Vérification de Google Chrome..."

# Diagnostic complet du système
echo "🔍 Diagnostic du système..."
echo "📋 Packages Chrome installés:"
dpkg -l | grep -i chrome || echo "Aucun package Chrome trouvé"

echo "🔍 Recherche de binaires Chrome..."
find /usr -name "*chrome*" -type f -executable 2>/dev/null | head -10

echo "🔍 Vérification des chemins standards..."
CHROME_PATHS=(
    "/usr/bin/google-chrome-stable"
    "/usr/bin/google-chrome"
    "/usr/bin/chromium"
    "/usr/bin/chromium-browser"
)

CHROME_FOUND=false
for chrome_path in "${CHROME_PATHS[@]}"; do
    echo "🔍 Vérification de: $chrome_path"
    if [ -f "$chrome_path" ] && [ -x "$chrome_path" ]; then
        echo "✅ Chrome trouvé: $chrome_path"
        version_output=$($chrome_path --version 2>/dev/null || echo 'Version non disponible')
        echo "✅ Version: $version_output"
        export CHROME_BIN="$chrome_path"
        CHROME_FOUND=true
        break
    else
        echo "❌ Non trouvé ou non exécutable: $chrome_path"
    fi
done

# Si pas trouvé, essayer avec which
if [ "$CHROME_FOUND" = false ]; then
    echo "🔍 Recherche avec 'which'..."
    for cmd in google-chrome-stable google-chrome chromium chromium-browser; do
        chrome_which=$(which $cmd 2>/dev/null)
        if [ -n "$chrome_which" ]; then
            echo "✅ Chrome trouvé via which: $chrome_which"
            export CHROME_BIN="$chrome_which"
            CHROME_FOUND=true
            break
        fi
    done
fi

if [ "$CHROME_FOUND" = false ]; then
    echo "❌ Chrome non trouvé!"
    echo "🔍 Contenu de /usr/bin/ (chrome*):"
    ls -la /usr/bin/*chrome* 2>/dev/null || echo "Aucun fichier chrome* dans /usr/bin/"
    echo "🔍 Contenu de /usr/local/bin/ (chrome*):"
    ls -la /usr/local/bin/*chrome* 2>/dev/null || echo "Aucun fichier chrome* dans /usr/local/bin/"
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