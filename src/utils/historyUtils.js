// historyUtils.js
// FIXED version — works with your SkinDiseaseForm and Results.jsx

const HISTORY_KEY = 'analysisHistory';

/**
 * Normalize result so History always receives:
 * result = {
 *   prediction: { disease, confidence },
 *   metadata: {...}
 * }
 */
const normalizeResult = (result) => {
  return {
    prediction: {
      disease: result.disease || result.prediction || "Unknown",
      confidence: Number(result.confidence) || 0,
    },
    metadata: result.metadata || {},
    all_predictions: result.all_predictions || {},
    recommendations: result.recommendations || [],
    model_details: result.model_details || {},
  };
};

/** SAVE to history */
export const saveToHistory = (result) => {
  try {
    const existingHistory = getHistory();
    
    // Normalize before saving
    const normalized = normalizeResult(result);

    const timestamp = Date.now();
    const id = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

    const historyItem = {
      id,
      timestamp: new Date().toISOString(),
      result: normalized
    };

    const updated = [historyItem, ...existingHistory].slice(0, 50); // limit 50
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

    console.log("✅ Saved normalized history:", historyItem);
    return historyItem;
  } catch (err) {
    console.error("❌ Error saving history:", err);
    return null;
  }
};

/** GET history */
export const getHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : [];

    // Normalize all old records too
    return history.map((item) => ({
      ...item,
      result: normalizeResult(item.result)
    }));
  } catch (err) {
    console.error("❌ Error loading history:", err);
    return [];
  }
};

export const getHistoryItem = (id) => {
  return getHistory().find((i) => i.id === id) || null;
};

/** DELETE */
export const deleteHistoryItem = (id) => {
  try {
    const updated = getHistory().filter((i) => i.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
};

/** CLEAR */
export const clearHistory = () => {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch {
    return false;
  }
};

/** STATS — FIXED (no NaN) */
export const getHistoryStats = () => {
  try {
    const history = getHistory();

    if (history.length === 0) {
      return { total: 0, diseases: {}, avgConfidence: 0 };
    }

    const diseases = {};
    let totalConfidence = 0;

    history.forEach((item) => {
      const d = item.result.prediction.disease || "Unknown";
      const c = Number(item.result.prediction.confidence) || 0;

      diseases[d] = (diseases[d] || 0) + 1;
      totalConfidence += c;
    });

    return {
      total: history.length,
      diseases,
      avgConfidence: Math.round((totalConfidence / history.length) * 10) / 10,
    };
  } catch {
    return { total: 0, diseases: {}, avgConfidence: 0 };
  }
};

/** EXPORT */
export const exportHistory = (filename = "analysis-history.json") => {
  const data = JSON.stringify(getHistory(), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
};

/** SEARCH */
export const searchHistory = (query) => {
  const q = query.toLowerCase();
  return getHistory().filter((item) => {
    const r = item.result;
    return (
      r.prediction.disease.toLowerCase().includes(q) ||
      r.metadata.symptoms?.toLowerCase().includes(q)
    );
  });
};

/** Unique Diseases */
export const getUniqueDiseases = () => {
  return [...new Set(getHistory().map((i) => i.result.prediction.disease))];
};
