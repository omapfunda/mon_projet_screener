'use client';

import { useState, useEffect } from 'react';
import './design4.css';

const Design4Prototype = () => {
  // État pour la navigation
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // États pour les données
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [screeningResults, setScreeningResults] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  
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

  // Sections de navigation
  const navigationSections = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'screening', name: 'Screening', icon: '🔍' },
    { id: 'watchlist', name: 'Watchlist', icon: '⭐' },
    { id: 'analysis', name: 'Analysis', icon: '📈' },
    { id: 'history', name: 'History', icon: '📋' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ];

  // Charger les indices au démarrage
  useEffect(() => {
    fetchIndices();
    // Simuler des données de watchlist
    setWatchlist([
      { symbol: 'AAPL', name: 'Apple Inc.', price: 195.00, change: '+2.5%', changeValue: '+4.75' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 380.00, change: '+1.2%', changeValue: '+4.50' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 140.00, change: '-0.8%', changeValue: '-1.12' }
    ]);
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
      setActiveSection('results');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = (stock) => {
    if (!watchlist.find(item => item.symbol === stock.symbol)) {
      setWatchlist(prev => [...prev, {
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change: '+0.0%',
        changeValue: '+0.00'
      }]);
    }
  };

  const removeFromWatchlist = (symbol) => {
    setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
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

  // Rendu du Dashboard
  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Market Overview</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setActiveSection('screening')}>
            🔍 New Screening
          </button>
          <button className="btn btn-secondary">
            📊 Export Report
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* KPI Cards */}
        <div className="kpi-section">
          <div className="kpi-card">
            <div className="kpi-icon">📈</div>
            <div className="kpi-content">
              <h3>Total Stocks</h3>
              <div className="kpi-value">2,847</div>
              <div className="kpi-change positive">+12 today</div>
            </div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon">⭐</div>
            <div className="kpi-content">
              <h3>Watchlist</h3>
              <div className="kpi-value">{watchlist.length}</div>
              <div className="kpi-change neutral">stocks tracked</div>
            </div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon">🎯</div>
            <div className="kpi-content">
              <h3>Last Screening</h3>
              <div className="kpi-value">{screeningResults?.total_results || 0}</div>
              <div className="kpi-change neutral">results found</div>
            </div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon">📊</div>
            <div className="kpi-content">
              <h3>Market Cap</h3>
              <div className="kpi-value">$45.2T</div>
              <div className="kpi-change positive">+2.1%</div>
            </div>
          </div>
        </div>

        {/* Watchlist Widget */}
        <div className="widget watchlist-widget">
          <div className="widget-header">
            <h3>My Watchlist</h3>
            <button className="btn-icon" onClick={() => setActiveSection('watchlist')}>
              <span>→</span>
            </button>
          </div>
          <div className="watchlist-items">
            {watchlist.slice(0, 5).map(stock => (
              <div key={stock.symbol} className="watchlist-item">
                <div className="stock-info">
                  <div className="stock-symbol">{stock.symbol}</div>
                  <div className="stock-name">{stock.name}</div>
                </div>
                <div className="stock-price">
                  <div className="price">${stock.price}</div>
                  <div className={`change ${stock.change.startsWith('+') ? 'positive' : 'negative'}`}>
                    {stock.change}
                  </div>
                </div>
              </div>
            ))}
            {watchlist.length === 0 && (
              <div className="empty-state">
                <p>No stocks in watchlist</p>
                <button className="btn btn-sm" onClick={() => setActiveSection('screening')}>
                  Start Screening
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Market Overview Widget */}
        <div className="widget market-widget">
          <div className="widget-header">
            <h3>Market Overview</h3>
            <select className="time-selector">
              <option>Today</option>
              <option>1 Week</option>
              <option>1 Month</option>
            </select>
          </div>
          <div className="market-indices">
            <div className="index-item">
              <span className="index-name">S&P 500</span>
              <span className="index-value">4,567.89</span>
              <span className="index-change positive">+1.2%</span>
            </div>
            <div className="index-item">
              <span className="index-name">NASDAQ</span>
              <span className="index-value">14,234.56</span>
              <span className="index-change positive">+0.8%</span>
            </div>
            <div className="index-item">
              <span className="index-name">DOW</span>
              <span className="index-value">34,567.12</span>
              <span className="index-change negative">-0.3%</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Widget */}
        <div className="widget activity-widget">
          <div className="widget-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-items">
            <div className="activity-item">
              <div className="activity-icon">🔍</div>
              <div className="activity-content">
                <div className="activity-title">Screening completed</div>
                <div className="activity-time">2 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">⭐</div>
              <div className="activity-content">
                <div className="activity-title">Added AAPL to watchlist</div>
                <div className="activity-time">1 day ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📊</div>
              <div className="activity-content">
                <div className="activity-title">Generated report</div>
                <div className="activity-time">3 days ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Rendu du Screening
  const renderScreening = () => (
    <div className="screening-content">
      <div className="screening-header">
        <h1>Stock Screening</h1>
        <p>Configure your criteria to find the perfect stocks</p>
      </div>

      <div className="screening-layout">
        <div className="criteria-panel">
          <div className="panel-section">
            <h3>Market Selection</h3>
            <div className="indices-selection">
              {Array.isArray(indices) && indices.map(index => (
                <label key={index} className="index-checkbox">
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
                  <span>{index}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <h3>Financial Criteria</h3>
            <div className="criteria-grid">
              <div className="criteria-item">
                <label>Market Cap (M$)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={criteria.marketCap.min}
                    onChange={(e) => handleRangeChange('marketCap', 'min', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={criteria.marketCap.max}
                    onChange={(e) => handleRangeChange('marketCap', 'max', e.target.value)}
                  />
                </div>
              </div>

              <div className="criteria-item">
                <label>P/E Ratio</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={criteria.peRatio.min}
                    onChange={(e) => handleRangeChange('peRatio', 'min', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={criteria.peRatio.max}
                    onChange={(e) => handleRangeChange('peRatio', 'max', e.target.value)}
                  />
                </div>
              </div>

              <div className="criteria-item">
                <label>Dividend Yield (%)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={criteria.dividendYield.min}
                    onChange={(e) => handleRangeChange('dividendYield', 'min', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={criteria.dividendYield.max}
                    onChange={(e) => handleRangeChange('dividendYield', 'max', e.target.value)}
                  />
                </div>
              </div>

              <div className="criteria-item">
                <label>ROE (%)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={criteria.roe.min}
                    onChange={(e) => handleRangeChange('roe', 'min', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={criteria.roe.max}
                    onChange={(e) => handleRangeChange('roe', 'max', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="panel-actions">
            <button 
              className="btn btn-primary btn-large"
              onClick={runScreening}
              disabled={loading || criteria.selectedIndices.length === 0}
            >
              {loading ? 'Screening...' : 'Run Screening'}
            </button>
            <button className="btn btn-secondary">
              Save Criteria
            </button>
          </div>
        </div>

        {screeningResults && (
          <div className="results-panel">
            <div className="results-header">
              <h3>Results ({screeningResults.total_results})</h3>
              <div className="results-actions">
                <button className="btn btn-sm" onClick={downloadCSV}>
                  📊 Export CSV
                </button>
              </div>
            </div>
            <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Market Cap</th>
                    <th>P/E</th>
                    <th>Actions</th>
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
                      <td>
                        <button 
                          className="btn btn-sm btn-icon"
                          onClick={() => addToWatchlist(stock)}
                          title="Add to Watchlist"
                        >
                          ⭐
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Rendu de la Watchlist
  const renderWatchlist = () => (
    <div className="watchlist-content">
      <div className="watchlist-header">
        <h1>My Watchlist</h1>
        <p>Track your favorite stocks</p>
      </div>

      <div className="watchlist-grid">
        {watchlist.map(stock => (
          <div key={stock.symbol} className="watchlist-card">
            <div className="card-header">
              <div className="stock-symbol">{stock.symbol}</div>
              <button 
                className="btn-remove"
                onClick={() => removeFromWatchlist(stock.symbol)}
              >
                ×
              </button>
            </div>
            <div className="stock-name">{stock.name}</div>
            <div className="stock-price">${stock.price}</div>
            <div className={`stock-change ${stock.change.startsWith('+') ? 'positive' : 'negative'}`}>
              {stock.change} ({stock.changeValue})
            </div>
            <div className="card-actions">
              <button className="btn btn-sm">📊 Analyze</button>
              <button className="btn btn-sm">📈 Chart</button>
            </div>
          </div>
        ))}
        
        {watchlist.length === 0 && (
          <div className="empty-watchlist">
            <div className="empty-icon">⭐</div>
            <h3>Your watchlist is empty</h3>
            <p>Start by running a screening to find interesting stocks</p>
            <button className="btn btn-primary" onClick={() => setActiveSection('screening')}>
              Start Screening
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="design4-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">📊</span>
            {!sidebarCollapsed && <span className="logo-text">StockScreener</span>}
          </div>
          <button 
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigationSections.map(section => (
            <button
              key={section.id}
              className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="nav-icon">{section.icon}</span>
              {!sidebarCollapsed && <span className="nav-text">{section.name}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">👤</div>
            {!sidebarCollapsed && (
              <div className="user-info">
                <div className="user-name">John Doe</div>
                <div className="user-role">Investor</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Search stocks, indices..." 
              className="search-input"
            />
            <button className="search-btn">🔍</button>
          </div>
          
          <div className="top-bar-actions">
            <button className="btn-icon notification-btn">
              🔔
              <span className="notification-badge">3</span>
            </button>
            <button className="btn-icon">⚙️</button>
            <button className="btn-icon">❓</button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'screening' && renderScreening()}
          {activeSection === 'watchlist' && renderWatchlist()}
          {activeSection === 'analysis' && (
            <div className="placeholder-content">
              <h1>Advanced Analysis</h1>
              <p>Coming soon...</p>
            </div>
          )}
          {activeSection === 'history' && (
            <div className="placeholder-content">
              <h1>Screening History</h1>
              <p>Coming soon...</p>
            </div>
          )}
          {activeSection === 'settings' && (
            <div className="placeholder-content">
              <h1>Settings</h1>
              <p>Coming soon...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Design4Prototype;