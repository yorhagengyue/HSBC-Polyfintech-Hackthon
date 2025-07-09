import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, X, TrendingUp, TrendingDown, Star, 
  Trash2, RefreshCw, AlertCircle, CheckCircle2, Loader2 
} from 'lucide-react';
import { stockAPI } from '../services/api';

const StockManager = ({ onStockListUpdate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [userStocks, setUserStocks] = useState([]);
  const [userStockData, setUserStockData] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [message, setMessage] = useState(null);

  // Load user stocks from localStorage on component mount
  useEffect(() => {
    const savedStocks = localStorage.getItem('userStocks');
    if (savedStocks) {
      try {
        const stocks = JSON.parse(savedStocks);
        setUserStocks(stocks);
        fetchUserStockData(stocks);
      } catch (error) {
        setUserStocks([]);
      }
    } else {
      // Add default stocks if none exist
      const defaultStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corporation' },
        { symbol: 'TSLA', name: 'Tesla, Inc.' },
        { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
        { symbol: 'BABA', name: 'Alibaba Group Holding' }
      ];
      setUserStocks(defaultStocks);
      localStorage.setItem('userStocks', JSON.stringify(defaultStocks));
      fetchUserStockData(defaultStocks);
    }
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showManager) {
      // Simple overflow handling
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scrolling
      document.body.style.overflow = '';
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = '';
    };
  }, [showManager]);

  // Fetch real-time data for user stocks
  const fetchUserStockData = async (stocks = userStocks) => {
    if (stocks.length === 0) {
      setUserStockData([]);
      onStockListUpdate && onStockListUpdate([]);
      return;
    }

    try {
      setIsLoading(true);
      const symbolString = stocks.map(s => s.symbol).join(',');
      
      const response = await stockAPI.getUserStocks(symbolString);
      
      setUserStockData(response.data);
      onStockListUpdate && onStockListUpdate(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch stock data' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Search for stocks
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await stockAPI.searchStocks(query);
      setSearchResults(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Search failed. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSearching(false);
    }
  };

  // Add stock to user's list
  const addStock = (stock) => {
    if (userStocks.some(s => s.symbol === stock.symbol)) {
      setMessage({ type: 'warning', text: `${stock.symbol} is already in your list` });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const newStocks = [...userStocks, stock];
    setUserStocks(newStocks);
    localStorage.setItem('userStocks', JSON.stringify(newStocks));
    fetchUserStockData(newStocks);
    
    setMessage({ type: 'success', text: `Added ${stock.symbol} to your watchlist` });
    setTimeout(() => setMessage(null), 3000);
    
    // Clear search
    setSearchQuery('');
    setSearchResults([]);
  };

  // Remove stock from user's list
  const removeStock = (symbol) => {
    const newStocks = userStocks.filter(s => s.symbol !== symbol);
    setUserStocks(newStocks);
    localStorage.setItem('userStocks', JSON.stringify(newStocks));
    fetchUserStockData(newStocks);
    
    setMessage({ type: 'success', text: `Removed ${symbol} from your watchlist` });
    setTimeout(() => setMessage(null), 3000);
  };

  // Refresh stock data
  const refreshData = () => {
    fetchUserStockData();
  };

  // Close modal handler
  const closeModal = () => {
    setShowManager(false);
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => {
          try {
            setShowManager(!showManager);
          } catch (error) {
            // Error setting showManager state
          }
        }}
        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-lg hover:scale-105 active:scale-95"
        style={{ cursor: 'pointer' }}
      >
        <Search className="w-4 h-4" />
        <span>Manage Stocks</span>
        {userStocks.length > 0 && (
          <span className="bg-blue-700 text-xs px-2 py-1 rounded-full">
            {userStocks.length}
          </span>
        )}
      </button>

      {/* Stock Manager Modal Portal */}
        {showManager && ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
          onClick={handleBackdropClick}
          >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Stock Manager
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Search and manage your custom stock watchlist
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                {/* Message Display */}
                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
                        message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        message.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}
                    >
                      {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                       message.type === 'error' ? <AlertCircle className="w-4 h-4" /> :
                       <AlertCircle className="w-4 h-4" />}
                      <span>{message.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search Section */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search stocks (e.g., AAPL, Apple, Tesla)..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearch(e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-3 w-5 h-5 text-blue-500 animate-spin" />
                    )}
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 max-h-60 overflow-y-auto"
                    >
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Search Results:
                      </h4>
                      <div className="space-y-2">
                        {searchResults.map((stock) => (
                          <motion.div
                            key={stock.symbol}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500"
                          >
                            <div>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {stock.symbol}
                              </span>
                              <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                                {stock.name}
                              </span>
                            </div>
                            <button
                              onClick={() => addStock(stock)}
                              className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                              title={`Add ${stock.symbol} to watchlist`}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* User Stocks Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Your Watchlist ({userStocks.length})
                    </h3>
                    <button
                      onClick={refreshData}
                      disabled={isLoading}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                      title="Refresh stock data"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {userStocks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No stocks in your watchlist yet.</p>
                      <p className="text-sm">Search and add stocks to get started!</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {userStockData.map((stock, index) => {
                        const isPositive = stock.change_percent > 0;
                        return (
                          <motion.div
                            key={stock.symbol}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {stock.symbol}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {stock.name}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="font-bold text-lg text-gray-900 dark:text-white">
                                  ${stock.price?.toFixed(2) || '0.00'}
                                </p>
                                <div className={`flex items-center text-sm ${
                                  isPositive ? 'text-green-500' : 'text-red-500'
                                }`}>
                                  {isPositive ? (
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3 mr-1" />
                                  )}
                                  <span>
                                    {isPositive ? '+' : ''}{stock.change?.toFixed(2) || '0.00'} 
                                    ({isPositive ? '+' : ''}{stock.change_percent?.toFixed(2) || '0.00'}%)
                                  </span>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => removeStock(stock.symbol)}
                                className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                title={`Remove ${stock.symbol} from watchlist`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default StockManager; 