// Design 1: Layout Vertical avec Sidebar Collapsible
"use client";

import { useState, useEffect } from "react";
import { fetchIndices, runScreening } from "../lib/api";

export default function Design1CollapsibleSidebar() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [indices, setIndices] = useState([]);
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

  useEffect(() => {
    fetchIndices()
      .then(data => setIndices(data.indices || []))
      .catch(err => setError("Impossible de charger la liste des indices"));
  }, []);

  const handleCriteriaChange = (name, value) => {
    setCriteria(prev => ({ ...prev, [name]: value }));
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runScreening(criteria);
      setScreeningResults(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="design1-layout">
      {/* Sidebar Collapsible */}
      <div className={`design1-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <button 
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
          {!sidebarCollapsed && <h3>Paramètres</h3>}
        </div>

        {!sidebarCollapsed && (
          <div className="controls-container">
            <div className="control-group">
              <label>📊 Indice</label>
              <select 
                value={criteria.index_name}
                onChange={(e) => handleCriteriaChange('index_name', e.target.value)}
              >
                {indices.map(index => (
                  <option key={index} value={index}>{index}</option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>💰 P/E Max: {criteria.pe_max}</label>
              <input
                type="range"
                min="5"
                max="50"
                value={criteria.pe_max}
                onChange={(e) => handleCriteriaChange('pe_max', parseFloat(e.target.value))}
              />
            </div>

            <div className="control-group">
              <label>📈 P/B Max: {criteria.pb_max}</label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={criteria.pb_max}
                onChange={(e) => handleCriteriaChange('pb_max', parseFloat(e.target.value))}
              />
            </div>

            <div className="control-group">
              <label>🏦 Dette/Equity Max: {criteria.de_max}%</label>
              <input
                type="range"
                min="0"
                max="200"
                value={criteria.de_max}
                onChange={(e) => handleCriteriaChange('de_max', parseFloat(e.target.value))}
              />
            </div>

            <div className="control-group">
              <label>📊 ROE Min: {(criteria.roe_min * 100).toFixed(0)}%</label>
              <input
                type="range"
                min="0.05"
                max="0.3"
                step="0.01"
                value={criteria.roe_min}
                onChange={(e) => handleCriteriaChange('roe_min', parseFloat(e.target.value))}
              />
            </div>

            <button 
              className="analyze-btn"
              onClick={handleRunAnalysis}
              disabled={loading}
            >
              {loading ? '🔄 Analyse...' : '🚀 Lancer l\'Analyse'}
            </button>
          </div>
        )}
      </div>

      {/* Zone de contenu principal */}
      <div className="design1-content">
        <header className="hero-section">
          <h1>🎯 Screener Financier</h1>
          <p>Découvrez les meilleures opportunités d'investissement avec notre analyse quantitative avancée</p>
        </header>

        {error && (
          <div className="alert error">
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div className="loading-card">
            <div className="spinner"></div>
            <p>Analyse en cours...</p>
          </div>
        )}

        {screeningResults && (
          <div className="results-section">
            <div className="kpi-cards">
              <div className="kpi-card">
                <h3>{screeningResults.length}</h3>
                <p>Actions analysées</p>
              </div>
              <div className="kpi-card">
                <h3>{screeningResults.filter(stock => stock.intrinsic_value > stock.current_price).length}</h3>
                <p>Sous-évaluées</p>
              </div>
              <div className="kpi-card">
                <h3>{screeningResults.length > 0 ? Math.round(screeningResults.reduce((acc, stock) => acc + stock.score, 0) / screeningResults.length) : 0}</h3>
                <p>Score moyen</p>
              </div>
            </div>

            <div className="results-table">
              <h3>📋 Résultats du Screening</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Prix</th>
                      <th>Valeur Intrinsèque</th>
                      <th>Score</th>
                      <th>P/E</th>
                      <th>ROE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {screeningResults.slice(0, 10).map((stock, index) => (
                      <tr key={index}>
                        <td><strong>{stock.ticker}</strong></td>
                        <td>{stock.current_price?.toFixed(2)}€</td>
                        <td className={stock.intrinsic_value > stock.current_price ? 'positive' : 'negative'}>
                          {stock.intrinsic_value?.toFixed(2)}€
                        </td>
                        <td>{stock.score}</td>
                        <td>{stock.pe_ratio?.toFixed(1)}</td>
                        <td>{(stock.roe * 100)?.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}