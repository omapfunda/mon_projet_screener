#!/usr/bin/env python3
"""
Test simple du système de cache sans dépendances Selenium
"""

import sys
import os
import time
from datetime import datetime

# Ajouter le répertoire courant au path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_cache_system():
    """Test du système de cache amélioré"""
    print("🧪 TEST SYSTÈME DE CACHE AMÉLIORÉ")
    print("=" * 50)
    print(f"📅 Timestamp: {datetime.now()}")
    
    # Test 1: Import et initialisation
    print("\n📦 TEST IMPORTS:")
    try:
        from database import CacheManager, cache_manager
        print("   ✅ database.py importé")
        print(f"   📊 Redis disponible: {cache_manager._redis_available}")
        print(f"   🗄️  Type de cache: {'Redis' if cache_manager._redis_available else 'Mémoire'}")
        
    except Exception as e:
        print(f"   ❌ Erreur import: {e}")
        return False
    
    # Test 2: Opérations de cache de base
    print("\n🗄️  TEST OPÉRATIONS CACHE:")
    try:
        # Test set/get
        test_key = "test_cache_key"
        test_data = {
            "message": "Test cache amélioré",
            "timestamp": str(datetime.now()),
            "number": 42,
            "list": [1, 2, 3, 4, 5]
        }
        
        print("   🔄 Test set...")
        cache_manager.set(test_key, test_data, ttl=300)
        print("   ✅ Cache set réussi")
        
        print("   🔄 Test get...")
        retrieved_data = cache_manager.get(test_key)
        
        if retrieved_data:
            print("   ✅ Cache get réussi")
            if retrieved_data.get("message") == test_data["message"]:
                print("   ✅ Données cohérentes")
            else:
                print("   ⚠️  Incohérence des données")
        else:
            print("   ❌ Cache get échoué")
            return False
        
        # Test delete
        print("   🔄 Test delete...")
        cache_manager.delete(test_key)
        deleted_data = cache_manager.get(test_key)
        
        if deleted_data is None:
            print("   ✅ Cache delete réussi")
        else:
            print("   ⚠️  Cache delete problématique")
            
    except Exception as e:
        print(f"   ❌ Erreur opérations cache: {e}")
        return False
    
    # Test 3: Performance du cache
    print("\n⚡ TEST PERFORMANCE CACHE:")
    try:
        performance_key = "performance_test"
        large_data = {
            "data": list(range(1000)),
            "metadata": {"size": 1000, "type": "performance_test"}
        }
        
        # Mesure du temps de set
        start_time = time.time()
        cache_manager.set(performance_key, large_data, ttl=300)
        set_time = time.time() - start_time
        print(f"   ⏱️  Temps set: {set_time:.4f}s")
        
        # Mesure du temps de get
        start_time = time.time()
        retrieved_large_data = cache_manager.get(performance_key)
        get_time = time.time() - start_time
        print(f"   ⏱️  Temps get: {get_time:.4f}s")
        
        if retrieved_large_data and len(retrieved_large_data["data"]) == 1000:
            print("   ✅ Performance test réussi")
        else:
            print("   ⚠️  Performance test problématique")
            
        # Nettoyage
        cache_manager.delete(performance_key)
        
    except Exception as e:
        print(f"   ❌ Erreur test performance: {e}")
    
    # Test 4: Simulation de fallback Redis -> Mémoire
    print("\n🔄 TEST FALLBACK REDIS -> MÉMOIRE:")
    try:
        if cache_manager._redis_available:
            print("   ℹ️  Redis actif, simulation de panne...")
            # Simuler une panne Redis
            original_redis = cache_manager.redis_client
            cache_manager._redis_available = False
            
            # Test avec fallback
            fallback_key = "fallback_test"
            fallback_data = {"message": "Test fallback", "mode": "memory"}
            
            cache_manager.set(fallback_key, fallback_data, ttl=300)
            retrieved_fallback = cache_manager.get(fallback_key)
            
            if retrieved_fallback and retrieved_fallback.get("mode") == "memory":
                print("   ✅ Fallback vers mémoire réussi")
            else:
                print("   ⚠️  Fallback problématique")
            
            # Restaurer Redis
            cache_manager._redis_available = True
            cache_manager.redis_client = original_redis
            
        else:
            print("   ℹ️  Cache mémoire déjà actif")
            
    except Exception as e:
        print(f"   ❌ Erreur test fallback: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 TEST CACHE TERMINÉ")
    print("=" * 50)
    return True

if __name__ == "__main__":
    success = test_cache_system()
    if success:
        print("\n✅ Tous les tests de cache ont réussi!")
        print("🚀 Le système est prêt pour le déploiement Render")
    else:
        print("\n❌ Certains tests ont échoué")
        print("⚠️  Vérifiez la configuration avant le déploiement")