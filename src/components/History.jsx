import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getHistory, 
  deleteHistoryItem, 
  clearHistory, 
  getHistoryStats,
  exportHistory,
  searchHistory 
} from '../utils/historyUtils';

function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const allHistory = getHistory();
    const historyStats = getHistoryStats();
    setHistory(allHistory);
    setStats(historyStats);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setHistory(getHistory());
    } else {
      setHistory(searchHistory(query));
    }
  };

  const handleDelete = (id) => {
    if (deleteHistoryItem(id)) {
      loadHistory();
      setShowDeleteConfirm(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all history? This cannot be undone.')) {
      if (clearHistory()) {
        loadHistory();
      }
    }
  };

  const handleViewResult = (item) => {
    navigate('/results', { 
      state: { 
        result: item.result,
        fromHistory: true 
      } 
    });
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Analysis History
                </h1>
                {stats && stats.total > 0 && (
                  <p className="text-sm text-gray-600">
                    {stats.total} {stats.total === 1 ? 'analysis' : 'analyses'} saved
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate('/form')}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md font-medium"
            >
              New Analysis
            </button>
          </div>

          {/* Stats Section */}
          {stats && stats.total > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-sm text-gray-600 mt-1">Total Analyses</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{stats.avgConfidence.toFixed(1)}%</p>
                <p className="text-sm text-gray-600 mt-1">Avg Confidence</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{Object.keys(stats.diseases).length}</p>
                <p className="text-sm text-gray-600 mt-1">Unique Diseases</p>
              </div>
            </div>
          )}
        </div>

        {/* Search + Action Buttons */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by disease or symptoms..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => exportHistory()}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </button>

                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Cards */}
        {history.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No History Yet</h2>
            <p className="text-gray-600 mb-6">Your analysis history will appear here</p>
            <button
              onClick={() => navigate('/form')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg font-semibold"
            >
              Start Your First Analysis
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between">

                  {/* LEFT SIDE */}
                  <div className="flex-1">

                    {/* Disease + Confidence */}
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-800">
                        {item.result.disease || "Unknown"}
                      </h3>

                      <span 
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getConfidenceColor(item.result.confidence)}`}
                      >
                        {Math.round(item.result.confidence || 0)}%
                      </span>
                    </div>

                    {/* Metadata */}
                    {item.result.metadata && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">

                        {item.result.metadata.symptoms && (
                          <div className="text-sm">
                            <span className="text-gray-500">Symptoms:</span>
                            <p className="text-gray-700 font-medium">{item.result.metadata.symptoms}</p>
                          </div>
                        )}

                        {item.result.metadata.duration && (
                          <div className="text-sm">
                            <span className="text-gray-500">Duration:</span>
                            <p className="text-gray-700 font-medium">{item.result.metadata.duration}</p>
                          </div>
                        )}

                        {item.result.metadata.severity && (
                          <div className="text-sm">
                            <span className="text-gray-500">Severity:</span>
                            <p className="text-gray-700 font-medium capitalize">{item.result.metadata.severity}</p>
                          </div>
                        )}

                      </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-sm text-gray-500">
                      <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(item.timestamp)}
                    </p>
                  </div>

                  {/* RIGHT SIDE BUTTONS */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewResult(item)}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
                    >
                      View Details
                    </button>

                    {showDeleteConfirm === item.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default History;
