import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const computeApiBase = () => {
  const envUrl = process.env.REACT_APP_API_URL || '';
  if (envUrl && !envUrl.includes('192.168.54.') && !envUrl.includes('backend.loca.lt')) {
    return envUrl;
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin;
    if (origin && !origin.includes('localhost')) return origin;
  }
  return 'http://localhost:5000';
};

const API_BASE = computeApiBase();

function Profile() {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserData();
    fetchHistory();
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/user/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        padding: '30px',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ color: '#333', marginBottom: '10px' }}>
              {user?.name || 'User Profile'}
            </h1>
            <p style={{ color: '#666', margin: 0 }}>{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        padding: '30px'
      }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>Analysis History</h2>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              No analysis history yet. Start your first analysis!
            </p>
            <button
              onClick={() => navigate('/form')}
              style={{
                padding: '12px 24px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Start Analysis
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
              {history.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '20px',
                    background: '#f5f5f5',
                    borderRadius: '8px'
                  }}
                >
                  <h3 style={{ color: '#667eea', marginBottom: '5px' }}>
                    {item.disease}
                  </h3>
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    {new Date(item.date).toLocaleDateString()}
                  </p>
                  <p>Confidence: <strong>{(item.confidence * 100).toFixed(2)}%</strong></p>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => navigate('/form')}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              New Analysis
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;