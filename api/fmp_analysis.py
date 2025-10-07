import requests
import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv

# Chargement des variables d'environnement
load_dotenv()

# Récupération sécurisée de la clé API depuis les variables d'environnement
API_KEY = os.getenv("FINANCIAL_MODELING_PREP_API_KEY")
if not API_KEY:
    raise ValueError("FINANCIAL_MODELING_PREP_API_KEY non trouvée dans les variables d'environnement. Veuillez configurer votre fichier .env")

BASE_URL = "https://financialmodelingprep.com/api/v3"

INDEX_CONFIG = {
    "CAC 40": {"country": "france", "symbol": "^FCHI"},
    "S&P 500": {"country": "united states", "symbol": "^GSPC"},
    "NASDAQ": {"country": "united states", "symbol": "^IXIC"},
    "DAX": {"country": "germany", "symbol": "^GDAXI"},
    "AEX": {"country": "netherlands", "symbol": "^AEX"},
    "BEL 20": {"country": "belgium", "symbol": "^BFX"},
}

def perform_screening(index_name, criteria):
    # Placeholder: This function should be implemented to perform screening
    # based on the new FMP data source.
    print(f"Screening for index {index_name} with criteria {criteria}")
    return []

def get_financial_statements(ticker):
    """Fetches and returns the income statement, balance sheet, and cash flow statement for a given ticker."""
    try:
        income_statement = get_income_statement(ticker)
        balance_sheet = get_balance_sheet(ticker)
        cash_flow = get_cash_flow_statement(ticker)
        return {
            'income_statement': income_statement,
            'balance_sheet': balance_sheet,
            'cash_flow': cash_flow
        }
    except Exception as e:
        print(f"Error fetching financial statements for {ticker}: {e}")
        return None

def get_income_statement(ticker, limit=5):
    """
    Fetches the income statement for a given ticker from the FMP API.
    """
    url = f"{BASE_URL}/income-statement/{ticker}?limit={limit}&apikey={API_KEY}"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

def get_balance_sheet(ticker, limit=5):
    """
    Fetches the balance sheet for a given ticker from the FMP API.
    """
    url = f"{BASE_URL}/balance-sheet-statement/{ticker}?limit={limit}&apikey={API_KEY}"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

def get_cash_flow_statement(ticker, limit=5):
    """
    Fetches the cash flow statement for a given ticker from the FMP API.
    """
    url = f"{BASE_URL}/cash-flow-statement/{ticker}?limit={limit}&apikey={API_KEY}"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

def get_enterprise_value(ticker, limit=5):
    """
    Fetches the enterprise value for a given ticker from the FMP API.
    """
    url = f"{BASE_URL}/enterprise-values/{ticker}?limit={limit}&apikey={API_KEY}"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

def get_processed_financial_data(ticker):
    """
    Fetches raw data using the FMP API and processes it into the format
    required for the DCF valuation.
    """
    print(f"▶️  Récupération des données financières pour {ticker} via FMP API...")
    try:
        is_raw = get_income_statement(ticker, limit=5)
        bs_raw = get_balance_sheet(ticker, limit=5)
        cf_raw = get_cash_flow_statement(ticker, limit=5)
        ev_raw = get_enterprise_value(ticker, limit=5)
        
        if not all([is_raw, bs_raw, cf_raw, ev_raw]):
            raise ValueError(f"Impossible de récupérer les données financières pour {ticker}. L'API FMP n'a pas retourné de données.")
        
        print("✅ Données brutes récupérées.\n")
    except Exception as e:
        raise ValueError(f"Erreur de traitement des données pour {ticker} via FMP API: {e}")

    # --- Process Income Statement ---
    is_df = pd.DataFrame(is_raw)[['date', 'revenue', 'ebitda']].copy()
    is_df.rename(columns={'date': 'Year', 'revenue': 'Revenue', 'ebitda': 'EBITDA'}, inplace=True)
    is_df['Year'] = pd.to_datetime(is_df['Year']).dt.year
    is_df.set_index('Year', inplace=True)

    # --- Process Balance Sheet ---
    bs_df = pd.DataFrame(bs_raw)[['date', 'cashAndCashEquivalents', 'longTermDebt']].copy()
    bs_df['date'] = pd.to_datetime(bs_df['date']).dt.year
    latest_year = bs_df['date'].max()
    balance_sheet_latest = {
        'Cash': bs_df.loc[bs_df['date'] == latest_year, 'cashAndCashEquivalents'].iloc[0],
        'Total Long Term Debt': bs_df.loc[bs_df['date'] == latest_year, 'longTermDebt'].iloc[0]
    }

    # --- Process Cash Flow Statement ---
    cf_df = pd.DataFrame(cf_raw)[['date', 'operatingCashFlow', 'capitalExpenditure']].copy()
    cf_df.rename(columns={
        'date': 'Year',
        'operatingCashFlow': 'CFO',
        'capitalExpenditure': 'CapEx'
    }, inplace=True)
    cf_df['Year'] = pd.to_datetime(cf_df['Year']).dt.year
    cf_df['CapEx'] = cf_df['CapEx'].abs()
    cf_df['FCF'] = cf_df['CFO'] - cf_df['CapEx']
    cf_df.set_index('Year', inplace=True)

    # --- Get Shares Outstanding ---
    ev_df = pd.DataFrame(ev_raw)[['date', 'numberOfShares']].copy()
    ev_df['date'] = pd.to_datetime(ev_df['date']).dt.year
    shares_outstanding = ev_df.loc[ev_df['date'] == latest_year, 'numberOfShares'].iloc[0]
    
    # --- Add Shares Outstanding to is_df ---
    is_df['Shares Outstanding'] = shares_outstanding

    return is_df, cf_df, balance_sheet_latest, latest_year


