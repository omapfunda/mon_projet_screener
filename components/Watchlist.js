import React, { useState, useEffect } from 'react';
import { getWatchlist, removeFromWatchlist } from '../lib/api';

const Watchlist = () => {
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterText, setFilterText] = useState('');
    const [sortAsc, setSortAsc] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });

    const fetchWatchlist = async () => {
        try {
            setLoading(true);
            const data = await getWatchlist();
            const sortedData = Array.isArray(data)
                ? [...data].sort((a, b) => new Date(b.added_date) - new Date(a.added_date))
                : [];
            setWatchlist(sortedData);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWatchlist();
    }, []);

    const handleRemove = async (itemId, ticker) => {
        const ok = window.confirm(`Remove ${ticker} from your watchlist?`);
        if (!ok) return;
        try {
            setLoading(true);
            await removeFromWatchlist(itemId);
            setNotification({ message: `${ticker} successfully removed from your watchlist.`, type: 'success' });
            await fetchWatchlist();
        } catch (err) {
            setNotification({ message: err.message || 'Failed to remove item from watchlist.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = watchlist.filter((item) =>
        item.ticker.toLowerCase().includes(filterText.toLowerCase())
    );
    const displayedItems = [...filteredItems].sort((a, b) =>
        sortAsc ? new Date(a.added_date) - new Date(b.added_date) : new Date(b.added_date) - new Date(a.added_date)
    );

    const notificationStyle = notification.message
        ? (notification.type === 'success'
            ? { background: '#e6ffed', color: '#0f5132', border: '1px solid #a3cfbb', padding: '8px', borderRadius: '6px', marginTop: '0.5rem' }
            : { background: '#fff3cd', color: '#664d03', border: '1px solid #ffe69c', padding: '8px', borderRadius: '6px', marginTop: '0.5rem' })
        : {};

    if (loading) return <div className="card" style={{ padding: '1rem' }}>Loading watchlist...</div>;
    if (error) return <div className="card" style={{ padding: '1rem', background: '#fff3cd', border: '1px solid #ffe69c' }}>Error: {error}</div>;

    return (
        <div className="card watchlist-container" style={{ padding: '1rem' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>My Watchlist</h2>
                <div className="card-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Filter by ticker..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                    <button className="btn-primary" onClick={() => setSortAsc((prev) => !prev)}>
                        Sort: {sortAsc ? 'Oldest' : 'Newest'}
                    </button>
                    <button className="btn-primary" onClick={fetchWatchlist}>Refresh</button>
                </div>
            </div>

            {notification.message && (
                <div style={notificationStyle}>{notification.message}</div>
            )}

            {displayedItems.length === 0 ? (
                <p style={{ marginTop: '1rem' }}>Your watchlist is empty.</p>
            ) : (
                <table style={{ width: '100%', marginTop: '1rem' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left' }}>Ticker</th>
                            <th style={{ textAlign: 'left' }}>Date Added</th>
                            <th style={{ textAlign: 'left' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedItems.map((item) => (
                            <tr key={item.id}>
                                <td>{item.ticker}</td>
                                <td>{new Date(item.added_date).toLocaleDateString()}</td>
                                <td>
                                    <button className="btn-primary" onClick={() => handleRemove(item.id, item.ticker)}>Remove</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Watchlist;