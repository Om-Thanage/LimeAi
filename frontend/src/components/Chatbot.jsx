import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Chatbot = ({ summarizedContent }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);

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


    {/* deepseekr1free
      
      try {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "deepseek/deepseek-r1:free",
      messages: [
        {
          role: "system",
          content: `You are a helpful study assistant chatbot. 
                   Answer questions ONLY based on the summarized notes provided below.
                   If the answer isn't in the notes, say "I don't see information about that in the notes."
                   Keep answers concise but thorough.
                   Use bullet points for complex answers.
                   Use plain text formatting for a clean and professional appearance.
                   Here are the summarized notes:\n\n${summarizedContent}`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      temperature: 0.2,
      max_tokens: 1024,
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
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are a helpful study assistant chatbot. 
                       Answer questions ONLY based on the summarized notes provided below.
                       If the answer isn't in the notes, say "I don't see information about that in the notes."
                       Keep answers concise but thorough. Also explain in simple terms and also ask a follow back question if the user understood or not. If not expalin in more simpler words by givingreal world examples apart from content provided.Use bullet points for complex answers.While geberating answer, maintain good spacing and punctuation in your sentences and between your paragraphs.
                       Important : Do not ever use markdown, use plain text formatting for a clean and professional appearance.
                       Here are the summarized notes:\n\n${summarizedContent}`
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.2,
          max_tokens: 1024
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
          }
        }
      );

      const responseText = response.data.choices[0].message.content;
      
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
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      getResponseForGivenPrompt();
    }
  };

  return (
    <div className="h-full bg-white rounded-lg shadow">
      <div className="flex flex-col h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Notes Assistant</h2>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isOpen ? <MinimizeIcon /> : <MaximizeIcon />}
          </button>
        </div>
        
        {isOpen && (
          <>
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
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  on={handleKeyPress}
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
          </>
        )}
      </div>
    </div>
  );
};

// Icons
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