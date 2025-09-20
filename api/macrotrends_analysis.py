# backend/app/macrotrends_analysis.py
import requests
import pandas as pd
import re
import json
import numpy as np

# --- CLASSES DE SCRAPING (INCHANGÉES) ---
def get_response(url):
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"}
    session = requests.Session()
    return session.get(url, headers=headers)

class SingleBase:
    def __init__(self, ticker):
        self._ticker = ticker.upper()
        self._base_stocks_url = f"https://www.macrotrends.net/stocks/charts/{self._ticker}"
        self._base_assets_url = "https://www.macrotrends.net/assets/php"
        self._years = 10
    
    def _get_url(self, item):
        response = get_response(self._base_stocks_url)
        short_name = response.url.split("/")[-2]

        url = f"{self._base_stocks_url}/{short_name}/{item}"
    
        return url

    def _get_financials(self, statement, freq=None):
        url = self._get_url(statement)
        response = get_response(f"{url}?freq={freq}")

        if response.status_code == 200:
            lbls = re.findall("(?<=\'\>)\D+(?=\<\\\/a\>)", response.text)
            lbls = [lbl.replace("\\", "") for lbl in lbls]
            
            data = re.findall("(?<=div\>\"\,)[0-9\.\"\:\-\, ]*", response.text)
            data = [json.loads("{"+i+"}") for i in data]

            df = pd.DataFrame(data=data, index=lbls)
            df = df.apply(lambda x: pd.to_numeric(x, errors="coerce"))
            df.replace({0: np.nan}, inplace=True)
            df = df.T.apply(pd.to_numeric, errors='coerce') 
            df.index = pd.to_datetime(df.index).year
            df.index.name = 'Year'
        else:
            df = pd.DataFrame()

        return df


class Ticker(SingleBase):
    def __repr__(self):
        return "macrotrends.Ticker object <%s>" % self._ticker

    @property
    def income_statement_annual(self):
        return self._get_financials(statement="income-statement")

    @property
    def balance_sheet_annual(self):
        return self._get_financials(statement="balance-sheet")

    @property
    def cash_flow_annual(self):
        return self._get_financials(statement="cash-flow-statement")

    @property
    def financial_ratios_annual(self):
        return self._get_financials(statement="financial-ratios")


# --- FONCTIONS DE TRAITEMENT ET DE VALORISATION ---

def get_processed_financial_data(ticker):
    """
    Fetches raw data using the scraper and processes it into the format
    required for the DCF valuation.
    """
    print(f"▶️  Récupération des données financières pour {ticker} via Macrotrends...")
    stock = Ticker(ticker)
    is_raw = stock.income_statement_annual
    bs_raw = stock.balance_sheet_annual
    cf_raw = stock.cash_flow_annual
    print("✅ Données brutes récupérées.\n")
    #print(is_raw)
    #return is_raw, bs_raw, cf_raw
    # --- Process Income Statement ---
    is_df = is_raw[['Revenue', 'EBITDA', 'Shares Outstanding']].copy()
    is_df.reset_index(inplace=True)
    
    # --- Process Balance Sheet ---
    latest_year = bs_raw.index.max()
    balance_sheet_latest = {
        # CORRECTED LINE: Changed 'Cash And Equivalents' to 'Cash on Hand'
        'Cash': bs_raw.loc[latest_year, 'Cash On Hand'],
        'Total Long Term Debt': bs_raw.loc[latest_year, 'Long Term Debt']
    }

    # --- Process Cash Flow Statement ---
    cf_df = cf_raw[['Cash Flow From Operating Activities', 'Net Change In Property, Plant, And Equipment']].copy()
    cf_df.rename(columns={
        'Cash Flow From Operating Activities': 'CFO',
        'Net Change In Property, Plant, And Equipment': 'CapEx'
    }, inplace=True)
    
    cf_df['CapEx'] = cf_df['CapEx'].abs()
    cf_df['FCF'] = cf_df['CFO'] - cf_df['CapEx']
    cf_df.reset_index(inplace=True)

    #print(is_df)

    return is_df, cf_df, balance_sheet_latest, is_df['Year'].max()

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
    """Fonction principale appelée par l'API pour lancer l'analyse DCF complète."""
    try:
        #stock = Ticker(ticker)
        is_df, cf_df, balance_sheet_latest, latest_year = get_processed_financial_data(ticker)
        print(cf_df)
        base_fcf = cf_df.loc[latest_year, 'FCF']
        total_debt = balance_sheet_latest['Total Long Term Debt']
        cash = balance_sheet_latest['Cash']
        shares_outstanding = is_df.loc[latest_year, 'Shares Outstanding']
        
        base_data = {
            "latest_year": latest_year, "base_fcf": base_fcf, "total_debt": total_debt,
            "cash": cash, "shares_outstanding": shares_outstanding
        }
        print("base_data")
        # Scénario 1: Prospectif
        fcf_growth_s1, perp_growth_s1 = 0.05, 0.025
        valeur_s1 = run_dcf_valuation(fcf_growth_s1, perp_growth_s1, base_fcf, total_debt, cash, shares_outstanding)
        scenario1 = {"assumptions": {"fcf_growth": fcf_growth_s1, "perp_growth": perp_growth_s1}, "intrinsic_value": valeur_s1}

        # Scénario 2: Historique
        num_years = len(cf_df) - 1
        start_fcf = cf_df['FCF'].iloc[0]
        fcf_growth_s2 = ((cf_df['FCF'].iloc[-1] / start_fcf)**(1 / num_years) - 1) if start_fcf > 0 else 0
        
        start_ebitda = is_df['EBITDA'].iloc[0]
        perp_growth_s2 = ((is_df['EBITDA'].iloc[-1] / start_ebitda)**(1 / num_years) - 1) if start_ebitda > 0 else 0
        perp_growth_s2 = min(perp_growth_s2, perp_growth_s1) # Safety cap
        
        valeur_s2 = run_dcf_valuation(fcf_growth_s2, perp_growth_s2, base_fcf, total_debt, cash, shares_outstanding)
        scenario2 = {"assumptions": {"fcf_growth": fcf_growth_s2, "perp_growth": perp_growth_s2}, "intrinsic_value": valeur_s2}
        
        return {"base_data": base_data, "scenario1": scenario1, "scenario2": scenario2}
    except Exception as e:
        return {"error": str(e)}