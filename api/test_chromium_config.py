#!/usr/bin/env python3
"""
Test de la configuration Chromium pour Render
"""

import os
import sys
import subprocess
import shutil

def test_chromium_binary():
    """Test de la présence du binaire Chromium"""
    print("🔍 Test du binaire Chromium...")
    
    chromium_paths = [
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/snap/bin/chromium"
    ]
    
    found = False
    for path in chromium_paths:
        if os.path.exists(path):
            print(f"✅ Chromium trouvé: {path}")
            try:
                result = subprocess.run([path, "--version"], 
                                      capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    print(f"✅ Version: {result.stdout.strip()}")
                    found = True
                    break
            except Exception as e:
                print(f"⚠️  Erreur lors du test de {path}: {e}")
    
    if not found:
        print("❌ Aucun binaire Chromium trouvé")
        
    return found

def test_chromium_driver():
    """Test du driver Chromium"""
    print("\n🔍 Test du driver Chromium...")
    
    drivers = ['chromedriver', 'chromium-driver']
    found = False
    
    for driver in drivers:
        driver_path = shutil.which(driver)
        if driver_path:
            print(f"✅ Driver trouvé: {driver_path}")
            try:
                result = subprocess.run([driver_path, "--version"], 
                                      capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    print(f"✅ Version: {result.stdout.strip()}")
                    found = True
                    break
            except Exception as e:
                print(f"⚠️  Erreur lors du test de {driver_path}: {e}")
    
    if not found:
        print("❌ Aucun driver trouvé")
        
    return found

def test_selenium_chromium():
    """Test de Selenium avec Chromium"""
    print("\n🔧 Test de Selenium avec Chromium...")
    
    try:
        from selenium_config import create_optimized_driver
        
        # Définir les variables d'environnement pour Chromium
        os.environ['CHROME_BIN'] = '/usr/bin/chromium'
        os.environ['DISPLAY'] = ':99'
        
        print("🚀 Création du driver...")
        driver = create_optimized_driver()
        
        print("🌐 Test de navigation...")
        driver.get("about:blank")
        
        print("✅ Test Selenium réussi!")
        driver.quit()
        return True
        
    except Exception as e:
        print(f"❌ Erreur Selenium: {e}")
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

def main():
    """Fonction principale"""
    print("🚀 Test de configuration Chromium pour Render")
    print("=" * 50)
    
    tests = [
        ("Binaire Chromium", test_chromium_binary),
        ("Driver Chromium", test_chromium_driver),
        ("Import stockdx", test_stockdx_import),
        ("Selenium Chromium", test_selenium_chromium)
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
        print("\n🎉 Configuration Chromium prête pour Render!")
        return 0
    else:
        print("\n⚠️  Certains tests ont échoué.")
        return 1

if __name__ == "__main__":
    sys.exit(main())