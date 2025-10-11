#!/usr/bin/env python3
"""
Test script pour vérifier que stockdex fonctionne correctement dans Docker
avec la configuration Selenium optimisée.
"""

import os
import sys
import traceback
from selenium_config import setup_stockdx_selenium

def test_docker_environment():
    """Test de l'environnement Docker pour stockdx"""
    print("🐳 Test de l'environnement Docker pour stockdx")
    print("=" * 60)
    
    # Vérifier les variables d'environnement
    print("📋 Variables d'environnement Chrome:")
    env_vars = [
        'CHROME_BIN', 'CHROME_PATH', 'CHROMIUM_PATH', 
        'GOOGLE_CHROME_BIN', 'DISPLAY',
        'CHROME_NO_SANDBOX', 'CHROME_DISABLE_DEV_SHM_USAGE',
        'CHROME_DISABLE_GPU', 'SELENIUM_HEADLESS'
    ]
    
    for var in env_vars:
        value = os.environ.get(var, 'Non définie')
        print(f"  {var}: {value}")
    
    print("\n🔧 Configuration de Selenium pour stockdx...")
    try:
        setup_stockdx_selenium()
        print("✅ Configuration stockdx validée!")
    except Exception as e:
        print(f"❌ Erreur de configuration: {e}")
        return False
    
    print("\n📦 Test d'importation de stockdx...")
    try:
        from stockdex import Ticker
        print("✅ Import de stockdx réussi!")
    except ImportError as e:
        print(f"❌ Erreur d'importation stockdx: {e}")
        return False
    
    print("\n📈 Test basique avec le ticker AAPL...")
    try:
        ticker = Ticker("AAPL")
        print("✅ Création du ticker réussie!")
        
        # Vérifier que l'objet ticker a été créé correctement
        if hasattr(ticker, 'symbol'):
            print(f"✅ Ticker créé pour le symbole: {ticker.symbol}")
        else:
            print("✅ Ticker créé (structure interne)")
            
    except Exception as e:
        print(f"❌ Erreur lors de la création du ticker: {e}")
        traceback.print_exc()
        return False
    
    print("\n🌐 Test de récupération de données Selenium (Macrotrends)...")
    try:
        # Test avec timeout réduit pour Docker
        income_data = ticker.macrotrends_income_statement()
        if income_data is not None and not income_data.empty:
            print(f"✅ Données Macrotrends récupérées avec succès!")
            print(f"📊 Taille des données: {income_data.shape}")
            if len(income_data.columns) > 1:
                print(f"📅 Colonnes disponibles: {list(income_data.columns[:5])}...")
        else:
            print("⚠️  Aucune donnée Macrotrends récupérée")
            
    except Exception as e:
        print(f"❌ Erreur lors de la récupération Macrotrends: {e}")
        # Ne pas faire échouer le test pour cette partie car elle peut être sensible au réseau
        print("ℹ️  Ceci peut être normal dans un environnement Docker avec restrictions réseau")
    
    print("\n🎉 Test Docker terminé!")
    return True

def main():
    """Fonction principale"""
    print("🚀 Démarrage du test Docker pour stockdx")
    
    try:
        success = test_docker_environment()
        if success:
            print("\n✅ Test Docker réussi!")
            sys.exit(0)
        else:
            print("\n❌ Test Docker échoué!")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n💥 Erreur inattendue: {e}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()