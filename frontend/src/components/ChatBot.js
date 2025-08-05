import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import { MessageCircle, Send, Bot, User } from 'lucide-react';

const ChatBot = ({ callId = null }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (callId) {
      fetchChatHistory();
    }
  }, [callId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChatHistory = async () => {
    try {
      const response = await chatAPI.getChatHistory(callId);
      const history = response.data.map(chat => [
        { type: 'user', content: chat.message, timestamp: chat.timestamp },
        { type: 'ai', content: chat.response, timestamp: chat.timestamp }
      ]).flat();
      setMessages(history.slice(-10)); // Limit to last 10 messages
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(inputMessage, callId);
      
      const aiMessage = {
        type: 'ai',
        content: response.data.response,
        timestamp: response.data.timestamp
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = callId ? [
    "What did I do well in this call?",
    "What objections could I have handled better?",
    "Did I miss any buying signals?",
    "How can I improve for next time?"
  ] : [
    "How can I handle price objections better?",
    "What are some effective closing techniques?",
    "How do I identify buying signals?",
    "Tips for building rapport with prospects"
  ];

  return (
    <div className="card">
      <div 
        className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <h3 className="font-semibold">AI Sales Coach</h3>
          </div>
          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          {/* Chat Messages */}
          <div className="chat-container mb-4" style={{ height: '300px' }}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="w-12 h-12 text-blue-500 mb-3" />
                <p className="text-gray-600 mb-2">Hi! I'm your AI sales coach.</p>
                <p className="text-sm text-gray-500">
                  {callId ? 'Ask me about this specific call!' : 'Ask me any sales-related questions!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`chat-message flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === 'user' ? 'bg-blue-500' : 'bg-gray-200'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <div className={`p-3 rounded-lg ${
                        message.type === 'user' 
                          ? 'bg-blue-500 text-white rounded-br-sm' 
                          : 'bg-white border border-gray-200 rounded-bl-sm'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Suggested Questions */}
          {messages.length === 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Try asking:</p>
              <div className="space-y-1">
                {suggestedQuestions.slice(0, 2).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="text-xs text-blue-600 hover:text-blue-800 block w-full text-left p-1 hover:bg-blue-50 rounded"
                  >
                    "{question}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex space-x-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about sales techniques or this call..."
              className="flex-1 p-2 border border-gray-300 rounded-lg resize-none text-sm"
              rows="2"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || loading}
              className={`p-2 rounded-lg ${
                inputMessage.trim() && !loading
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } transition-colors`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;