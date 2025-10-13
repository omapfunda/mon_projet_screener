#!/usr/bin/env python3
"""
Script de diagnostic pour identifier les problèmes spécifiques à l'environnement Render
"""

import sys
import os
import traceback
from datetime import datetime

def test_environment():
    """Test de l'environnement et des dépendances"""
    print("🔍 DIAGNOSTIC ENVIRONNEMENT RENDER")
    print("=" * 60)
    print(f"📅 Timestamp: {datetime.now()}")
    print(f"🐍 Python version: {sys.version}")
    print(f"📁 Working directory: {os.getcwd()}")
    print(f"📂 Python path: {sys.path}")
    
    # Variables d'environnement critiques
    print("\n🔧 VARIABLES D'ENVIRONNEMENT:")
    env_vars = [
        'REDIS_URL', 'DATABASE_PATH', 'CACHE_TTL', 'PORT',
        'CHROME_BIN', 'DISPLAY', 'PYTHONPATH'
    ]
    for var in env_vars:
        value = os.getenv(var, 'NON DÉFINIE')
        print(f"   {var}: {value}")

def test_imports():
    """Test des imports critiques"""
    print("\n📦 TEST DES IMPORTS:")
    
    imports_to_test = [
        ('redis', 'Redis'),
        ('selenium', 'Selenium'),
        ('pandas', 'Pandas'),
        ('numpy', 'NumPy'),
        ('requests', 'Requests'),
        ('stockdx', 'StockDX')
    ]
    
    for module_name, display_name in imports_to_test:
        try:
            __import__(module_name)
            print(f"   ✅ {display_name}")
        except ImportError as e:
            print(f"   ❌ {display_name}: {e}")

def test_redis_connection():
    """Test de la connexion Redis"""
    print("\n🔗 TEST CONNEXION REDIS:")
    try:
        import redis
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        print(f"   URL Redis: {redis_url}")
        
        client = redis.from_url(redis_url, decode_responses=True)
        client.ping()
        print("   ✅ Connexion Redis réussie")
        
        # Test d'écriture/lecture
        client.set('test_key', 'test_value', ex=60)
        value = client.get('test_key')
        if value == 'test_value':
            print("   ✅ Test écriture/lecture Redis réussi")
        else:
            print(f"   ⚠️  Problème écriture/lecture Redis: {value}")
            
    except Exception as e:
        print(f"   ❌ Erreur Redis: {e}")
        print("   ℹ️  Fallback vers cache mémoire")

def test_selenium_chrome():
    """Test de la configuration Selenium/Chrome"""
    print("\n🌐 TEST SELENIUM/CHROME:")
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--remote-debugging-port=9222')
        
        chrome_bin = os.getenv('CHROME_BIN', '/usr/bin/google-chrome-stable')
        if os.path.exists(chrome_bin):
            chrome_options.binary_location = chrome_bin
            print(f"   ✅ Chrome trouvé: {chrome_bin}")
        else:
            print(f"   ❌ Chrome non trouvé: {chrome_bin}")
            return False
        
        # Test rapide de création de driver
        driver = webdriver.Chrome(options=chrome_options)
        driver.get("data:text/html,<html><body><h1>Test</h1></body></html>")
        title = driver.title
        driver.quit()
        
        print("   ✅ Selenium/Chrome fonctionnel")
        return True
        
    except Exception as e:
        print(f"   ❌ Erreur Selenium/Chrome: {e}")
        traceback.print_exc()
        return False

def test_dcf_dependencies():
    """Test des dépendances spécifiques à l'analyse DCF"""
    print("\n📊 TEST DÉPENDANCES DCF:")
    try:
        # Test import des modules locaux
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        
        from database import CacheManager, cache_manager
        print("   ✅ Import database.py réussi")
        
        # Test du cache manager
        cache_manager.set('test_dcf', {'test': 'data'}, ttl=60)
        result = cache_manager.get('test_dcf')
        if result:
            print("   ✅ Cache manager fonctionnel")
        else:
            print("   ⚠️  Cache manager problématique")
        
        from fmp_analysis import get_dcf_analysis
        print("   ✅ Import fmp_analysis.py réussi")
        
    except Exception as e:
        print(f"   ❌ Erreur dépendances DCF: {e}")
        traceback.print_exc()

def test_simple_dcf():
    """Test simple de l'analyse DCF"""
    print("\n🧮 TEST ANALYSE DCF SIMPLE:")
    try:
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from fmp_analysis import get_dcf_analysis
        
        # Test avec un ticker simple
        print("   🔄 Test DCF pour AAPL...")
        result = get_dcf_analysis('AAPL')
        
        if result.get('success'):
            print("   ✅ Analyse DCF réussie")
            print(f"   📈 Scénario 1: {result.get('scenario1', {}).get('intrinsic_value', 'N/A')}")
        else:
            print(f"   ❌ Analyse DCF échouée: {result.get('error', 'Erreur inconnue')}")
            
    except Exception as e:
        print(f"   ❌ Erreur test DCF: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 DÉMARRAGE DU DIAGNOSTIC RENDER")
    
    test_environment()
    test_imports()
    test_redis_connection()
    
    selenium_ok = test_selenium_chrome()
    test_dcf_dependencies()
    
    if selenium_ok:
        test_simple_dcf()
    else:
        print("\n⚠️  Selenium/Chrome non fonctionnel - Test DCF ignoré")
    
    print("\n" + "=" * 60)
    print("🏁 DIAGNOSTIC TERMINÉ")
    print("=" * 60)