def run_dcf_valuation(fcf_growth_rate, perpetual_growth_rate, base_fcf, total_debt, cash, shares_outstanding):
    WACC = 0.0863
    PROJECTION_YEARS = 5
    # Projection des Free Cash Flows futurs
    projected_fcf = [base_fcf * (1 + fcf_growth_rate)**i for i in range(1, PROJECTION_YEARS + 1)]

    # Actualisation des FCF
    discounted_fcf = [fcf / (1 + WACC)**(i + 1) for i, fcf in enumerate(projected_fcf)]
    pv_of_fcf = sum(discounted_fcf)

    # Calcul de la Valeur Terminale et actualisation
    final_fcf = projected_fcf[-1]
    terminal_value = (final_fcf * (1 + perpetual_growth_rate)) / (WACC - perpetual_growth_rate)
    pv_of_terminal_value = terminal_value / (1 + WACC)**PROJECTION_YEARS

    # Calcul de la valeur d'entreprise et de la valeur des capitaux propres
    enterprise_value = pv_of_fcf + pv_of_terminal_value
    equity_value = enterprise_value - total_debt + cash
    
    # Calcul de la valeur intrinsèque par action
    intrinsic_value_per_share = equity_value / shares_outstanding
    
    return intrinsic_value_per_share, enterprise_value, equity_value


# --- FONCTION PRINCIPALE D'ORCHESTRATION ---

def get_dcf_analysis(ticker):
    """Fonction principale pour obtenir l'analyse DCF d'un ticker donné."""
    try:
        # Étape 1 : Récupération et traitement des données financières
        is_df, cf_df, balance_sheet_latest, latest_year = get_processed_financial_data(ticker)
        
        base_fcf = cf_df.loc[latest_year, 'FCF']
        total_debt = balance_sheet_latest['Total Long Term Debt']
        cash = balance_sheet_latest['Cash']
        shares_outstanding = is_df.loc[latest_year, 'Shares Outstanding']
        
        base_data = {
            "latest_year": int(latest_year),
            "base_fcf": float(base_fcf),
            "total_debt": float(total_debt),
            "cash": float(cash),
            "shares_outstanding": int(shares_outstanding)
        }

        # Scénario 1: Prospectif
        fcf_growth_s1, perp_growth_s1 = 0.05, 0.025
        valeur_s1, enterprise_value_s1, equity_value_s1 = run_dcf_valuation(fcf_growth_s1, perp_growth_s1, base_fcf, total_debt, cash, shares_outstanding)
        scenario1 = {
            "assumptions": {"fcf_growth": fcf_growth_s1, "perp_growth": perp_growth_s1},
            "intrinsic_value": float(valeur_s1),
            "enterprise_value": float(enterprise_value_s1),
            "equity_value": float(equity_value_s1)
        }

        # Scénario 2: Historique
        num_years = len(cf_df) - 1
        start_fcf = cf_df['FCF'].iloc[0]
        fcf_growth_s2 = ((cf_df['FCF'].iloc[-1] / start_fcf)**(1 / num_years) - 1) if start_fcf > 0 else 0
        
        start_ebitda = is_df['EBITDA'].iloc[0]
        perp_growth_s2 = ((is_df['EBITDA'].iloc[-1] / start_ebitda)**(1 / num_years) - 1) if start_ebitda > 0 else 0
        perp_growth_s2 = min(perp_growth_s2, perp_growth_s1) # Safety cap
        
        valeur_s2, enterprise_value_s2, equity_value_s2 = run_dcf_valuation(fcf_growth_s2, perp_growth_s2, base_fcf, total_debt, cash, shares_outstanding)
        scenario2 = {
            "assumptions": {"fcf_growth": float(fcf_growth_s2), "perp_growth": float(perp_growth_s2)},
            "intrinsic_value": float(valeur_s2),
            "enterprise_value": float(enterprise_value_s2),
            "equity_value": float(equity_value_s2)
        }
        
        return {"base_data": base_data, "scenario1": scenario1, "scenario2": scenario2}
    except Exception as e:
        return {"error": str(e)}