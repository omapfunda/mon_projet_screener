#!/usr/bin/env python3
"""Test de la nouvelle implémentation Russell 2000 via IWM ETF"""

from analysis import get_russell_2000_symbols
from database import db_manager

def test_russell_2000():
    print("=== Test Russell 2000 via IWM ETF (sans cache) ===")
    
    # Effacer le cache pour forcer une nouvelle récupération
    try:
        db_manager.clear_index_cache('Russell 2000 (USA)')
        print("Cache effacé pour Russell 2000 (USA)")
    except Exception as e:
        print(f"Erreur lors de l'effacement du cache: {e}")
    
    try:
        symbols = get_russell_2000_symbols()
        
        print(f"Nombre de symboles récupérés: {len(symbols)}")
        
        if symbols:
            print(f"Premiers 10 symboles: {symbols[:10]}")
            print(f"Derniers 5 symboles: {symbols[-5:]}")
            print("✅ Test réussi - Symboles Russell 2000 récupérés avec succès!")
        else:
            print("❌ Test échoué - Aucun symbole récupéré")
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_russell_2000()