#!/usr/bin/env python3
"""
Script de test pour démontrer la gestion d'erreur améliorée
avec des tickers qui fonctionnent et d'autres qui échouent.
"""

import fmp_analysis
import json

def test_ticker_with_error_handling(ticker):
    """Teste un ticker et affiche la gestion d'erreur améliorée."""
    print(f"\n{'='*60}")
    print(f"🔍 TEST: {ticker}")
    print(f"{'='*60}")
    
    result = fmp_analysis.get_dcf_analysis(ticker)
    
    if result.get('success', False):
        print(f"✅ SUCCÈS pour {ticker}")
        scenario1 = result.get('scenario1', {})
        scenario2 = result.get('scenario2', {})
        print(f"   📈 Prospectif: {scenario1.get('intrinsic_value', 'N/A'):.2f}$")
        print(f"   📊 Historique: {scenario2.get('intrinsic_value', 'N/A'):.2f}$")
    else:
        print(f"❌ ÉCHEC pour {ticker}")
        print(f"   🔍 Type d'erreur: {result.get('error_type', 'Inconnu')}")
        print(f"   📝 Message d'erreur:")
        print(f"      {result.get('error', 'Aucun message')}")
        
        if result.get('suggested_alternatives'):
            print(f"   💡 Alternatives suggérées: {', '.join(result['suggested_alternatives'])}")
    
    return result

def main():
    """Teste différents tickers pour démontrer la gestion d'erreur."""
    print("🧪 TEST DE GESTION D'ERREUR DCF")
    print("Démonstration de la gestion d'erreur améliorée")
    
    # Tickers à tester (mélange de fonctionnels et problématiques)
    test_cases = [
        ("LULU", "Ticker qui fonctionne maintenant"),
        ("MSFT", "Ticker généralement fiable"),
        ("INVALID_TICKER_123", "Ticker invalide pour tester la gestion d'erreur"),
        ("CHTR", "Ticker qui peut échouer"),
    ]
    
    results = {}
    
    for ticker, description in test_cases:
        print(f"\n📋 {description}")
        results[ticker] = test_ticker_with_error_handling(ticker)
    
    # Résumé final
    print(f"\n{'='*60}")
    print("📊 RÉSUMÉ DES TESTS")
    print(f"{'='*60}")
    
    successful = [t for t, r in results.items() if r.get('success', False)]
    failed = [t for t, r in results.items() if not r.get('success', False)]
    
    print(f"✅ Tickers réussis: {', '.join(successful) if successful else 'Aucun'}")
    print(f"❌ Tickers échoués: {', '.join(failed) if failed else 'Aucun'}")
    
    if failed:
        print(f"\n🔧 La gestion d'erreur améliorée fournit:")
        print(f"   • Messages d'erreur détaillés")
        print(f"   • Suggestions d'alternatives")
        print(f"   • Informations de diagnostic")

if __name__ == "__main__":
    main()