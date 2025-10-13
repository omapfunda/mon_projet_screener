#!/usr/bin/env python3
"""
Test spécifique pour valider l'analyse DCF sur Render
"""

import sys
import os
import time
import traceback
from datetime import datetime

# Ajouter le répertoire courant au path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_render_dcf():
    """Test complet de l'analyse DCF pour Render"""
    print("🚀 TEST ANALYSE DCF POUR RENDER")
    print("=" * 60)
    print(f"📅 Timestamp: {datetime.now()}")
    
    # Test 1: Vérification de l'environnement
    print("\n🔧 VÉRIFICATION ENVIRONNEMENT:")
    env_vars = ['REDIS_URL', 'DATABASE_PATH', 'CACHE_TTL']
    for var in env_vars:
        value = os.getenv(var, 'NON DÉFINIE')
        print(f"   {var}: {value}")
    
    # Test 2: Import des modules
    print("\n📦 TEST IMPORTS:")
    try:
        from database import CacheManager, cache_manager
        print("   ✅ database.py importé")
        
        from fmp_analysis import get_dcf_analysis
        print("   ✅ fmp_analysis.py importé")
        
    except Exception as e:
        print(f"   ❌ Erreur import: {e}")
        traceback.print_exc()
        return False
    
    # Test 3: Test du cache manager
    print("\n🗄️  TEST CACHE MANAGER:")
    try:
        # Test simple du cache
        test_key = "render_test_key"
        test_data = {"test": "render_data", "timestamp": str(datetime.now())}
        
        cache_manager.set(test_key, test_data, ttl=300)
        print("   ✅ Cache set réussi")
        
        retrieved_data = cache_manager.get(test_key)
        if retrieved_data and retrieved_data.get("test") == "render_data":
            print("   ✅ Cache get réussi")
        else:
            print(f"   ⚠️  Cache get problématique: {retrieved_data}")
            
    except Exception as e:
        print(f"   ❌ Erreur cache: {e}")
        traceback.print_exc()
    
    # Test 4: Test DCF avec différents tickers
    test_tickers = ["AAPL", "MSFT", "GOOGL"]
    
    for ticker in test_tickers:
        print(f"\n📊 TEST DCF - {ticker}:")
        try:
            start_time = time.time()
            result = get_dcf_analysis(ticker)
            end_time = time.time()
            duration = end_time - start_time
            
            print(f"   ⏱️  Durée: {duration:.2f}s")
            
            if result.get('success'):
                print(f"   ✅ Succès pour {ticker}")
                scenario1 = result.get('scenario1', {})
                intrinsic_value = scenario1.get('intrinsic_value', 'N/A')
                print(f"   💰 Valeur intrinsèque: {intrinsic_value}")
                
                # Test du cache (deuxième appel)
                print(f"   🔄 Test cache (2ème appel)...")
                start_time2 = time.time()
                result2 = get_dcf_analysis(ticker)
                end_time2 = time.time()
                duration2 = end_time2 - start_time2
                
                print(f"   ⏱️  Durée 2ème appel: {duration2:.2f}s")
                
                if duration2 < duration * 0.5:  # Le cache devrait être plus rapide
                    print(f"   🎉 Cache fonctionne pour {ticker}!")
                else:
                    print(f"   ⚠️  Cache ne semble pas actif pour {ticker}")
                
                break  # Si un ticker fonctionne, on s'arrête là
                
            else:
                error_msg = result.get('error', 'Erreur inconnue')
                print(f"   ❌ Échec pour {ticker}: {error_msg}")
                
                # Si c'est un problème de rate limiting, on continue avec le suivant
                if "rate limit" in error_msg.lower():
                    print(f"   🔄 Rate limiting détecté, test du ticker suivant...")
                    continue
                else:
                    print(f"   ⚠️  Erreur non liée au rate limiting")
                    
        except Exception as e:
            print(f"   ❌ Exception pour {ticker}: {e}")
            traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("🏁 TEST RENDER DCF TERMINÉ")
    print("=" * 60)

if __name__ == "__main__":
    test_render_dcf()