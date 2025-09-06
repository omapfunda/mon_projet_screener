"use client";
import { useState } from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(
  () => import('react-plotly.js'),
  { ssr: false }
);

// Fonction utilitaire pour le téléchargement CSV (inchangée)
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

export default function ResultsDisplay({ results }) {
  // --- NOUVELLE LOGIQUE DE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  if (!results || results.length === 0) {
    return <p>Aucun résultat à afficher.</p>;
  }

  // Calculs pour la pagination
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedResults = results.slice(startIndex, endIndex);
  // --- FIN DE LA LOGIQUE DE PAGINATION ---

  const currencySymbol = results[0]?.currency === 'EUR' ? '€' : '$';
  const top10 = results.slice(0, 10);
  const undervaluedCount = results.filter(s => s.intrinsic_value && s.current_price < s.intrinsic_value).length;

  const formatNumber = (num, decimals = 2) => num?.toFixed(decimals) || 'N/A';
  const formatPercent = (num, decimals = 1) => num ? `${(num * 100).toFixed(decimals)}%` : 'N/A';

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="label">Actions Analysées</div>
          <div className="value">{results.length}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Sous-évaluées (selon Graham)</div>
          <div className="value">{undervaluedCount}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Score Moyen</div>
          <div className="value">{(results.map(s=>s.score).reduce((a,b)=>a+b,0) / results.length).toFixed(1)}%</div>
        </div>
      </div>

      <div className="card">
        <h3>Top 10 des Actions par Score</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          <Plot
              data={[{ x: top10.map(s => s.company_name), y: top10.map(s => s.score), type: 'bar', marker: {color: 'var(--primary-color)'} }]}
              layout={{ title: 'Score de Valeur', xaxis: {tickangle: -30}, yaxis: {ticksuffix: '%'}}}
              style={{ width: '100%', height: '400px' }} use_container_width={true}
          />
          <Plot
              data={[
                  { x: top10.map(s => s.company_name), y: top10.map(s => s.current_price), name: 'Prix Actuel', type: 'bar' },
                  { x: top10.map(s => s.company_name), y: top10.map(s => s.intrinsic_value), name: 'Valeur Intrinsèque', type: 'bar' },
              ]}
              layout={{ title: 'Prix Actuel vs. Valeur Intrinsèque', barmode: 'group', xaxis: {tickangle: -30}, yaxis: {ticksuffix: currencySymbol, tickprefix: currencySymbol}}}
              style={{ width: '100%', height: '400px' }} use_container_width={true}
          />
        </div>
      </div>
      
      <div className="card">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h3>Résultats Détaillés du Screening</h3>
                <button onClick={() => downloadCSV(results)} className="secondary-button">Télécharger en CSV</button>
              </div>
              <div className="results-table-wrapper">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Entreprise</th>
                      <th className="text-right">Score</th>
                      <th className="text-right">Prix Actuel</th>
                      <th className="text-right">Val. Intrinsèque</th>
                      <th className="text-right">Marge Séc.</th>
                      <th className="text-right">P/E</th>
                      <th className="text-right">P/B</th>
                      <th className="text-right">Dette/FP</th>
                      <th className="text-right">ROE</th>
                      <th className="text-right">Dividende</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Le .map() utilise maintenant les données paginées */}
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
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* --- NOUVEAUX CONTRÔLES DE PAGINATION --- */}
              <div className="pagination-controls">
                <button onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1} className="secondary-button">
                  Précédent
                </button>
                <span>Page {currentPage} sur {totalPages}</span>
                <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages} className="secondary-button">
                  Suivant
                </button>
              </div>
              {/* --- FIN DES CONTRÔLES DE PAGINATION --- */}
            </div>
            <style jsx>{`
              /* ... (styles jsx existants) ... */
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
                background-color: #fff;
                cursor: not-allowed;
              }
            `}</style>
          </>
        );
      }