// frontend/components/FinancialAnalysis.js
"use client";

export default function FinancialAnalysis({ results }) {
  if (!results || results.length === 0) return null; // Ne rien afficher si pas de résultats

  return (
    <div style={{marginTop: '3rem'}}>
      <h2>Étape 2 : Analyse Financière Approfondie</h2>
      <p>Sélectionnez une entreprise dans le tableau ci-dessus pour l'analyser en détail.</p>
      {/* La logique pour le sélecteur, l'appel API et l'affichage des états financiers viendra ici */}
    </div>
  );
}