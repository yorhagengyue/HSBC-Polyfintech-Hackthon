import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, Calendar, DollarSign, Activity,
  Building2, Users, PieChart, X, Loader2
} from 'lucide-react';
import { stockAPI } from '../services/api';

const StockDetails = ({ symbol, onClose }) => {
  const [timeRange, setTimeRange] = useState('1mo');
  const [interval, setInterval] = useState('1d');

  // Fetch stock info
  const { data: stockInfo, isLoading: infoLoading } = useQuery({
    queryKey: ['stock-info', symbol],
    queryFn: async () => {
      const response = await stockAPI.getStockInfo(symbol);
      return response.data;
    },
    enabled: !!symbol,
  });

  // Fetch historical data
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['stock-history', symbol, timeRange, interval],
    queryFn: async () => {
      const response = await stockAPI.getStockHistory(symbol, timeRange, interval);
      return response.data;
    },
    enabled: !!symbol,
  });

  if (!symbol) return null;

  const isPositive = stockInfo?.price_change_percent > 0;
  const chartData = historyData?.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    price: item.close,
    volume: item.volume,
  })) || [];

  const timeRangeOptions = [
    { value: '1d', label: '1D', interval: '5m' },
    { value: '5d', label: '5D', interval: '30m' },
    { value: '1mo', label: '1M', interval: '1d' },
    { value: '3mo', label: '3M', interval: '1d' },
    { value: '1y', label: '1Y', interval: '1wk' },
  ];

  return (
    <>
      <motion.div
        key="stock-details-panel"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {symbol}
                {infoLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <span className={`text-sm px-2 py-1 rounded ${
                    isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isPositive ? '+' : ''}{stockInfo?.price_change_percent?.toFixed(2)}%
                  </span>
                )}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{stockInfo?.company_name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Price Info */}
          <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${stockInfo?.current_price?.toFixed(2) || '0.00'}
                </p>
                <div className={`flex items-center gap-2 mt-1 ${
                  isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>
                    {isPositive ? '+' : ''}{stockInfo?.price_change?.toFixed(2)} today
                  </span>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="text-gray-600 dark:text-gray-400">Volume</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {stockInfo?.volume ? (stockInfo.volume / 1000000).toFixed(2) + 'M' : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Price History</h3>
              <div className="flex gap-1">
                {timeRangeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTimeRange(option.value);
                      setInterval(option.interval);
                    }}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      timeRange === option.value
                        ? 'bg-hsbc-red text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {historyLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-600 dark:text-gray-400" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    tick={{ fontSize: 12 }}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isPositive ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Key Stats */}
          <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Open</span>
                  <span className="text-gray-900 dark:text-white font-medium">${stockInfo?.open?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Day High</span>
                  <span className="text-gray-900 dark:text-white font-medium">${stockInfo?.day_high?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Day Low</span>
                  <span className="text-gray-900 dark:text-white font-medium">${stockInfo?.day_low?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">52W High</span>
                  <span className="text-gray-900 dark:text-white font-medium">${stockInfo?.['52_week_high']?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">52W Low</span>
                  <span className="text-gray-900 dark:text-white font-medium">${stockInfo?.['52_week_low']?.toFixed(2) || 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Market Cap</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {stockInfo?.market_cap ? '$' + (stockInfo.market_cap / 1000000000).toFixed(2) + 'B' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">P/E Ratio</span>
                  <span className="text-gray-900 dark:text-white font-medium">{stockInfo?.pe_ratio?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Dividend Yield</span>
                  <span className="text-gray-900 dark:text-white font-medium">{stockInfo?.dividend_yield ? stockInfo.dividend_yield.toFixed(2) + '%' : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Prev Close</span>
                  <span className="text-gray-900 dark:text-white font-medium">${stockInfo?.previous_close?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Volume</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {stockInfo?.volume ? (stockInfo.volume / 1000000).toFixed(2) + 'M' : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* HSBC Products */}
          <div className="bg-gradient-to-r from-hsbc-red/10 to-hsbc-red/5 rounded-xl p-4 border border-hsbc-red/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">HSBC Investment Solutions</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gray-200/50 dark:bg-gray-800/30 rounded-lg">
                <PieChart className="w-5 h-5 text-hsbc-red" />
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">Diversified Portfolio</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Reduce risk with our managed funds</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-200/50 dark:bg-gray-800/30 rounded-lg">
                <Users className="w-5 h-5 text-hsbc-red" />
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">Expert Advisory</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Get personalized investment advice</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Backdrop */}
      <motion.div
        key="stock-details-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />
    </>
  );
};

export default StockDetails; 