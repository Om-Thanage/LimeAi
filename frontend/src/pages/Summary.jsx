import { useState } from 'react';
import axios from 'axios';
import Mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib'; // ✅ Use pdf-lib
import Chatbot from '../components/Chatbot';

const Summary = () => {
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    setLoading(true);
    setError('');

    {/*r1 free
      
      try {
  const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

  const response = await axios.post(
    apiUrl,
    {
      model: "deepseek/deepseek-r1:free",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that converts unstructured notes into a well-organized summary. Structure the content with clear sections and concise bullet points. Maintain essential details while ensuring readability. Use plain text formatting for a clean and professional appearance.",
        },
        {
          role: "user",
          content: fileContent,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    },
    {
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        "HTTP-Referer": "<YOUR_SITE_URL>", // Optional for OpenRouter ranking
        "X-Title": "<YOUR_SITE_NAME>", // Optional for OpenRouter ranking
        "Content-Type": "application/json",
      },
    }
  );

  console.log(response.data);
} catch (error) {
  console.error("Error fetching AI response:", error);
}


      */}

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

      setSummary(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Summary generation error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      setError('Failed to generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Smart Notes Summarizer</h1>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Upload Your Notes</h2>
            <input
              type="file"
              onChange={handleFileChange}
              className="border border-gray-300 rounded p-2"
              accept=".txt,.md,.docx,.pdf"
            />

            <button
              onClick={generateSummary}
              disabled={!fileContent || loading}
              className={`bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded ${
                !fileContent || loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Processing...' : 'Generate Summary'}
            </button>

            {error && <p className="text-red-500">{error}</p>}
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
                <div dangerouslySetInnerHTML={{ __html: markdownToHtml(summary) }} />
              </div>
            ) : (
              <p className="text-gray-500 italic">Your summary will appear here.</p>
            )}
          </div>
        </div>

        <div className="w-full md:w-1/2">
          <Chatbot summarizedContent={summary} />
        </div>
      </div>
    </div>
  );
};

// Markdown to HTML converter
const markdownToHtml = (markdown) => {
  if (!markdown) return '';
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\n/gim, '<br>');
};

export default Summary;
