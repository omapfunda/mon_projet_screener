// Prototype fonctionnel - Design 2: Layout en Onglets
"use client";

import { useState, useEffect } from "react";
import { fetchIndices, runScreening } from "../lib/api";
import "./design2.css";

export default function Design2Prototype() {
  const [activeTab, setActiveTab] = useState('screening');
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
      setActiveTab('results'); // Basculer automatiquement vers les résultats
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!screeningResults) return;
    
    const headers = ['Ticker', 'Prix Actuel', 'Valeur Intrinsèque', 'Score', 'P/E', 'P/B', 'ROE', 'Potentiel'];
    const csvContent = [
      headers.join(','),
      ...screeningResults.map(stock => [
        stock.ticker,
        stock.current_price?.toFixed(2) || 'N/A',
        stock.intrinsic_value?.toFixed(2) || 'N/A',
        stock.score,
        stock.pe_ratio?.toFixed(1) || 'N/A',
        stock.pb_ratio?.toFixed(1) || 'N/A',
        (stock.roe * 100)?.toFixed(1) + '%' || 'N/A',
        stock.intrinsic_value && stock.current_price ? 
          (((stock.intrinsic_value - stock.current_price) / stock.current_price) * 100).toFixed(1) + '%' : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screening_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'screening', label: '🎯 Screening', icon: '📊' },
    { id: 'results', label: '📈 Résultats', icon: '📋' },
    { id: 'analysis', label: '🔍 Analyse', icon: '💡' }
  ];

  return (
    <div className="design2-container">
      {/* Header avec logo et titre */}
      <header className="design2-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">💎</span>
            <h1>ValueFinder</h1>
          </div>
          <p className="tagline">Votre assistant intelligent pour l'investissement de valeur</p>
        </div>
      </header>

      {/* Navigation par onglets */}
      <nav className="tabs-navigation">
        <div className="tabs-container">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              disabled={tab.id === 'results' && !screeningResults}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Contenu des onglets */}
      <main className="tab-content">
        {/* Onglet Screening */}
        {activeTab === 'screening' && (
          <div className="screening-tab">
            <div className="tab-header">
              <h2>Configuration du Screening</h2>
              <p>Définissez vos critères d'investissement pour identifier les meilleures opportunités</p>
            </div>

            <div className="screening-form">
              <div className="form-grid">
                <div className="form-section">
                  <h3>📊 Sélection du Marché</h3>
                  <div className="input-group">
                    <label>Indice de référence</label>
                    <select 
                      value={criteria.index_name}
                      onChange={(e) => handleCriteriaChange('index_name', e.target.value)}
                      className="select-input"
                    >
                      {indices.map(index => (
                        <option key={index} value={index}>{index}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-section">
                  <h3>💰 Critères de Valorisation</h3>
                  <div className="slider-group">
                    <label>P/E Ratio Maximum: <strong>{criteria.pe_max}</strong></label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={criteria.pe_max}
                      onChange={(e) => handleCriteriaChange('pe_max', parseFloat(e.target.value))}
                      className="slider"
                    />
                  </div>
                  
                  <div className="slider-group">
                    <label>P/B Ratio Maximum: <strong>{criteria.pb_max}</strong></label>
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.1"
                      value={criteria.pb_max}
                      onChange={(e) => handleCriteriaChange('pb_max', parseFloat(e.target.value))}
                      className="slider"
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>📈 Critères de Performance</h3>
                  <div className="slider-group">
                    <label>Dette/Equity Maximum: <strong>{criteria.de_max}%</strong></label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={criteria.de_max}
                      onChange={(e) => handleCriteriaChange('de_max', parseFloat(e.target.value))}
                      className="slider"
                    />
                  </div>
                  
                  <div className="slider-group">
                    <label>ROE Minimum: <strong>{(criteria.roe_min * 100).toFixed(0)}%</strong></label>
                    <input
                      type="range"
                      min="0.05"
                      max="0.3"
                      step="0.01"
                      value={criteria.roe_min}
                      onChange={(e) => handleCriteriaChange('roe_min', parseFloat(e.target.value))}
                      className="slider"
                    />
                  </div>
                </div>
              </div>

              <div className="action-section">
                <button 
                  className="primary-action-btn"
                  onClick={handleRunAnalysis}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      🚀 Lancer le Screening
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Résultats */}
        {activeTab === 'results' && (
          <div className="results-tab">
            <div className="tab-header">
              <h2>Résultats du Screening</h2>
              <p>Découvrez les actions qui correspondent à vos critères</p>
            </div>

            {error && (
              <div className="error-banner">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {screeningResults && (
              <>
                <div className="metrics-dashboard">
                  <div className="metric-card">
                    <div className="metric-value">{screeningResults.length}</div>
                    <div className="metric-label">Actions Analysées</div>
                  </div>
                  <div className="metric-card highlight">
                    <div className="metric-value">
                      {screeningResults.filter(stock => stock.intrinsic_value > stock.current_price).length}
                    </div>
                    <div className="metric-label">Sous-évaluées</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-value">
                      {screeningResults.length > 0 ? 
                        Math.round(screeningResults.reduce((acc, stock) => acc + stock.score, 0) / screeningResults.length) : 0}
                    </div>
                    <div className="metric-label">Score Moyen</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-value">
                      {screeningResults.filter(stock => stock.score >= 8).length}
                    </div>
                    <div className="metric-label">Score ≥ 8</div>
                  </div>
                </div>

                <div className="results-table-container">
                  <div className="table-header">
                    <h3>📋 Top Opportunités</h3>
                    <button className="export-btn" onClick={downloadCSV}>📥 Exporter CSV</button>
                  </div>
                  
                  <div className="table-wrapper">
                    <table className="results-table">
                      <thead>
                        <tr>
                          <th>Rang</th>
                          <th>Ticker</th>
                          <th>Prix Actuel</th>
                          <th>Valeur Intrinsèque</th>
                          <th>Potentiel</th>
                          <th>Score</th>
                          <th>P/E</th>
                          <th>P/B</th>
                          <th>ROE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {screeningResults
                          .sort((a, b) => b.score - a.score)
                          .slice(0, 15)
                          .map((stock, index) => (
                          <tr key={index} className="table-row">
                            <td className="rank-cell">{index + 1}</td>
                            <td className="ticker-cell">{stock.ticker}</td>
                            <td>{stock.current_price?.toFixed(2)}€</td>
                            <td className={stock.intrinsic_value > stock.current_price ? 'positive' : 'negative'}>
                              {stock.intrinsic_value?.toFixed(2)}€
                            </td>
                            <td className={stock.intrinsic_value > stock.current_price ? 'positive' : 'negative'}>
                              {stock.intrinsic_value && stock.current_price ? 
                                `${(((stock.intrinsic_value - stock.current_price) / stock.current_price) * 100).toFixed(1)}%` : 'N/A'}
                            </td>
                            <td className="score-cell">{stock.score}</td>
                            <td>{stock.pe_ratio?.toFixed(1)}</td>
                            <td>{stock.pb_ratio?.toFixed(1)}</td>
                            <td>{(stock.roe * 100)?.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Onglet Analyse */}
        {activeTab === 'analysis' && (
          <div className="analysis-tab">
            <div className="tab-header">
              <h2>Analyse Avancée</h2>
              <p>Approfondissez votre analyse avec des outils avancés</p>
            </div>

            <div className="analysis-tools">
              <div className="tool-card">
                <h3>🔍 Analyse DCF</h3>
                <p>Calculez la valeur intrinsèque avec un modèle de flux de trésorerie actualisés</p>
                <button className="tool-btn" onClick={() => alert('Fonctionnalité DCF à venir!')}>Lancer DCF</button>
              </div>
              
              <div className="tool-card">
                <h3>📊 Comparaison Sectorielle</h3>
                <p>Comparez les métriques avec les pairs du secteur</p>
                <button className="tool-btn" onClick={() => alert('Comparaison sectorielle à venir!')}>Comparer</button>
              </div>
              
              <div className="tool-card">
                <h3>📈 Analyse Technique</h3>
                <p>Étudiez les tendances et les niveaux de support/résistance</p>
                <button className="tool-btn" onClick={() => alert('Analyse technique à venir!')}>Analyser</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}