import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  X, Bell, TrendingUp, TrendingDown, AlertTriangle,
  DollarSign, Activity, MoreVertical, Clock, AlertCircle, BarChart3, Settings
} from 'lucide-react';
import { stockAPI } from '../services/api';
import { StockCardSkeleton } from './SkeletonLoader';

const StockCard = ({ symbol, onRemove, onSelect, onStartMonitoring, isSelected }) => {
  const [showMonitorModal, setShowMonitorModal] = useState(false);
  const [threshold, setThreshold] = useState(5);
  const [interval, setInterval] = useState(60);
  const [showMonitoringOptions, setShowMonitoringOptions] = useState(false);

  // Fetch stock info
  const { data: stockInfo, isLoading, error } = useQuery({
    queryKey: ['stock', symbol],
    queryFn: async () => {
      const response = await stockAPI.getStockInfo(symbol);
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleStartMonitoring = () => {
    onStartMonitoring({
      symbol,
      threshold_percent: threshold,
      interval_seconds: interval,
    });
    setShowMonitorModal(false);
  };

  const handleMonitoringStart = () => {
    onStartMonitoring({
      symbol,
      threshold,
      type: 'price_drop'
    });
    setShowMonitoringOptions(false);
  };

  if (isLoading) {
    return <StockCardSkeleton />;
  }

  if (error || !stockInfo) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="relative bg-gray-700/50 rounded-lg p-4 cursor-pointer"
        onClick={() => onSelect && onSelect(symbol)}
      >
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(symbol);
            }}
            className="absolute top-2 right-2 p-1 hover:bg-gray-600 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}

        <div className="flex items-center justify-center h-24">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">{symbol}</h3>
            <div className="flex items-center justify-center space-x-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <p className="text-sm">Waiting for market data...</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const isPositive = stockInfo?.price_change_percent > 0;

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          bg-white dark:bg-gray-800/50 rounded-xl p-6 
          border transition-all cursor-pointer
          ${isSelected 
            ? 'border-hsbc-red shadow-lg shadow-hsbc-red/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }
        `}
        onClick={() => onSelect(symbol)}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{symbol}</h3>
              <BarChart3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stockInfo?.company_name || 'Loading...'}</p>
          </div>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowMonitoringOptions(!showMonitoringOptions);
              }}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </motion.button>
            {onRemove && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(symbol);
                }}
                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-red-400" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Price Info */}
        <div className="mb-4">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            ${stockInfo?.current_price?.toFixed(2) || '---'}
          </p>
          <div className={`flex items-center space-x-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>
              {isPositive ? '+' : ''}{stockInfo?.price_change?.toFixed(2)} ({stockInfo?.price_change_percent?.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-100 dark:bg-gray-700/30 rounded-lg p-2">
            <p className="text-gray-600 dark:text-gray-400 text-xs">Volume</p>
            <p className="text-gray-900 dark:text-white font-medium">
              {stockInfo?.volume ? (stockInfo.volume / 1000000).toFixed(1) + 'M' : '---'}
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700/30 rounded-lg p-2">
            <p className="text-gray-600 dark:text-gray-400 text-xs">Day Range</p>
            <p className="text-gray-900 dark:text-white font-medium">
              {stockInfo?.day_low && stockInfo?.day_high 
                ? `${stockInfo.day_low.toFixed(2)} - ${stockInfo.day_high.toFixed(2)}`
                : '---'
              }
            </p>
          </div>
        </div>

        {/* Monitoring Options (Hidden by default) */}
        {showMonitoringOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
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
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-gray-900 dark:text-white font-medium w-12 text-right">
                    {threshold}%
                  </span>
                </div>
              </div>
              <button
                onClick={handleMonitoringStart}
                className="w-full bg-hsbc-red text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Start Monitoring
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Monitor Modal */}
      {showMonitorModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setShowMonitorModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Set Price Alert for {symbol}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Price Drop Threshold (%)
                </label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  min="0.1"
                  max="50"
                  step="0.1"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-hsbc-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Check Interval (seconds)
                </label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-hsbc-red"
                >
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                  <option value={600}>10 minutes</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowMonitorModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartMonitoring}
                className="flex-1 px-4 py-2 bg-hsbc-red hover:bg-red-700 rounded-lg text-white transition-colors"
              >
                Start Monitoring
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default StockCard; 