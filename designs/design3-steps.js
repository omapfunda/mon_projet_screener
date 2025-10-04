// Design 3: Layout en Étapes Progressives
"use client";

import { useState, useEffect } from "react";
import { fetchIndices, runScreening } from "../lib/api";

export default function Design3StepsLayout() {
  const [currentStep, setCurrentStep] = useState(1);
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

  const steps = [
    { id: 1, title: "Sélection", description: "Choisissez votre marché", icon: "🎯" },
    { id: 2, title: "Critères", description: "Définissez vos paramètres", icon: "⚙️" },
    { id: 3, title: "Analyse", description: "Lancez le screening", icon: "🚀" },
    { id: 4, title: "Résultats", description: "Découvrez les opportunités", icon: "📊" }
  ];

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
      setCurrentStep(4); // Aller directement aux résultats
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return criteria.index_name;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <div className="design3-container">
      {/* Header avec progression */}
      <header className="design3-header">
        <div className="header-content">
          <h1>🎯 Assistant Screening</h1>
          <p>Trouvez les meilleures opportunités d'investissement en 4 étapes simples</p>
        </div>
        
        {/* Barre de progression */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
          <div className="steps-indicator">
            {steps.map(step => (
              <div 
                key={step.id}
                className={`step-indicator ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}
                onClick={() => setCurrentStep(step.id)}
              >
                <div className="step-circle">
                  <span className="step-icon">{step.icon}</span>
                </div>
                <div className="step-info">
                  <div className="step-title">{step.title}</div>
                  <div className="step-description">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="step-content">
        {/* Étape 1: Sélection du marché */}
        {currentStep === 1 && (
          <div className="step-panel">
            <div className="step-header">
              <h2>🎯 Étape 1: Sélection du Marché</h2>
              <p>Choisissez l'indice boursier que vous souhaitez analyser</p>
            </div>

            <div className="market-selection">
              <div className="market-grid">
                {indices.map(index => (
                  <div 
                    key={index}
                    className={`market-card ${criteria.index_name === index ? 'selected' : ''}`}
                    onClick={() => handleCriteriaChange('index_name', index)}
                  >
                    <div className="market-icon">
                      {index.includes('CAC') ? '🇫🇷' : 
                       index.includes('DAX') ? '🇩🇪' : 
                       index.includes('FTSE') ? '🇬🇧' : 
                       index.includes('S&P') ? '🇺🇸' : '🌍'}
                    </div>
                    <div className="market-name">{index}</div>
                    <div className="market-description">
                      {index.includes('CAC') ? 'Marché français' : 
                       index.includes('DAX') ? 'Marché allemand' : 
                       index.includes('FTSE') ? 'Marché britannique' : 
                       index.includes('S&P') ? 'Marché américain' : 'Marché international'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="step-actions">
              <button 
                className="next-btn"
                onClick={nextStep}
                disabled={!canProceed()}
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* Étape 2: Configuration des critères */}
        {currentStep === 2 && (
          <div className="step-panel">
            <div className="step-header">
              <h2>⚙️ Étape 2: Configuration des Critères</h2>
              <p>Définissez vos critères d'investissement pour filtrer les actions</p>
            </div>

            <div className="criteria-configuration">
              <div className="criteria-grid">
                <div className="criteria-section">
                  <div className="criteria-header">
                    <h3>💰 Valorisation</h3>
                    <p>Critères de prix et de valeur</p>
                  </div>
                  
                  <div className="criteria-item">
                    <div className="criteria-label">
                      <span>P/E Ratio Maximum</span>
                      <span className="criteria-value">{criteria.pe_max}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={criteria.pe_max}
                      onChange={(e) => handleCriteriaChange('pe_max', parseFloat(e.target.value))}
                      className="criteria-slider"
                    />
                    <div className="slider-labels">
                      <span>5</span>
                      <span>50</span>
                    </div>
                  </div>

                  <div className="criteria-item">
                    <div className="criteria-label">
                      <span>P/B Ratio Maximum</span>
                      <span className="criteria-value">{criteria.pb_max}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.1"
                      value={criteria.pb_max}
                      onChange={(e) => handleCriteriaChange('pb_max', parseFloat(e.target.value))}
                      className="criteria-slider"
                    />
                    <div className="slider-labels">
                      <span>0.5</span>
                      <span>5.0</span>
                    </div>
                  </div>
                </div>

                <div className="criteria-section">
                  <div className="criteria-header">
                    <h3>📈 Performance</h3>
                    <p>Critères de rentabilité et de risque</p>
                  </div>
                  
                  <div className="criteria-item">
                    <div className="criteria-label">
                      <span>Dette/Equity Maximum</span>
                      <span className="criteria-value">{criteria.de_max}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={criteria.de_max}
                      onChange={(e) => handleCriteriaChange('de_max', parseFloat(e.target.value))}
                      className="criteria-slider"
                    />
                    <div className="slider-labels">
                      <span>0%</span>
                      <span>200%</span>
                    </div>
                  </div>

                  <div className="criteria-item">
                    <div className="criteria-label">
                      <span>ROE Minimum</span>
                      <span className="criteria-value">{(criteria.roe_min * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.3"
                      step="0.01"
                      value={criteria.roe_min}
                      onChange={(e) => handleCriteriaChange('roe_min', parseFloat(e.target.value))}
                      className="criteria-slider"
                    />
                    <div className="slider-labels">
                      <span>5%</span>
                      <span>30%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="criteria-summary">
                <h4>📋 Résumé de vos critères</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span>Marché:</span>
                    <strong>{criteria.index_name}</strong>
                  </div>
                  <div className="summary-item">
                    <span>P/E Max:</span>
                    <strong>{criteria.pe_max}</strong>
                  </div>
                  <div className="summary-item">
                    <span>P/B Max:</span>
                    <strong>{criteria.pb_max}</strong>
                  </div>
                  <div className="summary-item">
                    <span>D/E Max:</span>
                    <strong>{criteria.de_max}%</strong>
                  </div>
                  <div className="summary-item">
                    <span>ROE Min:</span>
                    <strong>{(criteria.roe_min * 100).toFixed(0)}%</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="step-actions">
              <button className="prev-btn" onClick={prevStep}>
                ← Retour
              </button>
              <button className="next-btn" onClick={nextStep}>
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* Étape 3: Lancement de l'analyse */}
        {currentStep === 3 && (
          <div className="step-panel">
            <div className="step-header">
              <h2>🚀 Étape 3: Lancement de l'Analyse</h2>
              <p>Prêt à découvrir les meilleures opportunités d'investissement ?</p>
            </div>

            <div className="analysis-preview">
              <div className="preview-card">
                <h3>🎯 Configuration Finale</h3>
                <div className="config-details">
                  <div className="config-row">
                    <span>📊 Marché sélectionné:</span>
                    <strong>{criteria.index_name}</strong>
                  </div>
                  <div className="config-row">
                    <span>💰 P/E Maximum:</span>
                    <strong>{criteria.pe_max}</strong>
                  </div>
                  <div className="config-row">
                    <span>📈 P/B Maximum:</span>
                    <strong>{criteria.pb_max}</strong>
                  </div>
                  <div className="config-row">
                    <span>🏦 D/E Maximum:</span>
                    <strong>{criteria.de_max}%</strong>
                  </div>
                  <div className="config-row">
                    <span>📊 ROE Minimum:</span>
                    <strong>{(criteria.roe_min * 100).toFixed(0)}%</strong>
                  </div>
                </div>
              </div>

              <div className="analysis-info">
                <h4>🔍 Ce que nous allons analyser:</h4>
                <ul>
                  <li>✅ Filtrage des actions selon vos critères</li>
                  <li>✅ Calcul des scores de valeur</li>
                  <li>✅ Estimation des valeurs intrinsèques</li>
                  <li>✅ Identification des opportunités sous-évaluées</li>
                </ul>
              </div>
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <div className="step-actions">
              <button className="prev-btn" onClick={prevStep}>
                ← Retour
              </button>
              <button 
                className="launch-btn"
                onClick={handleRunAnalysis}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    🚀 Lancer l'Analyse
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Étape 4: Résultats */}
        {currentStep === 4 && screeningResults && (
          <div className="step-panel">
            <div className="step-header">
              <h2>📊 Étape 4: Vos Résultats</h2>
              <p>Découvrez les meilleures opportunités d'investissement identifiées</p>
            </div>

            <div className="results-dashboard">
              <div className="results-summary">
                <div className="summary-card highlight">
                  <div className="summary-number">{screeningResults.length}</div>
                  <div className="summary-label">Actions Analysées</div>
                </div>
                <div className="summary-card success">
                  <div className="summary-number">
                    {screeningResults.filter(stock => stock.intrinsic_value > stock.current_price).length}
                  </div>
                  <div className="summary-label">Sous-évaluées</div>
                </div>
                <div className="summary-card info">
                  <div className="summary-number">
                    {screeningResults.filter(stock => stock.score >= 8).length}
                  </div>
                  <div className="summary-label">Score ≥ 8</div>
                </div>
              </div>

              <div className="top-opportunities">
                <h3>🏆 Top 5 Opportunités</h3>
                <div className="opportunities-list">
                  {screeningResults
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5)
                    .map((stock, index) => (
                    <div key={index} className="opportunity-card">
                      <div className="opportunity-rank">#{index + 1}</div>
                      <div className="opportunity-info">
                        <div className="opportunity-ticker">{stock.ticker}</div>
                        <div className="opportunity-metrics">
                          <span>Score: <strong>{stock.score}</strong></span>
                          <span>P/E: <strong>{stock.pe_ratio?.toFixed(1)}</strong></span>
                          <span>ROE: <strong>{(stock.roe * 100)?.toFixed(1)}%</strong></span>
                        </div>
                      </div>
                      <div className="opportunity-price">
                        <div className="current-price">{stock.current_price?.toFixed(2)}€</div>
                        <div className={`intrinsic-price ${stock.intrinsic_value > stock.current_price ? 'positive' : 'negative'}`}>
                          Valeur: {stock.intrinsic_value?.toFixed(2)}€
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="step-actions">
              <button className="restart-btn" onClick={() => setCurrentStep(1)}>
                🔄 Nouvelle Analyse
              </button>
              <button className="export-btn">
                📥 Exporter les Résultats
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}