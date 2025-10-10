# Fichier : backend/app/schemas.py

from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional

class ScreeningRequest(BaseModel):
    """
    Modèle de données pour une requête de screening avec validation robuste.
    Valide les données envoyées par le frontend et applique des contraintes de sécurité.
    """
    index_name: str = Field(
        ..., 
        min_length=1, 
        max_length=100,
        description="Nom de l'indice boursier"
    )
    pe_max: float = Field(
        ..., 
        ge=0, 
        le=1000,
        description="Ratio P/E maximum (0-1000)"
    )
    pb_max: float = Field(
        ..., 
        ge=0, 
        le=100,
        description="Ratio P/B maximum (0-100)"
    )
    de_max: float = Field(
        ..., 
        ge=0, 
        le=10000,
        description="Ratio D/E maximum en pourcentage (0-10000)"
    )
    roe_min: float = Field(
        ..., 
        ge=-1, 
        le=10,
        description="ROE minimum en format décimal (-1 à 10, soit -100% à 1000%)"
    )
    
    @field_validator('index_name')
    @classmethod
    def validate_index_name(cls, v):
        """Validation du nom d'indice pour éviter les injections"""
        if not v or not v.strip():
            raise ValueError('Le nom de l\'indice ne peut pas être vide')
        
        # Liste des indices autorisés pour la sécurité (synchronisée avec analysis.py)
        allowed_indices = [
            'CAC 40 (France)', 'S&P 500 (USA)', 'NASDAQ 100 (USA)', 
            'DAX (Germany)', 'Dow Jones (USA)', 'Russell 2000 (USA)'
        ]
        
        if v not in allowed_indices:
            raise ValueError(f'Indice non autorisé. Indices valides: {", ".join(allowed_indices)}')
        
        return v.strip()
    
    @field_validator('pe_max', 'pb_max', 'de_max', 'roe_min')
    @classmethod
    def validate_numeric_fields(cls, v):
        """Validation supplémentaire pour les champs numériques"""
        if v is None:
            raise ValueError(f'La valeur ne peut pas être None')
        
        # Vérification des valeurs infinies ou NaN
        if not isinstance(v, (int, float)) or v != v:  # NaN check
            raise ValueError(f'La valeur doit être un nombre valide')
        
        return v
    
    class Config:
        """Configuration du modèle Pydantic"""
        # Exemples de valeurs valides
        schema_extra = {
            "example": {
                "index_name": "CAC 40 (France)",
                "pe_max": 15.0,
                "pb_max": 1.5,
                "de_max": 100.0,
                "roe_min": 0.12
            }
        }

# --- Watchlist Schemas ---

class WatchlistItem(BaseModel):
    """Modèle pour un élément de la watchlist."""
    id: int
    ticker: str
    added_date: str
    notes: Optional[str] = None

class AddToWatchlistRequest(BaseModel):
    """Modèle pour une requête d'ajout à la watchlist."""
    ticker: str = Field(..., min_length=1, max_length=10)
    notes: Optional[str] = Field(None, max_length=500)