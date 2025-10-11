# Configuration Selenium optimisée pour stockdx

## Vue d'ensemble

Ce projet utilise `stockdx` pour récupérer des données financières via web scraping. Pour optimiser les performances et la compatibilité avec les environnements de déploiement (notamment Docker), nous avons implémenté une configuration Selenium personnalisée.

## Problème résolu

`stockdx` utilise Selenium en interne mais ne permet pas de configurer facilement les options Chrome. Cela pose des problèmes dans les environnements containerisés où Chrome doit fonctionner en mode headless avec des options spécifiques.

## Solution implémentée

### 1. Monkey Patching de Selenium

Le fichier `selenium_config.py` implémente un système de "monkey patching" qui :

- Intercepte la création d'instances `webdriver.Chrome`
- Applique automatiquement des options Chrome optimisées
- Maintient la compatibilité avec le code existant

### 2. Options Chrome optimisées

```python
CHROME_OPTIONS = [
    "--headless=new",           # Mode headless moderne
    "--no-sandbox",             # Requis pour Docker
    "--disable-dev-shm-usage",  # Évite les problèmes de mémoire partagée
    "--disable-gpu",            # Désactive le GPU (non nécessaire en headless)
    "--disable-web-security",   # Évite les problèmes CORS
    "--disable-features=VizDisplayCompositor",
    "--window-size=1920,1080",  # Taille de fenêtre fixe
    "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
]
```

### 3. Configuration automatique

Dans `analysis.py` et `fmp_analysis.py`, nous appelons `setup_stockdx_selenium()` avant d'importer `stockdx` :

```python
from selenium_config import setup_stockdx_selenium
setup_stockdx_selenium()  # Configure Selenium avant l'import
from stockdx import Ticker as StockdxTicker
```

## Utilisation

### Environnement local

```python
from selenium_config import setup_stockdx_selenium
setup_stockdx_selenium()

from stockdx import Ticker
ticker = Ticker("AAPL")
data = ticker.macrotrends_income_statement()
```

### Gestionnaire de contexte

Pour une utilisation temporaire :

```python
from selenium_config import StockdxSeleniumContext

with StockdxSeleniumContext():
    from stockdx import Ticker
    ticker = Ticker("AAPL")
    data = ticker.macrotrends_income_statement()
```

## Configuration Docker

### Variables d'environnement

Le Dockerfile définit des variables d'environnement spécifiques :

```dockerfile
ENV CHROME_NO_SANDBOX=1
ENV CHROME_DISABLE_DEV_SHM_USAGE=1
ENV CHROME_DISABLE_GPU=1
ENV SELENIUM_HEADLESS=1
```

### Test de démarrage

Le script `start.sh` inclut un test rapide de la configuration :

```bash
python -c "from selenium_config import setup_stockdx_selenium; setup_stockdx_selenium()"
```

## Tests

### Test local
```bash
python test_stockdx.py           # Test basique
python test_stockdx_selenium.py  # Test complet avec Selenium
```

### Test Docker
```bash
python test_docker_stockdx.py    # Test spécifique pour Docker
```

## Avantages

1. **Compatibilité Docker** : Fonctionne dans les environnements containerisés
2. **Performance** : Options Chrome optimisées pour le web scraping
3. **Transparence** : Aucune modification du code `stockdx` nécessaire
4. **Flexibilité** : Peut être activé/désactivé facilement
5. **Robustesse** : Gestion d'erreurs et fallback

## Dépannage

### Chrome ne démarre pas
- Vérifiez que Chrome est installé : `google-chrome-stable --version`
- Vérifiez les permissions dans Docker
- Assurez-vous que `--no-sandbox` est activé

### Erreurs de mémoire
- L'option `--disable-dev-shm-usage` devrait résoudre les problèmes de mémoire partagée
- Augmentez la mémoire allouée au conteneur si nécessaire

### Timeout de réseau
- Les fonctions `stockdx` peuvent prendre du temps en raison du web scraping
- Ajustez les timeouts si nécessaire dans votre code

## Fichiers modifiés

- `selenium_config.py` : Configuration principale
- `analysis.py` : Intégration pour l'analyse FMP
- `fmp_analysis.py` : Intégration pour l'analyse FMP
- `Dockerfile` : Variables d'environnement optimisées
- `start.sh` : Test de configuration au démarrage
- `requirements.txt` : Dépendance `stockdx` ajoutée