import pandas as pd
import numpy as np
from typing import Dict, Tuple, Optional
from stockdex import Ticker

# Constantes de validation
MIN_GROWTH_RATE = -0.50  # -50% minimum
MAX_GROWTH_RATE = 1.00   # 100% maximum
MAX_PERPETUAL_GROWTH = 0.05  # 5% maximum pour croissance perpétuelle
DEFAULT_WACC = 0.0863  # 8.63%


class DCFAnalysisError(Exception):
    """Exception personnalisée pour les erreurs d'analyse DCF."""
    pass


def validate_growth_rate(rate: float, rate_name: str, is_perpetual: bool = False) -> float:
    """Valide et plafonne les taux de croissance."""
    if is_perpetual:
        if rate > MAX_PERPETUAL_GROWTH:
            print(f"⚠️  {rate_name} ({rate:.2%}) plafonné à {MAX_PERPETUAL_GROWTH:.2%}")
            return MAX_PERPETUAL_GROWTH
        if rate < 0:
            print(f"⚠️  {rate_name} négatif ({rate:.2%}) ajusté à 0%")
            return 0.0
    else:
        if rate > MAX_GROWTH_RATE:
            print(f"⚠️  {rate_name} ({rate:.2%}) plafonné à {MAX_GROWTH_RATE:.2%}")
            return MAX_GROWTH_RATE
        if rate < MIN_GROWTH_RATE:
            print(f"⚠️  {rate_name} ({rate:.2%}) ajusté à {MIN_GROWTH_RATE:.2%}")
            return MIN_GROWTH_RATE
    
    return rate


