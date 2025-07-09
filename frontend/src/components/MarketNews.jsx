import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, ExternalLink, Clock, TrendingUp, AlertCircle, Search, X, Filter, Bot, Send, ChevronDown, Tag, TrendingDown, Activity } from 'lucide-react';
import { stockAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const MarketNews = () => {
  const { isDarkMode } = useTheme();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedForAI, setSelectedForAI] = useState([]);
  const [sendingToAI, setSendingToAI] = useState(false);

  // Available filter tags
  const filterTags = [
    { id: 'bullish', label: 'Bullish', icon: TrendingUp, color: 'green' },
    { id: 'bearish', label: 'Bearish', icon: TrendingDown, color: 'red' },
    { id: 'neutral', label: 'Neutral', icon: Activity, color: 'gray' },
    { id: 'tech', label: 'Technology', color: 'blue' },
    { id: 'finance', label: 'Finance', color: 'purple' },
    { id: 'energy', label: 'Energy', color: 'yellow' },
    { id: 'healthcare', label: 'Healthcare', color: 'pink' },
    { id: 'consumer', label: 'Consumer', color: 'orange' },
    { id: 'breaking', label: 'Breaking', color: 'red' },
    { id: 'analysis', label: 'Analysis', color: 'indigo' }
  ];

  // Fetch market news
  const fetchMarketNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await stockAPI.getMarketNews();
      // Add tags to news articles based on content analysis
      const newsWithTags = (response.data || []).map(article => ({
        ...article,
        tags: extractTags(article)
      }));
      setNews(newsWithTags);
    } catch (err) {
      setError('Failed to load news. Please check your NEWS_API_KEY configuration.');
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  // Extract tags from article content
  const extractTags = (article) => {
    const tags = [];
    const content = `${article.title} ${article.description || ''}`.toLowerCase();
    
    // Sentiment analysis
    if (content.includes('surge') || content.includes('rally') || content.includes('gain') || content.includes('rise') || content.includes('positive')) {
      tags.push('bullish');
    } else if (content.includes('fall') || content.includes('drop') || content.includes('decline') || content.includes('negative') || content.includes('concern')) {
      tags.push('bearish');
    } else {
      tags.push('neutral');
    }
    
    // Sector tags
    if (content.includes('tech') || content.includes('software') || content.includes('ai') || content.includes('semiconductor')) {
      tags.push('tech');
    }
    if (content.includes('bank') || content.includes('finance') || content.includes('fed') || content.includes('interest rate')) {
      tags.push('finance');
    }
    if (content.includes('oil') || content.includes('energy') || content.includes('opec') || content.includes('gas')) {
      tags.push('energy');
    }
    if (content.includes('health') || content.includes('drug') || content.includes('pharma') || content.includes('medical')) {
      tags.push('healthcare');
    }
    if (content.includes('consumer') || content.includes('retail') || content.includes('spending')) {
      tags.push('consumer');
    }
    
    // News type
    if (article.published_at && new Date() - new Date(article.published_at) < 3600000) {
      tags.push('breaking');
    }
    if (content.length > 200 || content.includes('analysis') || content.includes('report')) {
      tags.push('analysis');
    }
    
    return [...new Set(tags)]; // Remove duplicates
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
      const newsWithTags = (response.data || []).map(article => ({
        ...article,
        tags: extractTags(article)
      }));
      setNews(newsWithTags);
    } catch (err) {
      setError('Search failed. Please check your NEWS_API_KEY configuration.');
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter news based on selected tags
  const filteredNews = useMemo(() => {
    if (selectedTags.length === 0) {
      return news;
    }
    return news.filter(article => 
      selectedTags.some(tag => article.tags?.includes(tag))
    );
  }, [news, selectedTags]);

  // Send selected news to AI for analysis
  const sendToAI = async () => {
    if (selectedForAI.length === 0) return;
    
    setSendingToAI(true);
    try {
      const newsContent = selectedForAI.map(id => {
        const article = news.find(n => n.url === id);
        return {
          title: article.title,
          description: article.description,
          source: article.source,
          url: article.url,
          published_at: article.published_at,
          symbols: article.symbols || [],
          tags: article.tags || []
        };
      });
      
      // Send to AI chat with proper context
      const message = `Please analyze these ${newsContent.length} news articles and provide insights on market implications:\n\n${
        newsContent.map((article, i) => 
          `${i + 1}. ${article.title}\nSource: ${article.source}\nTags: ${article.tags.join(', ')}\n${article.description || ''}`
        ).join('\n\n')
      }`;
      
      // Navigate to AI chat with pre-filled message
      window.dispatchEvent(new CustomEvent('openAIChat', { 
        detail: { message, context: 'news_analysis', articles: newsContent } 
      }));
      
      // Clear selection
      setSelectedForAI([]);
    } catch (err) {
      // Failed to send to AI - could show a toast notification
    } finally {
      setSendingToAI(false);
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

  // Get sentiment icon
  const getSentimentIcon = (tags) => {
    if (tags?.includes('bullish')) return { icon: TrendingUp, color: 'text-green-500' };
    if (tags?.includes('bearish')) return { icon: TrendingDown, color: 'text-red-500' };
    return { icon: Activity, color: 'text-gray-500' };
  };

  // Get tag style
  const getTagStyle = (tagId) => {
    const tag = filterTags.find(t => t.id === tagId);
    if (!tag) return '';
    
    const colorMap = {
      green: 'bg-green-500/10 text-green-400 border-green-500/20',
      red: 'bg-red-500/10 text-red-400 border-red-500/20',
      blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    };
    
    return colorMap[tag.color] || colorMap.gray;
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

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const toggleArticleSelection = (articleUrl) => {
    setSelectedForAI(prev => 
      prev.includes(articleUrl)
        ? prev.filter(url => url !== articleUrl)
        : [...prev, articleUrl]
    );
  };

  return (
    <div className={`${
      isDarkMode 
        ? 'bg-gray-900/50 border-gray-700/50' 
        : 'bg-white/80 border-gray-200/50'
    } border rounded-xl p-6 backdrop-blur-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Newspaper className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Market News</h2>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Latest financial updates</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-700' 
                : 'hover:bg-gray-100'
            } ${selectedTags.length > 0 ? 'text-blue-400' : ''}`}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-700' 
                : 'hover:bg-gray-100'
            }`}
          >
            <Search className={`w-4 h-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`} />
          </button>
          {selectedForAI.length > 0 && (
            <button
              onClick={sendToAI}
              disabled={sendingToAI}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <Bot className="w-4 h-4" />
              <span>AI Analyze ({selectedForAI.length})</span>
            </button>
          )}
          <button
            onClick={fetchMarketNews}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 pb-4 border-b border-gray-700/20"
          >
            <div className="flex flex-wrap gap-2">
              {filterTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                    selectedTags.includes(tag.id)
                      ? getTagStyle(tag.id)
                      : isDarkMode 
                        ? 'border-gray-600 text-gray-400 hover:border-gray-500'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {tag.icon && <tag.icon className="w-3 h-3" />}
                  <span>{tag.label}</span>
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-600 hover:text-gray-700'
                  }`}
                >
                  Clear all
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                className={`flex-1 px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:border-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
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
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <X className={`w-4 h-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`} />
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
              <p className={`text-xs mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Configure NEWS_API_KEY in your .env file to enable real news data
              </p>
            </div>
          </div>
        )}

        {!loading && !error && filteredNews.length === 0 && (
          <div className="text-center py-8">
            <div className={`p-4 rounded-full w-fit mx-auto mb-4 ${
              isDarkMode ? 'bg-gray-800/30' : 'bg-gray-100/50'
            }`}>
              <Newspaper className={`w-12 h-12 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
            </div>
            <p className={`font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {selectedTags.length > 0 ? 'No news matching filters' : 'No news available'}
            </p>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-500' : 'text-gray-600'
            }`}>
              {searchQuery ? 'Try a different search term' : 
               selectedTags.length > 0 ? 'Try removing some filters' :
               'Demo mode active - refresh to see sample news'}
            </p>
          </div>
        )}

        {!loading && filteredNews.length > 0 && (
          <div className="space-y-3">
            {filteredNews.slice(0, 10).map((article, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`group p-4 border rounded-lg transition-all duration-200 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-gray-800/60 hover:bg-gray-800 border-gray-600/30 hover:border-gray-500/50 hover:shadow-blue-500/10' 
                    : 'bg-gray-50/50 hover:bg-gray-50 border-gray-200/50 hover:border-gray-300/50 hover:shadow-blue-500/5'
                } hover:shadow-lg ${
                  selectedForAI.includes(article.url) 
                    ? 'ring-2 ring-purple-500/50' 
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Selection checkbox */}
                  <div 
                    className="mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleArticleSelection(article.url);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedForAI.includes(article.url)}
                      onChange={() => {}}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                  </div>
                  
                  <div 
                    className="flex-1 min-w-0"
                    onClick={() => window.open(article.url, '_blank')}
                  >
                    <h3 className={`font-semibold group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {article.title}
                    </h3>
                    
                    {/* Sentiment indicator */}
                    {(() => {
                      const sentiment = getSentimentIcon(article.tags);
                      const Icon = sentiment.icon;
                      return (
                        <div className="flex items-center gap-2 mt-2">
                          <Icon className={`w-4 h-4 ${sentiment.color}`} />
                          <span className={`text-xs ${sentiment.color} font-medium`}>
                            {article.tags?.includes('bullish') ? 'Bullish Sentiment' : 
                             article.tags?.includes('bearish') ? 'Bearish Sentiment' : 
                             'Neutral Sentiment'}
                          </span>
                        </div>
                      );
                    })()}
                    
                    {article.description && (
                      <p className={`text-sm mt-2 line-clamp-2 leading-relaxed ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {article.description}
                      </p>
                    )}
                    
                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {article.tags.map((tagId, idx) => {
                          const tag = filterTags.find(t => t.id === tagId);
                          if (!tag) return null;
                          return (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getTagStyle(tagId)}`}
                            >
                              {tag.icon && <tag.icon className="w-3 h-3" />}
                              {tag.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-3 h-3 ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <span className={`text-xs ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          {formatTimeAgo(article.published_at)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
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
                          <span className={`px-2 py-1 text-xs rounded ${
                            isDarkMode 
                              ? 'bg-gray-600 text-gray-300' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            +{article.symbols.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <ExternalLink className={`w-4 h-4 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
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