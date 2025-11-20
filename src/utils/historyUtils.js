// historyUtils.js
// Utility functions for managing analysis history in localStorage

const HISTORY_KEY = 'analysisHistory';

/**
 * Save a new analysis to history
 * @param {Object} result - The prediction result object
 * @returns {Object} The saved history item
 */
export const saveToHistory = (result) => {
  try {
    // Get existing history
    const existingHistory = getHistory();
    
    // Generate unique ID with timestamp and random string
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const id = `${timestamp}-${randomStr}`;
    
    // Check for duplicate within last 5 seconds (prevents StrictMode double-save)
    const recentDuplicate = existingHistory.find(item => {
      const itemTime = parseInt(item.id.split('-')[0]);
      const timeDiff = timestamp - itemTime;
      
      return (
        timeDiff < 5000 && // Within last 5 seconds
        item.result.prediction.disease === result.prediction.disease &&
        item.result.prediction.confidence === result.prediction.confidence &&
        item.result.metadata?.symptoms === result.metadata?.symptoms
      );
    });
    
    // If duplicate found, return existing item instead of creating new one
    if (recentDuplicate) {
      console.log('⚠️ Duplicate save detected within 5 seconds - skipping');
      return recentDuplicate;
    }
    
    // Create new history item
    const historyItem = {
      id: id,
      timestamp: new Date().toISOString(),
      result: result
    };
    
    // Add to beginning of array (newest first)
    const updatedHistory = [historyItem, ...existingHistory];
    
    // Keep only last 50 analyses to prevent localStorage overflow
    const limitedHistory = updatedHistory.slice(0, 50);
    
    // Save to localStorage
    localStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
    
    console.log('✅ Saved to history:', historyItem.id);
    return historyItem;
  } catch (error) {
    console.error('❌ Error saving to history:', error);
    return null;
  }
};

/**
 * Get all history items
 * @returns {Array} Array of history items
 */
export const getHistory = () => {
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('❌ Error loading history:', error);
    return [];
  }
};

/**
 * Get a specific history item by ID
 * @param {string} id - The history item ID
 * @returns {Object|null} The history item or null if not found
 */
export const getHistoryItem = (id) => {
  try {
    const history = getHistory();
    return history.find(item => item.id === id) || null;
  } catch (error) {
    console.error('❌ Error getting history item:', error);
    return null;
  }
};

/**
 * Delete a specific history item
 * @param {string} id - The history item ID to delete
 * @returns {boolean} Success status
 */
export const deleteHistoryItem = (id) => {
  try {
    const history = getHistory();
    const updatedHistory = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    console.log('✅ Deleted history item:', id);
    return true;
  } catch (error) {
    console.error('❌ Error deleting history item:', error);
    return false;
  }
};

/**
 * Clear all history
 * @returns {boolean} Success status
 */
export const clearHistory = () => {
  try {
    localStorage.removeItem(HISTORY_KEY);
    console.log('✅ Cleared all history');
    return true;
  } catch (error) {
    console.error('❌ Error clearing history:', error);
    return false;
  }
};

/**
 * Get history statistics
 * @returns {Object} Statistics about the history
 */
export const getHistoryStats = () => {
  try {
    const history = getHistory();
    
    if (history.length === 0) {
      return {
        total: 0,
        diseases: {},
        avgConfidence: 0,
        lastAnalysis: null
      };
    }
    
    // Calculate disease distribution
    const diseases = {};
    let totalConfidence = 0;
    
    history.forEach(item => {
      const disease = item.result.prediction.disease;
      diseases[disease] = (diseases[disease] || 0) + 1;
      totalConfidence += item.result.prediction.confidence;
    });
    
    return {
      total: history.length,
      diseases: diseases,
      avgConfidence: Math.round(totalConfidence / history.length * 10) / 10,
      lastAnalysis: history[0].timestamp
    };
  } catch (error) {
    console.error('❌ Error calculating history stats:', error);
    return {
      total: 0,
      diseases: {},
      avgConfidence: 0,
      lastAnalysis: null
    };
  }
};

/**
 * Export history as JSON file
 * @param {string} filename - Optional filename
 */
export const exportHistory = (filename = 'analysis-history.json') => {
  try {
    const history = getHistory();
    
    if (history.length === 0) {
      console.log('⚠️ No history to export');
      return false;
    }
    
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ Exported history to:', filename);
    return true;
  } catch (error) {
    console.error('❌ Error exporting history:', error);
    return false;
  }
};

/**
 * Search history by disease name or symptoms
 * @param {string} query - Search query
 * @returns {Array} Filtered history items
 */
export const searchHistory = (query) => {
  try {
    if (!query || query.trim() === '') {
      return getHistory();
    }
    
    const history = getHistory();
    const lowerQuery = query.toLowerCase().trim();
    
    return history.filter(item => 
      item.result.prediction.disease.toLowerCase().includes(lowerQuery) ||
      item.result.metadata?.symptoms?.toLowerCase().includes(lowerQuery) ||
      item.result.metadata?.duration?.toLowerCase().includes(lowerQuery) ||
      item.result.metadata?.severity?.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('❌ Error searching history:', error);
    return [];
  }
};

/**
 * Get unique diseases from history
 * @returns {Array} Array of unique disease names
 */
export const getUniqueDiseases = () => {
  try {
    const history = getHistory();
    const diseases = history.map(item => item.result.prediction.disease);
    return [...new Set(diseases)];
  } catch (error) {
    console.error('❌ Error getting unique diseases:', error);
    return [];
  }
};

/**
 * Get history filtered by disease
 * @param {string} disease - Disease name to filter by
 * @returns {Array} Filtered history items
 */
export const getHistoryByDisease = (disease) => {
  try {
    const history = getHistory();
    return history.filter(item => 
      item.result.prediction.disease.toLowerCase() === disease.toLowerCase()
    );
  } catch (error) {
    console.error('❌ Error filtering by disease:', error);
    return [];
  }
};

/**
 * Get history filtered by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Filtered history items
 */
export const getHistoryByDateRange = (startDate, endDate) => {
  try {
    const history = getHistory();
    return history.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= startDate && itemDate <= endDate;
    });
  } catch (error) {
    console.error('❌ Error filtering by date:', error);
    return [];
  }
};