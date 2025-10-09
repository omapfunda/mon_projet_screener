"use client";
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { addToWatchlist } from '../lib/api'; // Import the API function

// Utility function for CSV download (unchanged)
const downloadCSV = (data) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
  const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "screening_results.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function ResultsDisplay({ results, onGoToDcf }) {
  // --- NEW PAGINATION LOGIC ---
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // --- NEW: State for handling watchlist notifications ---
  const [notification, setNotification] = useState({ show: false, message: '', ticker: '' });

  const handleAddToWatchlist = async (ticker) => {
    try {
      await addToWatchlist(ticker);
      setNotification({ show: true, message: `Added ${ticker} to watchlist!`, ticker });
      setTimeout(() => setNotification({ show: false, message: '', ticker: '' }), 3000);
    } catch (error) {
      alert(error.message);
    }
  };

  if (!results || results.length === 0) {
    return <p>No results to display.</p>;
  }

  // Pagination calculations
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedResults = results.slice(startIndex, endIndex);
  // --- END OF PAGINATION LOGIC ---

  const currencySymbol = results[0]?.currency === 'EUR' ? '€' : '$';
  const top10 = results.slice(0, 10);
  const undervaluedCount = results.filter(s => s.intrinsic_value && s.current_price < s.intrinsic_value).length;

  const formatNumber = (num, decimals = 2) => num?.toFixed(decimals) || 'N/A';
  const formatPercent = (num, decimals = 1) => num ? `${(num * 100).toFixed(decimals)}%` : 'N/A';

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="label">Stocks Analyzed</div>
          <div className="value">{results.length}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Undervalued (according to Graham)</div>
          <div className="value">{undervaluedCount}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Average Score</div>
          <div className="value">{(results.map(s=>s.score).reduce((a,b)=>a+b,0) / results.length).toFixed(1)}%</div>
        </div>
      </div>

      <div className="card">
        <h3>Top 10 Stocks by Score</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          <div>
            <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Value Score</h4>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={top10.map(s => ({ name: s.company_name, score: s.score }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  angle={-30} 
                  textAnchor="end" 
                  height={100}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => `${value}%`}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Score']}
                  labelStyle={{ color: '#333' }}
                />
                <Bar dataKey="score" fill="#367bf5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div>
            <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Current Price vs. Intrinsic Value</h4>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={top10.map(s => ({ 
                name: s.company_name, 
                currentPrice: s.current_price, 
                intrinsicValue: s.intrinsic_value 
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  angle={-30} 
                  textAnchor="end" 
                  height={100}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => `${currencySymbol}${value}`}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value, name) => [`${currencySymbol}${value?.toFixed(2) || 'N/A'}`, name]}
                  labelStyle={{ color: '#333' }}
                />
                <Legend />
                <Bar dataKey="currentPrice" fill="#367bf5" name="Current Price" radius={[2, 2, 0, 0]} />
                <Bar dataKey="intrinsicValue" fill="#10b981" name="Intrinsic Value" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="card">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h3>Detailed Screening Results</h3>
                <button onClick={() => downloadCSV(results)} className="secondary-button">Download as CSV</button>
              </div>
              <div className="results-table-wrapper">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th className="text-right">Score</th>
                      <th className="text-right">Current Price</th>
                      <th className="text-right">Intrinsic Value</th>
                      <th className="text-right">Safety Margin</th>
                      <th className="text-right">P/E</th>
                      <th className="text-right">P/B</th>
                      <th className="text-right">Debt/Equity</th>
                      <th className="text-right">ROE</th>
                      <th className="text-right">Dividend</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* The .map() now uses paginated data */}
                    {paginatedResults.map(stock => {
                      const margin = stock.intrinsic_value ? (stock.intrinsic_value - stock.current_price) / stock.current_price : null;
                      return (
                        <tr key={stock.symbol}>
                          <td><strong>{stock.company_name}</strong><br/><span style={{color: 'var(--text-secondary)', fontSize:'0.8rem'}}>{stock.symbol}</span></td>
                          <td className="text-right"><strong>{formatPercent(stock.score / 100)}</strong></td>
                          <td className="text-right">{currencySymbol}{formatNumber(stock.current_price)}</td>
                          <td className="text-right">{stock.intrinsic_value ? `${currencySymbol}${formatNumber(stock.intrinsic_value)}` : 'N/A'}</td>
                          <td className={`text-right ${margin > 0 ? 'text-success' : 'text-error'}`}>{formatPercent(margin)}</td>
                          <td className="text-right">{formatNumber(stock.pe_ratio)}</td>
                          <td className="text-right">{formatNumber(stock.pb_ratio)}</td>
                          <td className="text-right">{formatNumber(stock.debt_to_equity, 1)}</td>
                          <td className="text-right">{formatPercent(stock.roe)}</td>
                          <td className="text-right">{formatPercent(stock.dividend_yield)}</td>
                          <td className="text-center">
                            <button 
                              className="add-watchlist-btn"
                              onClick={() => handleAddToWatchlist(stock.symbol)}
                            >
                              +
                            </button>
                            <button
                              className="btn-primary btn-dcf"
                              onClick={() => onGoToDcf(stock.symbol)}
                            >
                              Go to DCF
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* --- NEW PAGINATION CONTROLS --- */}
              <div className="pagination-controls">
                <button onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1} className="secondary-button">
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages} className="secondary-button">
                  Next
                </button>
              </div>
              {/* --- END OF PAGINATION CONTROLS --- */}
            </div>
            <style jsx>{`
              /* ... (existing jsx styles) ... */
              .pagination-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 1.5rem;
                padding-top: 1rem;
                border-top: 1px solid var(--border-color);
              }
              .secondary-button {
                background-color: #fff;
                color: var(--primary-color);
                border: 1px solid var(--primary-color);
                width: auto;
                font-weight: 500;
              }
              .secondary-button:hover {
                background-color: #f0f5ff;
              }
              .secondary-button:disabled {
                color: #ccc;
                border-color: #ccc;
              }
              .add-watchlist-btn {
                background: #e0e7ff;
                color: #367bf5;
                border: none;
                border-radius: 50%;
                width: 28px;
                height: 28px;
                font-size: 1.2rem;
                cursor: pointer;
                transition: all 0.2s;
              }
              .add-watchlist-btn:hover {
                background: #c7d2fe;
                transform: scale(1.1);
              }
              .dcf-button {
                background-color: #fff;
                color: var(--primary-color);
                border: 1px solid var(--primary-color);
                border-radius: 6px;
                padding: 6px 10px;
                font-size: 0.85rem;
                cursor: pointer;
              }
              .dcf-button:hover {
                background-color: #f0f5ff;
              }
              /* ... (rest of the styles) ... */
            `}</style>
          </>
        );
      }