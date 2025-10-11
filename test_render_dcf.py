#!/usr/bin/env python3
"""
Script de test pour diagnostiquer les problèmes DCF sur le déploiement Render.
"""

import requests
import json
import time

def test_render_api(base_url):
    """Teste l'API déployée sur Render."""
    print(f"🔍 Test de l'API Render: {base_url}")
    print("=" * 60)
    
    # Test 1: Vérifier que l'API est accessible
    print("\n1️⃣ Test de connectivité de base...")
    try:
        response = requests.get(f"{base_url}/", timeout=30)
        print(f"✅ API accessible - Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {response.text[:100]}...")
    except Exception as e:
        print(f"❌ Erreur de connectivité: {e}")
        return False
    
    # Test 2: Tester l'endpoint DCF avec un ticker simple
    print("\n2️⃣ Test de l'endpoint DCF avec AAPL...")
    try:
        response = requests.get(f"{base_url}/dcf-valuation/AAPL", timeout=120)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ DCF Analysis réussie pour AAPL")
            if data.get('success'):
                scenario1 = data.get('scenario1', {})
                print(f"   Valeur intrinsèque: {scenario1.get('intrinsic_value', 'N/A')}")
            else:
                print(f"   ⚠️ Analyse échouée: {data.get('error', 'Erreur inconnue')}")
        else:
            print(f"❌ Erreur HTTP {response.status_code}")
            print(f"   Response: {response.text[:500]}...")
            
    except requests.exceptions.Timeout:
        print("❌ Timeout - L'analyse DCF prend trop de temps")
    except Exception as e:
        print(f"❌ Erreur lors du test DCF: {e}")
    
    # Test 3: Tester avec MSFT (ticker qui fonctionnait localement)
    print("\n3️⃣ Test de l'endpoint DCF avec MSFT...")
    try:
        response = requests.get(f"{base_url}/dcf-valuation/MSFT", timeout=120)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ DCF Analysis réussie pour MSFT")
                scenario1 = data.get('scenario1', {})
                print(f"   Valeur intrinsèque: {scenario1.get('intrinsic_value', 'N/A')}")
            else:
                print(f"   ⚠️ Analyse échouée: {data.get('error', 'Erreur inconnue')}")
                print(f"   Type d'erreur: {data.get('error_type', 'Inconnu')}")
        else:
            print(f"❌ Erreur HTTP {response.status_code}")
            print(f"   Response: {response.text[:500]}...")
            
    except requests.exceptions.Timeout:
        print("❌ Timeout - L'analyse DCF prend trop de temps")
    except Exception as e:
        print(f"❌ Erreur lors du test DCF: {e}")
    
    # Test 4: Vérifier les autres endpoints
    print("\n4️⃣ Test des autres endpoints...")
    endpoints_to_test = [
        "/health",
        "/docs",
        "/openapi.json"
    ]
    
    for endpoint in endpoints_to_test:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=30)
            status = "✅" if response.status_code == 200 else "❌"
            print(f"   {status} {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"   ❌ {endpoint}: Erreur - {e}")

def main():
    """Fonction principale de test."""
    print("🧪 DIAGNOSTIC DCF - DÉPLOIEMENT RENDER")
    print("=" * 60)
    
    # URL de base de votre API Render (à remplacer par votre URL réelle)
    render_urls = [
        "https://screener-api.onrender.com",  # URL typique Render
        "https://your-app-name.onrender.com",  # À remplacer par votre URL
    ]
    
    print("⚠️  IMPORTANT: Remplacez les URLs ci-dessous par votre URL Render réelle")
    print("   Format typique: https://your-service-name.onrender.com")
    print()
    
    for url in render_urls:
        print(f"\n🌐 Test avec URL: {url}")
        print("-" * 40)
        test_render_api(url)
        print()
    
    print("\n📋 RECOMMANDATIONS:")
    print("1. Vérifiez les logs Render pour des erreurs spécifiques")
    print("2. Assurez-vous que Chrome/Selenium fonctionne dans l'environnement Render")
    print("3. Considérez une alternative à stockdx si nécessaire")
    print("4. Vérifiez les timeouts et les limites de ressources")

if __name__ == "__main__":
    main()