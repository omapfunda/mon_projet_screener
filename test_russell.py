import pandas as pd
import requests

# Chercher le tableau contenant les exemples de membres du Russell 2000
url = "https://en.wikipedia.org/wiki/Russell_2000_Index"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}
response = requests.get(url, headers=headers)
response.raise_for_status()
all_tables = pd.read_html(response.text)

print(f"Nombre de tableaux trouvés: {len(all_tables)}")

# Chercher le tableau qui contient des symboles boursiers
for i, table in enumerate(all_tables):
    print(f"\n--- Tableau {i} ---")
    print(f"Forme: {table.shape}")
    print(f"Colonnes: {list(table.columns)}")
    print("Premières lignes:")
    print(table.head(3))
    
    # Vérifier si ce tableau contient des symboles boursiers
    if table.shape[1] >= 2:
        # Chercher des patterns de symboles boursiers (lettres majuscules, 2-5 caractères)
        for col_idx in range(table.shape[1]):
            col_data = table.iloc[:, col_idx].astype(str)
            symbols_like = [val for val in col_data if val.isupper() and 2 <= len(val) <= 5 and val.isalpha()]
            if len(symbols_like) > 0:
                print(f"  -> Symboles potentiels trouvés dans la colonne {col_idx}: {symbols_like[:5]}")
    
    print("-" * 50)