def get_processed_financial_data(ticker_symbol: str) -> Tuple[pd.DataFrame, pd.DataFrame, Dict, int]:
    """
    Récupère et traite les données financières depuis Macrotrends via stockdex.
    
    Args:
        ticker_symbol: Symbole boursier (ex: 'AAPL', 'MSFT')
    
    Returns:
        Tuple contenant (income_statement_df, cash_flow_df, balance_sheet_dict, latest_year)
    """
    print(f"▶️  Récupération des données financières pour {ticker_symbol} via Macrotrends (stockdex)...")
    
    try:
        # Initialisation du ticker avec stockdex
        ticker = Ticker(ticker=ticker_symbol, security_type="stock")
        
        # Récupération des états financiers via Macrotrends (données annuelles)
        income_statement = ticker.macrotrends_income_statement(frequency='annual')
        balance_sheet = ticker.macrotrends_balance_sheet(frequency='annual')
        cash_flow = ticker.macrotrends_cash_flow(frequency='annual')
        
        if income_statement.empty or balance_sheet.empty or cash_flow.empty:
            raise DCFAnalysisError(
                f"Impossible de récupérer les données financières pour {ticker_symbol}. "
                "Vérifiez que le symbole est correct et que les données sont disponibles sur Macrotrends."
            )
        
        print("✅ Données brutes récupérées depuis Macrotrends.\n")
        
    except Exception as e:
        raise DCFAnalysisError(f"Erreur lors de la récupération des données pour {ticker_symbol}: {e}")

    # --- Traitement du compte de résultat ---
    # Stockdex retourne les données avec les métriques en index et les années en colonnes
    # On transpose pour avoir les années en index et les métriques en colonnes
    is_df = income_statement.T.copy()  # Transposition
    
    # Conversion des colonnes de dates en index datetime
    is_df.index = pd.to_datetime(is_df.index)
    is_df = is_df.sort_index()
    
    # Vérification et sélection des colonnes nécessaires
    required_is_columns = ['revenue', 'ebitda']
    available_columns = [col.lower() for col in is_df.columns]
    
    # Mapper les colonnes (recherche des métriques dans l'index original)
    column_mapping = {}
    for req_col in required_is_columns:
        for av_col in is_df.columns:
            if req_col in av_col.lower().replace('-', '').replace('_', '').replace(' ', ''):
                column_mapping[av_col] = req_col.capitalize()
                break
    
    if len(column_mapping) < len(required_is_columns):
        # Recherche plus flexible pour EBITDA
        for av_col in is_df.columns:
            av_col_clean = av_col.lower().replace('-', '').replace('_', '').replace(' ', '')
            if 'ebit' in av_col_clean and 'da' in av_col_clean:
                column_mapping[av_col] = 'Ebitda'
                break
    
    if len(column_mapping) < len(required_is_columns):
        raise DCFAnalysisError(
            f"Colonnes manquantes dans le compte de résultat. "
            f"Colonnes disponibles: {list(is_df.columns)}"
        )
    
    is_df = is_df.rename(columns=column_mapping)
    is_df = is_df[['Revenue', 'Ebitda']].copy()
    
    # Nettoyage des données (conversion en numérique si nécessaire)
    for col in is_df.columns:
        is_df[col] = pd.to_numeric(is_df[col], errors='coerce')
    
    # Suppression des lignes avec des valeurs manquantes
    is_df = is_df.dropna()

    # --- Traitement du bilan ---
    bs_df = balance_sheet.T.copy()  # Transposition
    
    # Conversion des colonnes de dates en index datetime
    bs_df.index = pd.to_datetime(bs_df.index)
    bs_df = bs_df.sort_index()
    
    # Recherche des colonnes de trésorerie et dette long terme
    cash_col = None
    debt_col = None
    
    for col in bs_df.columns:
        col_lower = col.lower().replace('-', '').replace('_', '').replace(' ', '')
        if 'cash' in col_lower and ('equivalents' in col_lower or 'equivalent' in col_lower):
            cash_col = col
        if ('longterm' in col_lower or 'long' in col_lower) and 'debt' in col_lower:
            debt_col = col
    
    # Recherche alternative si pas trouvé
    if not cash_col:
        for col in bs_df.columns:
            col_lower = col.lower().replace('-', '').replace('_', '').replace(' ', '')
            if 'cash' in col_lower:
                cash_col = col
                break
    
    if not debt_col:
        for col in bs_df.columns:
            col_lower = col.lower().replace('-', '').replace('_', '').replace(' ', '')
            if 'debt' in col_lower and 'total' in col_lower:
                debt_col = col
                break
    
    if not cash_col or not debt_col:
        raise DCFAnalysisError(
            f"Colonnes de trésorerie ou dette non trouvées. "
            f"Colonnes disponibles: {list(bs_df.columns)}"
        )
    
    # Récupération de l'année la plus récente commune à tous les états financiers
    # Nous devons attendre d'avoir traité le cash flow pour déterminer latest_year
    # Donc nous déplaçons cette logique après le traitement du cash flow

    # --- Traitement du tableau de flux de trésorerie ---
    cf_df = cash_flow.T.copy()  # Transposition
    
    # Conversion des colonnes de dates en index datetime
    cf_df.index = pd.to_datetime(cf_df.index)
    cf_df = cf_df.sort_index()
    
    # Recherche des colonnes CFO et CapEx
    cfo_col = None
    capex_col = None
    
    for col in cf_df.columns:
        col_lower = col.lower().replace('-', '').replace('_', '').replace(' ', '')
        # Recherche CFO
        if ('cash' in col_lower and 'flow' in col_lower and 'operating' in col_lower) or \
           ('operating' in col_lower and 'activities' in col_lower):
            cfo_col = col
        # Recherche CapEx - "Net Change In Property, Plant, And Equipment"
        if ('property' in col_lower and 'plant' in col_lower and 'equipment' in col_lower) or \
           ('capital' in col_lower and 'expenditure' in col_lower):
            capex_col = col
    
    # Recherche alternative pour CFO
    if not cfo_col:
        for col in cf_df.columns:
            if 'Cash Flow From Operating Activities' in col:
                cfo_col = col
                break
    
    # Recherche alternative pour CapEx
    if not capex_col:
        for col in cf_df.columns:
            if 'Net Change In Property, Plant, And Equipment' in col:
                capex_col = col
                break
    
    if not cfo_col:
        raise DCFAnalysisError(
            f"Colonne de flux de trésorerie opérationnel non trouvée. "
            f"Colonnes disponibles: {list(cf_df.columns)}"
        )
    
    if not capex_col:
        raise DCFAnalysisError(
            f"Colonne de dépenses en capital non trouvée. "
            f"Colonnes disponibles: {list(cf_df.columns)}"
        )
    
    cf_df = cf_df.rename(columns={cfo_col: 'CFO', capex_col: 'CapEx'})
    cf_df = cf_df[['CFO', 'CapEx']].copy()
    
    # Conversion en numérique
    cf_df['CFO'] = pd.to_numeric(cf_df['CFO'], errors='coerce')
    cf_df['CapEx'] = pd.to_numeric(cf_df['CapEx'], errors='coerce')
    
    # CapEx doit être positif (valeur absolue)
    cf_df['CapEx'] = cf_df['CapEx'].abs()
    
    # Calcul du Free Cash Flow
    cf_df['FCF'] = cf_df['CFO'] - cf_df['CapEx']
    
    # Suppression des lignes avec des valeurs manquantes
    cf_df = cf_df.dropna()

    # --- Détermination de l'année commune la plus récente ---
    # Trouver l'intersection des années disponibles dans tous les DataFrames
    common_years = set(is_df.index) & set(bs_df.index) & set(cf_df.index)
    if not common_years:
        raise DCFAnalysisError(
            "Aucune année commune trouvée entre les états financiers"
        )
    
    latest_year = max(common_years)
    
    # Création des données du bilan pour l'année la plus récente
    balance_sheet_latest = {
        'Cash': pd.to_numeric(bs_df.loc[latest_year, cash_col], errors='coerce') or 0,
        'Total Long Term Debt': pd.to_numeric(bs_df.loc[latest_year, debt_col], errors='coerce') or 0
    }

    # --- Récupération du nombre d'actions ---
    # Utilisation de la propriété digrin_shares_outstanding de stockdx
    try:
        shares_data = ticker.digrin_shares_outstanding
        
        if shares_data.empty:
            raise DCFAnalysisError(
                "Données du nombre d'actions en circulation non disponibles. "
                "Veuillez fournir cette information manuellement."
            )
        
        # Récupération de la valeur la plus récente
        shares_outstanding_raw = shares_data.iloc[-1, -1]  # Dernière ligne, dernière colonne
        
        # Conversion du format "7.5 billion" en nombre
        try:
            if isinstance(shares_outstanding_raw, str):
                shares_str = shares_outstanding_raw.lower().strip()
                if 'billion' in shares_str:
                    shares_outstanding = float(shares_str.replace('billion', '').strip()) * 1_000_000_000
                elif 'million' in shares_str:
                    shares_outstanding = float(shares_str.replace('million', '').strip()) * 1_000_000
                else:
                    shares_outstanding = pd.to_numeric(shares_outstanding_raw, errors='coerce')
            else:
                shares_outstanding = pd.to_numeric(shares_outstanding_raw, errors='coerce')
        except (ValueError, TypeError) as e:
            raise DCFAnalysisError(
                f"Erreur lors de la conversion du nombre d'actions '{shares_outstanding_raw}': {e}"
            )
        
        if pd.isna(shares_outstanding) or shares_outstanding <= 0:
            raise DCFAnalysisError(
                f"Nombre d'actions invalide: {shares_outstanding}. "
                "Valeur brute: '{shares_outstanding_raw}'. "
                "Cette information est nécessaire pour l'analyse DCF."
            )
        
    except Exception as e:
        raise DCFAnalysisError(
            f"Impossible de récupérer le nombre d'actions en circulation: {e}. "
            "Cette information est nécessaire pour l'analyse DCF."
        )
    
    # Ajout du nombre d'actions au DataFrame
    is_df['Shares Outstanding'] = shares_outstanding

    return is_df, cf_df, balance_sheet_latest, int(latest_year.year if hasattr(latest_year, 'year') else latest_year)


