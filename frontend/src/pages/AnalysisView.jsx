import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, FileText, 
  Download, Calendar, DollarSign, Activity 
} from 'lucide-react';
import PriceChart from '../components/PriceChart';

const AnalysisView = ({ userStockData, onStockSelect }) => {
  const [selectedStock, setSelectedStock] = useState(userStockData[0]?.symbol || 'AAPL');
  const [timeRange, setTimeRange] = useState('1M');

  // Mock fundamental data
  const fundamentalData = {
    marketCap: '2.95T',
    peRatio: '32.45',
    eps: '6.05',
    dividend: '0.96 (0.44%)',
    beta: '1.29',
    volume: '52.3M',
    avgVolume: '58.9M',
    high52w: '199.62',
    low52w: '164.08'
  };

  // Mock technical indicators
  const technicalIndicators = {
    rsi: 58.4,
    macd: 'Bullish',
    sma50: 185.23,
    sma200: 178.45,
    support: 190.50,
    resistance: 198.75
  };

  const handleStockChange = (symbol) => {
    setSelectedStock(symbol);
    onStockSelect(symbol);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analysis & Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Deep dive into technical and fundamental analysis
          </p>
        </div>
        
        {/* Stock Selector */}
        <div className="flex items-center space-x-4">
          <select
            value={selectedStock}
            onChange={(e) => handleStockChange(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          >
            {userStockData.map(stock => (
              <option key={stock.symbol} value={stock.symbol}>
                {stock.symbol} - {stock.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Technical Analysis - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Price Chart */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Technical Analysis - {selectedStock}
              </h3>
              
              {/* Time Range Selector */}
              <div className="flex space-x-2">
                {['1D', '1W', '1M', '3M', '1Y'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      timeRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-96">
              <PriceChart symbol={selectedStock} period={timeRange} />
            </div>
          </motion.div>

          {/* Technical Indicators */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Technical Indicators
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-600 dark:text-gray-400">RSI (14)</p>
                <p className={`text-xl font-bold ${
                  technicalIndicators.rsi > 70 ? 'text-red-600' : 
                  technicalIndicators.rsi < 30 ? 'text-green-600' : 
                  'text-gray-900 dark:text-white'
                }`}>
                  {technicalIndicators.rsi}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {technicalIndicators.rsi > 70 ? 'Overbought' : 
                   technicalIndicators.rsi < 30 ? 'Oversold' : 'Neutral'}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-600 dark:text-gray-400">MACD</p>
                <p className="text-xl font-bold text-green-600">
                  {technicalIndicators.macd}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Signal
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-600 dark:text-gray-400">SMA 50</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${technicalIndicators.sma50}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  50-day average
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-600 dark:text-gray-400">SMA 200</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${technicalIndicators.sma200}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  200-day average
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-600 dark:text-gray-400">Support</p>
                <p className="text-xl font-bold text-green-600">
                  ${technicalIndicators.support}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Key level
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-600 dark:text-gray-400">Resistance</p>
                <p className="text-xl font-bold text-red-600">
                  ${technicalIndicators.resistance}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Key level
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Fundamentals & Reports */}
        <div className="space-y-8">
          {/* Fundamental Data */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Fundamental Data
            </h3>
            
            <div className="space-y-3">
              {Object.entries(fundamentalData).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Custom Reports */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Custom Reports
            </h3>
            
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Monthly Performance
                  </span>
                </div>
                <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              
              <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Risk Analysis Report
                  </span>
                </div>
                <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              
              <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Portfolio Summary
                  </span>
                </div>
                <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            <button className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
              Generate Custom Report
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView; 