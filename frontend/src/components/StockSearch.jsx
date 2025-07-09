import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Loader } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { stockAPI } from '../services/api';

const StockSearch = ({ onSelect, existingSymbols = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  // Search for stocks using API
  useEffect(() => {
    const searchStocks = async () => {
      if (searchTerm.length < 1) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await stockAPI.searchStocks(searchTerm);
        const results = response.data || [];
        // Filter out existing symbols
        const filteredResults = results.filter(stock => !existingSymbols.includes(stock.symbol));
        setSearchResults(filteredResults);
      } catch (error) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchStocks, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, existingSymbols]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSelectStock(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectStock = (stock) => {
    onSelect(stock.symbol);
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div ref={searchRef} className="relative z-50">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search stocks..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(e.target.value.length > 0);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(searchTerm.length > 0)}
          className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-hsbc-red transition-colors w-full"
        />
        {isSearching && (
          <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[100] max-h-64 overflow-y-auto"
            style={{ zIndex: 9999 }}
          >
            {searchResults.map((stock, index) => (
              <motion.div
                key={stock.symbol}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelectStock(stock)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  selectedIndex === index 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900 dark:text-white">{stock.symbol}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{stock.exchange || 'NASDAQ'}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stock.name}</p>
                  </div>
                  <Plus className="w-4 h-4 text-gray-400" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Results */}
      <AnimatePresence>
        {isOpen && searchTerm.length > 0 && searchResults.length === 0 && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[100] p-4"
            style={{ zIndex: 9999 }}
          >
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
              No stocks found for "{searchTerm}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockSearch; 