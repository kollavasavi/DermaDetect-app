// historyUtils.js
// FINAL COMPLETE WORKING VERSION ✔

const HISTORY_KEY = "analysisHistory";

/****************************
 * NORMALIZE RESULT
 ****************************/
const normalizeResult = (result) => {
  return {
    disease: result.disease || result.prediction || "Unknown",
    confidence: Number(result.confidence) || 0,

    metadata: result.metadata || {},

    all_predictions: result.all_predictions || {},
    recommendations: result.recommendations || [],
    model_details: result.model_details || {},
  };
};

/****************************
 * SAVE TO HISTORY
 ****************************/
export const saveToHistory = (result) => {
  try {
    const existing = getHistory();

    const normalized = normalizeResult(result);

    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const item = {
      id,
      timestamp: new Date().toISOString(),
      result: normalized,
    };

    const updated = [item, ...existing].slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

    console.log("✅ Saved to history:", item);
    return item;
  } catch (err) {
    console.error("❌ Error saving to history:", err);
    return null;
  }
};

/****************************
 * GET ALL HISTORY
 ****************************/
export const getHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];

    return arr.map((item) => ({
      ...item,
      result: normalizeResult(item.result),
    }));
  } catch (err) {
    console.error("❌ Error loading history:", err);
    return [];
  }
};

/****************************
 * GET SINGLE HISTORY ITEM
 ****************************/
export const getHistoryItem = (id) => {
  return getHistory().find((i) => i.id === id) || null;
};

/****************************
 * DELETE ITEM
 ****************************/
export const deleteHistoryItem = (id) => {
  try {
    const updated = getHistory().filter((i) => i.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
};

/****************************
 * CLEAR ALL HISTORY
 ****************************/
export const clearHistory = () => {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch {
    return false;
  }
};

/****************************
 * HISTORY STATS (FIXED)
 * ✔ No NaN
 * ✔ Whole numbers for avg confidence
 ****************************/
export const getHistoryStats = () => {
  try {
    const history = getHistory();

    if (!history.length)
      return { total: 0, diseases: {}, avgConfidence: 0 };

    let totalConf = 0;
    const diseases = {};

    history.forEach((item) => {
      const d = item.result.disease || "Unknown";
      const c = Number(item.result.confidence) || 0;

      diseases[d] = (diseases[d] || 0) + 1;
      totalConf += c;
    });

    return {
      total: history.length,
      diseases,
      avgConfidence: Math.round(totalConf / history.length), // FIXED ✔
    };
  } catch (err) {
    console.error("❌ Stats error:", err);
    return { total: 0, diseases: {}, avgConfidence: 0 };
  }
};

/****************************
 * EXPORT HISTORY
 ****************************/
export const exportHistory = (filename = "analysis-history.json") => {
  const blob = new Blob([JSON.stringify(getHistory(), null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/****************************
 * SEARCH HISTORY
 ****************************/
export const searchHistory = (query) => {
  const q = query.toLowerCase();

  return getHistory().filter((item) => {
    const r = item.result;
    return (
      r.disease?.toLowerCase().includes(q) ||
      r.metadata?.symptoms?.toLowerCase().includes(q) ||
      r.metadata?.duration?.toLowerCase().includes(q)
    );
  });
};

/****************************
 * UNIQUE DISEASES
 ****************************/
export const getUniqueDiseases = () => {
  return [...new Set(getHistory().map((item) => item.result.disease))];
};
