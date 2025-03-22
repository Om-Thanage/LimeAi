import { useState } from 'react';
import axios from 'axios';
import Chatbot from '../components/Chatbot';

const Summary = () => {
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setFileContent(content);
    };
    
    reader.onerror = () => {
      setError('Error reading file');
    };
    
    reader.readAsText(selectedFile);
  };

  const generateSummary = async () => {
    if (!fileContent) {
      setError('Please upload a file first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that converts unstructured notes into well-structured, slightly summarized format. Create clear sections with headings, bullet points for key information, and maintain the essential content. Format your response using Markdown.'
            },
            {
              role: 'user',
              content: fileContent
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
          }
        }
      );

      const summaryText = response.data.choices[0].message.content;
      setSummary(summaryText);
    } catch (error) {
      console.error('Summary generation error:', error);
      setError('Failed to generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Smart Notes Summarizer</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left side - File upload and summary */}
        <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Upload Your Notes</h2>
            <div className="flex flex-col gap-4">
              <input
                type="file"
                onChange={handleFileChange}
                className="border border-gray-300 rounded p-2"
                accept=".txt,.md,.doc,.docx"
              />
              
              <button
                onClick={generateSummary}
                disabled={!fileContent || loading}
                className={`bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded ${
                  !fileContent || loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Processing...' : 'Generate Structured Summary'}
              </button>
              
              {error && <p className="text-red-500">{error}</p>}
            </div>
          </div>
          
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Structured Summary</h2>
            
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ) : summary ? (
              <div className="prose max-w-none overflow-y-auto max-h-[65vh] p-4 border rounded">
                <div dangerouslySetInnerHTML={{ 
                  __html: markdownToHtml(summary) 
                }} />
              </div>
            ) : (
              <p className="text-gray-500 italic">
                Your structured notes will appear here after processing.
              </p>
            )}
          </div>
        </div>
        
        {/* Right side - Chatbot */}
        <div className="w-full md:w-1/2">
          <Chatbot summarizedContent={summary} />
        </div>
      </div>
    </div>
  );
};

// Simple markdown to HTML converter for basic formatting
const markdownToHtml = (markdown) => {
  if (!markdown) return '';
  
  return markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Bold and Italic
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    
    // Lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/<\/li>\n<li>/gim, '</li><li>')
    .replace(/<\/li>\n/gim, '</li></ul>\n')
    .replace(/^\<li\>/gim, '<ul><li>')
    
    // Numbered lists
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/^\<li\>/gim, '<ol><li>')
    
    // Line breaks
    .replace(/\n/gim, '<br>');
};

export default Summary;