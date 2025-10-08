// Professional Stock Screener - Design 1: Vertical Layout with Collapsible Sidebar
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchIndices, runScreening, fetchDcfValuation } from "../lib/api";
import ResultsDisplay from "../components/ResultsDisplay";
import ScreeningHistory from "../components/ScreeningHistory";
import AdvancedAnalysis from "../components/AdvancedAnalysis";
import "./design1.css";

const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      background: '#ffffff',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#666666'
    },
    sidebar: {
      background: '#f5f5f5',
      borderRight: '1px solid #cccccc',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
    },
  collapseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    color: '#666666'
  },
  navItemActive: {
    background: '#ffd700',
    color: '#333333',
    borderRight: '3px solid #333333'
  },
  analyzeBtn: {
    width: '100%',
    padding: '16px 24px',
    background: '#ffd700',
    color: '#333333',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '20px'
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#333333',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '0'
  },
  titleIcon: {
    fontSize: '32px',
    color: '#ffd700'
  },
  exportBtn: {
    background: '#ffd700',
    color: '#333333',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },
  scoreBadge: {
    background: '#ffd700',
    color: '#333333',
    padding: '4px 12px',
    borderRadius: '20px',
    fontWeight: '600',
    fontSize: '12px'
  }
};

// Fonctions de formatage pour l'analyse DCF
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

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('screening'); // 'screening' ou 'history'
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [screeningResults, setScreeningResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // État pour l'analyse DCF
  const [valuationData, setValuationData] = useState(null);
  const [dcfLoading, setDcfLoading] = useState(false);
  const [dcfError, setDcfError] = useState(null);
  
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
      .catch(err => setError("Unable to load indices list"));
  }, []);

  // Fonction de validation des entrées utilisateur
  const validateCriteriaValue = (name, value) => {
    const numValue = parseFloat(value);
    
    // Vérification que la valeur est un nombre valide
    if (isNaN(numValue)) {
      setError(`Valeur invalide pour ${name}. Veuillez entrer un nombre valide.`);
      return false;
    }
    
    // Validation spécifique par critère
    switch (name) {
      case 'pe_max':
        if (numValue < 0 || numValue > 1000) {
          setError('Le P/E maximum doit être entre 0 et 1000');
          return false;
        }
        break;
      case 'pb_max':
        if (numValue < 0 || numValue > 100) {
          setError('Le P/B maximum doit être entre 0 et 100');
          return false;
        }
        break;
      case 'de_max':
        if (numValue < 0 || numValue > 10000) {
          setError('Le ratio D/E maximum doit être entre 0 et 10000%');
          return false;
        }
        break;
      case 'roe_min':
        if (numValue < -1 || numValue > 10) {
          setError('Le ROE minimum doit être entre -100% et 1000% (format décimal: -1 à 10)');
          return false;
        }
        break;
      default:
        break;
    }
    
    return true;
  };

  const handleCriteriaChange = (name, value) => {
    // Validation pour les critères numériques
    if (name !== 'index_name') {
      if (!validateCriteriaValue(name, value)) {
        return; // Ne pas mettre à jour si la validation échoue
      }
      // Effacer l'erreur si la validation réussit
      setError(null);
    }
    
    setCriteria(prev => ({ ...prev, [name]: value }));
  };

  const handleRunAnalysis = async () => {
    // Validation complète avant l'analyse
    const validationErrors = [];
    
    if (!criteria.index_name) {
      validationErrors.push('Veuillez sélectionner un indice');
    }
    
    if (!validateCriteriaValue('pe_max', criteria.pe_max)) {
      validationErrors.push('P/E maximum invalide');
    }
    
    if (!validateCriteriaValue('pb_max', criteria.pb_max)) {
      validationErrors.push('P/B maximum invalide');
    }
    
    if (!validateCriteriaValue('de_max', criteria.de_max)) {
      validationErrors.push('Ratio D/E maximum invalide');
    }
    
    if (!validateCriteriaValue('roe_min', criteria.roe_min)) {
      validationErrors.push('ROE minimum invalide');
    }
    
    if (validationErrors.length > 0) {
      setError(`Erreurs de validation: ${validationErrors.join(', ')}`);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await runScreening(criteria);
      setScreeningResults(data.results);
      setShowResults(true);
      setShowAnalysis(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const showSection = (section) => {
    if (section === 'screening') {
      setActiveTab('screening');
      setShowResults(false);
      setShowAnalysis(false);
    } else if (section === 'results') {
      setActiveTab('screening');
      setShowResults(true);
      setShowAnalysis(false);
    } else if (section === 'analysis') {
      setActiveTab('screening');
      setShowResults(false);
      setShowAnalysis(true);
    } else if (section === 'history') {
      setActiveTab('history');
      setShowResults(false);
      setShowAnalysis(false);
    }
  };

  const handleDcfAnalysis = async (ticker) => {
    setDcfLoading(true);
    setDcfError(null);
    setValuationData(null);
    try {
      const data = await fetchDcfValuation(ticker);
      setValuationData(data);
    } catch (err) {
      setDcfError(err.message);
    } finally {
      setDcfLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!screeningResults) return;
    
    const headers = ['Ticker', 'Current Price', 'Intrinsic Value', 'Score', 'P/E', 'P/B', 'ROE', 'Potential'];
    const csvContent = [
      headers.join(','),
      ...screeningResults.map(stock => [
        stock.symbol,
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

  return (
    <div className="design1-container" style={styles.container}>
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} style={{...styles.sidebar, width: sidebarCollapsed ? '80px' : '280px'}}>
        <div className="sidebar-header">
          <button className="collapse-btn" style={styles.collapseBtn} onClick={toggleSidebar}>
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link href="/homepage" className="nav-item" style={{textDecoration: 'none', color: 'inherit'}}>
            {!sidebarCollapsed && <span className="nav-label">🏠 Homepage</span>}
            {sidebarCollapsed && <span className="nav-label">🏠</span>}
          </Link>
          
          <button 
            className={`nav-item ${activeTab === 'screening' && !showResults && !showAnalysis ? 'active' : ''}`}
            onClick={() => showSection('screening')}
          >
            {!sidebarCollapsed && <span className="nav-label">Screening</span>}
          </button>
          
          <button 
            className={`nav-item ${showResults ? 'active' : ''} ${!screeningResults ? 'disabled' : ''}`}
            onClick={() => showSection('results')}
            disabled={!screeningResults}
          >
            {!sidebarCollapsed && <span className="nav-label">Results</span>}
          </button>
          
          <button 
            className={`nav-item ${showAnalysis ? 'active' : ''}`}
            onClick={() => showSection('analysis')}
          >
            {!sidebarCollapsed && <span className="nav-label">Analysis</span>}
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => showSection('history')}
          >
            {!sidebarCollapsed && <span className="nav-label">Historique</span>}
          </button>
        </nav>


      </aside>

      {/* Contenu principal */}
      <main className="main-content">
        <header className="content-header">
          <h1 className="page-title" style={styles.pageTitle}>
              {activeTab === 'history' ? (
                <>
                  Screening History
                </>
              ) : showResults ? (
                <>
                  Screening Results
                </>
              ) : showAnalysis ? (
                <>
                  Detailed Analysis
                </>
              ) : (
                <>
                  Stock Screening 
                </>
              )}
            </h1>
          <p className="page-subtitle">
            {activeTab === 'history' ? 'View your previous analysis and screening statistics' :
             showResults ? 'Discover the best investment opportunities' : 
             showAnalysis ? 'In-depth analysis tools for your investments' : 
             'Define your criteria to identify value stocks'}
          </p>
        </header>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* Section Historique */}
        {activeTab === 'history' && (
          <ScreeningHistory />
        )}

        {/* Section Screening */}
        {activeTab === 'screening' && !showResults && !showAnalysis && (
          <div className="hero-section">
            <div className="hero-content">
              <h2>Find Hidden Market Gems</h2>
              <p>Use our advanced screening algorithm to identify undervalued stocks with exceptional growth potential.</p>
              
              <div className="screening-layout">
                <div className="screening-controls">
                  <div className="control-group">
                    <label className="control-label">
                      Market
                    </label>
                    <select 
                      value={criteria.index_name}
                      onChange={(e) => handleCriteriaChange('index_name', e.target.value)}
                      className="control-select"
                    >
                      {indices.map(index => (
                        <option key={index} value={index}>{index}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      P/E Max: <strong>{criteria.pe_max}</strong>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={criteria.pe_max}
                      onChange={(e) => handleCriteriaChange('pe_max', parseFloat(e.target.value))}
                      className="control-slider"
                    />
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      P/B Max: <strong>{criteria.pb_max}</strong>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.1"
                      value={criteria.pb_max}
                      onChange={(e) => handleCriteriaChange('pb_max', parseFloat(e.target.value))}
                      className="control-slider"
                    />
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      Debt/Equity Max: <strong>{criteria.de_max}%</strong>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={criteria.de_max}
                      onChange={(e) => handleCriteriaChange('de_max', parseFloat(e.target.value))}
                      className="control-slider"
                    />
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      ROE Min: <strong>{(criteria.roe_min * 100).toFixed(0)}%</strong>
                    </label>
                    <input
                      type="range"
                      min="0.05"
                      max="0.3"
                      step="0.01"
                      value={criteria.roe_min}
                      onChange={(e) => handleCriteriaChange('roe_min', parseFloat(e.target.value))}
                      className="control-slider"
                    />
                  </div>

                  <button 
                    className="analyze-btn"
                    style={styles.analyzeBtn}
                    onClick={handleRunAnalysis}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Run Analysis
                      </>
                    )}
                  </button>
                </div>

                <div className="metrics-description">
                  <div className="metrics-header">
                    <h3>Value Investing Criteria</h3>
                  </div>
                  
                  <div className="metric-item">
                    <h4>P/E Ratio</h4>
                    <p>Measures stock price relative to earnings. Lower values indicate potentially undervalued stocks.</p>
                  </div>

                  <div className="metric-item">
                    <h4>P/B Ratio</h4>
                    <p>Compares market value to book value. Values below 1 may indicate undervaluation.</p>
                  </div>

                  <div className="metric-item">
                    <h4>Debt/Equity</h4>
                    <p>Measures financial leverage. Lower ratios indicate less financial risk.</p>
                  </div>

                  <div className="metric-item">
                    <h4>ROE</h4>
                    <p>Return on Equity measures profitability efficiency. Higher values indicate better management performance.</p>
                  </div>

                  <div className="scoring-section">
                    <h3>Scoring System</h3>
                    <p>Each stock receives a score based on how well it meets the value investing criteria:</p>
                    
                    <div className="score-ranges">
                      <div className="score-range excellent">
                        <span className="score-label">Excellent</span>
                        <span className="score-value">80-100</span>
                      </div>
                      <div className="score-range good">
                        <span className="score-label">Good</span>
                        <span className="score-value">60-79</span>
                      </div>
                      <div className="score-range average">
                        <span className="score-label">Average</span>
                        <span className="score-value">40-59</span>
                      </div>
                      <div className="score-range below-average">
                        <span className="score-label">Below Average</span>
                        <span className="score-value">0-39</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {activeTab === 'screening' && showResults && screeningResults && (
          <ResultsDisplay results={screeningResults} />
        )}

        {/* Analysis Section */}
          {activeTab === 'screening' && showAnalysis && !screeningResults && (
            <div className="analysis-section">
              <h2>DCF Analysis</h2>
              <div className="info-message">
                <p>Please complete Screening first to access DCF analysis.</p>
                <p>The DCF analysis will be available for the stocks found in your screening results.</p>
                <button 
                  className="btn-primary" 
                  onClick={() => showSection('screening')}
                >
                  Go to Screening
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'screening' && showAnalysis && screeningResults && screeningResults.length === 0 && (
            <div className="analysis-section">
              <h2>DCF Valuation</h2>
              <div className="info-message">
                <p>No stocks found in the screening results.</p>
                <p>Please adjust your screening criteria to find stocks for DCF analysis.</p>
                <button 
                  className="btn-primary" 
                  onClick={() => showSection('screening')}
                >
                  Adjust Screening Criteria
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'screening' && showAnalysis && screeningResults && screeningResults.length > 0 && (
            <AdvancedAnalysis results={screeningResults} />
          )}

          {activeTab === 'screening' && showAnalysis && (!screeningResults || screeningResults.length === 0) && (
            <AdvancedAnalysis results={[]} />
          )}
      </main>
    </div>
  );
}