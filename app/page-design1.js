// Professional Stock Screener - Design 1: Vertical Layout with Collapsible Sidebar
"use client";

import { useState, useEffect } from "react";
import { fetchIndices, runScreening } from "../lib/api";
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

export default function Design1Prototype() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [screeningResults, setScreeningResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
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

  const handleCriteriaChange = (name, value) => {
    setCriteria(prev => ({ ...prev, [name]: value }));
  };

  const handleRunAnalysis = async () => {
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
      setShowResults(false);
      setShowAnalysis(false);
    } else if (section === 'results') {
      setShowResults(true);
      setShowAnalysis(false);
    } else if (section === 'analysis') {
      setShowResults(false);
      setShowAnalysis(true);
    }
  };

  const downloadCSV = () => {
    if (!screeningResults) return;
    
    const headers = ['Ticker', 'Current Price', 'Intrinsic Value', 'Score', 'P/E', 'P/B', 'ROE', 'Potential'];
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
          <button 
            className={`nav-item ${!showResults && !showAnalysis ? 'active' : ''}`}
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
        </nav>

        {/* Screening controls in the sidebar */}
        {!sidebarCollapsed && !showResults && !showAnalysis && (
          <div className="sidebar-controls">
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
        )}
      </aside>

      {/* Contenu principal */}
      <main className="main-content">
        <header className="content-header">
          <h1 className="page-title" style={styles.pageTitle}>
              {showResults ? (
                <>
                  Screening Results
                </>
              ) : showAnalysis ? (
                <>
                  Detailed Analysis
                </>
              ) : (
                <>
                  Screening Configuration
                </>
              )}
            </h1>
          <p className="page-subtitle">
            {showResults ? 'Discover the best investment opportunities' : 
             showAnalysis ? 'In-depth analysis tools for your investments' : 
             'Define your criteria to identify value stocks'}
          </p>
        </header>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* Section Screening */}
        {!showResults && !showAnalysis && (
          <div className="hero-section">
            <div className="hero-content">
              <h2>Find Hidden Market Gems</h2>
              <p>Use our advanced screening algorithm to identify undervalued stocks with exceptional growth potential.</p>
              
              {sidebarCollapsed && (
                <div className="quick-controls">
                  <div className="quick-control-row">
                    <div className="quick-control">
                      <label>Market</label>
                      <select 
                        value={criteria.index_name}
                        onChange={(e) => handleCriteriaChange('index_name', e.target.value)}
                      >
                        {indices.map(index => (
                          <option key={index} value={index}>{index}</option>
                        ))}
                      </select>
                    </div>
                    <div className="quick-control">
                      <label>P/E Max: {criteria.pe_max}</label>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        value={criteria.pe_max}
                        onChange={(e) => handleCriteriaChange('pe_max', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="quick-control-row">
                    <div className="quick-control">
                      <label>P/B Max: {criteria.pb_max}</label>
                      <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        value={criteria.pb_max}
                        onChange={(e) => handleCriteriaChange('pb_max', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="quick-control">
                      <label>ROE Min: {(criteria.roe_min * 100).toFixed(0)}%</label>
                      <input
                        type="range"
                        min="0.05"
                        max="0.3"
                        step="0.01"
                        value={criteria.roe_min}
                        onChange={(e) => handleCriteriaChange('roe_min', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>

                  <button 
                    className="hero-cta-btn"
                    onClick={handleRunAnalysis}
                    disabled={loading}
                  >
                    {loading ? 'Analysis in progress...' : 'Launch Screening'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Section */}
        {showResults && screeningResults && (
          <div className="results-section">
            <div className="results-summary">
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="card-content">
                    <div className="card-value">{screeningResults.length}</div>
                    <div className="card-label">Stocks Analyzed</div>
                  </div>
                </div>
                
                <div className="summary-card highlight">
                  <div className="card-content">
                    <div className="card-value">
                      {screeningResults.filter(stock => stock.intrinsic_value > stock.current_price).length}
                    </div>
                    <div className="card-label">Undervalued</div>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="card-content">
                    <div className="card-value">
                      {screeningResults.length > 0 ? 
                        Math.round(screeningResults.reduce((acc, stock) => acc + stock.score, 0) / screeningResults.length) : 0}
                    </div>
                    <div className="card-label">Average Score</div>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="card-content">
                    <div className="card-value">
                      {screeningResults.filter(stock => stock.score >= 8).length}
                    </div>
                    <div className="card-label">Score ≥ 8</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="results-table-section">
              <div className="table-header">
                <h3>Top Opportunities</h3>
                <button className="export-btn" style={styles.exportBtn} onClick={downloadCSV}>
                  Export CSV
                </button>
              </div>
              
              <div className="table-container">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Ticker</th>
                      <th>Current Price</th>
                      <th>Intrinsic Value</th>
                      <th>Potential</th>
                      <th>Score</th>
                      <th>P/E</th>
                      <th>P/B</th>
                      <th>ROE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {screeningResults
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 20)
                      .map((stock, index) => (
                      <tr key={index} className="table-row">
                        <td className="rank-cell">
                          <span className="rank-badge">{index + 1}</span>
                        </td>
                        <td className="ticker-cell">
                          <strong>{stock.ticker}</strong>
                        </td>
                        <td className="price-cell">${stock.current_price?.toFixed(2)}</td>
                        <td className={`intrinsic-cell ${stock.intrinsic_value > stock.current_price ? 'positive' : 'negative'}`}>
                          ${stock.intrinsic_value?.toFixed(2)}
                        </td>
                        <td className={`potential-cell ${stock.intrinsic_value > stock.current_price ? 'positive' : 'negative'}`}>
                          {stock.intrinsic_value && stock.current_price ? 
                            `${(((stock.intrinsic_value - stock.current_price) / stock.current_price) * 100).toFixed(1)}%` : 'N/A'}
                        </td>
                        <td className="score-cell">
                          <span className="score-badge" style={styles.scoreBadge}>{stock.score}</span>
                        </td>
                        <td>{stock.pe_ratio?.toFixed(1)}</td>
                        <td>{stock.pb_ratio?.toFixed(1)}</td>
                        <td className="roe-cell">{(stock.roe * 100)?.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Section */}
        {showAnalysis && (
          <div className="analysis-section">
            <div className="analysis-grid">
              <div className="analysis-card">
                <div className="card-header">
                  <h3>DCF Analysis</h3>
                </div>
                <p>Calculate intrinsic value with a custom discounted cash flow model.</p>
                <button className="analysis-btn" onClick={() => alert('DCF functionality coming soon!')}>
                  Launch DCF
                </button>
              </div>
              
              <div className="analysis-card">
                <div className="card-header">
                  <h3>Sector Comparison</h3>
                </div>
                <p>Compare financial metrics with peers from the same industry sector.</p>
                <button className="analysis-btn" onClick={() => alert('Sector comparison coming soon!')}>
                  Compare
                </button>
              </div>
              
              <div className="analysis-card">
                <div className="card-header">
                  <h3>Technical Analysis</h3>
                </div>
                <p>Study trends, support, resistance and technical indicators.</p>
                <button className="analysis-btn" onClick={() => alert('Technical analysis coming soon!')}>
                  Analyze
                </button>
              </div>
              
              <div className="analysis-card">
                <div className="card-header">
                  <h3>Detailed Report</h3>
                </div>
                <p>Generate a comprehensive report with all metrics and analyses.</p>
                <button className="analysis-btn" onClick={() => alert('Detailed report coming soon!')}>
                  Generate
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}