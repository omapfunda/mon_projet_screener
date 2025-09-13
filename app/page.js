// frontend/app/page.js
"use client";

import { useState, useEffect } from "react";
// Assurez-vous que les imports sont corrects
import { fetchIndices, runScreening } from "../lib/api";
import ScreenerControls from "../components/ScreenerControls";
import ResultsDisplay from "../components/ResultsDisplay";
import AdvancedAnalysis from "../components/AdvancedAnalysis";

export default function Home() {
  // --- ÉTAT PRINCIPAL ---
  const [indices, setIndices] = useState([]); // Initialisé comme un tableau vide
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [screeningResults, setScreeningResults] = useState(null);
  
  const [criteria, setCriteria] = useState({
    index_name: 'CAC 40 (France)',
    pe_max: 15,
    pb_max: 1.5,
    de_max: 100,
    roe_min: 0.12,
  });

  // --- LOGIQUE DE RÉCUPÉRATION DES INDICES ---
  useEffect(() => {
    // Cette fonction s'exécute une seule fois au chargement de la page
    fetchIndices()
      .then(data => {
        // POINT CRITIQUE : On doit accéder à la clé "indices" de l'objet JSON retourné par l'API.
        // Si data est { "indices": [...] }, alors data.indices est le tableau que nous voulons.
        // Le `|| []` est une sécurité si `data.indices` est manquant pour une raison quelconque.
        setIndices(data.indices || []);
      })
      .catch(err => {
        console.error("Erreur lors du fetch des indices:", err);
        setError("Impossible de charger la liste des indices. Le backend est-il lancé ?");
      });
  }, []); // Le tableau de dépendances vide [] garantit que cela ne s'exécute qu'une fois.

  // --- GESTIONNAIRES D'ÉVÉNEMENTS ---
  const handleCriteriaChange = (name, value) => {
    setCriteria(prev => ({ ...prev, [name]: value }));
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);
    setScreeningResults(null);
    try {
      const data = await runScreening(criteria);
      setScreeningResults(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- AFFICHAGE ---
  return (
    <div className="main-layout">
      <ScreenerControls
        indices={indices}
        criteria={criteria}
        onCriteriaChange={handleCriteriaChange}
        onRunAnalysis={handleRunAnalysis}
        isLoading={loading}
      />
      <div className="content">
        <header>
          <h1>Screener de Valeur & Analyse Avancée</h1>
          <p style={{color: 'var(--text-secondary)'}}>Utilisez les paramètres sur la gauche pour lancer une analyse quantitative, puis explorez les résultats ci-dessous.</p>
        </header>

        {error && <div className="error-message">{error}</div>}
        {loading && <div className="card"><p>Analyse en cours, veuillez patienter...</p></div>}
        {screeningResults && (
          <>
            <ResultsDisplay results={screeningResults} />
            <AdvancedAnalysis results={screeningResults} />
          </>
        )}
      </div>
    </div>
  );
}