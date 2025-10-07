import React, { useState, useEffect } from 'react';
import { fetchScreeningHistory, fetchScreeningDetails } from '../lib/api';

const ScreeningHistory = () => {
  const [history, setHistory] = useState([]);
  const [selectedScreening, setSelectedScreening] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch history
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await fetchScreeningHistory();
      setHistory(data.history || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch screening details
  const handleFetchScreeningDetails = async (screeningId) => {
    try {
      const data = await fetchScreeningDetails(screeningId);
      setSelectedScreening(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    }
  };

  // Function to format date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US');
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{color: 'red'}}>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Screenings history</h2>
      
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
        {/* Screening list */}
        <div>
          <h3>Previous Analyses</h3>
          {history.length === 0 ? (
            <p>No screening found</p>
          ) : (
            <div>
              {history.map((screening) => (
                <div
                  key={screening.id}
                  style={{
                    padding: '10px',
                    margin: '10px 0',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    backgroundColor: selectedScreening?.id === screening.id ? '#e6f3ff' : '#f9f9f9'
                  }}
                  onClick={() => handleFetchScreeningDetails(screening.id)}
                >
                  <div><strong>{screening.index_name}</strong></div>
                  <div>Date: {formatDate(screening.timestamp)}</div>
                  <div>Results: {screening.total_results}</div>
                  <div>Time: {screening.execution_time}s</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected screening details */}
        <div>
          <h3>Screening details</h3>
          {selectedScreening ? (
            <div>
              <h4>General Information</h4>
              <p><strong>Index:</strong> {selectedScreening.index_name}</p>
              <p><strong>Date:</strong> {formatDate(selectedScreening.timestamp)}</p>
              <p><strong>Results:</strong> {selectedScreening.total_results}</p>
              <p><strong>Execution Time:</strong> {selectedScreening.execution_time}s</p>

              {selectedScreening.criteria && (
                <div>
                  <h4>Criteria Used</h4>
                  {Object.entries(selectedScreening.criteria).map(([key, value]) => (
                    <p key={key}><strong>{key}:</strong> {value}</p>
                  ))}
                </div>
              )}

              {selectedScreening.results && selectedScreening.results.length > 0 && (
                <div>
                  <h4>Top 5 Results</h4>
                  {selectedScreening.results.slice(0, 5).map((result, index) => (
                    <div key={index} style={{margin: '5px 0', padding: '5px', border: '1px solid #ddd'}}>
                      <strong>{result.symbol}</strong> - {result.name}
                      <br />Score: {result.score} | Price: ${result.current_price}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p>Select a screening to view details</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScreeningHistory;