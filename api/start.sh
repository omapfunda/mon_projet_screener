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

# Diagnostic complet du système
echo "🔍 Diagnostic du système..."
echo "📋 Packages Chromium installés:"
dpkg -l | grep -i chromium || echo "Aucun package Chromium trouvé"

echo "🔍 Recherche de binaires Chromium..."
find /usr -name "*chromium*" -type f -executable 2>/dev/null | head -10

echo "🔍 Vérification des chemins standards..."
CHROMIUM_PATHS=(
    "/usr/bin/chromium"
    "/usr/bin/chromium-browser"
    "/snap/bin/chromium"
    "/usr/lib/chromium-browser/chromium-browser"
)

CHROMIUM_FOUND=false
for chromium_path in "${CHROMIUM_PATHS[@]}"; do
    echo "🔍 Vérification de: $chromium_path"
    if [ -f "$chromium_path" ] && [ -x "$chromium_path" ]; then
        echo "✅ Chromium trouvé: $chromium_path"
        version_output=$($chromium_path --version 2>/dev/null || echo 'Version non disponible')
        echo "✅ Version: $version_output"
        export CHROME_BIN="$chromium_path"
        CHROMIUM_FOUND=true
        break
    else
        echo "❌ Non trouvé ou non exécutable: $chromium_path"
    fi
done

# Si pas trouvé, essayer avec which
if [ "$CHROMIUM_FOUND" = false ]; then
    echo "🔍 Recherche avec 'which'..."
    for cmd in chromium chromium-browser; do
        chromium_which=$(which $cmd 2>/dev/null)
        if [ -n "$chromium_which" ]; then
            echo "✅ Chromium trouvé via which: $chromium_which"
            export CHROME_BIN="$chromium_which"
            CHROMIUM_FOUND=true
            break
        fi
    done
fi

if [ "$CHROMIUM_FOUND" = false ]; then
    echo "❌ Chromium non trouvé!"
    echo "🔍 Contenu de /usr/bin/ (chromium*):"
    ls -la /usr/bin/chromium* 2>/dev/null || echo "Aucun fichier chromium* dans /usr/bin/"
    echo "🔍 Contenu de /usr/lib/ (chromium*):"
    find /usr/lib -name "*chromium*" -type f 2>/dev/null | head -5 || echo "Aucun fichier chromium* dans /usr/lib/"
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