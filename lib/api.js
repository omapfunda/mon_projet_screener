// Fichier : lib/api.js

// Utilise une variable d'environnement pour l'URL de base, 
// avec une valeur par défaut pour le développement local.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

/**
 * Récupère la liste des indices disponibles.
 */
export const fetchIndices = async () => {
  // Le chemin de l'endpoint reste le même
  const response = await fetch(`${API_BASE_URL}/indices`);
  if (!response.ok) {
    throw new Error("Impossible de charger les indices.");
  }
  return response.json();
};

/**
 * Lance une requête de screening au backend.
 * @param {object} params - Les critères de screening.
 */
export const runScreening = async (params) => {
  const response = await fetch(`${API_BASE_URL}/screening`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Une erreur est survenue lors du screening.");
  }
  return response.json();
};

/**
 * Récupère les états financiers pour un ticker donné.
 * @param {string} ticker - Le symbole de l'action.
 */
export const fetchFinancials = async (ticker) => {
    const response = await fetch(`${API_BASE_URL}/financials/${ticker}`);
    if (!response.ok) {
        throw new Error(`Impossible de charger les données financières pour ${ticker}.`);
    }
    return response.json();
};

// Dans lib/api.js
export const fetchAdvancedAnalysis = async (ticker) => {
    const response = await fetch(`${API_BASE_URL}/advanced-analysis/${ticker}`);
    if (!response.ok) {
        throw new Error(`L'analyse avancée a échoué pour ${ticker}.`);
    }
    return response.json();
};

export const fetchDcfValuation = async (ticker) => {
    const response = await fetch(`${API_BASE_URL}/dcf-valuation/${ticker}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `L'analyse DCF a échoué pour ${ticker}.`);
    }
    return response.json();
};

export const fetchScreeningHistory = async () => {
  const response = await fetch(`${API_BASE_URL}/screening/history`);
  if (!response.ok) {
    throw new Error("Impossible de charger l'historique des screenings.");
  }
  return response.json();
};

export const fetchScreeningDetails = async (screeningId) => {
  const response = await fetch(`${API_BASE_URL}/screening/history/${screeningId}`);
  if (!response.ok) {
    throw new Error("Impossible de charger les détails du screening.");
  }
  return response.json();
};