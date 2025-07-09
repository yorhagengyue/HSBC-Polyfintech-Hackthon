import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, X, Send, Bot, User, Sparkles, Loader2, AlertCircle,
  TrendingUp, TrendingDown, DollarSign, Shield, FileText, BarChart3,
  Lightbulb, AlertTriangle, CheckCircle, Copy, Download, Maximize2, 
  Minimize2, Move, Trash2
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTheme } from '../contexts/ThemeContext';
import { UserPreferencesContext } from './UserPreferences';
import { aiAPI } from '../services/api';

const AIChat = ({ lastAlert, hasNewAlert, userStocks = [] }) => {
  const { isDarkMode } = useTheme();
  const { riskProfile } = useContext(UserPreferencesContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 450, height: 650 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(() => {
    // Load cached messages from localStorage
    const cached = localStorage.getItem('ai_chat_messages');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Convert timestamp strings back to Date objects
        return parsed.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch (e) {
        return [{
          id: 1,
          type: 'bot',
          text: 'Hi! I\'m your AI Financial Advisor powered by Gemini. I can help you with:\n\n📊 Market Analysis & Stock Performance\n🛡️ Risk Assessment & Portfolio Optimization\n🏦 HSBC Product Recommendations\n📈 Technical & Fundamental Analysis\n⚠️ Alert Explanations & Action Plans\n\nHow can I assist you today?',
          timestamp: new Date(),
          features: ['analysis', 'risk', 'products', 'alerts']
        }];
      }
    }
    return [{
      id: 1,
      type: 'bot',
      text: 'Hi! I\'m your AI Financial Advisor powered by Gemini. I can help you with:\n\n📊 Market Analysis & Stock Performance\n🛡️ Risk Assessment & Portfolio Optimization\n🏦 HSBC Product Recommendations\n📈 Technical & Fundamental Analysis\n⚠️ Alert Explanations & Action Plans\n\nHow can I assist you today?',
      timestamp: new Date(),
      features: ['analysis', 'risk', 'products', 'alerts']
    }];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const chatWindowRef = useRef(null);

  // Get AI provider info
  const { data: providerInfo } = useQuery({
    queryKey: ['ai-provider-info'],
    queryFn: aiAPI.getProviderInfo,
    refetchInterval: 30000,
  });

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    // Don't save if it's just the initial welcome message
    if (messages.length > 1) {
      try {
        localStorage.setItem('ai_chat_messages', JSON.stringify(messages));
      } catch (e) {
        // Silently fail - caching is not critical
      }
    }
  }, [messages]);

  // Drag and resize handlers
  const handleMouseDown = (e, type) => {
    e.preventDefault();
    if (type === 'drag' && isMaximized) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
    } else if (type === 'resize' && isMaximized) {
      setIsResizing(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && isMaximized) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPosition({
        x: deltaX,
        y: deltaY
      });
    } else if (isResizing && isMaximized) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setSize({
        width: Math.max(500, 800 + deltaX),
        height: Math.max(600, 700 + deltaY)
      });
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, position, size]);

  // Toggle maximize with animation
  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    
    // Use setTimeout to allow state change to trigger, then animate
    setTimeout(() => {
      if (isMaximized) {
        // When restoring, go back to normal size
        setSize({ width: 400, height: 500 });
        setPosition({ x: 0, y: 0 });
      } else {
        // When maximizing, set to 2/3 screen size and center
        setSize({
          width: Math.floor(window.innerWidth * 0.67),
          height: Math.floor(window.innerHeight * 0.67)
        });
        setPosition({ x: 0, y: 0 });
      }
    }, 50);
  };

  // Copy message to clipboard
  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      // Failed to copy - could show a toast notification instead
    }
  };

  // Download chat history
  const downloadChatHistory = () => {
    const chatContent = messages.map(msg => 
      `[${msg.timestamp.toLocaleString()}] ${msg.type.toUpperCase()}: ${msg.text}`
    ).join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Clear chat history and cache
  const clearChatHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      // Clear localStorage
      localStorage.removeItem('ai_chat_messages');
      
      // Reset messages to initial welcome message
      setMessages([{
        id: 1,
        type: 'bot',
        text: 'Hi! I\'m your AI Financial Advisor powered by Gemini. I can help you with:\n\n📊 Market Analysis & Stock Performance\n🛡️ Risk Assessment & Portfolio Optimization\n🏦 HSBC Product Recommendations\n📈 Technical & Fundamental Analysis\n⚠️ Alert Explanations & Action Plans\n\nHow can I assist you today?',
        timestamp: new Date(),
        features: ['analysis', 'risk', 'products', 'alerts']
      }]);
    }
  };

  // Enhanced prompt templates
  const enhancePrompt = (userMessage) => {
    let enhancedPrompt = userMessage;
    
    // Add context about user's portfolio if asking about stocks
    if (userStocks.length > 0 && (userMessage.toLowerCase().includes('portfolio') || userMessage.toLowerCase().includes('my stocks'))) {
      const stockSymbols = userStocks.map(s => s.symbol).join(', ');
      enhancedPrompt += `\n\nContext: User's portfolio includes: ${stockSymbols}`;
    }
    
    // Add professional finance context
    enhancedPrompt += '\n\nPlease provide a professional financial analysis with specific data points, actionable insights, and relevant HSBC product recommendations where appropriate.';
    
    return enhancedPrompt;
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ messageText, analysisMode = 'simple', context = null }) => {
      const conversationHistory = messages.slice(-6).map(msg => ({
        user: msg.type === 'user' ? msg.text : '',
        assistant: msg.type === 'bot' ? msg.text : ''
      })).filter(item => item.user || item.assistant);

      // Include risk profile in context
      const enhancedContext = {
        ...context,
        user_risk_profile: riskProfile || 'medium'
      };

      return aiAPI.chat({
        message: enhancePrompt(messageText),
        conversation_history: conversationHistory,
        analysis_mode: analysisMode,
        context: enhancedContext
      });
    },
    onSuccess: (response, variables) => {
      // Handle different response structures
      const data = response.data || response;
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: data.response || data.analysis || data.content || 'No response content',
        timestamp: new Date(),
        provider: data.provider,
        model: data.model,
        tokens: data.tokens_used,
        cost: data.cost_estimate,
        features: extractFeatures(data.response || data.analysis || data.content || ''),
        analysisMode: data.analysis_mode || variables.analysisMode,
        originalQuery: variables.messageText,
        context: variables.context,
        // Generate follow-up suggestions based on the response
        followUpSuggestions: generateFollowUpSuggestions(data.response || data.analysis || data.content || '', variables.messageText)
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    },
    onError: (error) => {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: `I apologize, but I encountered an error: ${error.message}\n\nPlease try again or check your connection.`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  });

  // Extract features from response for rich display
  const extractFeatures = (text) => {
    const features = [];
    if (text && typeof text === 'string') {
      if (text.includes('risk') || text.includes('Risk')) features.push('risk');
      if (text.includes('HSBC') || text.includes('product')) features.push('products');
      if (text.includes('%') || text.includes('price')) features.push('metrics');
      if (text.includes('recommend') || text.includes('suggest')) features.push('recommendations');
    }
    return features;
  };

  // Generate follow-up suggestions based on AI response
  const generateFollowUpSuggestions = (response, originalQuery) => {
    const suggestions = [];
    
    // Context-aware suggestions based on response content
    if (response.toLowerCase().includes('risk')) {
      suggestions.push('How can I better diversify to reduce this risk?');
    }
    if (response.toLowerCase().includes('hsbc')) {
      suggestions.push('What are the minimum requirements for these HSBC products?');
    }
    if (response.toLowerCase().includes('market') && response.toLowerCase().includes('volatile')) {
      suggestions.push('Should I consider defensive assets during this volatility?');
    }
    if (response.toLowerCase().includes('crypto') || response.toLowerCase().includes('bitcoin')) {
      suggestions.push('What percentage of crypto is safe for my risk profile?');
    }
    if (response.toLowerCase().includes('recommend')) {
      suggestions.push('What are the historical returns of these recommendations?');
    }
    
    // Always add a risk-profile aware suggestion
    if (!suggestions.some(s => s.includes('risk profile'))) {
      suggestions.push(`Are these recommendations suitable for my ${riskProfile} risk tolerance?`);
    }
    
    // Limit to 3 suggestions
    return suggestions.slice(0, 3);
  };

  // Handle sending message
  const handleSend = async (analysisMode = 'simple') => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    // Special handling for specific queries
    let finalMessage = message;
    let context = null;
    
    if (message.toLowerCase().includes('explain last alert') && lastAlert) {
      finalMessage = `Please provide a comprehensive analysis of this financial alert:\n\nAlert: ${lastAlert.title}\nDetails: ${lastAlert.message}\nSeverity: ${lastAlert.severity}\nTime: ${new Date(lastAlert.timestamp).toLocaleString()}\n\nInclude:\n1. Root cause analysis\n2. Market impact assessment\n3. Risk mitigation strategies\n4. Relevant HSBC products for protection\n5. Action items with priorities`;
    } else if (message.toLowerCase().includes('analyze my portfolio')) {
      finalMessage = `Please analyze my investment portfolio and provide:\n1. Overall risk assessment\n2. Diversification analysis\n3. Performance metrics\n4. Optimization recommendations\n5. HSBC wealth management solutions that could enhance returns`;
    } else if (message.toLowerCase().includes('market outlook')) {
      finalMessage = `Provide a comprehensive market outlook including:\n1. Current market conditions\n2. Key economic indicators\n3. Sector performance analysis\n4. Risk factors to monitor\n5. Investment opportunities\n6. Protective strategies using HSBC products`;
    }

    sendMessageMutation.mutate({ 
      messageText: finalMessage, 
      analysisMode: analysisMode,
      context: context 
    });
  };

  // Handle deep analysis request
  const handleDeepAnalysis = (messageId) => {
    const originalMessage = messages.find(msg => msg.id === messageId);
    if (!originalMessage) return;
    
    setMessage(originalMessage.originalQuery || originalMessage.text);
    setIsLoading(true);
    
    sendMessageMutation.mutate({
      messageText: originalMessage.originalQuery || originalMessage.text,
      analysisMode: 'deep',
      context: originalMessage.context
    });
  };

  // Listen for news analysis requests
  useEffect(() => {
    const handleNewsAnalysis = (event) => {
      const { message, context, articles } = event.detail;
      
      // Open chat window
      setIsOpen(true);
      
      // Create user message with context
      const userMessage = {
        id: Date.now(),
        type: 'user',
        text: message,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      
      // Send to AI with context
      sendMessageMutation.mutate({
        messageText: message,
        analysisMode: 'simple',
        context: { news_articles: articles }
      });
    };

    window.addEventListener('openAIChat', handleNewsAnalysis);
    
    return () => {
      window.removeEventListener('openAIChat', handleNewsAnalysis);
    };
  }, []);

  // Quick action templates - enhanced with follow-up prompts
  const quickActions = [
    {
      label: 'Portfolio Analysis',
      icon: BarChart3,
      message: 'Analyze current market conditions and suggest portfolio adjustments for the next 3 months',
      color: 'blue',
      followUps: [
        'Which sectors should I overweight given my risk profile?',
        'How should I rebalance between stocks and bonds?',
        'What tax-efficient strategies should I consider?'
      ]
    },
    {
      label: 'Risk Assessment',
      icon: Shield,
      message: 'What are the top 3 market risks right now and how can I protect my investments?',
      color: 'green',
      followUps: [
        'Which hedging strategies work best for my portfolio?',
        'Should I increase my cash position?',
        'What insurance products could protect my wealth?'
      ]
    },
    {
      label: 'Market Update',
      icon: TrendingUp,
      message: 'Give me a quick market summary and 3 actionable investment moves for this week',
      color: 'purple',
      followUps: [
        'Which emerging markets show the most promise?',
        'What technical indicators suggest buy signals?',
        'How are global events affecting markets?'
      ]
    },
    {
      label: 'HSBC Products',
      icon: DollarSign,
      message: 'Recommend 3 HSBC products that could improve my portfolio performance and reduce risk',
      color: 'red',
      followUps: [
        'Tell me more about HSBC structured products',
        'What are the fees for HSBC wealth management?',
        'How does HSBC Private Banking work?'
      ]
    }
  ];

  // Format message with rich content
  const formatMessage = (text) => {
    // Handle undefined or null text
    if (!text || typeof text !== 'string') {
      return <p>No message content</p>;
    }
    
    // This is a simple formatter - in production, you'd use a proper markdown parser
    return text.split('\n').map((line, index) => {
      if (line.startsWith('##')) {
        return <h3 key={index} className="font-bold text-lg mt-2 mb-1">{line.replace('##', '')}</h3>;
      } else if (line.startsWith('•') || line.startsWith('-')) {
        return <li key={index} className="ml-4">{line.substring(1).trim()}</li>;
      } else if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index}>
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
          </p>
        );
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return <p key={index}>{line}</p>;
      }
    });
  };

  return (
    <>
      {/* FAB Button with pulse effect */}
      <motion.button
        className={`fixed bottom-6 right-6 w-14 h-14 ${
          isDarkMode 
            ? 'bg-hsbc-red hover:bg-red-700' 
            : 'bg-orange-500 hover:bg-orange-600'
        } rounded-full shadow-lg flex items-center justify-center z-40 transition-colors duration-300 ${
          hasNewAlert ? 'animate-pulse' : ''
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

      {/* Enhanced Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWindowRef}
            initial={{ 
              opacity: 0, 
              scale: 0.8, 
              y: isMaximized ? 0 : 50,
              x: isMaximized ? 0 : 20
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              x: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.3
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.8, 
              y: isMaximized ? 0 : 50,
              x: isMaximized ? 0 : 20,
              transition: {
                duration: 0.2
              }
            }}
            style={{
              position: 'fixed',
              left: isMaximized 
                ? `calc(50% - ${size.width/2}px + ${position.x}px)` 
                : 'auto',
              top: isMaximized 
                ? `calc(50% - ${size.height/2}px + ${position.y}px)` 
                : 'auto',
              right: isMaximized ? 'auto' : '24px',
              bottom: isMaximized ? 'auto' : '100px',
              width: `${size.width}px`,
              height: `${size.height}px`,
              zIndex: 50
            }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ease-in-out"
          >
            {/* Enhanced Header with drag handle */}
            <div 
              className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-t-xl ${isMaximized ? 'cursor-move' : ''}`}
              onMouseDown={isMaximized ? (e) => handleMouseDown(e, 'drag') : undefined}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-hsbc-red to-red-600 rounded-full flex items-center justify-center shadow-md">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white font-semibold">AI Financial Advisor</h3>
                  <p className="text-xs text-green-500 flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {providerInfo?.provider_info?.provider || 'Connecting...'} 
                    {providerInfo?.provider_info?.model && ` • ${providerInfo.provider_info.model}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={downloadChatHistory}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Download chat history"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={clearChatHistory}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Clear chat history"
                >
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </button>
                <motion.button
                  onClick={toggleMaximize}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title={isMaximized ? "Restore" : "Maximize"}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <motion.div
                    initial={false}
                    animate={{ rotate: isMaximized ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isMaximized ? (
                      <Minimize2 className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Maximize2 className="w-4 h-4 text-gray-500" />
                    )}
                  </motion.div>
                </motion.button>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>
            </div>

            {/* Resize handle - only show when maximized */}
            {isMaximized && (
              <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                onMouseDown={(e) => handleMouseDown(e, 'resize')}
                style={{
                  clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)'
                }}
              />
            )}

            {/* Messages with enhanced display */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.type === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`rounded-lg p-4 shadow-sm ${
                      msg.type === 'user' 
                        ? 'bg-gradient-to-br from-hsbc-red to-red-600 text-white' 
                        : msg.isError 
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                    }`}>
                      {/* Message content with rich formatting */}
                      <div className="text-sm space-y-1">
                        {msg.type === 'bot' ? formatMessage(msg.text) : msg.text}
                      </div>
                      
                      {/* Feature badges */}
                      {msg.features && msg.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {msg.features.includes('risk') && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Risk Analysis
                            </span>
                          )}
                          {msg.features.includes('products') && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                              <Shield className="w-3 h-3 mr-1" />
                              HSBC Products
                            </span>
                          )}
                          {msg.features.includes('recommendations') && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              <Lightbulb className="w-3 h-3 mr-1" />
                              Recommendations
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Token usage and cost */}
                      {msg.tokens && (
                        <p className="text-xs mt-2 opacity-60">
                          {msg.tokens} tokens • ${msg.cost?.toFixed(4) || '0.0000'}
                        </p>
                      )}

                      {/* Deep Analysis Button */}
                      {msg.type === 'bot' && !msg.isError && msg.analysisMode === 'simple' && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => handleDeepAnalysis(msg.id)}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-sm rounded-lg transition-all disabled:opacity-50"
                          >
                            <Sparkles className="w-4 h-4" />
                            Deep Analysis
                          </button>
                        </div>
                      )}

                      {/* Follow-up Suggestions */}
                      {msg.type === 'bot' && !msg.isError && msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Suggested follow-ups:</p>
                          <div className="flex flex-wrap gap-2">
                            {msg.followUpSuggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setMessage(suggestion);
                                  handleSend();
                                }}
                                disabled={isLoading}
                                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Message actions */}
                    <div className="flex items-center justify-between mt-1 px-1">
                      <p className="text-xs text-gray-500">
                        {msg.timestamp.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      {msg.type === 'bot' && !msg.isError && (
                        <button
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          {copiedMessageId === msg.id ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-2 shadow-sm ${
                    msg.type === 'user' 
                      ? 'bg-gradient-to-br from-gray-600 to-gray-700 order-1' 
                      : msg.isError 
                        ? 'bg-red-500 order-2'
                        : 'bg-gradient-to-br from-hsbc-red to-red-600 order-2'
                  }`}>
                    {msg.type === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : msg.isError ? (
                      <AlertCircle className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                </motion.div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-hsbc-red" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">AI is analyzing...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => setMessage(action.message)}
                      disabled={isLoading}
                      className={`flex items-center space-x-1 text-xs px-3 py-1.5 rounded-lg
                        ${action.color === 'blue' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30' : ''}
                        ${action.color === 'green' ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30' : ''}
                        ${action.color === 'purple' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30' : ''}
                        ${action.color === 'red' ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30' : ''}
                        transition-colors disabled:opacity-50`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Enhanced Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask me anything about finance..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-hsbc-red focus:ring-1 focus:ring-hsbc-red text-sm disabled:opacity-50 transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSend('simple')}
                  disabled={isLoading || !message.trim()}
                  data-send-button
                  className="px-4 py-2.5 bg-gradient-to-r from-hsbc-red to-red-600 hover:from-red-700 hover:to-red-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-white" />
                  )}
                </motion.button>
              </div>
              
              {/* Suggested queries */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setMessage('Explain last alert and suggest actions')}
                  disabled={isLoading || !lastAlert}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
                >
                  Explain last alert
                </button>
                <button
                  onClick={() => setMessage('What are 3 defensive stocks I should consider right now?')}
                  disabled={isLoading}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
                >
                  Defensive stocks
                </button>
                <button
                  onClick={() => setMessage('Should I increase my cash position this month? Why?')}
                  disabled={isLoading}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
                >
                  Cash strategy
                </button>
                <button
                  onClick={() => setMessage('What HSBC investment product best fits current market conditions?')}
                  disabled={isLoading}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
                >
                  HSBC products
                </button>
              </div>
            </div>
            
            {/* Resize handle */}
            {!isMaximized && (
              <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                onMouseDown={(e) => handleMouseDown(e, 'resize')}
                style={{
                  clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)'
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChat; 