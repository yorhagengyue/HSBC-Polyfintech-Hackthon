import React, { useState, useRef, useEffect } from 'react';
import { Search, X, TrendingUp, Clock, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalSearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([
    'AAPL', 'TSLA', 'GOOGL', 'MSFT'
  ]);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value) => {
    setQuery(value);
    if (value.length > 0) {
      // Mock search results
      const mockResults = [
        { type: 'stock', symbol: 'AAPL', name: 'Apple Inc.', price: 175.23, change: 2.5 },
        { type: 'stock', symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.65, change: -1.2 },
        { type: 'news', title: 'Fed announces rate decision', time: '2 hours ago' },
        { type: 'alert', title: 'TSLA dropped 5%', severity: 'high', time: '30 min ago' }
      ].filter(item => 
        item.symbol?.toLowerCase().includes(value.toLowerCase()) ||
        item.name?.toLowerCase().includes(value.toLowerCase()) ||
        item.title?.toLowerCase().includes(value.toLowerCase())
      );
      setResults(mockResults);
    } else {
      setResults([]);
    }
  };

  const handleSelectResult = (result) => {
    if (result.type === 'stock') {
      // Add to recent searches
      setRecentSearches(prev => [result.symbol, ...prev.filter(s => s !== result.symbol)].slice(0, 4));
    }
    if (onSearch) {
      onSearch(result);
    }
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search stocks, news, alerts..."
          className="w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white placeholder-gray-500"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (query || recentSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Recent Searches</p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => handleSearch(symbol)}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{symbol}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {results.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectResult(result)}
                    className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
                  >
                    {result.type === 'stock' && (
                      <>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-900 dark:text-white">{result.symbol}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{result.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">${result.price}</p>
                          <p className={`text-sm ${result.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {result.change >= 0 ? '+' : ''}{result.change}%
                          </p>
                        </div>
                      </>
                    )}
                    {result.type === 'news' && (
                      <>
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <Hash className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900 dark:text-white">{result.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">News • {result.time}</p>
                        </div>
                      </>
                    )}
                    {result.type === 'alert' && (
                      <>
                        <div className={`p-2 rounded-lg ${
                          result.severity === 'high' 
                            ? 'bg-red-100 dark:bg-red-900/30' 
                            : 'bg-yellow-100 dark:bg-yellow-900/30'
                        }`}>
                          <TrendingUp className={`w-4 h-4 ${
                            result.severity === 'high'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900 dark:text-white">{result.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Alert • {result.time}</p>
                        </div>
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {query && results.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No results found for "{query}"</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearchBar; 