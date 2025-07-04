import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, BarChart3, RefreshCw, 
  Star, Plus, ChevronRight, Activity, AlertTriangle,
  Bell, Settings 
} from 'lucide-react';
import { stockAPI } from '../services/api';
import { UserPreferencesContext } from './UserPreferences';

const UserStocksList = ({ userStockData, onRefresh, isLoading, onStockSelect, onStartMonitoring, onStockListUpdate }) => {
  const [expandedStock, setExpandedStock] = useState(null);
  const [monitoringStock, setMonitoringStock] = useState(null);
  const [showAllStocks, setShowAllStocks] = useState(false);
  
  // Use preferences from context
  const { threshold: globalThreshold, density, lowRiskMode } = useContext(UserPreferencesContext);
  const [localThreshold, setLocalThreshold] = useState(globalThreshold);

  // Update local threshold when global threshold changes
  useEffect(() => {
    setLocalThreshold(globalThreshold);
  }, [globalThreshold]);

  // Reset showAllStocks when lowRiskMode changes
  useEffect(() => {
    if (!lowRiskMode) {
      setShowAllStocks(false);
    }
  }, [lowRiskMode]);

  // Generate mini chart data for each stock
  const generateMiniChart = (isPositive, index) => {
    const points = 8;
    const data = [];
    for (let i = 0; i < points; i++) {
      const base = 50;
      const trend = isPositive ? (i * 2) : -(i * 2);
      const volatility = (Math.random() - 0.5) * 15;
      data.push(base + trend + volatility);
    }
    return data;
  };

  const MiniChart = ({ isPositive, index }) => {
    const data = generateMiniChart(isPositive, index);
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;

    return (
      <div className="w-16 h-8">
        <svg width="100%" height="100%" viewBox="0 0 64 32">
          <motion.path
            d={`M ${data.map((point, i) => 
              `${(i / (data.length - 1)) * 64},${32 - ((point - min) / range) * 28}`
            ).join(' L ')}`}
            fill="none"
            stroke={isPositive ? '#10b981' : '#ef4444'}
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: index * 0.1 }}
          />
        </svg>
      </div>
    );
  };

  // Filter stocks based on Low Risk Mode (unless user wants to see all)
  const filteredStockData = (lowRiskMode && !showAllStocks) 
    ? userStockData?.filter(stock => {
        // In low risk mode, show blue-chip stocks and well-known companies
        const conservativeStocks = [
          // Major Tech Companies
          'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NVDA', 'TSLA',
          // Blue Chip Stocks
          'BRK', 'V', 'JNJ', 'WMT', 'JPM', 'PG', 'MA', 'UNH', 'HD', 'DIS',
          'BAC', 'XOM', 'ABBV', 'CVX', 'PFE', 'CSCO', 'TMO', 'COST', 'PEP',
          'AVGO', 'KO', 'MRK', 'LLY', 'ACN', 'NKE', 'ADBE', 'NFLX', 'ABT',
          'AMD', 'INTC', 'WFC', 'CRM', 'ORCL', 'MDT', 'UPS', 'TXN', 'MS',
          'BA', 'BMY', 'RTX', 'NOW', 'QCOM', 'CVS', 'GS', 'HON', 'SCHW',
          // Popular ETFs
          'SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'VOO', 'VEA', 'VWO', 'BND',
          // Other well-known stocks
          'GM', 'F', 'UBER', 'LYFT', 'ABNB', 'COIN', 'HOOD', 'PLTR', 'SOFI',
          // Chinese ADRs (some are considered stable)
          'BABA', 'JD', 'BIDU', 'NIO', 'XPEV', 'LI',
          // Biotechs and others that users might add
          'RGTI', 'GLU', 'MRNA', 'BNTX', 'ZM', 'DOCU', 'ROKU', 'SQ', 'PYPL'
        ];
        
        // If the symbol is in the conservative list, include it
        if (conservativeStocks.includes(stock.symbol)) {
          return true;
        }
        
        // For symbols not in the list, check if volatility/change is reasonable
        const changePercent = Math.abs(stock.change_percent || 0);
        const price = stock.price || 0;
        
        // Include stocks that are:
        // 1. Above $5 (avoid penny stocks)
        // 2. Daily change less than 15% (avoid highly volatile stocks)
        return price >= 5 && changePercent <= 15;
      })
    : userStockData;

  // Show filtered count information
  const totalCount = userStockData?.length || 0;
  const actualFilteredData = lowRiskMode ? userStockData?.filter(stock => {
    // Same filtering logic as above
    const conservativeStocks = [
      'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NVDA', 'TSLA',
      'BRK', 'V', 'JNJ', 'WMT', 'JPM', 'PG', 'MA', 'UNH', 'HD', 'DIS',
      'BAC', 'XOM', 'ABBV', 'CVX', 'PFE', 'CSCO', 'TMO', 'COST', 'PEP',
      'AVGO', 'KO', 'MRK', 'LLY', 'ACN', 'NKE', 'ADBE', 'NFLX', 'ABT',
      'AMD', 'INTC', 'WFC', 'CRM', 'ORCL', 'MDT', 'UPS', 'TXN', 'MS',
      'BA', 'BMY', 'RTX', 'NOW', 'QCOM', 'CVS', 'GS', 'HON', 'SCHW',
      'SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'VOO', 'VEA', 'VWO', 'BND',
      'GM', 'F', 'UBER', 'LYFT', 'ABNB', 'COIN', 'HOOD', 'PLTR', 'SOFI',
      'BABA', 'JD', 'BIDU', 'NIO', 'XPEV', 'LI',
      'RGTI', 'GLU', 'MRNA', 'BNTX', 'ZM', 'DOCU', 'ROKU', 'SQ', 'PYPL'
    ];
    
    if (conservativeStocks.includes(stock.symbol)) return true;
    
    const changePercent = Math.abs(stock.change_percent || 0);
    const price = stock.price || 0;
    return price >= 5 && changePercent <= 15;
  }) : userStockData;
  
  const displayedCount = filteredStockData?.length || 0;
  const conservativeCount = actualFilteredData?.length || 0;
  const hiddenCount = totalCount - conservativeCount;

  if (!filteredStockData || filteredStockData.length === 0) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-fluid border border-gray-200/50 dark:border-gray-700/50 shadow-lg card-adaptive card-hover">
        <div className="flex items-center justify-between mb-fluid">
          <h3 className="text-xl-fluid font-bold text-gray-900 dark:text-white flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Your Watchlist
            {lowRiskMode && (
              <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-600 text-xs rounded-full">
                Low Risk
              </span>
            )}
          </h3>
        </div>
        
        <div className="text-center py-fluid-xl">
          <Star className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h4 className="text-large font-semibold text-gray-900 dark:text-white mb-2">
            {lowRiskMode ? 'No conservative stocks in your watchlist' : 'No stocks in your watchlist'}
          </h4>
          <p className="text-body text-gray-500 dark:text-gray-400 mb-4">
            {lowRiskMode 
              ? 'Add some blue-chip stocks like AAPL, MSFT, or stable ETFs like SPY'
              : 'Use the Stock Manager to search and add stocks you want to track'
            }
          </p>
          <div className="flex items-center justify-center text-body text-blue-500">
            <Plus className="w-4 h-4 mr-1" />
            <span>Click "Manage Stocks" to get started</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-fluid border border-gray-200/50 dark:border-gray-700/50 shadow-lg card-adaptive card-hover">
      <div className="flex items-center justify-between mb-fluid-lg">
        <h3 className="text-xl-fluid font-bold text-gray-900 dark:text-white flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-500" />
          Your Watchlist
          {lowRiskMode && (
            <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-600 text-xs rounded-full">
              Low Risk Mode
            </span>
          )}
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-small text-gray-500 dark:text-gray-400">
            {displayedCount} stock{displayedCount !== 1 ? 's' : ''}
            {lowRiskMode && hiddenCount > 0 && !showAllStocks && (
              <span className="ml-1 text-orange-500">
                ({hiddenCount} filtered)
              </span>
            )}
            {showAllStocks && lowRiskMode && (
              <span className="ml-1 text-blue-500">
                (showing all)
              </span>
            )}
          </span>
          {density === 'detailed' && (
            <span className="text-xs text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
              Detailed View
            </span>
          )}
          {lowRiskMode && hiddenCount > 0 && !showAllStocks && (
            <button 
              onClick={() => setShowAllStocks(true)}
              className="text-xs text-orange-500 hover:text-orange-600 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-1 rounded transition-colors"
              title="Temporarily show all stocks"
            >
              Show All ({totalCount})
            </button>
          )}
          {lowRiskMode && showAllStocks && (
            <button 
              onClick={() => setShowAllStocks(false)}
              className="text-xs text-blue-500 hover:text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded transition-colors"
              title="Return to filtered view"
            >
              Show Filtered ({conservativeCount})
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-fluid">
        {filteredStockData.map((stock, index) => {
          const isPositive = stock.change_percent > 0;
          const isExpanded = expandedStock === stock.symbol;
          const isMonitoring = monitoringStock === stock.symbol;

          return (
            <motion.div
              key={stock.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
              className="group"
            >
              <motion.div
                className="bg-white dark:bg-gray-800/50 rounded-xl p-fluid border border-gray-200 dark:border-gray-700/50 hover:shadow-md transition-all duration-300 cursor-pointer card-hover"
                onClick={() => {
                  // When clicking the main card, open StockDetails
                  if (onStockSelect && !isMonitoring) {
                    onStockSelect(stock.symbol);
                  }
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Stock Icon */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    
                    {/* Stock Info */}
                    <div>
                      <h4 className="font-semibold text-body text-gray-900 dark:text-white">
                        {stock.symbol}
                      </h4>
                      {density === 'detailed' && (
                        <p className="text-small text-gray-500 dark:text-gray-400">
                          {stock.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Price Info */}
                    <div className="text-right">
                      <p className="text-large font-bold text-gray-900 dark:text-white">
                        ${stock.price?.toFixed(2) || '0.00'}
                      </p>
                      <div className={`flex items-center text-small ${
                        isPositive ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {isPositive ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        <span>
                          {density === 'detailed' ? (
                            `${isPositive ? '+' : ''}${stock.change?.toFixed(2) || '0.00'} 
                            (${isPositive ? '+' : ''}${stock.change_percent?.toFixed(2) || '0.00'}%)`
                          ) : (
                            `${isPositive ? '+' : ''}${stock.change_percent?.toFixed(1) || '0.0'}%`
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Mini Chart - only in detailed view */}
                    {density === 'detailed' && (
                      <MiniChart isPositive={isPositive} index={index} />
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1">
                      {/* Monitor Button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMonitoringStock(isMonitoring ? null : stock.symbol);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          isMonitoring 
                            ? 'bg-hsbc-red/20 text-hsbc-red' 
                            : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}
                        title="Set price alert"
                      >
                        <Bell className="w-4 h-4" />
                      </motion.button>

                      {/* Expand Indicator - only in detailed view */}
                      {density === 'detailed' && (
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedStock(isExpanded ? null : stock.symbol);
                          }}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Monitoring Options */}
                <AnimatePresence>
                  {isMonitoring && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-gray-600 dark:text-gray-400">
                            Alert when price drops by:
                          </label>
                          <div className="flex items-center space-x-2 mt-1">
                            <input
                              type="range"
                              min="1"
                              max="20"
                              value={localThreshold}
                              onChange={(e) => setLocalThreshold(Number(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-gray-900 dark:text-white font-medium w-12 text-right">
                              {localThreshold}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Using global threshold: {globalThreshold}% (adjustable above)
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMonitoringStock(null);
                              setLocalThreshold(globalThreshold); // Reset to global
                            }}
                            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onStartMonitoring) {
                                onStartMonitoring({
                                  symbol: stock.symbol,
                                  threshold_percent: localThreshold,
                                  interval_seconds: 60
                                });
                              }
                              setMonitoringStock(null);
                            }}
                            className="flex-1 px-4 py-2 bg-hsbc-red text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Start Monitoring
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expanded Details - only in detailed view */}
                <AnimatePresence>
                  {isExpanded && density === 'detailed' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Market Status
                          </p>
                          <div className="flex items-center justify-center mt-1">
                            <Activity className="w-3 h-3 text-green-500 mr-1" />
                            <span className="text-sm font-medium text-green-500">Live</span>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Day Range
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                            ${(stock.price * 0.98).toFixed(2)} - ${(stock.price * 1.02).toFixed(2)}
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Volume
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                            {(Math.random() * 50 + 10).toFixed(1)}M
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Updated
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                            {new Date(stock.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Click to view detailed chart</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            isPositive ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {isPositive ? 'Gaining' : 'Losing'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Footer - only in detailed view */}
      {density === 'detailed' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-600 dark:text-gray-400">
                  {filteredStockData.filter(s => s.change_percent > 0).length} gaining
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-gray-600 dark:text-gray-400">
                  {filteredStockData.filter(s => s.change_percent < 0).length} losing
                </span>
              </div>
            </div>
            
            <div className="text-gray-500 dark:text-gray-400">
              Last updated: {new Date().toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UserStocksList; 