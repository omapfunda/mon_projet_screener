'use client';

import { useState, useEffect } from 'react';
import './design3.css';

const Design3Prototype = () => {
  // État pour la navigation par étapes
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  
  // États pour les données
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [screeningResults, setScreeningResults] = useState(null);
  
  // États pour les critères de screening
  const [criteria, setCriteria] = useState({
    selectedIndices: [],
    marketCap: { min: '', max: '' },
    peRatio: { min: '', max: '' },
    dividendYield: { min: '', max: '' },
    debtToEquity: { min: '', max: '' },
    currentRatio: { min: '', max: '' },
    roe: { min: '', max: '' },
    roa: { min: '', max: '' },
    profitMargin: { min: '', max: '' },
    revenueGrowth: { min: '', max: '' },
    earningsGrowth: { min: '', max: '' }
  });

  // Définition des étapes
  const steps = [
    { id: 1, title: 'Sélection du Marché', description: 'Choisissez les indices à analyser' },
    { id: 2, title: 'Configuration des Critères', description: 'Définissez vos critères de screening' },
    { id: 3, title: 'Aperçu de l\'Analyse', description: 'Vérifiez vos paramètres avant l\'exécution' },
    { id: 4, title: 'Résultats', description: 'Consultez les résultats de votre screening' }
  ];

  // Charger les indices au démarrage
  useEffect(() => {
    fetchIndices();
  }, []);

  const fetchIndices = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/indices');
      if (!response.ok) throw new Error('Erreur lors du chargement des indices');
      const data = await response.json();
      setIndices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCriteriaChange = (field, value) => {
    setCriteria(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRangeChange = (field, type, value) => {
    setCriteria(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [type]: value
      }
    }));
  };

  const runScreening = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/screen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(criteria),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du screening');
      }

      const results = await response.json();
      setScreeningResults(results);
      
      // Marquer l'étape comme complétée et passer à la suivante
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepNumber) => {
    if (stepNumber <= currentStep || completedSteps.includes(stepNumber)) {
      setCurrentStep(stepNumber);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return criteria.selectedIndices.length > 0;
      case 2:
        return Object.values(criteria).some(value => {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return value.min !== '' || value.max !== '';
          }
          return false;
        });
      case 3:
        return true;
      default:
        return false;
    }
  };

  const downloadCSV = () => {
    if (!screeningResults || !screeningResults.results) return;
    
    const headers = ['Symbole', 'Nom', 'Prix', 'Market Cap', 'P/E Ratio', 'Dividend Yield'];
    const csvContent = [
      headers.join(','),
      ...screeningResults.results.map(stock => 
        [stock.symbol, stock.name, stock.price, stock.market_cap, stock.pe_ratio, stock.dividend_yield].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'screening_results.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="design3-container">
      {/* En-tête */}
      <header className="design3-header">
        <h1>Stock Screener - Analyse Progressive</h1>
        <p>Suivez les étapes pour configurer et exécuter votre analyse</p>
      </header>

      {/* Indicateur de progression */}
      <div className="progress-container">
        <div className="progress-bar">
          {steps.map((step, index) => (
            <div key={step.id} className="progress-step-container">
              <div 
                className={`progress-step ${
                  currentStep === step.id ? 'active' : 
                  completedSteps.includes(step.id) ? 'completed' : 'pending'
                }`}
                onClick={() => goToStep(step.id)}
              >
                <div className="step-number">
                  {completedSteps.includes(step.id) ? '✓' : step.id}
                </div>
                <div className="step-info">
                  <div className="step-title">{step.title}</div>
                  <div className="step-description">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`progress-connector ${
                  completedSteps.includes(step.id) ? 'completed' : ''
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contenu principal */}
      <main className="design3-main">
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Étape 1: Sélection du Marché */}
        {currentStep === 1 && (
          <div className="step-panel">
            <h2>Étape 1: Sélection du Marché</h2>
            <p>Choisissez les indices boursiers que vous souhaitez analyser :</p>
            
            <div className="market-selection">
              {loading ? (
                <div className="loading-spinner">Chargement des indices...</div>
              ) : (
                <div className="indices-grid">
                  {Array.isArray(indices) && indices.map(index => (
                    <label key={index} className="index-card">
                      <input
                        type="checkbox"
                        checked={criteria.selectedIndices.includes(index)}
                        onChange={(e) => {
                          const newIndices = e.target.checked
                            ? [...criteria.selectedIndices, index]
                            : criteria.selectedIndices.filter(i => i !== index);
                          handleCriteriaChange('selectedIndices', newIndices);
                        }}
                      />
                      <span className="index-name">{index}</span>
                    </label>
                  ))}
                  {!Array.isArray(indices) && !loading && (
                    <div className="no-indices">Aucun indice disponible</div>
                  )}
                </div>
              )}
            </div>

            <div className="step-actions">
              <button 
                className="btn btn-primary"
                onClick={nextStep}
                disabled={!canProceedToNextStep()}
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* Étape 2: Configuration des Critères */}
        {currentStep === 2 && (
          <div className="step-panel">
            <h2>Étape 2: Configuration des Critères</h2>
            <p>Définissez vos critères de screening financier :</p>
            
            <div className="criteria-grid">
              <div className="criteria-group">
                <h3>Valorisation</h3>
                <div className="range-input">
                  <label>Market Cap (M$)</label>
                  <div className="range-controls">
                    <input
                      type="number"
                      placeholder="Min"
                      value={criteria.marketCap.min}
                      onChange={(e) => handleRangeChange('marketCap', 'min', e.target.value)}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={criteria.marketCap.max}
                      onChange={(e) => handleRangeChange('marketCap', 'max', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="range-input">
                  <label>P/E Ratio</label>
                  <div className="range-controls">
                    <input
                      type="number"
                      placeholder="Min"
                      value={criteria.peRatio.min}
                      onChange={(e) => handleRangeChange('peRatio', 'min', e.target.value)}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={criteria.peRatio.max}
                      onChange={(e) => handleRangeChange('peRatio', 'max', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="criteria-group">
                <h3>Dividendes & Ratios</h3>
                <div className="range-input">
                  <label>Dividend Yield (%)</label>
                  <div className="range-controls">
                    <input
                      type="number"
                      placeholder="Min"
                      value={criteria.dividendYield.min}
                      onChange={(e) => handleRangeChange('dividendYield', 'min', e.target.value)}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={criteria.dividendYield.max}
                      onChange={(e) => handleRangeChange('dividendYield', 'max', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="range-input">
                  <label>Current Ratio</label>
                  <div className="range-controls">
                    <input
                      type="number"
                      placeholder="Min"
                      value={criteria.currentRatio.min}
                      onChange={(e) => handleRangeChange('currentRatio', 'min', e.target.value)}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={criteria.currentRatio.max}
                      onChange={(e) => handleRangeChange('currentRatio', 'max', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="criteria-group">
                <h3>Rentabilité</h3>
                <div className="range-input">
                  <label>ROE (%)</label>
                  <div className="range-controls">
                    <input
                      type="number"
                      placeholder="Min"
                      value={criteria.roe.min}
                      onChange={(e) => handleRangeChange('roe', 'min', e.target.value)}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={criteria.roe.max}
                      onChange={(e) => handleRangeChange('roe', 'max', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="range-input">
                  <label>Profit Margin (%)</label>
                  <div className="range-controls">
                    <input
                      type="number"
                      placeholder="Min"
                      value={criteria.profitMargin.min}
                      onChange={(e) => handleRangeChange('profitMargin', 'min', e.target.value)}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={criteria.profitMargin.max}
                      onChange={(e) => handleRangeChange('profitMargin', 'max', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="step-actions">
              <button className="btn btn-secondary" onClick={prevStep}>
                ← Retour
              </button>
              <button 
                className="btn btn-primary"
                onClick={nextStep}
                disabled={!canProceedToNextStep()}
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* Étape 3: Aperçu de l'Analyse */}
        {currentStep === 3 && (
          <div className="step-panel">
            <h2>Étape 3: Aperçu de l'Analyse</h2>
            <p>Vérifiez vos paramètres avant de lancer l'analyse :</p>
            
            <div className="preview-summary">
              <div className="summary-section">
                <h3>Indices sélectionnés</h3>
                <div className="selected-indices">
                  {criteria.selectedIndices.length > 0 ? (
                    criteria.selectedIndices.map(index => (
                      <span key={index} className="index-tag">{index}</span>
                    ))
                  ) : (
                    <span className="no-selection">Aucun indice sélectionné</span>
                  )}
                </div>
              </div>

              <div className="summary-section">
                <h3>Critères configurés</h3>
                <div className="criteria-summary">
                  {Object.entries(criteria).map(([key, value]) => {
                    if (key === 'selectedIndices' || !value || typeof value !== 'object') return null;
                    if (value.min === '' && value.max === '') return null;
                    
                    return (
                      <div key={key} className="criteria-item">
                        <span className="criteria-name">{key}</span>
                        <span className="criteria-range">
                          {value.min && `Min: ${value.min}`}
                          {value.min && value.max && ' | '}
                          {value.max && `Max: ${value.max}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="step-actions">
              <button className="btn btn-secondary" onClick={prevStep}>
                ← Retour
              </button>
              <button 
                className="btn btn-primary btn-analyze"
                onClick={runScreening}
                disabled={loading || criteria.selectedIndices.length === 0}
              >
                {loading ? 'Analyse en cours...' : 'Lancer l\'Analyse →'}
              </button>
            </div>
          </div>
        )}

        {/* Étape 4: Résultats */}
        {currentStep === 4 && (
          <div className="step-panel">
            <h2>Étape 4: Résultats de l'Analyse</h2>
            
            {loading && (
              <div className="loading-container">
                <div className="loading-spinner">Analyse en cours...</div>
              </div>
            )}

            {screeningResults && (
              <div className="results-dashboard">
                <div className="results-summary">
                  <div className="summary-card">
                    <h3>Actions trouvées</h3>
                    <div className="summary-value">{screeningResults.total_results}</div>
                  </div>
                  <div className="summary-card">
                    <h3>Indices analysés</h3>
                    <div className="summary-value">{criteria.selectedIndices.length}</div>
                  </div>
                  <div className="summary-card">
                    <h3>Critères appliqués</h3>
                    <div className="summary-value">
                      {Object.values(criteria).filter(v => 
                        typeof v === 'object' && v !== null && !Array.isArray(v) && 
                        (v.min !== '' || v.max !== '')
                      ).length}
                    </div>
                  </div>
                </div>

                <div className="results-actions">
                  <button className="btn btn-secondary" onClick={downloadCSV}>
                    📊 Télécharger CSV
                  </button>
                  <button className="btn btn-primary" onClick={() => setCurrentStep(1)}>
                    🔄 Nouvelle Analyse
                  </button>
                </div>

                <div className="results-table-container">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Symbole</th>
                        <th>Nom</th>
                        <th>Prix</th>
                        <th>Market Cap</th>
                        <th>P/E Ratio</th>
                        <th>Dividend Yield</th>
                      </tr>
                    </thead>
                    <tbody>
                      {screeningResults.results?.map((stock, index) => (
                        <tr key={index}>
                          <td className="symbol-cell">{stock.symbol}</td>
                          <td>{stock.name}</td>
                          <td>${stock.price?.toFixed(2) || 'N/A'}</td>
                          <td>{stock.market_cap ? `$${(stock.market_cap / 1000000).toFixed(0)}M` : 'N/A'}</td>
                          <td>{stock.pe_ratio?.toFixed(2) || 'N/A'}</td>
                          <td>{stock.dividend_yield ? `${stock.dividend_yield.toFixed(2)}%` : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!screeningResults && !loading && (
              <div className="no-results">
                <p>Aucun résultat disponible. Veuillez relancer l'analyse.</p>
                <button className="btn btn-primary" onClick={() => setCurrentStep(1)}>
                  Recommencer l'Analyse
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Design3Prototype;