def run_dcf_valuation(
    fcf_growth_rate: float,
    perpetual_growth_rate: float,
    base_fcf: float,
    total_debt: float,
    cash: float,
    shares_outstanding: int,
    wacc: float = DEFAULT_WACC,
    projection_years: int = 5
) -> Tuple[float, float, float]:
    """
    Calcule la valorisation DCF avec les paramètres donnés.
    
    Args:
        fcf_growth_rate: Taux de croissance du FCF pour la période de projection
        perpetual_growth_rate: Taux de croissance perpétuel (terminal)
        base_fcf: Free Cash Flow de base (année la plus récente)
        total_debt: Dette totale à long terme
        cash: Trésorerie et équivalents
        shares_outstanding: Nombre d'actions en circulation
        wacc: Coût moyen pondéré du capital
        projection_years: Nombre d'années de projection (défaut: 5)
    
    Returns:
        Tuple contenant (valeur_intrinsèque_par_action, valeur_entreprise, valeur_capitaux_propres)
    """
    # Validation des paramètres pour les valeurs NaN
    if np.isnan(base_fcf) or np.isnan(total_debt) or np.isnan(cash) or np.isnan(wacc):
        raise DCFAnalysisError(
            f"Paramètres invalides (NaN détecté): "
            f"FCF={base_fcf}, Dette={total_debt}, Trésorerie={cash}, WACC={wacc}"
        )
    
    if np.isnan(fcf_growth_rate) or np.isnan(perpetual_growth_rate):
        raise DCFAnalysisError(
            f"Taux de croissance invalides (NaN détecté): "
            f"Croissance FCF={fcf_growth_rate}, Croissance perpétuelle={perpetual_growth_rate}"
        )
    
    # Validation des paramètres
    if base_fcf <= 0:
        raise DCFAnalysisError(
            f"FCF de base invalide ({base_fcf:,.0f}). "
            "L'analyse DCF nécessite un FCF positif."
        )
    
    if wacc <= perpetual_growth_rate:
        raise DCFAnalysisError(
            f"WACC ({wacc:.2%}) doit être supérieur au taux de croissance perpétuel ({perpetual_growth_rate:.2%})"
        )
    
    if shares_outstanding <= 0:
        raise DCFAnalysisError(f"Nombre d'actions invalide: {shares_outstanding}")
    
    # Projection des Free Cash Flows futurs
    projected_fcf = [base_fcf * (1 + fcf_growth_rate)**i for i in range(1, projection_years + 1)]

    # Actualisation des FCF
    discounted_fcf = [fcf / (1 + wacc)**(i + 1) for i, fcf in enumerate(projected_fcf)]
    pv_of_fcf = sum(discounted_fcf)

    # Calcul de la Valeur Terminale et actualisation
    final_fcf = projected_fcf[-1]
    terminal_value = (final_fcf * (1 + perpetual_growth_rate)) / (wacc - perpetual_growth_rate)
    pv_of_terminal_value = terminal_value / (1 + wacc)**projection_years

    # Calcul de la valeur d'entreprise et de la valeur des capitaux propres
    enterprise_value = pv_of_fcf + pv_of_terminal_value
    equity_value = enterprise_value - total_debt + cash
    

    # Vérification que la valeur des capitaux propres est positive
    if equity_value <= 0:
        print(f"⚠️  Valeur des capitaux propres négative: {equity_value:,.0f}")
    
    # Calcul de la valeur intrinsèque par action
    intrinsic_value_per_share = equity_value / shares_outstanding
    
    # Validation des résultats pour détecter les valeurs NaN
    if np.isnan(intrinsic_value_per_share) or np.isnan(enterprise_value) or np.isnan(equity_value):
        raise DCFAnalysisError(
            f"Calcul DCF invalide - valeurs NaN détectées. "
            f"Valeur intrinsèque: {intrinsic_value_per_share}, "
            f"Valeur d'entreprise: {enterprise_value}, "
            f"Valeur des capitaux propres: {equity_value}"
        )
    
    return intrinsic_value_per_share, enterprise_value, equity_value


