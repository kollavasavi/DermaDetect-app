import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { llmAPI } from '../services/api';
import { saveToHistory } from '../utils/historyUtils';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

marked.setOptions({
  breaks: true,
  gfm: true,
});

const renderMarkdownSafe = (markdown) => {
  if (!markdown) return '';
  const rawHtml = marked.parse(markdown);
  return DOMPurify.sanitize(rawHtml);
};

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [advice, setAdvice] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const hasSavedRef = useRef(false);

  /*****************************************
   * LOAD RESULT & SAVE TO HISTORY (FIXED)
   *****************************************/
  useEffect(() => {
    if (location.state?.result) {
      const r = location.state.result;
      setResult(r);

      if (!location.state?.fromHistory && !hasSavedRef.current) {
        // CONFIDENCE FIX
        let raw = Number(r.confidence) || 0;
        let finalConfidence = raw <= 1 ? raw * 100 : raw;
        finalConfidence = Math.round(finalConfidence);

        const formatted = {
          disease: r.disease || r.prediction || "Unknown",
          confidence: finalConfidence,
          metadata: r.metadata || {},
          all_predictions: r.all_predictions || {},
          recommendations: r.recommendations || [],
          model_details: r.model_details || {},
        };

        saveToHistory(formatted);
        hasSavedRef.current = true;
        setSaved(true);
      }

      fetchAdvice(r);
    } else {
      navigate('/form');
    }

    return () => { hasSavedRef.current = false; };
  }, [location.state, navigate]);

  /*****************************************
   * FETCH MEDICAL ADVICE
   *****************************************/
  const fetchAdvice = async (predictionResult) => {
    setLoadingAdvice(true);
    setError('');

    try {
      const disease =
        predictionResult.disease ||
        predictionResult.prediction ||
        predictionResult.prediction?.disease;

      if (!disease) {
        setError("Disease information missing");
        return;
      }

      const resp = await llmAPI.getAdvice(
        disease,
        predictionResult.metadata?.symptoms || '',
        predictionResult.predictionId || 'unknown',
        predictionResult.metadata?.severity || 'moderate',
        predictionResult.metadata?.duration || ''
      );

      if (resp.data.success) setAdvice(resp.data.advice);
    } catch (err) {
      setError("Failed to load medical advice.");
    }

    setLoadingAdvice(false);
  };

  /*****************************************
   * UI HELPERS
   *****************************************/
  const getSeverityColor = (c) =>
    c >= 80 ? "text-green-600" :
    c >= 60 ? "text-yellow-600" :
              "text-red-600";

  const getSeverityBadge = (c) =>
    c >= 80 ? { text: "High Confidence", color: "bg-green-100 text-green-800" } :
    c >= 60 ? { text: "Moderate Confidence", color: "bg-yellow-100 text-yellow-800" } :
              { text: "Low Confidence", color: "bg-red-100 text-red-800" };

  if (!result) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  /*****************************************
   * CONFIDENCE FORMAT (DISPLAY)
   *****************************************/
  let raw = Number(result.confidence) || 0;
  let finalConfidence = raw <= 1 ? raw * 100 : raw;
  finalConfidence = Math.round(finalConfidence);

  const disease = result.disease || result.prediction || "Unknown";
  const metadata = result.metadata || {};
  const badge = getSeverityBadge(finalConfidence);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border">
          <div className="flex justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                Analysis Results
              </h1>
              {saved && <p className="text-green-600 text-sm mt-1">✔ Saved to history</p>}
            </div>

            <button onClick={() => navigate('/form')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl">
              New Analysis
            </button>
          </div>

          {/* Detected Condition */}
          <div className="border-l-4 border-blue-500 pl-6 mb-6 bg-blue-50 py-4 rounded-r-xl">
            <p className="text-sm text-gray-600">Detected Condition</p>
            <h2 className="text-3xl font-bold">{disease}</h2>
          </div>

          {/* Confidence */}
          <div className="flex items-center gap-4 mb-6">
            <span className={`px-5 py-2 rounded-full font-semibold ${badge.color}`}>
              {badge.text}
            </span>

            <div className="relative w-24 h-24">
              <svg className="transform -rotate-90 w-24 h-24">
                <circle cx="48" cy="48" r="40" strokeWidth="8" fill="none" className="text-gray-200" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - finalConfidence / 100)}`}
                  className={getSeverityColor(finalConfidence)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xl font-bold ${getSeverityColor(finalConfidence)}`}>
                  {finalConfidence}%
                </span>
              </div>
            </div>
          </div>

          {/* Metadata */}
          {(metadata.symptoms || metadata.duration || metadata.severity) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metadata.symptoms && (
                <div className="p-4 bg-blue-50 rounded-xl border">
                  <b>Symptoms:</b> {metadata.symptoms}
                </div>
              )}
              {metadata.duration && (
                <div className="p-4 bg-purple-50 rounded-xl border">
                  <b>Duration:</b> {metadata.duration}
                </div>
              )}
              {metadata.severity && (
                <div className="p-4 bg-orange-50 rounded-xl border">
                  <b>Severity:</b> {metadata.severity}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Medical Advice */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border">
          {loadingAdvice && <p>Loading medical advice...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {advice && <div dangerouslySetInnerHTML={{ __html: renderMarkdownSafe(advice) }} />}
        </div>

        {/* View History */}
        <button onClick={() => navigate('/history')}
          className="w-full py-4 bg-gray-100 rounded-xl border font-semibold">
          View History
        </button>
      </div>
    </div>
  );
}

export default Results;
