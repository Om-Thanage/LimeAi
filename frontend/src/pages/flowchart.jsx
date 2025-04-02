import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import './flowchart.css';
import { useAuth } from '../context/AuthContext';
import { saveContentToFirestore } from '../utils/firebaseHelpers';

// API base URL - change this when deploying
const API_BASE_URL = 'https://limeai.onrender.com';

const Flowchart = () => {
  const [concept, setConcept] = useState('');
  const [flowchartCode, setFlowchartCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fallbackMessage, setFallbackMessage] = useState('');
  const [isApiGenerated, setIsApiGenerated] = useState(true);
  const [saved, setSaved] = useState(false);
  const flowchartRef = useRef(null);
  const { currentUser } = useAuth();
  
  // Throttle requests to avoid overwhelming the API
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const throttleTime = 5000; // 5 seconds between requests

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);

  useEffect(() => {
    if (flowchartCode) {
      renderFlowchart();
    }
  }, [flowchartCode]);

  const renderFlowchart = () => {
    if (flowchartRef.current) {
      try {
        flowchartRef.current.innerHTML = flowchartCode;
        mermaid.init(undefined, flowchartRef.current);
      } catch (err) {
        console.error('Error rendering flowchart:', err);
        setError('The generated flowchart has syntax errors. Please try again with a different concept.');
      }
    }
  };

  const generateFlowchart = async () => {
    if (!concept.trim()) {
      setError('Please enter a concept');
      return;
    }
    
    // Implement frontend throttling
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < throttleTime) {
      setError(`Please wait ${Math.ceil((throttleTime - timeSinceLastRequest) / 1000)} seconds before making another request.`);
      return;
    }

    setLoading(true);
    setError('');
    setFallbackMessage('');
    setSaved(false);
    setLastRequestTime(Date.now());
    
    try {
      // Call to our backend API that uses Gemini
      const response = await fetch(`${API_BASE_URL}/api/generate-flowchart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ concept }),
      });

      const data = await response.json();
      
      if (data.mermaidCode) {
        setFlowchartCode(data.mermaidCode);
        setIsApiGenerated(data.isGeneratedByApi === true);
        
        // Save to Firebase if user is logged in
        if (currentUser) {
          try {
            await saveContentToFirestore(
              currentUser.uid,
              concept,
              data.mermaidCode,
              'flowchart'
            );
            setSaved(true);
          } catch (error) {
            console.error('Error saving flowchart:', error);
          }
        }
        
        
        if (data.message) {
          setFallbackMessage(data.message);
        }
      } else if (data.error) {
        throw new Error(data.error || 'Failed to generate flowchart');
      }
    } catch (err) {
      setError(`Error generating flowchart: ${err.message}`);
      console.error(err);
      
      handleSampleFlowchart();
    } finally {
      setLoading(false);
    }
  };

  // Example of how to handle a sample response for testing
  const handleSampleFlowchart = () => {
    const sampleMermaidCode = `graph TD
    A[Start] --> B{Do you understand the concept?}
    B -->|Yes| C[Great! You're ready to proceed]
    B -->|No| D[Break it down into smaller parts]
    D --> E[Study each part separately]
    E --> F[Connect the concepts together]
    F --> B`;
    
    setFlowchartCode(sampleMermaidCode);
    setFallbackMessage('Using a sample flowchart. Enter a concept and click "Generate Flowchart" for a custom flowchart.');
    setIsApiGenerated(false);
  };

  return (
    <div className="flowchart-container">
      <h1>Concept Flowchart Generator</h1>
      <p className="description">
        Enter a concept you're having trouble with, and we'll generate a visual flowchart to help you understand it better.
      </p>
      
      <div className="input-section">
        <textarea
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="Describe the concept you want to understand (e.g., 'How does React rendering work?')"
          className="concept-input"
        />
        
        <div className="buttons">
          <button 
            onClick={generateFlowchart} 
            disabled={loading} 
            className="generate-btn"
          >
            {loading ? 'Generating...' : 'Generate Flowchart'}
          </button>
          
          <button 
            onClick={handleSampleFlowchart} 
            className="sample-btn"
          >
            See Example
          </button>
        </div>
        
        {error && <p className="error">{error}</p>}
        {saved && <div className="saved-message">Flowchart saved to your account! Check the Dashboard to view it later.</div>}
        
        <p className="api-note">
          <strong>AI Powered Flowcharts:</strong> This app uses DeepSeek AI to generate custom flowcharts.
          For best results, wait at least 5 seconds between requests.
        </p>
      </div>
      
      {flowchartCode && (
        <div className="flowchart-result">
          <h2>
            {isApiGenerated ? 'AI-Generated Flowchart' : 'Flowchart'}
          </h2>
          
          {fallbackMessage && (
            <div className={isApiGenerated ? "info-message" : "fallback-message"}>
              <p>{fallbackMessage}</p>
            </div>
          )}
          
          <div className="mermaid-container" ref={flowchartRef}></div>
          
          <div className="flowchart-code">
            <h3>Mermaid Code:</h3>
            <pre>{flowchartCode}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default Flowchart;
