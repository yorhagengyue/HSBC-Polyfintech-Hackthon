import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, ExternalLink, Clock, TrendingUp, AlertCircle, Search, X } from 'lucide-react';
import { stockAPI } from '../services/api';

const MarketNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Fetch market news
  const fetchMarketNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await stockAPI.getMarketNews();
      setNews(response.data || []);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError('Failed to load news. Please check your NEWS_API_KEY configuration.');
      // Only show empty array if API fails, no more mock data
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  // Search news
  const searchNews = async (query) => {
    if (!query.trim()) {
      fetchMarketNews();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await stockAPI.searchNews(query);
      setNews(response.data || []);
    } catch (err) {
      console.error('Failed to search news:', err);
      setError('Search failed. Please check your NEWS_API_KEY configuration.');
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketNews();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Get relevance color
  const getRelevanceColor = (score) => {
    if (score >= 0.8) return 'text-red-500 bg-red-500/10';
    if (score >= 0.6) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-blue-500 bg-blue-500/10';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchNews(searchQuery);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
    fetchMarketNews();
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Newspaper className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Market News</h2>
            <p className="text-sm text-gray-400">Latest financial updates</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Search className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={fetchMarketNews}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search news..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={clearSearch}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-red-400 font-medium">News Service Error</p>
              <p className="text-red-300 text-sm">{error}</p>
              <p className="text-gray-400 text-xs mt-1">
                Configure NEWS_API_KEY in your .env file to enable real news data
              </p>
            </div>
          </div>
        )}

        {!loading && !error && news.length === 0 && (
          <div className="text-center py-8">
            <Newspaper className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No news available</p>
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'Try a different search term' : 'Configure NEWS_API_KEY to load market news'}
            </p>
          </div>
        )}

        {!loading && news.length > 0 && (
          <div className="space-y-3">
            {news.slice(0, 10).map((article, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group p-4 bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 hover:border-gray-500 rounded-lg transition-all duration-200 cursor-pointer"
                onClick={() => window.open(article.url, '_blank')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h3>
                    
                    {article.description && (
                      <p className="text-gray-400 text-sm mt-2 line-clamp-2 leading-relaxed">
                        {article.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(article.published_at)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400">
                          {article.source}
                        </span>
                      </div>
                      
                      {article.relevance_score && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRelevanceColor(article.relevance_score)}`}>
                          {Math.round(article.relevance_score * 100)}% relevant
                        </div>
                      )}
                    </div>
                    
                    {article.symbols && article.symbols.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {article.symbols.slice(0, 3).map((symbol, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded border border-blue-500/20"
                          >
                            ${symbol}
                          </span>
                        ))}
                        {article.symbols.length > 3 && (
                          <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                            +{article.symbols.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketNews; 