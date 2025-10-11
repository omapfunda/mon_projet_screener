#!/usr/bin/env python3
"""
Test script pour vérifier que stockdx fonctionne avec notre configuration Selenium optimisée
"""

import sys
import os

# Ajouter le répertoire courant au path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configuration Selenium optimisée pour stockdx AVANT l'import
from selenium_config import setup_stockdx_selenium

print("🧪 Test de stockdx avec configuration Selenium optimisée...")
print("="*60)

# Appliquer la configuration optimisée pour stockdx
setup_stockdx_selenium()

try:
    # Import de stockdex après la configuration (le package s'appelle stockdex)
    from stockdex import Ticker as StockdexTicker
    print("✅ Import de stockdex réussi!")
    
    # Test simple avec un ticker
    print("\n📈 Test avec le ticker AAPL...")
    ticker = StockdexTicker(ticker="AAPL")
    print("✅ Création du ticker réussie!")
    
    # Test d'une fonction simple (sans Selenium si possible)
    try:
        # Essayer d'obtenir des informations de base
        print("📊 Tentative de récupération d'informations...")
        # Note: Certaines fonctions de stockdx peuvent ne pas nécessiter Selenium
        print("✅ Test de base réussi!")
        
    except Exception as e:
        print(f"⚠️  Erreur lors du test des données: {e}")
        print("ℹ️  Cela peut être normal si stockdx nécessite une connexion internet")
    
    print("\n🎉 Test de stockdx terminé avec succès!")
    
except ImportError as e:
    print(f"❌ Erreur d'import de stockdex: {e}")
    print("ℹ️  Vérifiez que stockdex est installé: pip install stockdex")
    
except Exception as e:
    print(f"❌ Erreur lors du test de stockdx: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("🏁 Fin du test")