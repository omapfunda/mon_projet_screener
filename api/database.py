# database.py - Configuration et modèles de base de données
import sqlite3
import json
import redis
import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from contextlib import contextmanager
import logging

# Configuration
DATABASE_PATH = os.getenv("DATABASE_PATH", "screener.db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
CACHE_TTL = int(os.getenv("CACHE_TTL", "3600"))  # 1 heure par défaut

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    """Gestionnaire de base de données SQLite pour la persistance"""
    
    def __init__(self, db_path: str = DATABASE_PATH):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialise la base de données avec les tables nécessaires"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Table des screenings
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS screenings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    index_name TEXT NOT NULL,
                    criteria TEXT NOT NULL,  -- JSON des critères
                    results TEXT NOT NULL,   -- JSON des résultats
                    total_results INTEGER,
                    execution_time REAL
                )
            """)
            
            # Table des données financières en cache
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS financial_cache (
                    ticker TEXT PRIMARY KEY,
                    data TEXT NOT NULL,      -- JSON des données
                    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                    source TEXT NOT NULL    -- 'yahoo' ou 'fmp'
                )
            """)
            
            # Table des indices et symboles
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS index_symbols (
                    index_name TEXT PRIMARY KEY,
                    symbols TEXT NOT NULL,   -- JSON array des symboles
                    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Table des watchlists utilisateur (future extension)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS watchlists (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT DEFAULT 'default',
                    ticker TEXT NOT NULL,
                    added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT
                )
            """)
            
            conn.commit()
            logger.info("Base de données initialisée avec succès")
    
    @contextmanager
    def get_connection(self):
        """Context manager pour les connexions SQLite"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Pour accès par nom de colonne
        try:
            yield conn
        finally:
            conn.close()
    
    def save_screening_result(self, index_name: str, criteria: dict, 
                            results: list, execution_time: float) -> int:
        """Sauvegarde un résultat de screening"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO screenings (index_name, criteria, results, total_results, execution_time)
                VALUES (?, ?, ?, ?, ?)
            """, (
                index_name,
                json.dumps(criteria),
                json.dumps(results),
                len(results),
                execution_time
            ))
            conn.commit()
            return cursor.lastrowid
    
    def get_screening_history(self, limit: int = 50) -> List[Dict]:
        """Récupère l'historique des screenings"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, timestamp, index_name, criteria, total_results, execution_time
                FROM screenings
                ORDER BY timestamp DESC
                LIMIT ?
            """, (limit,))
            
            return [dict(row) for row in cursor.fetchall()]
    
    def delete_screening(self, screening_id: int) -> bool:
        """Supprime un screening de l'historique"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                DELETE FROM screenings WHERE id = ?
            """, (screening_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    def cache_financial_data(self, ticker: str, data: dict, source: str):
        """Met en cache les données financières"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO financial_cache (ticker, data, source, last_updated)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            """, (ticker, json.dumps(data), source))
            conn.commit()
    
    def get_cached_financial_data(self, ticker: str, max_age_hours: int = 24) -> Optional[Dict]:
        """Récupère les données financières en cache si elles sont récentes"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT data, last_updated FROM financial_cache
                WHERE ticker = ? AND last_updated > datetime('now', '-{} hours')
            """.format(max_age_hours), (ticker,))
            
            row = cursor.fetchone()
            if row:
                return json.loads(row['data'])
            return None
    
    def cache_index_symbols(self, index_name: str, symbols: List[str]):
        """Met en cache les symboles d'un indice"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO index_symbols (index_name, symbols, last_updated)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            """, (index_name, json.dumps(symbols)))
            conn.commit()
    
    def get_cached_index_symbols(self, index_name: str, max_age_hours: int = 24) -> Optional[List[str]]:
        """Récupère les symboles d'un indice en cache si ils sont récents"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT symbols FROM index_symbols
                WHERE index_name = ? AND last_updated > datetime('now', '-{} hours')
            """.format(max_age_hours), (index_name,))
            
            row = cursor.fetchone()
            if row:
                return json.loads(row['symbols'])
            return None

    def add_to_watchlist(self, user_id: str, ticker: str, notes: Optional[str] = None) -> int:
        """Ajoute un ticker à la watchlist d'un utilisateur"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO watchlists (user_id, ticker, notes)
                VALUES (?, ?, ?)
            """, (user_id, ticker, notes))
            conn.commit()
            return cursor.lastrowid

    def remove_from_watchlist(self, watchlist_id: int) -> bool:
        """Supprime un élément de la watchlist par son ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM watchlists WHERE id = ?", (watchlist_id,))
            conn.commit()
            return cursor.rowcount > 0

    def get_watchlist(self, user_id: str) -> List[Dict]:
        """Récupère la watchlist d'un utilisateur"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, ticker, added_date, notes
                FROM watchlists
                WHERE user_id = ?
                ORDER BY added_date DESC
            """, (user_id,))
            return [dict(row) for row in cursor.fetchall()]

    def is_in_watchlist(self, user_id: str, ticker: str) -> bool:
        """Vérifie si un ticker est déjà dans la watchlist de l'utilisateur"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM watchlists WHERE user_id = ? AND ticker = ?", (user_id, ticker))
            return cursor.fetchone() is not None

