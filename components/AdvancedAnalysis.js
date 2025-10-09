// frontend/components/AdvancedAnalysis.js
"use client";
import { useState, useEffect } from 'react';
import { fetchDcfValuation, addToWatchlist } from '../lib/api';

 // --- NEW ROBUST FORMATTING FUNCTIONS ---
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

 // Calculate margin of safety
 const calculateMarginOfSafety = (currentPrice, intrinsicValue) => {
     if (!currentPrice || !intrinsicValue || isNaN(currentPrice) || isNaN(intrinsicValue)) return 0;
     return (intrinsicValue - currentPrice) / intrinsicValue;
 };

export default function AdvancedAnalysis({ results, initialTicker }) {
   const [selectedCompany, setSelectedCompany] = useState(null);
   const [valuationData, setValuationData] = useState(null);
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState(null);
   const [notification, setNotification] = useState({ message: '', type: '' });

   // Default companies when no screening results are available
   const defaultCompanies = [
     { symbol: 'AAPL', company_name: 'Apple Inc.' },
     { symbol: 'MSFT', company_name: 'Microsoft Corporation' },
     { symbol: 'GOOGL', company_name: 'Alphabet Inc.' },
     { symbol: 'AMZN', company_name: 'Amazon.com Inc.' },
     { symbol: 'TSLA', company_name: 'Tesla Inc.' },
     { symbol: 'META', company_name: 'Meta Platforms Inc.' },
     { symbol: 'NVDA', company_name: 'NVIDIA Corporation' },
     { symbol: 'JPM', company_name: 'JPMorgan Chase & Co.' },
     { symbol: 'JNJ', company_name: 'Johnson & Johnson' },
     { symbol: 'V', company_name: 'Visa Inc.' }
   ];

   // Use screening results if available, otherwise use default companies
   const availableCompanies = results && results.length > 0 ? results : defaultCompanies;
   
   const handleCompanyChange = (ticker) => {
     setSelectedCompany(ticker);
     handleAnalyze(ticker);
   };

   const handleAnalyze = async (ticker) => {
     if (!ticker) return;
     setIsLoading(true);
     setError(null);
     setValuationData(null);
     setNotification({ message: '', type: '' });
     try {
       const data = await fetchDcfValuation(ticker);
       setValuationData(data);
     } catch (err) {
       setError(err.message);
     } finally {
       setIsLoading(false);
     }
   };

  // Automatically trigger analysis if an initialTicker is provided
  useEffect(() => {
    if (initialTicker) {
      setSelectedCompany(initialTicker);
      handleAnalyze(initialTicker);
    }
  }, [initialTicker]);

   const handleAddToWatchlist = async () => {
       if (!selectedCompany) {
           setNotification({ message: 'Ticker non disponible.', type: 'error' });
           return;
       }
       try {
           const result = await addToWatchlist(selectedCompany);
           setNotification({ message: result.message, type: 'success' });
       } catch (error) {
           setNotification({ message: error.message || "Erreur lors de l'ajout.", type: 'error' });
       }
   };

   // MetricCard component for visual display
   const MetricCard = ({ title, value, icon, color, subtitle, trend, isLarge }) => (
     <div className={`metric-card ${color} ${isLarge ? 'large' : ''}`}>
       <div className="metric-header">
         <span className="metric-icon">{icon}</span>
         <span className="metric-title">{title}</span>
       </div>
       <div className="metric-value">{value}</div>
       {subtitle && <div className="metric-subtitle">{subtitle}</div>}
       {trend && <div className="metric-trend">{trend}</div>}
     </div>
   );

   const ScenarioCard = ({ title, scenario, currentPrice }) => {
     return (
       <div className="scenario-card">
         <h4>{title}</h4>
         <p>Revenue Growth: <span>{formatPercent(scenario.revenue_growth)}</span></p>
         <p>EBITDA Margin: <span>{formatPercent(scenario.ebitda_margin)}</span></p>
         <p>Discount Rate: <span>{formatPercent(scenario.discount_rate)}</span></p>
         <p>Terminal Growth: <span>{formatPercent(scenario.terminal_growth)}</span></p>
       </div>
     );
   };

   return (
     <div className="card" style={{marginTop: '2rem'}}>
       <h2>DCF Valuation</h2>
       <div className="control-group">
         <label>Choose a company to launch the valuation:</label>
         <select onChange={(e) => handleCompanyChange(e.target.value)} defaultValue="">
           <option value="" disabled>Select a company...</option>
           {availableCompanies.map(stock => (
             <option key={stock.symbol} value={stock.symbol}>{stock.company_name}</option>
           ))}
         </select>
         {valuationData && !valuationData.error && (
           <button 
             onClick={handleAddToWatchlist} 
             className="btn-primary"
             style={{marginLeft: '1rem'}}
           >
             Add to Watchlist
           </button>
         )}
       </div>

       {isLoading && <p>DCF analysis in progress (this may take a few seconds)...</p>}
       {error && <p className="error-message">{error}</p>}
       {notification.message && (
         <div className={`alert alert-${notification.type}`}>
           {notification.message}
         </div>
       )}

       {valuationData && !valuationData.error && (
         <div>
           {/* Current Price Display */}
           <div className="current-price-section">
             <MetricCard 
               title="Current Price" 
               value={formatSharePrice(valuationData.current_price)} 
               icon="$" 
               isLarge={true}
               color="purple-gradient"
             />
           </div>

           <div className="base-data-grid">
             <div className="data-point">
               <label>Base Year</label><span>{valuationData.base_data.latest_year}</span>
             </div>
             <div className="data-point">
               <label>Free Cash Flow</label><span>{formatCurrency(valuationData.base_data.base_fcf)}</span>
             </div>
             <div className="data-point">
               <label>Long-term Debt</label><span>{formatCurrency(valuationData.base_data.total_debt)}</span>
             </div>
             <div className="data-point">
               <label>Cash</label><span>{formatCurrency(valuationData.base_data.cash)}</span>
             </div>
           </div>
           {/* Intrinsic Values & Margin of Safety Section */}
           <div className="new-metrics-container">
             <div className="new-metrics-column">
                 {/* Intrinsic Value Conservative */}
                 <div className="new-metric">
                     <h4>Intrinsic Value (Conservative)</h4>
                     <p className="value">{formatSharePrice(valuationData.scenario1.intrinsic_value)}</p>
                     <p className="subtitle">+{formatPercent((valuationData.scenario1.intrinsic_value - valuationData.current_price) / valuationData.current_price)} vs current price</p>
                 </div>

                 {/* Margin of Safety Conservative */}
                 <div className="new-metric">
                     <h4>Margin of Safety (Conservative)</h4>
                     <p className="value">{formatPercent(calculateMarginOfSafety(valuationData.current_price, valuationData.scenario1.intrinsic_value))}</p>
                     <p className="subtitle">{calculateMarginOfSafety(valuationData.current_price, valuationData.scenario1.intrinsic_value) > 0.2 ? "Excellent opportunity" : calculateMarginOfSafety(valuationData.current_price, valuationData.scenario1.intrinsic_value) > 0.1 ? "Good opportunity" : "Limited opportunity"}</p>
                 </div>
             </div>
             <div className="new-metrics-column">
                 {/* Intrinsic Value Optimistic */}
                 <div className="new-metric">
                     <h4>Intrinsic Value (Optimistic)</h4>
                     <p className="value">{formatSharePrice(valuationData.scenario2.intrinsic_value)}</p>
                     <p className="subtitle">+{formatPercent((valuationData.scenario2.intrinsic_value - valuationData.current_price) / valuationData.current_price)} vs current price</p>
                 </div>

                 {/* Margin of Safety Optimistic */}
                 <div className="new-metric">
                     <h4>Margin of Safety (Optimistic)</h4>
                     <p className="value">{formatPercent(calculateMarginOfSafety(valuationData.current_price, valuationData.scenario2.intrinsic_value))}</p>
                     <p className="subtitle">{calculateMarginOfSafety(valuationData.current_price, valuationData.scenario2.intrinsic_value) > 0.2 ? "Excellent opportunity" : calculateMarginOfSafety(valuationData.current_price, valuationData.scenario2.intrinsic_value) > 0.1 ? "Good opportunity" : "Limited opportunity"}</p>
                 </div>
             </div>
         </div>

          <div className="scenarios-container">
            <ScenarioCard 
              title="Conservative Scenario" 
              scenario={valuationData.scenario1} 
              currentPrice={valuationData.current_price}
            />
            <ScenarioCard 
              title="Optimistic Scenario" 
              scenario={valuationData.scenario2} 
              currentPrice={valuationData.current_price}
            />
          </div>
        </div>
      )}
      <style jsx>{`
        .new-metrics-container {
          display: flex;
          justify-content: space-between;
          gap: 2rem;
          margin: 2rem 0;
        }

        .new-metrics-column {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          width: 50%;
        }

        .new-metric {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .new-metric h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .metric-card.large {
          padding: 2rem;
          text-align: left;
        }

        .metric-card.large .metric-title {
          font-size: 1.5rem;
        }

        .metric-card.large .metric-value {
          font-size: 3rem;
          font-weight: 700;
        }

        .purple-gradient {
          background: linear-gradient(to right, #8e2de2, #4a00e0);
          color: white;
        }

        .new-metric .value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .new-metric .subtitle {
          font-size: 0.875rem;
          color: #6b7280;
        }

        /* Current Price Section */
        .current-price-section {
          margin: 2rem 0;
          display: flex;
          justify-content: center;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin: 2rem 0;
        }

        /* Metric Cards */
        .metric-card {
          background: linear-gradient(135deg, var(--card-bg-start), var(--card-bg-end));
          border-radius: 20px;
          padding: 32px 28px;
          color: white;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          min-width: 280px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }

        .metric-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent 50%);
          pointer-events: none;
        }

        /* Color variants */
        .metric-card.purple {
          --card-bg-start: #8B5CF6;
          --card-bg-end: #6D28D9;
        }

        .metric-card.green {
          --card-bg-start: #10B981;
          --card-bg-end: #047857;
        }

        .metric-card.blue {
          --card-bg-start: #3B82F6;
          --card-bg-end: #1E40AF;
        }

        .metric-card.red {
          --card-bg-start: #EF4444;
          --card-bg-end: #B91C1C;
        }

        .metric-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .metric-icon {
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .metric-title {
          font-size: 16px;
          font-weight: 600;
          opacity: 0.95;
          letter-spacing: -0.01em;
        }

        .metric-value {
          font-size: 42px;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .metric-subtitle {
          font-size: 14px;
          opacity: 0.85;
          font-weight: 500;
          letter-spacing: -0.005em;
        }

        .metric-trend {
          font-size: 13px;
          opacity: 0.9;
          margin-top: 6px;
          font-weight: 500;
        }

        /* Base data grid */
        .base-data-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
          gap: 1rem; 
          background: #f9fafb; 
          padding: 1rem; 
          border-radius: 12px; 
          margin: 2rem 0;
          border: 1px solid #e5e7eb;
        }
        
        .data-point { 
          text-align: center; 
          padding: 8px;
        }
        
        .data-point label { 
          display: block; 
          font-size: 0.8rem; 
          color: #6b7280; 
          margin-bottom: 4px;
        }
        
        .data-point span { 
          font-size: 1.2rem; 
          font-weight: 600; 
          color: #1f2937;
        }

        /* Scenarios container */
        .scenarios-container { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 2rem; 
          margin-top: 2rem;
        }

        .scenario-card { 
          border: 1px solid #e5e7eb; 
          padding: 1.5rem; 
          border-radius: 12px; 
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .scenario-card h4 { 
          margin-top: 0; 
          color: #1f2937;
          font-size: 1.1rem;
          margin-bottom: 1rem;
        }

        .scenario-card p { 
          margin: 0.5rem 0;
          color: #6b7280;
        }

        .scenario-card p span { 
          font-weight: bold; 
          color: #1f2937;
        }

        .scenario-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .scenarios-container {
            grid-template-columns: 1fr;
          }
          
          .scenario-metrics {
            grid-template-columns: 1fr;
          }
          
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          
          .metric-card {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
}