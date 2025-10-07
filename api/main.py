# main.py
# Fichier : backend/app/main.py

import os
import json
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
import analysis  # Yahoo Finance for screening
import fmp_analysis  # FMP for DCF
import schemas
from database import db_manager, cache_manager

# Création de l'instance FastAPI
app = FastAPI(
    title="Value Investing Screener API",
    description="API pour screener des actions et analyser leurs données financières.",
    version="1.0.0"
)

# Configuration du CORS (Cross-Origin Resource Sharing)
# Utilise les variables d'environnement pour plus de flexibilité
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    FRONTEND_URL,
]

# Ajouter les domaines Render automatiquement
if FRONTEND_URL and "onrender.com" in FRONTEND_URL:
    ALLOWED_ORIGINS.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gestionnaire d'erreurs global pour les erreurs de validation
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Gestionnaire personnalisé pour les erreurs de validation Pydantic"""
    error_details = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        message = error["msg"]
        error_details.append(f"{field}: {message}")
    
    return JSONResponse(
        status_code=422,
        content={
            "error": "Erreur de validation des données",
            "details": error_details,
            "message": "Veuillez vérifier les valeurs saisies et réessayer."
        }
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Gestionnaire pour les erreurs de valeur personnalisées"""
    return JSONResponse(
        status_code=400,
        content={
            "error": "Valeur invalide",
            "message": str(exc)
        }
    )


@app.get("/", tags=["Status"])
def read_root():
    """Endpoint racine pour vérifier que l'API est en ligne."""
    return {"status": "ok", "message": "Welcome to the Value Screener API!"}

@app.get("/indices", tags=["Screening"])
def get_available_indices():
    """Retourne la liste des indices boursiers disponibles pour l'analyse."""
    return {"indices": list(analysis.INDEX_CONFIG.keys())}

@app.post("/screening", tags=["Screening"])
def run_screening(request: schemas.ScreeningRequest):
    """
    Lance le processus de screening basé sur les critères fournis.
    C'est le principal endpoint de l'Étape 1.
    """
    try:
        # Validation supplémentaire côté serveur
        criteria = request.dict()
        
        # Log de sécurité (sans données sensibles)
        print(f"🔍 Screening demandé pour l'indice: {request.index_name}")
        
        # Exécution du screening
        results = analysis.perform_screening(request.index_name, criteria)
        
        if not results:
            raise HTTPException(
                status_code=404, 
                detail="Aucun résultat trouvé pour les critères donnés. Essayez d'assouplir vos critères."
            )
        
        # Log du succès
        print(f"✅ Screening terminé: {len(results)} résultats trouvés")
        
        return {"results": results}
        
    except HTTPException:
        # Re-lever les HTTPException sans modification
        raise
    except Exception as e:
        # Gestion des erreurs inattendues
        print(f"❌ Erreur lors du screening: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erreur interne lors du screening: {str(e)}"
        )

# Dans backend/app/main.py, ajoutez cet endpoint :

@app.get("/dcf-valuation/{ticker}", tags=["Analysis"])
def get_dcf_valuation(ticker: str):
    """
    Lance une analyse DCF à 2 scénarios basée sur les données de FMP.
    C'est le nouvel endpoint pour l'Étape 2.
    """
    valuation_results = fmp_analysis.get_dcf_analysis(ticker)
    if "error" in valuation_results:
        raise HTTPException(status_code=404, detail=f"L'analyse DCF a échoué pour {ticker}: {valuation_results['error']}")
    
    # Transform data to match frontend expectations
    transformed_data = {
        "base_data": valuation_results.get("base_data", {}),
        "optimistic_scenario": {
            "fair_value": valuation_results.get("scenario1", {}).get("intrinsic_value"),
            "revenue_growth_rate": valuation_results.get("scenario1", {}).get("assumptions", {}).get("fcf_growth"),
            "wacc": 0.10,  # Default WACC value
            "terminal_growth_rate": valuation_results.get("scenario1", {}).get("assumptions", {}).get("perp_growth")
        },
        "conservative_scenario": {
            "fair_value": valuation_results.get("scenario2", {}).get("intrinsic_value"),
            "revenue_growth_rate": valuation_results.get("scenario2", {}).get("assumptions", {}).get("fcf_growth"),
            "wacc": 0.10,  # Default WACC value
            "terminal_growth_rate": valuation_results.get("scenario2", {}).get("assumptions", {}).get("perp_growth")
        }
    }
    
    return transformed_data
    
