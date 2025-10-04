# main.py
# Fichier : backend/app/main.py

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import analysis  # Yahoo Finance for screening
import fmp_analysis  # FMP for DCF
import schemas

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
    results = analysis.perform_screening(request.index_name, request.dict())
    if not results:
        raise HTTPException(status_code=404, detail="Aucun résultat trouvé pour les critères donnés.")
    return {"results": results}

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