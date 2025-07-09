import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { UserCheck, TrendingUp, TrendingDown, AlertCircle, DollarSign, Users, Calendar, Building2, Database, Wifi, WifiOff } from 'lucide-react';
import { advancedAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const InsiderTradesWidget = ({ onTradeClick }) => {
  const { isDarkMode } = useTheme();
  const [selectedTrade, setSelectedTrade] = useState(null);
  
  const { data: insiderTrades, isLoading, error } = useQuery({
    queryKey: ['insider-trades'],
    queryFn: async () => {
      const response = await advancedAPI.getInsiderTrades();
      return response.data || [];
    },
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
  });

  // Check if data is real or mock
  const isRealData = insiderTrades?.[0]?.is_real_data === true;
  const dataSource = insiderTrades?.[0]?.data_source || 'unknown';

  const formatValue = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value}`;
  };

  const formatShares = (shares) => {
    if (shares >= 1e6) return `${(shares / 1e6).toFixed(1)}M`;
    if (shares >= 1e3) return `${(shares / 1e3).toFixed(0)}K`;
    return shares?.toLocaleString() || '0';
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div className={`border rounded-xl overflow-hidden ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-6 border-b ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Insider Trading Activity</h2>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Executive transactions in real-time</p>
            </div>
          </div>
          
          {/* Data Source Indicator */}
          <div className="flex items-center gap-2">
            {isRealData ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                <Wifi className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400 font-medium">Live Data</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                <Database className="w-3 h-3 text-orange-400" />
                <span className="text-xs text-orange-400 font-medium">Demo Data</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        {insiderTrades && insiderTrades.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className={`rounded-lg p-3 ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <div className={`text-sm mb-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Total Volume</div>
              <div className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {formatValue(insiderTrades.reduce((sum, trade) => sum + (trade.value || 0), 0))}
              </div>
            </div>
            
            <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
              <div className={`text-sm mb-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Buys</div>
              <div className="text-2xl font-bold text-green-400">
                {insiderTrades.filter(trade => trade.transaction_type === 'BUY').length}
              </div>
            </div>
            
            <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
              <div className={`text-sm mb-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Sells</div>
              <div className="text-2xl font-bold text-red-400">
                {insiderTrades.filter(trade => trade.transaction_type === 'SELL').length}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Data Source Warning for Mock Data */}
        {!isRealData && (
          <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-400">Demo Data Notice</span>
            </div>
            <p className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Showing simulated insider trading data. Configure YAHOO_FINANCE_RAPID_API_KEY to see real SEC filings.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <WifiOff className={`w-12 h-12 mx-auto mb-3 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`font-medium ${
              isDarkMode ? 'text-gray-400' : 'text-gray-700'
            }`}>Failed to load insider trades</p>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-500' : 'text-gray-600'
            }`}>{error.message}</p>
          </div>
        )}

        {!isLoading && !error && (!insiderTrades || insiderTrades.length === 0) && (
          <div className="text-center py-8">
            <Users className={`w-12 h-12 mx-auto mb-3 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`font-medium ${
              isDarkMode ? 'text-gray-400' : 'text-gray-700'
            }`}>No insider trades available</p>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-500' : 'text-gray-600'
            }`}>Check back later for updates</p>
          </div>
        )}

        {!isLoading && insiderTrades && insiderTrades.length > 0 && (
          <div className="space-y-3">
            {insiderTrades.map((trade, index) => (
              <motion.div
                key={`${trade.symbol}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`group p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  trade.transaction_type === 'SELL' 
                    ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' 
                    : 'bg-green-500/5 border-green-500/20 hover:border-green-500/40'
                }`}
                onClick={() => onTradeClick?.(trade)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {/* Stock Symbol */}
                    <div className={`p-2 rounded-lg ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <span className={`text-sm font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {trade.symbol}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      {/* Company & Transaction Type */}
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{trade.company_name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          trade.transaction_type === 'SELL' 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {trade.transaction_type}
                        </span>
                        
                        {/* Value Badge */}
                        {trade.value >= 10000000 && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">
                            $ Large
                          </span>
                        )}
                      </div>
                      
                      {/* Insider Details */}
                      <div className={`flex items-center gap-4 text-sm mb-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <div className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          <span>{trade.insider_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>{trade.insider_title}</span>
                        </div>
                      </div>
                      
                      {/* Transaction Details */}
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {formatShares(trade.shares)} shares
                        </span>
                        <span className={`${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          @ ${trade.price?.toFixed(2)}
                        </span>
                        <div className={`flex items-center gap-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          <span>{getTimeAgo(trade.filing_date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Transaction Value */}
                  <div className="text-right">
                    <div className={`text-lg font-bold mb-1 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {formatValue(trade.value)}
                    </div>
                    <div className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {formatShares(trade.shares)} shares
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Data Source Footer */}
        <div className={`mt-4 pt-4 border-t ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className={`flex items-center justify-between text-xs ${
            isDarkMode ? 'text-gray-500' : 'text-gray-600'
          }`}>
            <span>
              Data source: {isRealData ? 'SEC Filings via RapidAPI' : 'Simulated Demo Data'}
            </span>
            <span>
              Updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsiderTradesWidget; 