import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { llmAPI } from '../services/api';
import { saveToHistory } from '../utils/historyUtils';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Configure marked for better rendering
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
      
      // Save to local history
      if (!location.state?.fromHistory && !hasSavedRef.current) {
        const historyItem = saveToHistory(location.state.result);
        if (historyItem) {
          setSaved(true);
          hasSavedRef.current = true;
          console.log('✅ Analysis saved to local history');
        }
      }
      
      // Automatically fetch advice
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
      // Extract disease from multiple possible locations
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
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityBadge = (confidence) => {
    if (confidence >= 80) return { text: 'High Confidence', color: 'bg-green-100 text-green-800' };
    if (confidence >= 60) return { text: 'Moderate Confidence', color: 'bg-yellow-100 text-yellow-800' };
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

  // CRITICAL FIX: Extract data correctly from result object
  console.log('🔍 Processing result object:', result);
  
  // The disease name can be at multiple levels
  const disease = result.disease || result.prediction;
  
  // The confidence can also be at multiple levels
  const confidence = result.confidence || 0;
  
  // Get metadata
  const metadata = result.metadata || {};
  
  console.log('✅ Extracted disease:', disease);
  console.log('✅ Extracted confidence:', confidence);
  console.log('✅ Extracted metadata:', metadata);
  
  const badge = getSeverityBadge(confidence);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
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
          
          {/* Prediction */}
          <div className="border-l-4 border-blue-500 pl-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 py-4 rounded-r-xl">
            <p className="text-sm text-gray-600 font-medium mb-1">Detected Condition</p>
            <h2 className="text-3xl font-bold text-gray-800">{disease || 'Unknown'}</h2>
          </div>

          {/* Confidence Badge */}
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
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - confidence / 100)}`}
                    className={getSeverityColor(confidence)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xl font-bold ${getSeverityColor(confidence)}`}>
                    {confidence}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
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

        {/* AI-Generated Advice Section */}
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
                    Test LLM (public debug)
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
                    <strong>Important:</strong> This advice is generated using medical knowledge databases and AI assistance.
                    Always consult a healthcare professional for diagnosis and treatment.
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

        {/* Warning Section */}
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
                This AI-powered analysis is for <strong>informational purposes only</strong> and should not be considered 
                a medical diagnosis. Always consult with a <strong>qualified healthcare professional or dermatologist</strong> 
                for proper evaluation, diagnosis, and treatment of any skin condition.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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

      {/* Enhanced CSS for Medical Advice */}
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
          color: #1e3a8a;
          margin-top: 2.5rem;
          margin-bottom: 1.5rem;
          padding: 1rem 1.25rem;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border-left: 6px solid #1e40af;
          border-radius: 0.75rem;
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .medical-advice-content h1:first-child,
        .medical-advice-content h2:first-child {
          margin-top: 0;
        }

        .medical-advice-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          padding-left: 0.5rem;
          border-left: 3px solid #6366f1;
        }

        .medical-advice-content p {
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
          color: #4b5563;
          line-height: 1.8;
        }

        .medical-advice-content ul {
          margin-top: 1rem;
          margin-bottom: 1rem;
          padding-left: 0;
          list-style: none;
        }

        .medical-advice-content li {
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
          padding-left: 2rem;
          position: relative;
          color: #374151;
          line-height: 1.75;
          background: white;
          padding: 0.75rem 0.75rem 0.75rem 2.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .medical-advice-content li:before {
          content: "✓";
          position: absolute;
          left: 0.75rem;
          color: #10b981;
          font-weight: bold;
          font-size: 1.2rem;
          top: 0.75rem;
        }

        .medical-advice-content ul ul {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          margin-left: 1rem;
        }

        .medical-advice-content ul ul li:before {
          content: "→";
          color: #6366f1;
          font-size: 1rem;
        }

        .medical-advice-content strong {
          font-weight: 600;
          color: #1f2937;
        }

        .medical-advice-content em {
          font-style: italic;
          color: #6366f1;
        }

        .medical-advice-content code {
          background-color: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          color: #dc2626;
        }

        .medical-advice-content blockquote {
          border-left: 4px solid #3b82f6;
          background-color: #f0f9ff;
          padding: 1rem;
          margin: 1rem 0;
          border-radius: 0.5rem;
          color: #1e3a8a;
          font-style: italic;
        }

        .medical-advice-content p:last-child {
          background: white;
          border-left: none;
          padding: 0;
          border-radius: 0;
          margin-top: 1rem;
          font-size: 1rem;
          color: #4b5563;
          box-shadow: none;
        }

        .medical-advice-content hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2rem 0;
        }

        @media (max-width: 640px) {
          .medical-advice-content {
            padding: 1.5rem;
          }
          
          .medical-advice-content h1,
          .medical-advice-content h2 {
            font-size: 1.25rem;
            padding: 0.5rem 0.75rem;
          }
          
          .medical-advice-content h3 {
            font-size: 1.1rem;
          }
          
          .medical-advice-content {
            font-size: 0.95rem;
          }
          
          .medical-advice-content li {
            padding: 0.5rem 0.5rem 0.5rem 2rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Results;
