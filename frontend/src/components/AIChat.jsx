import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTheme } from '../contexts/ThemeContext';

const AIChat = ({ lastAlert, hasNewAlert }) => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hi! I\'m your Financial AI Assistant. Ask me about market events, risk analysis, or say "Explain last alert" to understand recent notifications.',
      timestamp: new Date(),
    }
  ]);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending message
  const handleSend = () => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      let aiResponse = '';
      
      if (message.toLowerCase().includes('explain last alert') && lastAlert) {
        aiResponse = `📊 Alert Analysis: ${lastAlert.title}\n\n` +
          `This ${lastAlert.severity} severity event occurred ${getTimeAgo(lastAlert.timestamp)}. ` +
          `${lastAlert.message}\n\n` +
          `💡 Recommendation: Based on this market volatility, consider diversifying with HSBC Fixed Deposit accounts ` +
          `offering stable returns of 3.5% p.a. This can help balance your portfolio risk.\n\n` +
          `Would you like me to show you specific HSBC products for risk mitigation?`;
      } else if (message.toLowerCase().includes('risk')) {
        aiResponse = `Risk management is crucial in volatile markets. Here are key strategies:\n\n` +
          `1. 📈 Diversification: Don't put all eggs in one basket\n` +
          `2. 🛡️ Fixed Income: HSBC offers competitive fixed deposit rates\n` +
          `3. 📊 Regular Monitoring: Set price alerts at 3-5% thresholds\n\n` +
          `Your current portfolio shows MODERATE risk. Consider allocating 30% to low-risk products.`;
      } else {
        aiResponse = `I understand you're asking about "${message}". ` +
          `Let me analyze the market data and provide personalized recommendations. ` +
          `In the meantime, have you considered HSBC's wealth management services for professional portfolio guidance?`;
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: aiResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <>
      {/* FAB Button */}
      <motion.button
        className={`fixed bottom-6 right-6 w-14 h-14 ${
          isDarkMode 
            ? 'bg-hsbc-red hover:bg-red-700' 
            : 'bg-orange-500 hover:bg-orange-600'
        } rounded-full shadow-lg flex items-center justify-center z-40 transition-colors duration-300 ${
          hasNewAlert ? (isDarkMode ? 'ring-4 ring-hsbc-red/30' : 'ring-4 ring-orange-500/30') : ''
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
      >
        <motion.div
          animate={hasNewAlert ? {
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          } : {}}
          transition={{ repeat: hasNewAlert ? Infinity : 0, duration: 2 }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </motion.div>
        {hasNewAlert && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
            animate={{ scale: [0.8, 1.2, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 flex flex-col border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-hsbc-red rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                                  <div>
                    <h3 className="text-gray-900 dark:text-white font-medium">AI Financial Advisor</h3>
                    <p className="text-xs text-green-400 flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${msg.type === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`rounded-lg p-3 ${
                      msg.type === 'user' 
                        ? 'bg-hsbc-red text-white' 
                        : 'bg-gray-700 text-gray-200'
                    }`}>
                      <p className="text-sm whitespace-pre-line">{msg.text}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-1">
                      {msg.timestamp.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-2 ${
                    msg.type === 'user' ? 'bg-gray-600 order-1' : 'bg-hsbc-red order-2'
                  }`}>
                    {msg.type === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about market events..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-hsbc-red text-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  className="px-4 py-2 bg-hsbc-red hover:bg-red-700 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4 text-white" />
                </motion.button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => setMessage('Explain last alert')}
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
                >
                  Explain last alert
                </button>
                <button
                  onClick={() => setMessage('Show risk analysis')}
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
                >
                  Risk analysis
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChat; 