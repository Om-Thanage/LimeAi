import { useState } from 'react';
import axios from 'axios';
import Mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';
import Chatbot from '../components/Chatbot';
import { useAuth } from '../context/AuthContext';
import { saveContentToFirestore } from '../utils/firebaseHelpers';
import { marked } from 'marked';

const Summary = () => {
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState('');
  const { currentUser } = useAuth();

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
          const extractedText = (await Promise.all(pdfDoc.getPages().map(page => page.getTextContent()))).map(textObj =>
            textObj.items.map(item => item.str).join(' ')
          ).join('\n\n');

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
                'You are a helpful assistant that converts unstructured notes into a well-structured summary. Create clear sections with headings, bullet points, and keep essential details. Format in Markdown.',
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">AI Summary Generator</h1>
      <div className='flex'>    
      <div className="bg-white p-6 rounded-lg shadow mb-6">
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

      <div className="bg-white p-6 rounded-lg shadow">
        <Chatbot />
      </div>
      </div>
    </div>
  );
};

export default Summary;
