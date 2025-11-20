import React, { useState } from 'react';
import { llmAPI, predictionAPI } from './services/api';

function ImageUpload() {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState('');
  const [advice, setAdvice] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return setMessage('Please select an image.');
    const formData = new FormData();
    // The backend expects the file field to be named 'image' (multer config)
    formData.append('image', file);

    try {
      // Use axios-based helper which handles baseURL and auth headers
      const resp = await predictionAPI.predict(formData);
      const data = resp.data;
      if (data && data.success) {
        setPrediction(data.prediction);
        setMessage('Prediction received!');
        // Automatically request LLM advice (if token exists)
        try {
          setLoadingAdvice(true);
          // llmAPI attaches Authorization header via interceptor
          const adviceResp = await llmAPI.getAdvice(
            data.prediction || '',
            '', // symptoms (not collected here)
            data.predictionId || data.id || null,
            'moderate',
            ''
          );
          if (adviceResp?.data?.success) {
            setAdvice(adviceResp.data.advice);
          }
        } catch (err) {
          console.error('LLM advice error:', err);
        } finally {
          setLoadingAdvice(false);
        }
      } else {
        setMessage('Error during prediction.');
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setMessage('Failed to connect to backend.');
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload & Predict</button>
      {message && <p>{message}</p>}
      {prediction && <h3>Prediction: {prediction}</h3>}
      {loadingAdvice && <p>Loading advice...</p>}
      {advice && (
        <div className="mt-4 p-3 bg-white rounded shadow-sm">
          <h4 className="font-semibold mb-2">AI Medical Advice</h4>
          <div>{advice}</div>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
