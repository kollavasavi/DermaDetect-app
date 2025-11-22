import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictionAPI } from '../services/api';

function SkinDiseaseForm() {
  const [formData, setFormData] = useState({
    image: null,
    imagePreview: null,
    symptoms: '',
    duration: '',
    durationOption: '',
    spreading: '',
    sensations: [],
    appearance: [],
    sunExposure: '',
    newMedication: '',
    familyHistory: '',
    stress: '',
    oozing: '',
    severity: 'moderate'
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
      setStep(1);
      setError('');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCheckboxToggle = (field, value) => {
    const arr = formData[field] || [];
    const exists = arr.includes(value);
    const next = exists ? arr.filter(i => i !== value) : [...arr, value];
    setFormData({ ...formData, [field]: next });
  };

  const handleOptionChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.image) {
      setError('Please select an image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('image', formData.image);
      data.append('symptoms', formData.symptoms);
      data.append('duration', formData.duration);
      data.append('severity', formData.severity);

      console.log('📤 Sending prediction request...');
      const response = await predictionAPI.predict(data);
      
      console.log('📥 Received response:', response.data);
      
      if (response.data.success) {
        // Extract disease and confidence from response
        // Handle both flat structure and nested structure
        const disease = response.data.disease || response.data.prediction;
        const confidence = response.data.confidence || 0;
        
        console.log('✅ Extracted disease:', disease);
        console.log('✅ Extracted confidence:', confidence);
        
        // Create normalized result structure that Results.jsx expects
        const normalizedResult = {
          disease: disease,
          prediction: disease,
          confidence: confidence,
          metadata: {
            symptoms: formData.symptoms,
            duration: formData.duration,
            durationOption: formData.durationOption,
            spreading: formData.spreading,
            sensations: formData.sensations,
            appearance: formData.appearance,
            sunExposure: formData.sunExposure,
            newMedication: formData.newMedication,
            familyHistory: formData.familyHistory,
            stress: formData.stress,
            oozing: formData.oozing,
            severity: formData.severity
          },
          all_predictions: response.data.all_predictions || {},
          recommendations: response.data.recommendations || [],
          model_details: response.data.model_details || {},
          predictionId: Date.now().toString()
        };

        console.log('📦 Normalized result:', normalizedResult);

        // Navigate to results page with the normalized data
        navigate('/results', { 
          state: { result: normalizedResult }
        });
      } else {
        setError(response.data.message || 'Prediction failed');
      }

    } catch (err) {
      console.error('❌ Prediction error:', err);
      
      if (err.response) {
        console.error('Response error:', err.response.data);
        setError(err.response.data.message || err.response.data.error || 'Failed to get prediction');
      } else if (err.request) {
        setError('Cannot connect to server. Please check your internet connection.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Skin Disease Analysis
          </h1>
          <p className="text-gray-600 text-lg">Upload an image for automated diagnosis</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-indigo-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upload Skin Image *
              </label>
              <div className="border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-indigo-400 transition-all">
                {formData.imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img 
                        src={formData.imagePreview} 
                        alt="Preview" 
                        className="mx-auto max-h-80 rounded-xl shadow-lg border-4 border-white"
                      />
                      <div className="absolute -top-2 -right-2">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Post-upload questionnaire */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <h3 className="font-semibold text-gray-800 mb-3">Quick Questions (optional)</h3>
                      <div className="text-sm text-gray-600 mb-3">Step {step} of 4</div>

                      {/* Step 1: Duration & spreading */}
                      {step === 1 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">How long have you had this skin problem?</p>
                          <select name="durationOption" value={formData.durationOption} onChange={(e) => handleOptionChange('durationOption', e.target.value)} className="w-full px-3 py-2 rounded-lg border mb-4">
                            <option value="">Select duration</option>
                            <option value="<1week">Less than 1 week</option>
                            <option value="1-4weeks">1–4 weeks</option>
                            <option value="1-3months">1–3 months</option>
                            <option value=">3months">More than 3 months</option>
                          </select>

                          <p className="text-sm font-medium text-gray-700 mb-2">Is the affected area spreading?</p>
                          <div className="flex flex-col gap-3">
                            <button type="button" onClick={() => handleOptionChange('spreading','yes')} className={`w-full text-left py-3 px-4 rounded-lg ${formData.spreading==='yes' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Yes</button>
                            <button type="button" onClick={() => handleOptionChange('spreading','no')} className={`w-full text-left py-3 px-4 rounded-lg ${formData.spreading==='no' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>No</button>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Sensations & appearance */}
                      {step === 2 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Do you feel itching, pain, or burning?</p>
                          <div className="flex flex-col gap-2 mb-4">
                            {['Itching','Pain','Burning','None'].map(s => (
                              <button key={s} type="button" onClick={() => handleCheckboxToggle('sensations', s)} className={`w-full text-left py-3 px-4 rounded-lg ${formData.sensations.includes(s) ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{s}</button>
                            ))}
                          </div>

                          <p className="text-sm font-medium text-gray-700 mb-2">How does the skin look?</p>
                          <div className="flex flex-col gap-2">
                            {['White patches','Dark spots','Red/inflamed','Scaly/dry','Circular patch'].map(a => (
                              <button key={a} type="button" onClick={() => handleCheckboxToggle('appearance', a)} className={`w-full text-left py-3 px-4 rounded-lg ${formData.appearance.includes(a) ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{a}</button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step 3: Triggers */}
                      {step === 3 && (
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Frequent sun exposure?</p>
                            <div className="flex flex-col gap-3">
                              <button type="button" onClick={() => handleOptionChange('sunExposure','yes')} className={`w-full py-3 px-4 rounded-lg ${formData.sunExposure==='yes' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Yes</button>
                              <button type="button" onClick={() => handleOptionChange('sunExposure','no')} className={`w-full py-3 px-4 rounded-lg ${formData.sunExposure==='no' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>No</button>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Started after new medication?</p>
                            <div className="flex flex-col gap-3">
                              <button type="button" onClick={() => handleOptionChange('newMedication','yes')} className={`w-full py-3 px-4 rounded-lg ${formData.newMedication==='yes' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Yes</button>
                              <button type="button" onClick={() => handleOptionChange('newMedication','no')} className={`w-full py-3 px-4 rounded-lg ${formData.newMedication==='no' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>No</button>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Family history of skin diseases?</p>
                            <div className="flex flex-col gap-3">
                              <button type="button" onClick={() => handleOptionChange('familyHistory','yes')} className={`w-full py-3 px-4 rounded-lg ${formData.familyHistory==='yes' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Yes</button>
                              <button type="button" onClick={() => handleOptionChange('familyHistory','no')} className={`w-full py-3 px-4 rounded-lg ${formData.familyHistory==='no' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>No</button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 4: Severity */}
                      {step === 4 && (
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Does it ooze, bleed, or have blisters?</p>
                            <div className="flex flex-col gap-3">
                              <button type="button" onClick={() => handleOptionChange('oozing','yes')} className={`w-full py-3 px-4 rounded-lg ${formData.oozing==='yes' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Yes</button>
                              <button type="button" onClick={() => handleOptionChange('oozing','no')} className={`w-full py-3 px-4 rounded-lg ${formData.oozing==='no' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>No</button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navigation */}
                      <div className="mt-6 flex items-center justify-between">
                        <button type="button" onClick={() => setStep(Math.max(1, step-1))} disabled={step === 1} className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50">Back</button>
                        <div>
                          {step < 4 ? (
                            <button type="button" onClick={() => setStep(step+1)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Next</button>
                          ) : (
                            <button type="button" onClick={() => setStep(1)} className="px-4 py-2 rounded-lg bg-green-600 text-white">Done</button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: null, imagePreview: null })}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                      <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="mt-4">
                      <label className="cursor-pointer">
                        <span className="mt-2 block text-base font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                          Click to upload or drag and drop
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          required
                        />
                      </label>
                    </div>
                    <p className="mt-3 text-sm text-gray-500">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Describe Your Symptoms
              </label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleInputChange}
                rows="4"
                placeholder="E.g., Itching, redness, pain, swelling..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How long have you had this condition?
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="E.g., 2 weeks, 3 days, 1 month..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50"
              />
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Severity Level
              </label>
              <div className="grid grid-cols-3 gap-4">
                {['mild', 'moderate', 'severe'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, severity: level })}
                    className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                      formData.severity === level
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 font-bold text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing Image...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Analyze Image
                </span>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 rounded-r-xl">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-indigo-900 font-semibold mb-1">Important Information</p>
                <p className="text-sm text-indigo-800 leading-relaxed">
                  This tool is for informational purposes only and is not a substitute for professional medical advice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkinDiseaseForm;