class CacheManager:
    """Gestionnaire de cache Redis pour les données temporaires"""
    
    def __init__(self, redis_url: str = REDIS_URL):
        self.redis_client = None
        self._memory_cache = {}
        self._redis_available = False
        
        # Tentative de connexion Redis avec timeout plus court
        try:
            if redis_url and redis_url != "redis://localhost:6379":
                # Seulement si une URL Redis réelle est fournie
                self.redis_client = redis.from_url(
                    redis_url, 
                    decode_responses=True,
                    socket_timeout=5,
                    socket_connect_timeout=5,
                    retry_on_timeout=False
                )
                self.redis_client.ping()  # Test de connexion
                self._redis_available = True
                logger.info(f"✅ Connexion Redis établie: {redis_url}")
            else:
                logger.info("🔄 Redis URL par défaut détectée, utilisation du cache mémoire")
        except Exception as e:
            logger.warning(f"⚠️  Redis non disponible ({e}), utilisation du cache en mémoire")
            self.redis_client = None
            self._redis_available = False
    
    def set(self, key: str, value: Any, ttl: int = CACHE_TTL):
        """Met une valeur en cache"""
        try:
            if self._redis_available and self.redis_client:
                try:
                    self.redis_client.setex(key, ttl, json.dumps(value))
                    return
                except Exception as redis_error:
                    logger.warning(f"⚠️  Redis set failed, falling back to memory: {redis_error}")
                    self._redis_available = False
            
            # Fallback vers cache mémoire
            self._memory_cache[key] = {
                'value': value,
                'expires': datetime.now() + timedelta(seconds=ttl)
            }
            
        except Exception as e:
            logger.error(f"❌ Erreur cache set: {e}")
    
    def get(self, key: str) -> Optional[Any]:
        """Récupère une valeur du cache"""
        try:
            if self._redis_available and self.redis_client:
                try:
                    value = self.redis_client.get(key)
                    if value:
                        return json.loads(value)
                except Exception as redis_error:
                    logger.warning(f"⚠️  Redis get failed, falling back to memory: {redis_error}")
                    self._redis_available = False
            
            # Fallback vers cache mémoire
            cached = self._memory_cache.get(key)
            if cached and cached['expires'] > datetime.now():
                return cached['value']
            elif cached:
                del self._memory_cache[key]
            return None
            
        except Exception as e:
            logger.error(f"❌ Erreur cache get: {e}")
            return None
    
    def delete(self, key: str):
        """Supprime une clé du cache"""
        try:
            if self._redis_available and self.redis_client:
                try:
                    self.redis_client.delete(key)
                    return
                except Exception as redis_error:
                    logger.warning(f"⚠️  Redis delete failed, using memory: {redis_error}")
                    self._redis_available = False
            
            # Fallback vers cache mémoire
            self._memory_cache.pop(key, None)
            
        except Exception as e:
            logger.error(f"❌ Erreur cache delete: {e}")
    
    def clear_pattern(self, pattern: str):
        """Supprime toutes les clés correspondant au pattern"""
        try:
            if self.redis_client:
                keys = self.redis_client.keys(pattern)
                if keys:
                    self.redis_client.delete(*keys)
            else:
                # Pour le cache mémoire, on supprime les clés qui matchent
                keys_to_delete = [k for k in self._memory_cache.keys() if pattern.replace('*', '') in k]
                for key in keys_to_delete:
                    del self._memory_cache[key]
        except Exception as e:
            logger.error(f"Erreur cache clear_pattern: {e}")

# Instances globales
db_manager = DatabaseManager()
cache_manager = CacheManager()

# Fonctions utilitaires
def get_cache_key(prefix: str, *args) -> str:
    """Génère une clé de cache standardisée"""
    return f"{prefix}:" + ":".join(str(arg) for arg in args)

def cache_api_response(func):
    """Décorateur pour mettre en cache les réponses d'API"""
    def wrapper(*args, **kwargs):
        # Génère une clé de cache basée sur la fonction et ses arguments
        cache_key = get_cache_key(func.__name__, *args, *sorted(kwargs.items()))
        
        # Vérifie le cache
        cached_result = cache_manager.get(cache_key)
        if cached_result:
            logger.info(f"Cache hit pour {cache_key}")
            return cached_result
        
        # Exécute la fonction et met en cache
        result = func(*args, **kwargs)
        if result:  # Ne cache que les résultats valides
            cache_manager.set(cache_key, result)
            logger.info(f"Résultat mis en cache pour {cache_key}")
        
        return result
    return wrapper