def get_dcf_analysis(ticker: str, wacc: Optional[float] = None) -> Dict:
    """
    Fonction principale pour obtenir l'analyse DCF d'un ticker donné.
    
    Args:
        ticker: Symbole boursier (ex: 'AAPL', 'MSFT')
        wacc: Coût moyen pondéré du capital (optionnel, par défaut 8.63%)
    
    Returns:
        Dictionnaire contenant les données de base et deux scénarios de valorisation
    """
    if wacc is None:
        wacc = DEFAULT_WACC
    
    try:
        # Étape 1 : Récupération et traitement des données financières
        is_df, cf_df, balance_sheet_latest, latest_year = get_processed_financial_data(ticker)
        
        # Récupération des données pour l'année la plus récente
        # Note: latest_year est maintenant un entier, mais cf_df.index contient des Timestamps
        # Nous devons trouver l'index correspondant dans cf_df
        cf_latest_index = None
        for idx in cf_df.index:
            if (hasattr(idx, 'year') and idx.year == latest_year) or idx == latest_year:
                cf_latest_index = idx
                break
        
        if cf_latest_index is None:
            raise DCFAnalysisError(f"Données de flux de trésorerie manquantes pour l'année {latest_year}")
        
        base_fcf_raw = cf_df.loc[cf_latest_index, 'FCF']
        
        # Validation et conversion du FCF
        if pd.isna(base_fcf_raw) or base_fcf_raw <= 0:
            raise DCFAnalysisError(
                f"FCF invalide pour l'année {latest_year}: {base_fcf_raw}. "
                "L'analyse DCF nécessite un FCF positif."
            )
        base_fcf = base_fcf_raw * 1_000_000  # Conversion millions -> unités
        
        total_debt_raw = balance_sheet_latest['Total Long Term Debt']
        cash_raw = balance_sheet_latest['Cash']
        
        # Validation et conversion avec valeurs par défaut pour données manquantes
        total_debt = total_debt_raw * 1_000_000 if pd.notna(total_debt_raw) else 0
        cash = cash_raw * 1_000_000 if pd.notna(cash_raw) else 0
        
        # Avertissement si des données sont manquantes
        if pd.isna(total_debt_raw):
            print(f"⚠️  Données de dette manquantes pour {latest_year}, utilisation de 0")
        if pd.isna(cash_raw):
            print(f"⚠️  Données de trésorerie manquantes pour {latest_year}, utilisation de 0")
        # Trouver l'index correspondant dans is_df
        is_latest_index = None
        for idx in is_df.index:
            if (hasattr(idx, 'year') and idx.year == latest_year) or idx == latest_year:
                is_latest_index = idx
                break
        
        shares_outstanding = is_df.loc[is_latest_index, 'Shares Outstanding']
        
        # Validation et conversion du nombre d'actions
        if pd.isna(shares_outstanding) or shares_outstanding <= 0:
            raise DCFAnalysisError(
                f"Nombre d'actions en circulation invalide: {shares_outstanding}. "
                "Impossible de procéder à l'analyse DCF."
            )
        
        shares_outstanding = int(shares_outstanding)
        
        # Validation finale des données critiques
        if base_fcf <= 0:
            raise DCFAnalysisError(
                f"FCF de base invalide ({base_fcf:,.0f}). "
                "L'analyse DCF nécessite un FCF positif."
            )
        
        if shares_outstanding <= 0:
            raise DCFAnalysisError(
                f"Nombre d'actions invalide: {shares_outstanding}. "
                "Cette information est nécessaire pour l'analyse DCF."
            )
        
        # Affichage des données de base
        print(f"📊 Données de base ({latest_year}):")
        print(f"   • FCF: {base_fcf:,.0f}")
        print(f"   • Dette: {total_debt:,.0f}")
        print(f"   • Trésorerie: {cash:,.0f}")
        print(f"   • Actions: {shares_outstanding:,.0f}")
        print(f"   • WACC: {wacc:.2%}\n")
        
        base_data = {
            "ticker": ticker,
            "latest_year": int(latest_year),
            "base_fcf": float(base_fcf),
            "total_debt": float(total_debt),
            "cash": float(cash),
            "shares_outstanding": int(shares_outstanding),
            "wacc": float(wacc)
        }

        # Scénario 1: Prospectif (hypothèses conservatrices)
        fcf_growth_s1 = 0.05  # 5% de croissance du FCF
        perp_growth_s1 = 0.025  # 2.5% de croissance perpétuelle
        
        print("🔮 Scénario 1 - Prospectif:")
        valeur_s1, enterprise_value_s1, equity_value_s1 = run_dcf_valuation(
            fcf_growth_s1, perp_growth_s1, base_fcf, total_debt, cash, shares_outstanding, wacc
        )
        scenario1 = {
            "name": "Prospectif",
            "assumptions": {"fcf_growth": fcf_growth_s1, "perp_growth": perp_growth_s1},
            "intrinsic_value": float(valeur_s1),
            "enterprise_value": float(enterprise_value_s1),
            "equity_value": float(equity_value_s1)
        }
        print(f"   ✓ Valeur intrinsèque: {valeur_s1:.2f} par action\n")

        # Scénario 2: Basé sur l'historique
        print("📈 Scénario 2 - Historique:")
        
        # Calcul du taux de croissance historique du FCF
        num_years = len(cf_df) - 1
        if num_years < 1:
            raise DCFAnalysisError("Pas assez de données historiques pour calculer les taux de croissance")
        
        start_fcf = cf_df['FCF'].iloc[0]
        end_fcf = cf_df['FCF'].iloc[-1]
        
        if start_fcf > 0 and end_fcf > 0:
            fcf_growth_s2 = (end_fcf / start_fcf)**(1 / num_years) - 1
        else:
            print("⚠️  FCF négatif détecté, utilisation du taux prospectif")
            fcf_growth_s2 = fcf_growth_s1
        
        # Calcul du taux de croissance historique de l'EBITDA
        start_ebitda = is_df['Ebitda'].iloc[0]
        end_ebitda = is_df['Ebitda'].iloc[-1]
        
        if start_ebitda > 0 and end_ebitda > 0:
            perp_growth_s2 = (end_ebitda / start_ebitda)**(1 / num_years) - 1
        else:
            print("⚠️  EBITDA négatif détecté, utilisation du taux prospectif")
            perp_growth_s2 = perp_growth_s1
        
        # Validation et plafonnement des taux
        fcf_growth_s2 = validate_growth_rate(fcf_growth_s2, "Croissance FCF historique")
        perp_growth_s2 = validate_growth_rate(perp_growth_s2, "Croissance perpétuelle historique", is_perpetual=True)
        
        valeur_s2, enterprise_value_s2, equity_value_s2 = run_dcf_valuation(
            fcf_growth_s2, perp_growth_s2, base_fcf, total_debt, cash, shares_outstanding, wacc
        )
        scenario2 = {
            "name": "Historique",
            "assumptions": {"fcf_growth": float(fcf_growth_s2), "perp_growth": float(perp_growth_s2)},
            "intrinsic_value": float(valeur_s2),
            "enterprise_value": float(enterprise_value_s2),
            "equity_value": float(equity_value_s2)
        }
        print(f"   ✓ Valeur intrinsèque: {valeur_s2:.2f} par action\n")
        
        return {
            "success": True,
            "base_data": base_data,
            "scenario1": scenario1,
            "scenario2": scenario2
        }
        
    except DCFAnalysisError as e:
        error_msg = str(e)
        
        # Tentative de fallback vers yfinance si stockdx échoue
        if ("'NoneType' object has no attribute 'find_all'" in error_msg or 
            "Erreur lors de la récupération des données" in error_msg):
            
            print(f"⚠️  Échec de stockdx pour {ticker}, tentative avec yfinance...")

        
        # Ajouter des suggestions spécifiques pour les erreurs de récupération de données
        if "'NoneType' object has no attribute 'find_all'" in error_msg:
            error_msg += (
                "\n\n💡 Suggestions:\n"
                "• Ce ticker pourrait ne pas être disponible sur Macrotrends\n"
                "• Essayez avec des tickers populaires comme AAPL ou MSFT\n"
                "• Vérifiez que le symbole boursier est correct\n"
                "• Il pourrait y avoir un problème temporaire avec la source de données"
            )
        
        return {
            "success": False,
            "error": error_msg,
            "error_type": "DCF Analysis Error",
            "ticker": ticker,
            "suggested_alternatives": ["AAPL", "MSFT", "GOOGL", "AMZN"] if "'NoneType'" in error_msg else None
        }
    except Exception as e:
        error_msg = str(e)
        
        # Ajouter des suggestions pour les erreurs générales
        if "'NoneType' object has no attribute 'find_all'" in error_msg:
            error_msg += (
                "\n\n💡 Suggestions:\n"
                "• Ce ticker pourrait ne pas être disponible sur Macrotrends\n"
                "• Essayez avec des tickers populaires comme AAPL ou MSFT\n"
                "• Vérifiez que le symbole boursier est correct"
            )
        
        return {
            "success": False,
            "error": error_msg,
            "error_type": type(e).__name__,
            "ticker": ticker,
            "suggested_alternatives": ["AAPL", "MSFT", "GOOGL", "AMZN"] if "'NoneType'" in error_msg else None
        }


