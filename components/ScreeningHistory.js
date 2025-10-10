import React, { useState, useEffect } from 'react';
import { fetchScreeningHistory, fetchScreeningDetails, deleteScreening } from '../lib/api';

const ScreeningHistory = () => {
  const [history, setHistory] = useState([]);
  const [selectedScreening, setSelectedScreening] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

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

  // Function to delete screening with confirmation
  const handleDeleteScreening = async (screeningId, indexName, event) => {
    // Prevent the click from triggering the parent div's onClick
    event.stopPropagation();
    
    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the screening for "${indexName}"? This action cannot be undone.`
    );
    
    if (!confirmDelete) {
      return;
    }

    try {
      setDeleteLoading(screeningId);
      setError(null);
      setSuccessMessage(null);
      
      await deleteScreening(screeningId);
      
      // Remove the deleted screening from the list
      setHistory(prevHistory => prevHistory.filter(screening => screening.id !== screeningId));
      
      // Clear selected screening if it was the deleted one
      if (selectedScreening?.id === screeningId) {
        setSelectedScreening(null);
      }
      
      setSuccessMessage('Screening deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error deleting screening:', err);
      setError(err.message);
    } finally {
      setDeleteLoading(null);
    }
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
      
      {/* Success message */}
      {successMessage && (
        <div style={{
          color: 'green',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '5px',
          padding: '10px',
          margin: '10px 0'
        }}>
          {successMessage}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div style={{
          color: 'red',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          padding: '10px',
          margin: '10px 0'
        }}>
          Error: {error}
        </div>
      )}
      
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
                    backgroundColor: selectedScreening?.id === screening.id ? '#e6f3ff' : '#f9f9f9',
                    position: 'relative'
                  }}
                  onClick={() => handleFetchScreeningDetails(screening.id)}
                >
                  <div><strong>{screening.index_name}</strong></div>
                  <div>Date: {formatDate(screening.timestamp)}</div>
                  <div>Results: {screening.total_results}</div>
                  <div>Time: {screening.execution_time}s</div>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteScreening(screening.id, screening.index_name, e)}
                    disabled={deleteLoading === screening.id}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '5px 8px',
                      fontSize: '12px',
                      cursor: deleteLoading === screening.id ? 'not-allowed' : 'pointer',
                      opacity: deleteLoading === screening.id ? 0.6 : 1
                    }}
                    title="Delete this screening"
                  >
                    {deleteLoading === screening.id ? '...' : '×'}
                  </button>
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