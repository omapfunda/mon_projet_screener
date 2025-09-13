# Fichier : backend/app/schemas.py

from pydantic import BaseModel

class ScreeningRequest(BaseModel):
    """
    Modèle de données pour une requête de screening.
    Valide les données envoyées par le frontend.
    """
    index_name: str
    pe_max: float
    pb_max: float
    de_max: float
    roe_min: float