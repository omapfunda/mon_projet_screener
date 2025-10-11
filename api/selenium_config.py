"""
Configuration optimisée pour Selenium et Chrome sur Render
Inclut le monkey patching pour stockdx
"""

import os
import functools
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service


def get_optimized_chrome_options():
    """
    Retourne les options Chrome optimisées pour l'environnement Render
    """
    chrome_options = Options()
    
    # Options essentielles pour l'environnement de production
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--disable-extensions')
    chrome_options.add_argument('--disable-plugins')
    chrome_options.add_argument('--disable-images')
    chrome_options.add_argument('--disable-javascript')
    chrome_options.add_argument('--disable-css')
    
    # Optimisations de performance
    chrome_options.add_argument('--disable-background-timer-throttling')
    chrome_options.add_argument('--disable-backgrounding-occluded-windows')
    chrome_options.add_argument('--disable-renderer-backgrounding')
    chrome_options.add_argument('--disable-features=TranslateUI')
    chrome_options.add_argument('--disable-ipc-flooding-protection')
    
    # Gestion de la mémoire
    chrome_options.add_argument('--memory-pressure-off')
    chrome_options.add_argument('--max_old_space_size=4096')
    
    # Configuration de la fenêtre
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--start-maximized')
    
    # User agent
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    
    # Désactiver les logs verbeux
    chrome_options.add_argument('--log-level=3')
    chrome_options.add_argument('--silent')
    chrome_options.add_argument('--disable-logging')
    
    # Configuration pour les environnements conteneurisés
    chrome_options.add_argument('--disable-web-security')
    chrome_options.add_argument('--allow-running-insecure-content')
    chrome_options.add_argument('--ignore-certificate-errors')
    chrome_options.add_argument('--ignore-ssl-errors')
    chrome_options.add_argument('--ignore-certificate-errors-spki-list')
    
    # Timeouts
    chrome_options.add_argument('--timeout=30000')
    
    return chrome_options


def get_chrome_driver_path():
    """
    Retourne le chemin vers le driver Chrome
    """
    # Render utilise généralement chromedriver dans le PATH
    return None  # Utilise le chromedriver du PATH


def create_optimized_driver():
    """
    Crée un driver Chrome optimisé pour Render
    """
    try:
        chrome_options = get_optimized_chrome_options()
        driver_path = get_chrome_driver_path()
        
        if driver_path:
            service = Service(driver_path)
            driver = webdriver.Chrome(service=service, options=chrome_options)
        else:
            driver = webdriver.Chrome(options=chrome_options)
        
        # Configuration des timeouts
        driver.implicitly_wait(10)
        driver.set_page_load_timeout(30)
        driver.set_script_timeout(30)
        
        return driver
        
    except Exception as e:
        print(f"❌ Erreur lors de la création du driver Chrome: {e}")
        raise


def test_chrome_setup():
    """
    Teste la configuration Chrome
    """
    try:
        print("🧪 Test de la configuration Chrome...")
        driver = create_optimized_driver()
        
        # Test simple
        driver.get("https://www.google.com")
        title = driver.title
        print(f"✅ Chrome fonctionne! Titre de la page: {title}")
        
        driver.quit()
        return True
        
    except Exception as e:
        print(f"❌ Échec du test Chrome: {e}")
        return False


# ============================================================================
# MONKEY PATCHING POUR STOCKDX ET AUTRES BIBLIOTHÈQUES
# ============================================================================

# Sauvegarde de la classe Chrome originale
_original_chrome_init = webdriver.Chrome.__init__

def _patched_chrome_init(self, options=None, service=None, **kwargs):
    """
    Version patchée de Chrome.__init__ qui applique automatiquement
    nos options optimisées si aucune option n'est fournie
    """
    if options is None:
        print("🔧 Application automatique des options Chrome optimisées...")
        options = get_optimized_chrome_options()
    else:
        print("ℹ️  Options Chrome personnalisées détectées, conservation...")
    
    # Appel de l'initialisation originale avec nos options
    return _original_chrome_init(self, options=options, service=service, **kwargs)


def apply_selenium_monkey_patch():
    """
    Applique le monkey patch pour intercepter la création des WebDriver Chrome
    """
    print("🐒 Application du monkey patch pour Selenium...")
    webdriver.Chrome.__init__ = _patched_chrome_init
    print("✅ Monkey patch appliqué avec succès!")


def remove_selenium_monkey_patch():
    """
    Retire le monkey patch et restaure le comportement original
    """
    print("🔄 Suppression du monkey patch Selenium...")
    webdriver.Chrome.__init__ = _original_chrome_init
    print("✅ Monkey patch supprimé!")


def setup_stockdx_selenium():
    """
    Configure Selenium pour une utilisation optimale avec stockdx
    """
    print("📈 Configuration de Selenium pour stockdx...")
    apply_selenium_monkey_patch()
    
    # Test rapide pour vérifier que le patch fonctionne
    try:
        driver = webdriver.Chrome()
        driver.quit()
        print("✅ Configuration stockdx validée!")
        return True
    except Exception as e:
        print(f"❌ Erreur lors de la configuration stockdx: {e}")
        return False


# ============================================================================
# CONTEXT MANAGER POUR UTILISATION TEMPORAIRE
# ============================================================================

class StockdxSeleniumContext:
    """
    Context manager pour appliquer temporairement le monkey patch
    """
    def __enter__(self):
        apply_selenium_monkey_patch()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        remove_selenium_monkey_patch()


if __name__ == "__main__":
    # Test de la configuration
    test_chrome_setup()
    
    # Test du monkey patch
    print("\n" + "="*50)
    print("🧪 Test du monkey patch pour stockdx...")
    setup_stockdx_selenium()