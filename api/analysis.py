# Fichier : backend/app/analysis.py (Version Complète Mise à Jour)

import yfinance as yf
import pandas as pd
import numpy as np
from stockdex import Ticker as StockdexTicker
import requests

# --- Configurations ---
INDEX_CONFIG = {
    'CAC 40 (France)': { 'url': 'https://en.wikipedia.org/wiki/CAC_40', 'table_index': 4, 'ticker_col': 'Ticker', 'suffix': '.PA' },
    'S&P 500 (USA)': { 'url': 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies', 'table_index': 0, 'ticker_col': 'Symbol', 'suffix': '' },
    'NASDAQ 100 (USA)': { 'url': 'https://en.wikipedia.org/wiki/Nasdaq-100', 'table_index': 4, 'ticker_col': 'Ticker', 'suffix': '' },
    'DAX (Germany)': { 'url': 'https://en.wikipedia.org/wiki/DAX', 'table_index': 4, 'ticker_col': 'Ticker', 'suffix': '.DE' },
    'Dow Jones (USA)': { 'url': 'https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average', 'table_index': 1, 'ticker_col': 'Ticker', 'suffix': '' }
}

def get_index_symbols(index_name: str) -> list:
    """Récupère les symboles pour un indice donné de manière robuste avec un logging d'erreur."""
    if index_name not in INDEX_CONFIG:
        print(f"Erreur: L'indice '{index_name}' n'est pas dans INDEX_CONFIG.")
        return []
    
    config = INDEX_CONFIG[index_name]
    
    try:
        # Tente de lire les tables de la page Wikipedia
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(config['url'], headers=headers)
        response.raise_for_status()
        all_tables = pd.read_html(response.text)
        
        # Vérifie si l'index de la table est valide
        if config['table_index'] >= len(all_tables):
            print(f"Erreur: L'index de table {config['table_index']} est invalide pour {index_name}. Tables trouvées: {len(all_tables)}")
            return []
            
        df = all_tables[config['table_index']]

        # Vérifie si la colonne du ticker existe
        if config['ticker_col'] not in df.columns:
            print(f"Erreur: La colonne '{config['ticker_col']}' n'a pas été trouvée pour {index_name}. Colonnes disponibles: {list(df.columns)}")
            return []

        raw_tickers = df[config['ticker_col']].tolist()
        final_symbols = []
        for ticker in raw_tickers:
            t = str(ticker).split(' ')[0]
            if config['suffix'] == '':
                t = t.replace('.', '-', 1)
            
            if config['suffix'] and not t.endswith(config['suffix']):
                final_symbols.append(t + config['suffix'])
            else:
                final_symbols.append(t)
                
        return final_symbols
        
    except Exception as e:
        # Affiche l'erreur réelle dans le terminal du backend pour un débogage facile
        print(f"ERREUR CRITIQUE lors du scraping pour {index_name}: {e}")
        return []
# --- NOUVELLES FONCTIONS POUR LE DCF AVANCÉ ---

RISK_FREE_RATE_TICKER = "^TNX" # US 10-Year Treasury Note
MARKET_RETURN = 0.085 # Hypothèse de retour moyen du marché (S&P 500 historique)

# --- Fonction Principale d'Orchestration ---

def perform_screening(index_name: str, criteria: dict) -> list:
    """Orchestre le processus de screening complet."""
    symbols = get_index_symbols(index_name)
    if not symbols:
        return []
    
    all_results = []
    for symbol in symbols:
        data = get_stock_data(symbol)
        if data:
            result = calculate_value(data, criteria)
            if result:
                all_results.append(result)
    
    # Trier les résultats par score décroissant
    all_results.sort(key=lambda x: x['score'], reverse=True)
    return all_results



def get_stock_data(symbol: str) -> dict:
    """Récupère les données financières clés pour un symbole."""
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        if not info or 'symbol' not in info: return None
        
        current_price = info.get('currentPrice', info.get('regularMarketPreviousClose'))
        if not current_price: return None

        return {
            'symbol': info.get('symbol'), 'company_name': info.get('longName', 'N/A'),
            'currency': info.get('currency', 'USD'), 'current_price': current_price,
            'market_cap': info.get('marketCap', 0), 'pe_ratio': info.get('trailingPE'),
            'pb_ratio': info.get('priceToBook'), 'debt_to_equity': info.get('debtToEquity'),
            'roe': info.get('returnOnEquity'), 'dividend_yield': info.get('dividendYield', 0),
            'eps': info.get('trailingEps'), 'bvps': info.get('bookValue')
        }
    except Exception:
        return None

def get_financial_statements(ticker: str) -> dict:
    """Récupère les états financiers et les retourne sous forme de dictionnaires."""
    stock = yf.Ticker(ticker)
    try:
        financials = stock.financials.to_dict()
        balance_sheet = stock.balance_sheet.to_dict()
        cash_flow = stock.cashflow.to_dict()
        return {'financials': financials, 'balance_sheet': balance_sheet, 'cash_flow': cash_flow}
    except Exception:
        return None

# --- Fonctions de Calcul ---

def calculate_value(data: dict, criteria: dict) -> dict:
    """Calcule le score de valeur et la valeur intrinsèque."""
    if not data: return None
    score, max_score = 0, 0
    
    # ... (logique de notation) ...
    if data.get('pe_ratio') and data['pe_ratio'] > 0:
        max_score += 1
        if data['pe_ratio'] < criteria['pe_max']: score += 1
            
    value_score = (score / max_score * 100) if max_score > 0 else 0
    
    intrinsic_value = None
    eps, bvps = data.get('eps'), data.get('bvps')
    if eps and bvps and eps > 0 and bvps > 0:
        intrinsic_value = np.sqrt(22.5 * eps * bvps)
    
    return {**data, 'score': value_score, 'intrinsic_value': intrinsic_value}

                
def get_risk_free_rate():
    """Récupère le taux sans risque en temps réel (rendement du Trésor US 10 ans)."""
    try:
        tnx = yf.Ticker(RISK_FREE_RATE_TICKER)
        hist = tnx.history(period="5d")
        return hist['Close'].iloc[-1] / 100  # Le ticker donne le taux en % (ex: 4.5 pour 4.5%)
    except:
        return 0.04 # Valeur de secours

def get_metric(df, primary_name, fallbacks=[]):
    if df is None or df.empty: return None
    potential_names = [primary_name] + fallbacks
    for name in potential_names:
        if name in df.index: return df.loc[name]
    return None

def calculate_wacc(ticker_obj, risk_free_rate):
    """Calcule le WACC (Coût Moyen Pondéré du Capital) de manière dynamique."""
    info = ticker_obj.info
    financials = ticker_obj.financials
    balance_sheet = ticker_obj.balance_sheet

    # Coût des Fonds Propres (Re) via CAPM = Rf + Beta * (Rm - Rf)
    beta = info.get('beta', 1.0) # Si Beta n'est pas dispo, on suppose 1.0 (risque du marché)
    cost_of_equity = risk_free_rate + beta * (MARKET_RETURN - risk_free_rate)

    # Coût de la Dette (Rd)
    interest_expense = abs(get_metric(financials, 'Interest Expense', ['Interest Expense Non Operating'])[financials.columns[0]])
    total_debt = get_metric(balance_sheet, 'Total Debt')[balance_sheet.columns[0]]
    cost_of_debt = interest_expense / total_debt if total_debt and interest_expense else 0.05 # Taux de secours

    # Taux d'imposition effectif (Tc)
    income_before_tax = get_metric(financials, 'Pretax Income', ['EBT'])[financials.columns[0]]
    tax_expense = get_metric(financials, 'Tax Provision', ['Tax Rate For Calcs'])[financials.columns[0]]
    tax_rate = tax_expense / income_before_tax if income_before_tax and tax_expense and income_before_tax > 0 else 0.21 # Taux de secours

    # Pondérations
    market_cap = info['marketCap']
    equity_weight = market_cap / (market_cap + total_debt)
    debt_weight = total_debt / (market_cap + total_debt)

    # Formule du WACC
    wacc = (equity_weight * cost_of_equity) + (debt_weight * cost_of_debt * (1 - tax_rate))
    
    return {
        "wacc": wacc, "cost_of_equity": cost_of_equity, "cost_of_debt": cost_of_debt,
        "tax_rate": tax_rate, "beta": beta
    }


def calculate_advanced_dcf(ticker_obj) -> dict:
    """Calcule la valeur intrinsèque via un modèle DCF avancé à 2 phases."""
    try:
        info = ticker_obj.info
        cash_flow = ticker_obj.cashflow
        
        # --- Étape 1: Calculer le WACC et le taux sans risque ---
        risk_free_rate = get_risk_free_rate()
        wacc_data = calculate_wacc(ticker_obj, risk_free_rate)
        discount_rate = wacc_data["wacc"]

        # --- Étape 2: Définir les taux de croissance ---
        perpetual_growth_rate = 0.025
        short_term_growth = info.get('revenueGrowth', 0.05) # Estimation à court terme
        if not short_term_growth or short_term_growth < 0: short_term_growth = 0.05
        
        growth_rates = []
        # Phase 1: 5 ans de croissance élevée
        for i in range(5):
            growth_rates.append(short_term_growth)
        # Phase 2: 5 ans de déclin linéaire vers la croissance perpétuelle
        for i in range(5):
            growth = short_term_growth - (short_term_growth - perpetual_growth_rate) * ((i + 1) / 5)
            growth_rates.append(growth)

        # --- Étape 3: Projeter les Free Cash Flows (FCF) sur 10 ans ---
        op_cash_flow = get_metric(cash_flow, 'Operating Cash Flow', ['Total Cash From Operating Activities'])
        cap_ex = get_metric(cash_flow, 'Capital Expenditures', ['Capital Expenditure'])
        if op_cash_flow is None or cap_ex is None: raise ValueError("FCF non calculable.")
        
        last_fcf = op_cash_flow[cash_flow.columns[0]] + cap_ex[cash_flow.columns[0]]
        
        future_fcf = []
        for year in range(10):
            last_fcf *= (1 + growth_rates[year])
            future_fcf.append(last_fcf)

        # --- Étape 4: Calculer la Valeur Terminale et actualiser ---
        terminal_value = (future_fcf[-1] * (1 + perpetual_growth_rate)) / (discount_rate - perpetual_growth_rate)
        
        discounted_fcf = [fcf / (1 + discount_rate) ** (i + 1) for i, fcf in enumerate(future_fcf)]
        discounted_terminal_value = terminal_value / (1 + discount_rate) ** 10
        
        enterprise_value = sum(discounted_fcf) + discounted_terminal_value
        
        # --- Étape 5: Calculer la valeur par action ---
        equity_value = enterprise_value - info['totalDebt'] + info['totalCash']
        intrinsic_value = equity_value / info['sharesOutstanding']
        margin_of_safety = (intrinsic_value - info['currentPrice']) / info['currentPrice']

        return {
            "intrinsic_value": intrinsic_value, "margin_of_safety": margin_of_safety,
            "assumptions": {
                "risk_free_rate": risk_free_rate, "market_return": MARKET_RETURN, **wacc_data
            },
            "projections": {"projected_fcf": future_fcf}
        }
    except Exception as e:
        return {"error": f"Calcul DCF avancé impossible: {e}"}

# --- FONCTION PRINCIPALE D'ORCHESTRATION MISE À JOUR ---

def perform_advanced_analysis(ticker: str) -> dict:
    """Orchestre les analyses avancées pour un ticker."""
    ticker_obj = yf.Ticker(ticker)
    # L'ancien F-Score peut être conservé ou supprimé selon votre choix
    # f_score_results = calculate_piotroski_f_score(ticker_obj)
    dcf_results = calculate_advanced_dcf(ticker_obj)
    # return {"f_score": f_score_results, "dcf": dcf_results}
    return {"dcf": dcf_results} # On se concentre sur le DCF pour l'instant


# ... (gardez toutes les autres fonctions : get_index_symbols, get_stock_data, etc.)

# --- NOUVELLES Fonctions pour l'Analyse Avancée (Étape 2 - Basées sur stockdex) ---

def run_dcf_valuation(fcf_growth_rate, perpetual_growth_rate, base_fcf, total_debt, cash, shares_outstanding):
    """Calcule la valeur intrinsèque. Cette fonction est purement mathématique et reste inchangée."""
    WACC = 0.0863
    PROJECTION_YEARS = 5
    """Calcule la valeur intrinsèque par action selon un scénario donné."""
    
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

def get_dcf_analysis(ticker: str):
    """
    Fonction principale pour l'analyse DCF, maintenant basée sur stockdex.
    """
    try:
        print(f"▶️  Récupération des données pour {ticker} via stockdex...")
        stock = StockdexTicker(ticker=ticker, headless=True)
        
        # Utilisation des méthodes de la bibliothèque stockdex
        is_df_raw = stock.macrotrends_income_statement(frequency='annual')
        bs_df_raw = stock.macrotrends_balance_sheet(frequency='annual')
        cf_df_raw = stock.macrotrends_cash_flow(frequency='annual')
        print("✅ Données brutes récupérées.")

        # --- ÉTAPE DE NETTOYAGE ET CONVERSION DES DONNÉES ---
        # Cette nouvelle étape est cruciale pour éviter les erreurs de type.
        dataframes = {'is_df': is_df_raw.T, 'bs_df': bs_df_raw.T, 'cf_df': cf_df_raw.T}
        cleaned_dfs = {}
        for name, df in dataframes.items():
            if df.empty:
                raise ValueError(f"Le DataFrame '{name}' est vide après le scraping.")
            
            # Convertir toutes les colonnes en type numérique, en ignorant les erreurs
            # pour les colonnes qui ne sont pas des nombres.
            for col in df.columns:
                # Remplacer les virgules et convertir en nombre
                if df[col].dtype == 'object':
                    df[col] = df[col].str.replace(',', '', regex=False)
                df[col] = pd.to_numeric(df[col], errors='coerce')
             # --- CORRECTION FINALE : Convertir l'index de date en année ---
            # S'assure que l'index est bien un objet Datetime, puis en extrait l'année
            df.index = pd.to_datetime(df.index).year
            df.index.name = 'Year' # C'est une bonne pratique de nommer l'index
            df.sort_index(ascending=False, inplace=True)
            # --- FIN DE LA CORRECTION ---
            cleaned_dfs[name] = df

        is_df = cleaned_dfs['is_df']
        bs_df = cleaned_dfs['bs_df']
        cf_df = cleaned_dfs['cf_df']
        # --- FIN DE L'ÉTAPE DE NETTOYAGE ---

            # --- Process Income Statement ---
        is_df = is_df[['Revenue', 'EBITDA', 'Shares Outstanding']].copy()
        is_df.reset_index(inplace=True)
        
        # --- Process Balance Sheet ---
        latest_year = bs_df.index.max()
        balance_sheet_latest = {
        'Cash': bs_df.get('Cash On Hand', pd.Series(dtype='float64')).get(latest_year, 0),
        'Total Long Term Debt': bs_df.get('Long-Term Debt', pd.Series(dtype='float64')).get(latest_year, 0)
}

        # --- Process Cash Flow Statement ---
        cf_df = cf_df[['Cash Flow From Operating Activities', 'Net Change In Property, Plant, And Equipment']].copy()
        cf_df.rename(columns={
            'Cash Flow From Operating Activities': 'CFO',
            'Net Change In Property, Plant, And Equipment': 'CapEx'
        }, inplace=True)
        
        #cf_df['CapEx'] = cf_df['CapEx'].abs()
        cf_df['FCF'] = cf_df['CFO'] - cf_df['CapEx']
        cf_df.reset_index(inplace=True)

        # Le traitement des données est adapté à la sortie de stockdex
        # Extraire les valeurs de base pour la valorisation
        base_fcf = cf_df[cf_df['Year'] == latest_year]['FCF'].iloc[0]
        total_debt = balance_sheet_latest['Total Long Term Debt']
        cash = balance_sheet_latest['Cash']
        shares_outstanding = is_df[is_df['Year'] == latest_year]['Shares Outstanding'].iloc[0]

        # Vérification des données
        if any(pd.isna(val) for val in [base_fcf, total_debt, cash, shares_outstanding]):
             raise ValueError("Données de base manquantes (FCF, Dette, Cash ou Actions).")

        base_data = {
            "latest_year": int(latest_year), "base_fcf": base_fcf * 1_000_000, # Les données sont en millions
            "total_debt": total_debt * 1_000_000, "cash": cash * 1_000_000,
            "shares_outstanding": shares_outstanding * 1_000_000
        }

        # Scénario 1: Prospectif
        fcf_growth_s1, perp_growth_s1 = 0.05, 0.025
        valeur_s1, _, _ = run_dcf_valuation(fcf_growth_s1, perp_growth_s1, base_data['base_fcf'], base_data['total_debt'], base_data['cash'], base_data['shares_outstanding'])
        scenario1 = {"assumptions": {"fcf_growth": fcf_growth_s1, "perp_growth": perp_growth_s1}, "intrinsic_value": float(valeur_s1)}

        # Scénario 2: Historique
        # Calcul des taux de croissance historiques (CAGR)
        cf_df.sort_values('Year', inplace=True)
        is_df.sort_values('Year', inplace=True)
        
        num_years = len(cf_df) - 1
        start_fcf = cf_df['FCF'].iloc[0]
        end_fcf = cf_df['FCF'].iloc[-1]
        # Éviter une division par zéro ou une racine négative si le FCF de départ est nul ou négatif
        if start_fcf > 0 and end_fcf > 0:
            fcf_growth_s2 = (end_fcf / start_fcf)**(1 / num_years) - 1
        else:
            fcf_growth_s2 = 0.0 # Supposer une croissance nulle si les données historiques ne sont pas fiables

        start_ebitda = is_df['EBITDA'].iloc[0]
        end_ebitda = is_df['EBITDA'].iloc[-1]

        # Add protection for non-positive EBITDA values
        if start_ebitda > 0 and end_ebitda > 0:
            perp_growth_s2 = (end_ebitda / start_ebitda)**(1 / num_years) - 1
        else:
            perp_growth_s2 = 0.0 # Default to 0% growth if data is not usable
        
        # S'assurer que le taux de croissance perpétuel n'est pas trop élevé
        perp_growth_s2 = min(perp_growth_s2, perp_growth_s1)

        valeur_s2, _, _ = run_dcf_valuation(fcf_growth_s2, perp_growth_s2, base_data['base_fcf'], base_data['total_debt'], base_data['cash'], base_data['shares_outstanding'])
        scenario2 = {"assumptions": {"fcf_growth": fcf_growth_s2, "perp_growth": perp_growth_s2}, "intrinsic_value": float(valeur_s2)}
        
        return {"base_data": base_data, "scenario1": scenario1, "scenario2": scenario2}
    except Exception as e:
        print(f"--- ERREUR DÉTAILLÉE POUR {ticker} ---")
        print(e)
        print("---------------------------------")
        return {"error": f"Erreur de traitement des données pour {ticker} via stockdex: {e}"}
