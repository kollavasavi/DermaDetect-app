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
  const [debugInfo, setDebugInfo] = useState(null);
  const [saved, setSaved] = useState(false);
  
  const hasSavedRef = useRef(false);

  useEffect(() => {
    if (location.state?.result) {
      console.log('📥 Received result in Results page:', location.state.result);
      setResult(location.state.result);
      
      if (!location.state?.fromHistory && !hasSavedRef.current) {
        const historyItem = saveToHistory(location.state.result);
        if (historyItem) {
          setSaved(true);
          hasSavedRef.current = true;
          console.log('✅ Analysis saved to local history');
        }
      }
      
      fetchAdvice(location.state.result);
    } else {
      navigate('/form');
    }
    
    return () => {
      hasSavedRef.current = false;
    };
  }, [location.state, navigate]);

  const fetchAdvice = async (predictionResult) => {
    setLoadingAdvice(true);
    setError('');
    setDebugInfo(null);
    try {
      const disease = predictionResult.disease || 
                     predictionResult.prediction || 
                     predictionResult.prediction?.disease;
      
      console.log('🔍 Extracted disease for LLM:', disease);
      
      if (!disease) {
        setError('Disease information not found in results');
        return;
      }
      
      const response = await llmAPI.getAdvice(
        disease,
        predictionResult.metadata?.symptoms || predictionResult.symptoms || '',
        predictionResult.predictionId || 'unknown',
        predictionResult.metadata?.severity || predictionResult.severity || 'moderate',
        predictionResult.metadata?.duration || predictionResult.duration || ''
      );

      if (response.data.success) {
        setAdvice(response.data.advice);
      }
    } catch (err) {
      console.error('❌ Error fetching advice:', err);
      if (err.response) {
        const msg = err.response.data?.message || err.response.data?.error || JSON.stringify(err.response.data);
        setError(`Failed to load treatment advice: ${msg}`);
      } else if (err.request) {
        setError('Failed to reach LLM service. Please check backend and LLM availability.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoadingAdvice(false);
    }
  };

  const runLLMDebug = async () => {
    setLoadingAdvice(true);
    setDebugInfo(null);
    try {
      const resp = await llmAPI.debug();
      setDebugInfo(resp.data || { success: true });
    } catch (err) {
      console.error('LLM debug failed:', err);
      if (err.response) setDebugInfo({ error: err.response.data });
      else setDebugInfo({ error: err.message });
    } finally {
      setLoadingAdvice(false);
    }
  };

  const getSeverityColor = (confidence) => {
    const conf = Number(confidence) || 0;
    if (conf >= 80) return 'text-green-600';
    if (conf >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityBadge = (confidence) => {
    const conf = Number(confidence) || 0;
    if (conf >= 80) return { text: 'High Confidence', color: 'bg-green-100 text-green-800' };
    if (conf >= 60) return { text: 'Moderate Confidence', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Low Confidence', color: 'bg-red-100 text-red-800' };
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Extract and convert confidence properly
  console.log('🔍 Full result object:', JSON.stringify(result, null, 2));
  
  const disease = result.disease || result.prediction;
  // Convert confidence to number and ensure it's valid
  const rawConfidence = result.confidence ?? 0;
  const confidence = Number(rawConfidence);
  const displayConfidence = isNaN(confidence) ? 0 : confidence;
  const metadata = result.metadata || {};
  
  console.log('✅ Extracted disease:', disease);
  console.log('✅ Raw confidence:', rawConfidence);
  console.log('✅ Converted confidence:', confidence);
  console.log('✅ Display confidence:', displayConfidence);
  console.log('✅ Is NaN?:', isNaN(confidence));
  
  const badge = getSeverityBadge(displayConfidence);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-indigo-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Analysis Results</h1>
                {saved && (
                  <p className="text-sm text-green-600 font-medium flex items-center gap-1 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved to history
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate('/form')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
            >
              New Analysis
            </button>
          </div>
          
          <div className="border-l-4 border-blue-500 pl-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 py-4 rounded-r-xl">
            <p className="text-sm text-gray-600 font-medium mb-1">Detected Condition</p>
            <h2 className="text-3xl font-bold text-gray-800">{disease || 'Unknown'}</h2>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <span className={`px-5 py-2.5 rounded-full text-sm font-semibold shadow-md ${badge.color}`}>
              {badge.text}
            </span>
            <div className="flex items-center gap-2">
              <div className="relative w-24 h-24">
                <svg className="transform -rotate-90 w-24 h-24">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - displayConfidence / 100)}`}
                    className={getSeverityColor(displayConfidence)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xl font-bold ${getSeverityColor(displayConfidence)}`}>
                    {Math.round(displayConfidence)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {(metadata.symptoms || metadata.duration || metadata.severity) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {metadata.symptoms && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-sm text-blue-700 font-semibold">Symptoms</p>
                    </div>
                    <p className="font-medium text-gray-800">{metadata.symptoms}</p>
                  </div>
                )}
                {metadata.duration && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-purple-700 font-semibold">Duration</p>
                    </div>
                    <p className="font-medium text-gray-800">{metadata.duration}</p>
                  </div>
                )}
                {metadata.severity && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <p className="text-sm text-orange-700 font-semibold">Severity</p>
                    </div>
                    <p className="font-medium text-gray-800 capitalize">{metadata.severity}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-indigo-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Medical Advice & Care</h2>
          </div>

          {loadingAdvice && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 font-medium">Generating personalized medical advice...</p>
              <p className="text-sm text-gray-500">This may take a few moments</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-5 mb-4 shadow-sm">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-800 font-medium">{error}</p>
                  <button
                    onClick={() => fetchAdvice(result)}
                    className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={runLLMDebug}
                    className="mt-3 ml-3 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium text-sm"
                  >
                    Test LLM
                  </button>
                  {debugInfo && (
                    <pre className="mt-3 p-3 bg-gray-100 rounded-md text-sm overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {advice && !loadingAdvice && (
            <div className="max-w-none">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 p-5 mb-6 rounded-r-xl shadow-sm">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-indigo-800 leading-relaxed">
                    <strong>Important:</strong> This advice is AI-generated. Always consult a healthcare professional.
                  </p>
                </div>
              </div>
              <div 
                className="medical-advice-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdownSafe(advice) }}
              />
            </div>
          )}

          {!advice && !loadingAdvice && !error && (
            <button
              onClick={() => fetchAdvice(result)}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-lg"
            >
              Generate Detailed Medical Advice
            </button>
          )}
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-r-2xl p-6 shadow-lg mb-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-yellow-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-yellow-900 mb-2 text-lg">⚠️ Important Medical Disclaimer</h3>
              <p className="text-yellow-800 text-sm leading-relaxed">
                This AI-powered analysis is for <strong>informational purposes only</strong>. Always consult a <strong>qualified healthcare professional</strong> for proper diagnosis and treatment.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/history')}
            className="py-4 bg-white text-gray-800 rounded-xl hover:bg-gray-50 shadow-lg border-2 border-gray-200 transition-all hover:shadow-xl transform hover:-translate-y-0.5 font-semibold flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View History
          </button>
          <button
            onClick={() => navigate('/form')}
            className="py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Analysis
          </button>
        </div>
      </div>

      <style jsx>{`
        .medical-advice-content {
          line-height: 1.8;
          font-size: 1rem;
          color: #374151;
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          border: 1px solid #e5e7eb;
        }
        .medical-advice-content h1,
        .medical-advice-content h2 {
          font-size: 1.75rem;
          font-weight: 800;
          margin-top: 2.5rem;
          margin-bottom: 1.5rem;
          padding: 1rem 1.25rem;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border-radius: 0.75rem;
          text-transform: uppercase;
        }
        .medical-advice-content li {
          margin: 0.75rem 0;
          padding-left: 2.5rem;
          position: relative;
        }
        .medical-advice-content li:before {
          content: "✓";
          position: absolute;
          left: 0.75rem;
          color: #10b981;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}

export default Results;
