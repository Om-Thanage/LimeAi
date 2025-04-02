import React ,{ useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Chatbot = ({ summarizedContent }) => {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);
  const inputAreaRef = useRef(null); // New ref for the input area

  // Initial greeting message
  useEffect(() => {
    setChatHistory([{ 
      userID: 'chatBot', 
      textContent: 'Hello! I\'m your Notes Assistant. Ask me questions about the summarized content and I\'ll try to help you understand it better.' 
    }]);
  }, []);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    
    // Also scroll to input area after messages update
    if (inputAreaRef.current) {
      inputAreaRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const getResponseForGivenPrompt = async () => {
    if (inputValue.trim() === '') return;
    
    if (!summarizedContent) {
      setChatHistory([
        ...chatHistory,
        { userID: 'user', textContent: inputValue },
        { userID: 'chatBot', textContent: "I don't see any summarized content yet. Please upload and summarize your notes first so I can answer questions about them." }
      ]);
      setInputValue('');
      return;
    }
    
    const userMessage = inputValue;
    const updatedHistory = [
      ...chatHistory,
      { userID: 'user', textContent: userMessage }
    ];
    
    setChatHistory(updatedHistory);
    setInputValue('');
    setLoading(true);

    try {
      const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent';
      
      const historyFormatted = chatHistory.map(msg => ({
        role: msg.userID === 'user' ? 'user' : 'model',
        parts: [{ text: msg.textContent }]
      })).slice(-5); 
      
      const systemPrompt = {
        role: 'user',
        parts: [{
          text: `You are a helpful study assistant chatbot. 
                Answer questions ONLY based on the summarized notes provided below.
                If the answer isn't in the notes, say "I don't see information about that in the notes."
                Keep answers concise but thorough. Also explain in simple terms and ask a follow-up question if the user understood or not. 
                If not, explain in simpler words by giving real-world examples apart from content provided.
                Use bullet points for complex answers. While generating answers, maintain good spacing and punctuation in your sentences and between paragraphs.
                Important: Do not use markdown, use plain text formatting for a clean and professional appearance.
                Here are the summarized notes:

                ${summarizedContent}`
        }]
      };
      
      // Add user's current message
      const currentMessage = {
        role: 'user',
        parts: [{ text: userMessage }]
      };
      
      const messages = [systemPrompt, ...historyFormatted, currentMessage];
      
      const response = await axios.post(
        `${apiUrl}?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          contents: messages,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const responseText = response.data.candidates[0].content.parts[0].text;
      
      setChatHistory([
        ...updatedHistory,
        { userID: 'chatBot', textContent: responseText }
      ]);
    } catch (error) {
      console.error('API Error:', error);
      
      setChatHistory([
        ...updatedHistory,
        { 
          userID: 'chatBot', 
          textContent: `I apologize, but I encountered an error. Please try again in a moment.` 
        }
      ]);
    } finally {
      setLoading(false);
      
      // Ensure input area is visible after loading completes
      setTimeout(() => {
        if (inputAreaRef.current) {
          inputAreaRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      getResponseForGivenPrompt();
    }
  };

  return (
    <div className="h-full bg-white rounded-lg shadow">
      <div className="flex flex-col min-h-[60vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Notes Assistant</h2>
        </div>
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {chatHistory.map((chat, index) => (
                <div
                  key={index}
                  className={`max-w-[80%] ${
                    chat.userID === 'user' 
                      ? 'ml-auto bg-blue-500 text-white rounded-l-lg rounded-tr-lg' 
                      : 'bg-gray-100 rounded-r-lg rounded-tl-lg'
                  } p-3`}
                >
                  <p className="whitespace-pre-line">{chat.textContent}</p>
                </div>
              ))}
              {loading && (
                <div className="bg-gray-100 max-w-[80%] rounded-r-lg rounded-tl-lg p-3">
                  <p>Thinking...</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200" ref={inputAreaRef}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  placeholder={summarizedContent ? "Ask about your notes..." : "Summarize your notes first..."}
                  disabled={loading || !summarizedContent}
                />
                <button
                  onClick={getResponseForGivenPrompt}
                  className={`bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 ${
                    loading || !summarizedContent ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={loading || !summarizedContent} 
                >
                  <SendIcon />
                </button>
              </div>
            </div>
      </div>
    </div>
  );
};

// Icons remain unchanged
const MinimizeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="4 14 10 14 10 20"></polyline>
    <polyline points="20 10 14 10 14 4"></polyline>
    <line x1="14" y1="10" x2="21" y2="3"></line>
    <line x1="3" y1="21" x2="10" y2="14"></line>
  </svg>
);

const MaximizeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 3 21 3 21 9"></polyline>
    <polyline points="9 21 3 21 3 15"></polyline>
    <line x1="21" y1="3" x2="14" y2="10"></line>
    <line x1="3" y1="21" x2="10" y2="14"></line>
  </svg>
);

const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

export default Chatbot;