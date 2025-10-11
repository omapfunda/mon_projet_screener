#!/usr/bin/env python3
"""
Test script pour vérifier que stockdex fonctionne avec Selenium et notre configuration optimisée
"""

import sys
import os

# Ajouter le répertoire courant au path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configuration Selenium optimisée pour stockdex AVANT l'import
from selenium_config import setup_stockdx_selenium

print("🧪 Test de stockdex avec Selenium et configuration optimisée...")
print("="*60)

# Appliquer la configuration optimisée pour stockdex
setup_stockdx_selenium()

try:
    # Import de stockdex après la configuration
    from stockdex import Ticker as StockdexTicker
    print("✅ Import de stockdex réussi!")
    
    # Test avec un ticker
    print("\n📈 Test avec le ticker AAPL...")
    ticker = StockdexTicker(ticker="AAPL")
    print("✅ Création du ticker réussie!")
    
    # Test d'une fonction qui utilise Selenium (Macrotrends)
    try:
        print("🌐 Test de récupération de données Macrotrends (utilise Selenium)...")
        
        # Essayer d'obtenir des données financières de Macrotrends
        # Cette fonction utilise Selenium en arrière-plan
        income_statement = ticker.macrotrends_income_statement()
        
        if income_statement is not None and not income_statement.empty:
            print("✅ Données Macrotrends récupérées avec succès!")
            print(f"📊 Taille des données: {income_statement.shape}")
            print(f"📅 Colonnes disponibles: {list(income_statement.columns[:5])}...")
        else:
            print("⚠️  Données Macrotrends vides (peut être normal)")
            
    except Exception as e:
        print(f"⚠️  Erreur lors du test Macrotrends: {e}")
        print("ℹ️  Cela peut être normal si le site est inaccessible ou si les options sont trop restrictives")
    
    # Test d'une autre fonction Selenium si disponible
    try:
        print("\n🔍 Test de récupération du bilan (balance sheet)...")
        balance_sheet = ticker.macrotrends_balance_sheet()
        
        if balance_sheet is not None and not balance_sheet.empty:
            print("✅ Bilan récupéré avec succès!")
            print(f"📊 Taille des données: {balance_sheet.shape}")
        else:
            print("⚠️  Bilan vide (peut être normal)")
            
    except Exception as e:
        print(f"⚠️  Erreur lors du test du bilan: {e}")
    
    print("\n🎉 Test de stockdex avec Selenium terminé!")
    
except ImportError as e:
    print(f"❌ Erreur d'import de stockdex: {e}")
    print("ℹ️  Vérifiez que stockdex est installé: pip install stockdex")
    
except Exception as e:
    print(f"❌ Erreur lors du test de stockdex: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("🏁 Fin du test Selenium")