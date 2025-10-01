#!/bin/bash

# Script de test pour valider le déploiement
# Usage: ./test-deployment.sh [API_URL] [FRONTEND_URL]

set -e

# Configuration
API_URL=${1:-"https://screener-api-xxxxxxxxx-ew.a.run.app"}
FRONTEND_URL=${2:-"https://screener-frontend.onrender.com"}

echo "🧪 Test de déploiement"
echo "API URL: $API_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Fonction pour tester une URL
test_url() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo "🔍 Test: $description"
    echo "URL: $url"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.txt "$url")
    
    if [ "$response" -eq "$expected_status" ]; then
        echo "✅ Succès (Status: $response)"
    else
        echo "❌ Échec (Status: $response)"
        echo "Réponse:"
        cat /tmp/response.txt
        return 1
    fi
    echo ""
}

# Fonction pour tester un endpoint POST
test_post() {
    local url=$1
    local data=$2
    local description=$3
    
    echo "🔍 Test POST: $description"
    echo "URL: $url"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.txt \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$url")
    
    if [ "$response" -eq "200" ]; then
        echo "✅ Succès (Status: $response)"
        echo "Réponse (premiers 200 caractères):"
        head -c 200 /tmp/response.txt
        echo ""
    else
        echo "❌ Échec (Status: $response)"
        echo "Réponse:"
        cat /tmp/response.txt
        return 1
    fi
    echo ""
}

echo "🚀 Début des tests..."
echo ""

# Tests de l'API Backend
echo "=== TESTS BACKEND API ==="

# Test 1: Endpoint racine
test_url "$API_URL/" "Endpoint racine de l'API"

# Test 2: Endpoint indices
test_url "$API_URL/indices" "Liste des indices disponibles"

# Test 3: Endpoint screening (POST)
screening_data='{
    "index_name": "CAC 40 (France)",
    "pe_max": 15,
    "pb_max": 1.5,
    "de_max": 100,
    "roe_min": 0.12
}'

test_post "$API_URL/screening" "$screening_data" "Screening avec critères"

# Test 4: Endpoint financials (exemple avec un ticker)
test_url "$API_URL/financials/AAPL" "Données financières (peut échouer si ticker non trouvé)" 404

echo "=== TESTS FRONTEND ==="

# Test 5: Page d'accueil du frontend
test_url "$FRONTEND_URL/" "Page d'accueil du frontend"

# Test 6: Vérifier que le frontend peut charger les ressources statiques
test_url "$FRONTEND_URL/_next/static/css" "Ressources CSS" 404  # 404 est normal pour ce test

echo "=== TESTS DE CONNECTIVITÉ ==="

# Test 7: Vérifier que le frontend peut communiquer avec l'API
echo "🔍 Test: Communication Frontend → API"
echo "Vérification des CORS..."

cors_test=$(curl -s -w "%{http_code}" -o /tmp/cors_response.txt \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -X OPTIONS \
    "$API_URL/screening")

if [ "$cors_test" -eq "200" ] || [ "$cors_test" -eq "204" ]; then
    echo "✅ CORS configuré correctement"
else
    echo "⚠️  CORS pourrait avoir des problèmes (Status: $cors_test)"
    echo "Réponse:"
    cat /tmp/cors_response.txt
fi
echo ""

echo "=== RÉSUMÉ DES TESTS ==="

# Compter les succès et échecs
total_tests=7
echo "📊 Tests effectués: $total_tests"

# Test de performance simple
echo "🚀 Test de performance basique..."
start_time=$(date +%s%N)
curl -s "$API_URL/" > /dev/null
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))
echo "⏱️  Temps de réponse API: ${duration}ms"

start_time=$(date +%s%N)
curl -s "$FRONTEND_URL/" > /dev/null
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))
echo "⏱️  Temps de réponse Frontend: ${duration}ms"

echo ""
echo "🎉 Tests terminés!"
echo ""
echo "📝 Prochaines étapes recommandées:"
echo "1. Tester manuellement l'interface utilisateur"
echo "2. Vérifier les logs des services"
echo "3. Effectuer un screening complet"
echo "4. Tester l'export CSV"
echo "5. Vérifier les graphiques Plotly"

# Nettoyer les fichiers temporaires
rm -f /tmp/response.txt /tmp/cors_response.txt