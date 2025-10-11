#!/usr/bin/env python3
"""
Script de test pour vérifier la configuration Chrome/Selenium 
avant déploiement sur Render
"""

import os
import sys
import subprocess
from selenium_config import setup_stockdx_selenium

def test_chrome_installation():
    """Test de l'installation de Chrome"""
    print("🔍 Test de l'installation de Chrome...")
    
    chrome_paths = [
        "/usr/bin/google-chrome-stable",
        "/usr/bin/google-chrome", 
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium"
    ]
    
    for chrome_path in chrome_paths:
        if os.path.exists(chrome_path):
            try:
                result = subprocess.run([chrome_path, "--version"], 
                                      capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    print(f"✅ Chrome trouvé: {chrome_path}")
                    print(f"✅ Version: {result.stdout.strip()}")
                    return True
            except Exception as e:
                print(f"⚠️  Erreur lors du test de {chrome_path}: {e}")
    
    print("❌ Aucune installation Chrome valide trouvée")
    return False

def test_selenium_config():
    """Test de la configuration Selenium"""
    print("\n🔧 Test de la configuration Selenium...")
    
    try:
        setup_stockdx_selenium()
        print("✅ Configuration Selenium OK")
        return True
    except Exception as e:
        print(f"❌ Erreur de configuration Selenium: {e}")
        return False

def test_stockdx_import():
    """Test de l'importation de stockdx"""
    print("\n📦 Test de l'importation de stockdx...")
    
    try:
        from stockdex import Ticker
        print("✅ Import stockdx réussi")
        return True
    except ImportError as e:
        print(f"❌ Erreur d'importation stockdx: {e}")
        return False

def test_environment_variables():
    """Test des variables d'environnement"""
    print("\n📋 Test des variables d'environnement...")
    
    env_vars = {
        'DISPLAY': ':99',
        'CHROME_BIN': '/usr/bin/google-chrome-stable',
        'CHROME_NO_SANDBOX': '1',
        'CHROME_DISABLE_DEV_SHM_USAGE': '1',
        'CHROME_DISABLE_GPU': '1',
        'SELENIUM_HEADLESS': '1'
    }
    
    all_good = True
    for var, expected in env_vars.items():
        actual = os.environ.get(var, 'Non définie')
        if actual == 'Non définie':
            print(f"⚠️  {var}: Non définie (attendue: {expected})")
        else:
            print(f"✅ {var}: {actual}")
    
    return all_good

def main():
    """Fonction principale"""
    print("🚀 Test de préparation pour Render")
    print("=" * 50)
    
    tests = [
        ("Installation Chrome", test_chrome_installation),
        ("Configuration Selenium", test_selenium_config), 
        ("Import stockdx", test_stockdx_import),
        ("Variables d'environnement", test_environment_variables)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"💥 Erreur lors du test {test_name}: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("📊 Résultats des tests:")
    
    all_passed = True
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status} {test_name}")
        if not passed:
            all_passed = False
    
    if all_passed:
        print("\n🎉 Tous les tests sont passés! Prêt pour Render!")
        return 0
    else:
        print("\n⚠️  Certains tests ont échoué. Vérifiez la configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main())