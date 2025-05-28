import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Chatbot = ({ summarizedContent }) => {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const chatContainerRef = useRef(null);
  const latestUserMessageRef = useRef(null);
  const inputRef = useRef(null);

  // Initial greeting message
  useEffect(() => {
    setChatHistory([{ 
      userID: 'chatBot', 
      textContent: 'Hello! I\'m your Notes Assistant. Ask me questions about the summarized content and I\'ll try to help you understand it better.' 
    }]);
  }, []);

  // Scroll to the user's latest message when they submit a prompt
  useEffect(() => {
    if (latestUserMessageRef.current && chatContainerRef.current) {
      // Scroll within the chat container instead of the whole page
      chatContainerRef.current.scrollTo({
        top: latestUserMessageRef.current.offsetTop - chatContainerRef.current.offsetTop,
        behavior: 'smooth'
      });
    }
    
    // Expand the chat container when there's more than just the greeting
    if (chatHistory.length > 1) {
      setExpanded(true);
    }
  }, [chatHistory]);
  
  // Focus the input field after sending a message
  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

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
                Do not mention that this is according to the notes, it does not look good in the response.
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
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      getResponseForGivenPrompt();
    }
  };

  return (
    <div 
      className="h-full bg-white rounded-lg shadow flex flex-col"
      style={{ 
        height: expanded ? "calc(80vh)" : "320px", 
        transition: "height 0.3s ease",
        position: "relative" // Add this to create a positioning context
      }}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Notes Assistant</h2>
      </div>
      
      {/* Dynamic height chat container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ 
          height: expanded ? "calc(100% - 80px)" : "220px",
          transition: "height 0.3s ease",
          overscrollBehavior: "contain" // Prevents scroll chaining
        }}
      >
        {chatHistory.map((chat, index) => {
          const isUserMessage = chat.userID === 'user';
          const isLastUserMessage = isUserMessage && 
            chatHistory.filter(msg => msg.userID === 'user').length === 
            chatHistory.filter(msg => msg.userID === 'user' && chatHistory.indexOf(msg) <= index).length;
          
          return (
            <div
              key={index}
              ref={isLastUserMessage ? latestUserMessageRef : null}
              className={`max-w-[80%] ${
                isUserMessage
                  ? 'ml-auto bg-blue-500 text-white rounded-l-lg rounded-tr-lg' 
                  : 'bg-gray-100 rounded-r-lg rounded-tl-lg'
              } p-3`}
            >
              <p className="whitespace-pre-line">{chat.textContent}</p>
            </div>
          );
        })}
        {loading && (
          <div className="bg-gray-100 max-w-[80%] rounded-r-lg rounded-tl-lg p-3">
            <p>Thinking...</p>
          </div>
        )}
        {/* Invisible div for stable scrolling */}
        <div className="h-4"></div>
      </div>
      
      <div className="p-4 border-t border-gray-200 mt-auto">
        <div className="flex gap-2">
          <input
            type="text"
            ref={inputRef}
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
  );
};

// SendIcon component remains unchanged
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