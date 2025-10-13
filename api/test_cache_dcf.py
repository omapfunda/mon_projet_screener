#!/usr/bin/env python3
"""
Test du système de cache pour l'analyse DCF
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fmp_analysis import get_dcf_analysis
from database import cache_manager
import time

def test_dcf_cache():
    """Test du cache pour l'analyse DCF"""
    print("🧪 Test du système de cache DCF")
    print("=" * 50)
    
    # Ticker de test (utilisons un ticker populaire)
    ticker = "AAPL"
    
    # Vider le cache pour ce ticker
    cache_key_pattern = f"get_dcf_analysis:{ticker}*"
    cache_manager.clear_pattern(cache_key_pattern)
    print(f"✅ Cache vidé pour {ticker}")
    
    # Premier appel (devrait aller chercher les données)
    print(f"\n🔄 Premier appel pour {ticker}...")
    start_time = time.time()
    result1 = get_dcf_analysis(ticker)
    end_time = time.time()
    duration1 = end_time - start_time
    
    print(f"⏱️  Durée du premier appel: {duration1:.2f}s")
    print(f"✅ Succès: {result1.get('success', False)}")
    if not result1.get('success'):
        print(f"❌ Erreur: {result1.get('error', 'Inconnue')}")
        return False
    
    # Deuxième appel (devrait utiliser le cache)
    print(f"\n🔄 Deuxième appel pour {ticker} (devrait utiliser le cache)...")
    start_time = time.time()
    result2 = get_dcf_analysis(ticker)
    end_time = time.time()
    duration2 = end_time - start_time
    
    print(f"⏱️  Durée du deuxième appel: {duration2:.2f}s")
    print(f"✅ Succès: {result2.get('success', False)}")
    
    # Vérification que le cache a fonctionné
    if duration2 < duration1 * 0.1:  # Le cache devrait être au moins 10x plus rapide
        print("🎉 Cache fonctionne correctement!")
        return True
    else:
        print("⚠️  Le cache ne semble pas fonctionner (pas d'amélioration significative)")
        return False

def test_cache_manager():
    """Test du gestionnaire de cache"""
    print("\n🧪 Test du gestionnaire de cache")
    print("=" * 50)
    
    # Test simple
    test_key = "test_key"
    test_value = {"test": "data", "number": 42}
    
    # Set
    cache_manager.set(test_key, test_value)
    print("✅ Valeur mise en cache")
    
    # Get
    retrieved_value = cache_manager.get(test_key)
    print(f"✅ Valeur récupérée: {retrieved_value}")
    
    # Vérification
    if retrieved_value == test_value:
        print("🎉 Cache manager fonctionne correctement!")
        return True
    else:
        print("❌ Problème avec le cache manager")
        return False

if __name__ == "__main__":
    print("🚀 Démarrage des tests de cache")
    
    # Test du cache manager
    cache_ok = test_cache_manager()
    
    if cache_ok:
        # Test du cache DCF
        dcf_cache_ok = test_dcf_cache()
        
        if dcf_cache_ok:
            print("\n🎉 Tous les tests de cache ont réussi!")
        else:
            print("\n⚠️  Le cache DCF ne fonctionne pas comme attendu")
    else:
        print("\n❌ Problème avec le gestionnaire de cache de base")