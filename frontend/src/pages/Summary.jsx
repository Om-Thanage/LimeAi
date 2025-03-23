import { useState } from 'react';
import axios from 'axios';
import Mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';
import Chatbot from '../components/Chatbot';
import { useAuth } from '../context/AuthContext';
import { saveContentToFirestore } from '../utils/firebaseHelpers';
import { marked } from 'marked';
import { BarChart2, BookOpen, FolderOpen, Users, Settings, LogOut } from 'lucide-react';

const Summary = () => {
  const { currentUser, logout } = useAuth();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState('');

  const handleMouseEnter = (item) => {
    setHoveredItem(item);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setError('');
    const reader = new FileReader();
    if (selectedFile.type === 'text/plain' || selectedFile.type === 'text/markdown') {
      reader.onload = (event) => setFileContent(event.target.result);
      reader.onerror = () => setError('Error reading file');
      reader.readAsText(selectedFile);
    } else if (selectedFile.name.endsWith('.docx')) {
      reader.onload = async (event) => {
        try {
          const result = await Mammoth.extractRawText({ arrayBuffer: event.target.result });
          setFileContent(result.value);
        } catch (err) {
          setError('Error extracting text from .docx file');
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else if (selectedFile.type === 'application/pdf') {
      reader.onload = async (event) => {
        try {
          const pdfDoc = await PDFDocument.load(event.target.result);
          const extractedText = (await Promise.all(
            pdfDoc.getPages().map(page => page.getTextContent())
          ))
            .map(textObj => textObj.items.map(item => item.str).join(' '))
            .join('\n\n');
          setFileContent(extractedText);
        } catch (err) {
          setError('Error extracting text from PDF file');
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      setError('Unsupported file format. Please upload .txt, .md, .docx, or .pdf files.');
    }
  };

  const generateSummary = async () => {
    if (!fileContent) {
      setError('Please upload a valid file');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a title for your summary');
      return;
    }
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
      const response = await axios.post(
        apiUrl,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful assistant that converts unstructured notes into a well-organized summary. Structure the content with clear sections and concise bullet points. Maintain essential details while ensuring readability. Use plain text formatting for a clean and professional appearance.',
            },
            {
              role: 'user',
              content: fileContent,
            },
          ],
          temperature: 0.3,
          max_tokens: 1500,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
          },
        }
      );
      const summaryContent = response.data.choices[0].message.content;
      setSummary(summaryContent);
      if (currentUser) {
        try {
          await saveContentToFirestore(
            currentUser.uid,
            title,
            summaryContent,
            'summary'
          );
          setSaved(true);
        } catch (error) {
          console.error('Error saving summary:', error);
        }
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setError(
        error.response?.data?.error?.message ||
          'Error generating summary. Please check your API key.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-20 flex-shrink-0 flex flex-col items-center pt-8 pb-4 space-y-8 bg-blue-500">
        <div className="bg-white w-10 h-10 rounded-lg flex items-center justify-center">
          <img src="src/images/LimeAi.svg" alt="Logo" />
        </div>
        <div className="flex flex-col items-center space-y-6 flex-1">
          <a href="/flowchart" className="relative">
            <button
              className="text-white p-2"
              onMouseEnter={() => handleMouseEnter('flowchart')}
              onMouseLeave={handleMouseLeave}
            >
              <BarChart2 className="w-6 h-6" />
              {hoveredItem === 'flowchart' && (
                <div className="absolute bottom-full ml-2 px-2 py-1 bg-white text-blue-500 rounded text-sm whitespace-nowrap">
                  Flowchart
                </div>
              )}
            </button>
          </a>
          <a href="/summary" className="relative">
            <button
              className="text-white p-2"
              onMouseEnter={() => handleMouseEnter('summary')}
              onMouseLeave={handleMouseLeave}
            >
              <BookOpen className="w-6 h-6" />
              {hoveredItem === 'summary' && (
                <div className="absolute bottom-full ml-2 px-2 py-1 bg-white text-blue-500 rounded text-sm whitespace-nowrap">
                  Summary
                </div>
              )}
            </button>
          </a>
          <a href="/whiteboard" className="relative">
            <button
              className="text-white p-2"
              onMouseEnter={() => handleMouseEnter('whiteboard')}
              onMouseLeave={handleMouseLeave}
            >
              <FolderOpen className="w-6 h-6" />
              {hoveredItem === 'whiteboard' && (
                <div className="absolute bottom-full px-2 py-1 bg-white text-blue-500 rounded text-sm whitespace-nowrap">
                  Whiteboard
                </div>
              )}
            </button>
          </a>
          <a href="/podcast" className="relative">
            <button
              className="text-white p-2"
              onMouseEnter={() => handleMouseEnter('podcast')}
              onMouseLeave={handleMouseLeave}
            >
              <Users className="w-6 h-6" />
              {hoveredItem === 'podcast' && (
                <div className="absolute bottom-full px-2 py-1 bg-white text-blue-500 rounded text-sm whitespace-nowrap">
                  Podcast
                </div>
              )}
            </button>
          </a>
          <div className="relative">
            <button
              className="text-white p-2"
              onMouseEnter={() => handleMouseEnter('settings')}
              onMouseLeave={handleMouseLeave}
            >
              <Settings className="w-6 h-6" />
              {hoveredItem === 'settings' && (
                <div className="absolute bottom-full ml-2 px-2 py-1 bg-white text-blue-500 rounded text-sm whitespace-nowrap">
                  Settings
                </div>
              )}
            </button>
          </div>
        </div>
        <div className="relative">
          <button
            className="text-white p-2"
            onClick={logout}
            onMouseEnter={() => handleMouseEnter('logout')}
            onMouseLeave={handleMouseLeave}
          >
            <LogOut className="w-6 h-6" />
            {hoveredItem === 'logout' && (
              <div className="absolute bottom-full px-2 py-1 bg-white text-blue-500 rounded text-sm whitespace-nowrap">
                Logout
              </div>
            )}
          </button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 p-6 -ml-7.6">
        <h1 className="text-3xl font-bold mb-6">AI Summary Generator</h1>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Summary Generation Box */}
          <div className="bg-white p-6 rounded-lg shadow flex-1">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
              <div className="flex flex-col space-y-4">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="border p-2 rounded"
                  accept=".txt,.md,.docx,.pdf"
                />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your summary"
                  className="border p-2 rounded"
                  required
                />
                <button
                  onClick={generateSummary}
                  disabled={!fileContent || loading || !title.trim()}
                  className={`bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded ${
                    !fileContent || loading || !title.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Processing...' : 'Generate Summary'}
                </button>
                {error && <p className="text-red-500">{error}</p>}
                {saved && <p className="text-green-500">Summary saved to your account!</p>}
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
                  <div dangerouslySetInnerHTML={{ __html: marked.parse(summary) }}></div>
                </div>
              ) : (
                <div className="text-gray-500">
                  Upload a document and click "Generate Summary" to see results
                </div>
              )}
            </div>
          </div>
          {/* Chatbot Box */}
          <div className="bg-white p-6 rounded-lg shadow w-full md:w-1/3">
            <Chatbot summarizedContent={summary} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;