@app.get("/financials/{ticker}", tags=["Analysis"])
def get_stock_financials(ticker: str):
    """
    Récupère les états financiers détaillés pour un ticker donné.
    C'est l'endpoint pour l'Étape 2.
    """
    financial_data = fmp_analysis.get_financial_statements(ticker)
    if not financial_data:
        raise HTTPException(status_code=404, detail=f"Données financières non trouvées pour le ticker {ticker}.")
    return financial_data

@app.get("/screening/history", tags=["Screening"])
def get_screening_history(limit: int = 20):
    """
    Récupère l'historique des screenings précédents.
    Permet de voir les analyses passées et leurs résultats.
    """
    try:
        history = db_manager.get_screening_history(limit=limit)
        
        # Transformer les données pour l'affichage
        formatted_history = []
        for record in history:
            formatted_record = {
                "id": record["id"],
                "timestamp": record["timestamp"],
                "index_name": record["index_name"],
                "criteria": record["criteria"] if isinstance(record["criteria"], dict) else eval(record["criteria"]),
                "total_results": record["total_results"],
                "execution_time": record["execution_time"]
            }
            formatted_history.append(formatted_record)
        
        return {
            "history": formatted_history,
            "total_records": len(formatted_history)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération de l'historique: {str(e)}")

@app.get("/screening/history/{screening_id}", tags=["Screening"])
def get_screening_details(screening_id: int):
    """
    Récupère les détails complets d'un screening spécifique.
    Inclut tous les résultats et critères utilisés.
    """
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM screenings WHERE id = ?
            """, (screening_id,))
            
            record = cursor.fetchone()
            if not record:
                raise HTTPException(status_code=404, detail=f"Screening {screening_id} non trouvé")
            
            return {
                "id": record["id"],
                "timestamp": record["timestamp"],
                "index_name": record["index_name"],
                "criteria": json.loads(record["criteria"]) if isinstance(record["criteria"], str) else record["criteria"],
                "results": json.loads(record["results"]) if isinstance(record["results"], str) else record["results"],
                "total_results": record["total_results"],
                "execution_time": record["execution_time"]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération du screening: {str(e)}")

@app.delete("/cache/clear", tags=["Cache"])
def clear_cache():
    """
    Vide le cache Redis et les données temporaires.
    Utile pour forcer le rechargement des données.
    """
    try:
        cache_manager.clear_pattern("*")
        return {"message": "Cache vidé avec succès"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du vidage du cache: {str(e)}")

@app.get("/cache/stats", tags=["Cache"])
def get_cache_stats():
    """
    Retourne des statistiques sur le cache et la base de données.
    """
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Statistiques des screenings
            cursor.execute("SELECT COUNT(*) as total FROM screenings")
            total_screenings = cursor.fetchone()["total"]
            
            # Statistiques du cache financier
            cursor.execute("SELECT COUNT(*) as total FROM financial_cache")
            cached_tickers = cursor.fetchone()["total"]
            
            # Statistiques des indices
            cursor.execute("SELECT COUNT(*) as total FROM index_symbols")
            cached_indices = cursor.fetchone()["total"]
            
            return {
                "database_stats": {
                    "total_screenings": total_screenings,
                    "cache_entries": cached_tickers,
                    "cached_indices": cached_indices
                },
                "cache_type": "Redis disponible" if hasattr(cache_manager, 'redis_client') and cache_manager.redis_client else "Cache memoire"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des statistiques: {str(e)}")