def display_dcf_results(results: Dict) -> None:
    """Affiche les résultats de l'analyse DCF de manière formatée."""
    if not results.get("success"):
        print(f"❌ Erreur: {results.get('error')}")
        return
    
    print("=" * 60)
    print(f"📊 ANALYSE DCF - {results['base_data']['ticker']}")
    print("=" * 60)
    
    for scenario_key in ['scenario1', 'scenario2']:
        scenario = results[scenario_key]
        print(f"\n{scenario['name']}:")
        print(f"  Hypothèses:")
        print(f"    - Croissance FCF: {scenario['assumptions']['fcf_growth']:.2%}")
        print(f"    - Croissance perpétuelle: {scenario['assumptions']['perp_growth']:.2%}")
        print(f"  Résultats:")
        print(f"    - Valeur intrinsèque: {scenario['intrinsic_value']:.2f} / action")
        print(f"    - Valeur d'entreprise: {scenario['enterprise_value']:,.0f}")
        print(f"    - Valeur des capitaux propres: {scenario['equity_value']:,.0f}")


# Exemple d'utilisation
if __name__ == "__main__":
    # Test avec Microsoft
    ticker = "LULU"
    print(f"Analyse DCF pour {ticker} (données Macrotrends via stockdx)\n")
    results = get_dcf_analysis(ticker)
    display_dcf_results(results)