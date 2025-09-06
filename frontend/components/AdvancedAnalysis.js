// frontend/components/AdvancedAnalysis.js
"use client";
import { useState } from 'react';
import { fetchDcfValuation } from '../lib/api';

// --- NOUVELLES FONCTIONS DE FORMATAGE ROBUSTES ---
const formatCurrency = (num) => {
    const val = parseFloat(num);
    if (isNaN(val)) return 'N/A';
    return `$${(val / 1000000).toFixed(0)}M`;
};
const formatPercent = (num) => {
    const val = parseFloat(num);
    if (isNaN(val)) return 'N/A';
    return `${(val * 100).toFixed(2)}%`;
};
const formatSharePrice = (num) => {
    const val = parseFloat(num);
    if (isNaN(val)) return 'N/A';
    return `$${val.toFixed(2)}`;
};

export default function AdvancedAnalysis({ results }) {
  const [valuationData, setValuationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleAnalyze = async (ticker) => {
    setIsLoading(true);
    setError(null);
    setValuationData(null);
    try {
      const data = await fetchDcfValuation(ticker);
      setValuationData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const ScenarioCard = ({ title, scenario }) => (
    <div className="scenario-card">
      <h4>{title}</h4>
      <p>Taux de Croissance FCF: <span>{formatPercent(scenario.assumptions.fcf_growth)}</span></p>
      <p>Taux de Croissance Perp.: <span>{formatPercent(scenario.assumptions.perp_growth)}</span></p>
      <div className="intrinsic-value">
        <label>Valeur Intrinsèque / Action</label>
        <span>{formatSharePrice(scenario.intrinsic_value)}</span>
      </div>
    </div>
  );

  return (
    <div className="card" style={{marginTop: '2rem'}}>
      <h2>Étape 2 : Valorisation DCF (via Macrotrends)</h2>
      <div className="control-group">
        <label>Choisissez une entreprise pour lancer la valorisation :</label>
        <select onChange={(e) => handleAnalyze(e.target.value)} defaultValue="">
          <option value="" disabled>Sélectionnez une entreprise...</option>
          {results.map(stock => (
            <option key={stock.symbol} value={stock.symbol}>{stock.company_name}</option>
          ))}
        </select>
      </div>

      {isLoading && <p>Analyse DCF en cours (cela peut prendre quelques secondes)...</p>}
      {error && <p className="error-message">{error}</p>}

      {valuationData && !valuationData.error && (
        <div>
          <div className="base-data-grid">
            <div className="data-point">
              <label>Année de base</label><span>{valuationData.base_data.latest_year}</span>
            </div>
            <div className="data-point">
              <label>Free Cash Flow</label><span>{formatCurrency(valuationData.base_data.base_fcf)}</span>
            </div>
            <div className="data-point">
              <label>Dette LT</label><span>{formatCurrency(valuationData.base_data.total_debt)}</span>
            </div>
            <div className="data-point">
              <label>Trésorerie</label><span>{formatCurrency(valuationData.base_data.cash)}</span>
            </div>
          </div>
          <div className="scenarios-container">
            <ScenarioCard title="Scénario 1: Prospectif" scenario={valuationData.scenario1} />
            <ScenarioCard title="Scénario 2: Historique" scenario={valuationData.scenario2} />
          </div>
        </div>
      )}
      <style jsx>{`
        .base-data-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; background: #f9fafb; padding: 1rem; border-radius: 8px; margin: 2rem 0;}
        .data-point { text-align: center; }
        .data-point label { display: block; font-size: 0.8rem; color: var(--text-secondary); }
        .data-point span { font-size: 1.2rem; font-weight: 600; }
        .scenarios-container { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .scenario-card { border: 1px solid var(--border-color); padding: 1.5rem; border-radius: var(--border-radius); }
        .scenario-card h4 { margin-top: 0; }
        .scenario-card p span { font-weight: bold; }
        .intrinsic-value { margin-top: 1.5rem; background-color: #eef5ff; padding: 1rem; text-align: center; border-radius: 8px;}
        .intrinsic-value label { display: block; font-size: 0.9rem; }
        .intrinsic-value span { font-size: 1.75rem; font-weight: 700; color: var(--primary-color); }
      `}</style>
    </div>
  );
}