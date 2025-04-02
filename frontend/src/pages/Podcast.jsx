import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { saveContentToFirestore } from '../utils/firebaseHelpers';
import mammoth from 'mammoth';

// API base URL - change this when deploying
const API_BASE_URL = 'https://limeai.onrender.com';

const Podcast = () => {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [podcastStyle, setPodcastStyle] = useState('conversational');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [jobId, setJobId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [podcastContent, setPodcastContent] = useState('');
  const [podcastAudio, setPodcastAudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const { currentUser } = useAuth();

  // Effect for handling job polling
  useEffect(() => {
    if (jobId && isPolling) {
      // Set up polling interval
      pollIntervalRef.current = setInterval(checkJobStatus, 3000);
      
      // Cleanup function
      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [jobId, isPolling]);

  const checkJobStatus = async () => {
    if (!jobId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/podcast-status/${jobId}`);
      
      if (!response.ok) {
        throw new Error(`Error checking status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'completed' && data.audioUrl) {
        // Job completed successfully
        clearInterval(pollIntervalRef.current);
        setIsPolling(false);
        setGenerationProgress(100);
        setAudioUrl(data.audioUrl);
        setStep(3);
        setIsGenerating(false);
        
        // Automatically play the audio if desired
        if (audioRef.current) {
          audioRef.current.play();
        }
      } else if (data.status === 'failed') {
        // Job failed
        clearInterval(pollIntervalRef.current);
        setIsPolling(false);
        setIsGenerating(false);
        setError(`Failed to generate podcast: ${data.message}`);
      } else {
        // Still processing - update progress indication 
        setGenerationProgress(prev => Math.min(prev + 5, 90));
      }
    } catch (err) {
      console.error('Error checking job status:', err);
      // Don't stop polling on temporary errors
      if (err.message.includes('404') || err.message.includes('not found')) {
        clearInterval(pollIntervalRef.current);
        setIsPolling(false);
        setIsGenerating(false);
        setError('Podcast generation job not found. Please try again.');
      }
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;
    
    // Check file type
    const fileType = selectedFile.type;
    if (!fileType.includes('pdf') && 
        !fileType.includes('word') && 
        !fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setError('Please upload a PDF or Word document (.pdf, .doc, .docx)');
      return;
    }
    
    setFile(selectedFile);
    setError('');
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    
    try {
      let text = '';
      
      // Extract text based on file type
      if (fileType.includes('pdf')) {
        // For PDF files - upload to server for extraction
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const response = await fetch(`${API_BASE_URL}/api/extract-pdf`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to extract text from PDF');
        }
        
        const data = await response.json();
        text = data.text;
      } else {
        // For Word documents - extract in the browser
        const reader = new FileReader();
        
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target.result;
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
            
            setExtractedText(text);
            clearInterval(progressInterval);
            setUploadProgress(100);
            setIsUploading(false);
            setStep(2);
          } catch (err) {
            clearInterval(progressInterval);
            setIsUploading(false);
            setError(`Failed to extract text: ${err.message}`);
          }
        };
        
        reader.readAsArrayBuffer(selectedFile);
        return; // Exit early for Word docs to allow async reader to work
      }
      
      setExtractedText(text);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploading(false);
      setStep(2);
    } catch (err) {
      clearInterval(progressInterval);
      setIsUploading(false);
      setError(`Error processing file: ${err.message}`);
    }
  };
  
  const generatePodcast = async () => {
    if (!extractedText.trim()) {
      setError('No text extracted from document');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    setAudioUrl(null);
    setGenerationProgress(10); // Start progress

    try {
      // First, generate optimized podcast content
      const contentResponse = await fetch(`${API_BASE_URL}/api/generate-podcast-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: extractedText,
          style: podcastStyle
        }),
      });
      
      if (!contentResponse.ok) {
        throw new Error('Failed to generate podcast content');
      }
      
      const contentData = await contentResponse.json();
      const podcastText = contentData.podcastContent;
      
      setGenerationProgress(40); // Update progress after content generation
      
      // Then, convert to speech using PlayDialog API
      const response = await fetch(`${API_BASE_URL}/api/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: podcastText,
          style: podcastStyle
        }),
      });
      
      if (!response.ok) {
        // Handle error response
        let errorMessage = 'Failed to generate audio';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = `Error (${response.status}): ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (data.jobId) {
        // Begin polling for job completion
        setJobId(data.jobId);
        setIsPolling(true);
        setGenerationProgress(50); // Update progress to indicate processing has started
      } else {
        throw new Error('No job ID returned from the server');
      }
    } catch (err) {
      console.error('Error generating podcast:', err);
      
      let userErrorMessage = err.message;
      if (err.message.includes('401')) {
        userErrorMessage = 'Authentication error with the text-to-speech service. Please check the API key.';
      } else if (err.message.includes('429')) {
        userErrorMessage = 'Too many requests to the text-to-speech service. Please try again later.';
      } else if (err.message.includes('Failed to fetch')) {
        userErrorMessage = 'Cannot connect to the server. Please check your connection or try again later.';
      }
      
      setError(userErrorMessage);
      setIsGenerating(false);
      setIsPolling(false);
      
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    }
  };

  // Function to generate simplified podcast
  const generateSimplePodcast = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic for your podcast');
      return;
    }
    
    if (!title.trim()) {
      setError('Please provide a title for your podcast');
      return;
    }
  
    setLoading(true);
    setError('');
    setSaved(false);
    setPodcastContent('');
    setPodcastAudio(null);
  
    try {
      // Call the backend API to generate podcast content
      const response = await axios.post(`${API_BASE_URL}/api/generate-podcast`, {
        text: topic,
        style: 'educational',
      });
  
      if (response.data.podcastContent) {
        setPodcastContent(response.data.podcastContent);
        
        // Save to Firebase if user is logged in
        if (currentUser) {
          try {
            await saveContentToFirestore(
              currentUser.uid,
              title,
              response.data.podcastContent,
              'podcast'
            );
            setSaved(true);
          } catch (error) {
            console.error('Error saving podcast:', error);
          }
        }
      } else if (response.data.error) {
        throw new Error(response.data.error);
      }
    } catch (err) {
      setError(`Error generating podcast: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetProcess = () => {
    setFile(null);
    setExtractedText('');
    setAudioUrl(null);
    setError('');
    setStep(1);
    setUploadProgress(0);
    setGenerationProgress(0);
    setJobId(null);
    setIsPolling(false);
    
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-b from-white to-indigo-50 shadow-xl rounded-xl my-12">
      <h1 className="text-3xl font-bold text-center text-indigo-800 mb-8">PodCast Studio</h1>
      
      {/* Steps Progress */}
      <div className="mb-10 px-4">
        <div className="flex items-center justify-between">
          <div className={`flex flex-col items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-indigo-100 text-indigo-600 border-2 border-indigo-600' : 'bg-gray-200 text-gray-400'}`}>
              1
            </div>
            <span className="mt-2 text-sm">Upload</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
          <div className={`flex flex-col items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-indigo-100 text-indigo-600 border-2 border-indigo-600' : 'bg-gray-200 text-gray-400'}`}>
              2
            </div>
            <span className="mt-2 text-sm">Generate</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
          <div className={`flex flex-col items-center ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-indigo-100 text-indigo-600 border-2 border-indigo-600' : 'bg-gray-200 text-gray-400'}`}>
              3
            </div>
            <span className="mt-2 text-sm">Listen</span>
          </div>
        </div>
      </div>
      
      {/* Errors */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
          <div className="flex">
            <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="mb-8">
          <div className="border-2 border-dashed border-indigo-300 rounded-lg p-8 text-center bg-indigo-50 hover:bg-indigo-100 transition-colors">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
              disabled={isUploading}
            />
            
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800">Upload Your Document</h3>
              <p className="text-gray-600 max-w-sm">
                Upload a Word or PDF document to transform into a professional podcast with multiple voices
              </p>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition shadow-md"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Select Document'}
              </button>
              
              <p className="text-xs text-gray-500">
                Supported formats: .pdf, .doc, .docx
              </p>
            </div>
            
            {isUploading && (
              <div className="mt-4">
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {uploadProgress < 100 ? 'Processing document...' : 'Text extraction complete!'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Step 2: Generate */}
      {step === 2 && (
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Document Content
            </h3>
            
            {file && (
              <div className="mb-4 flex items-center bg-indigo-50 p-3 rounded-lg">
                <svg className="h-8 w-8 text-indigo-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Podcast Style
              </label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  { id: 'conversational', name: 'Conversational', description: 'Friendly chat between two hosts' },
                  { id: 'educational', name: 'Educational', description: 'Teacher explaining concepts to a student' },
                  { id: 'storytelling', name: 'Storytelling', description: 'Narrative with character voices' },
                  { id: 'interview', name: 'Interview', description: 'Host interviewing an expert guest' }
                ].map((style) => (
                  <div 
                    key={style.id}
                    onClick={() => setPodcastStyle(style.id)}
                    className={`cursor-pointer rounded-lg border p-3 ${
                      podcastStyle === style.id 
                        ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between">
                      <h4 className="font-medium text-gray-900">{style.name}</h4>
                      {podcastStyle === style.id && (
                        <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{style.description}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <svg className="h-5 w-5 text-indigo-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Extracted Text Preview
              </label>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-200 h-32 overflow-y-auto text-sm text-gray-700">
                {extractedText.slice(0, 500)}
                {extractedText.length > 500 && '...'}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {extractedText.length} characters extracted from your document.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={resetProcess}
                className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              
              <button
                onClick={generatePodcast}
                disabled={isGenerating || !extractedText.trim()}
                className={`flex-1 px-5 py-2 text-white font-medium rounded-lg focus:outline-none focus:ring-4 transition ${
                  isGenerating || !extractedText.trim() 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-300'
                }`}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Podcast...
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Generate Podcast
                  </>
                )}
              </button>
            </div>
            
            {isGenerating && (
              <div className="mt-5">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Processing...</span>
                  <span>{generationProgress}%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center italic">
                  {generationProgress < 40 ? 'Creating podcast script...' : 
                   generationProgress < 80 ? 'Generating professional audio...' :
                   'Finalizing your podcast...'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Step 3: Results */}
      {step === 3 && audioUrl && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-6 shadow-lg">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Your Podcast is Ready!</h3>
            
            <div className="bg-white rounded-xl p-6 shadow-md mb-6">
              <div className="flex items-center mb-5">
                <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mr-4 shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {file?.name?.split('.')[0] || 'Your AI Podcast'}
                  </h4>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-indigo-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-6">
                <audio 
                  ref={audioRef}
                  controls 
                  className="w-full" 
                  src={audioUrl}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a 
                  href={audioUrl} 
                  download={`podcast_${Date.now()}.mp3`}
                  className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white text-center font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Podcast
                </a>
                
                <button 
                  onClick={resetProcess}
                  className="flex items-center justify-center px-4 py-3 border border-indigo-600 text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Create Another Podcast
                </button>
              </div>
            
            <div className="text-center"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Podcast;
