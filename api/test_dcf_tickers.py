#!/usr/bin/env python3
"""
Script de diagnostic pour tester l'analyse DCF avec différents tickers
et identifier lesquels fonctionnent avec Macrotrends via stockdx.
"""

import fmp_analysis

def test_ticker(ticker):
    """Teste un ticker et retourne le résultat."""
    print(f"\n🔍 Test de {ticker}...")
    try:
        result = fmp_analysis.get_dcf_analysis(ticker)
        if result.get('success', False):
            scenario1 = result.get('scenario1', {})
            scenario2 = result.get('scenario2', {})
            print(f"✅ {ticker}: Succès")
            print(f"   Prospectif: {scenario1.get('intrinsic_value', 'N/A'):.2f}$")
            print(f"   Historique: {scenario2.get('intrinsic_value', 'N/A'):.2f}$")
            return True
        else:
            print(f"❌ {ticker}: Échec - {result.get('error', 'Erreur inconnue')}")
            return False
    except Exception as e:
        print(f"❌ {ticker}: Exception - {str(e)}")
        return False

def main():
    """Teste plusieurs tickers populaires."""
    print("🧪 Test de diagnostic DCF - Tickers multiples")
    print("=" * 60)
    
    # Liste de tickers populaires à tester
    test_tickers = [
        'AAPL',   # Apple
        'MSFT',   # Microsoft
        'GOOGL',  # Alphabet
        'AMZN',   # Amazon
        'TSLA',   # Tesla
        'NVDA',   # NVIDIA
        'META',   # Meta
        'NFLX',   # Netflix
        'LULU',   # Lululemon
        'BIIB',   # Biogen
        'CHTR',   # Charter Communications
        'JPM',    # JPMorgan Chase
        'JNJ',    # Johnson & Johnson
        'PG',     # Procter & Gamble
        'KO'      # Coca-Cola
    ]
    
    successful = []
    failed = []
    
    for ticker in test_tickers:
        if test_ticker(ticker):
            successful.append(ticker)
        else:
            failed.append(ticker)
    
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 60)
    print(f"✅ Tickers fonctionnels ({len(successful)}): {', '.join(successful)}")
    print(f"❌ Tickers en échec ({len(failed)}): {', '.join(failed)}")
    print(f"📈 Taux de succès: {len(successful)}/{len(test_tickers)} ({len(successful)/len(test_tickers)*100:.1f}%)")
    
    if failed:
        print(f"\n⚠️  Recommandation: Utiliser les tickers fonctionnels pour les tests")
        print(f"   Tickers recommandés: {', '.join(successful[:5])}")

if __name__ == "__main__":
    main()