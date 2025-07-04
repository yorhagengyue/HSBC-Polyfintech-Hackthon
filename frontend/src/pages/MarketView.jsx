import React from 'react';
import { motion } from 'framer-motion';
import MarketOverview from '../components/MarketOverview';
import MarketNews from '../components/MarketNews';
import InsiderTradesWidget from '../components/InsiderTradesWidget';

const MarketView = ({ onStockSelect, onTradeClick }) => {
  // Mock sector performance data
  const sectorPerformance = [
    { name: 'Technology', change: 2.5, color: 'bg-blue-500' },
    { name: 'Healthcare', change: 1.8, color: 'bg-green-500' },
    { name: 'Finance', change: -0.5, color: 'bg-yellow-500' },
    { name: 'Energy', change: -1.2, color: 'bg-orange-500' },
    { name: 'Consumer', change: 0.8, color: 'bg-purple-500' },
    { name: 'Industrial', change: 1.2, color: 'bg-indigo-500' },
  ];

  // Mock trending stocks
  const trendingStocks = [
    { symbol: 'NVDA', name: 'NVIDIA', price: 875.28, change: 5.2, volume: '52.3M' },
    { symbol: 'TSLA', name: 'Tesla', price: 238.45, change: -2.1, volume: '45.8M' },
    { symbol: 'AAPL', name: 'Apple', price: 195.89, change: 0.8, volume: '38.2M' },
    { symbol: 'AMD', name: 'AMD', price: 178.65, change: 3.4, volume: '35.6M' },
    { symbol: 'MSFT', name: 'Microsoft', price: 415.26, change: 1.2, volume: '28.9M' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Market Overview */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <MarketOverview />
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Trending & Sectors */}
        <div className="lg:col-span-2 space-y-8">
          {/* Trending Stocks */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Trending Stocks
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3">Symbol</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Change</th>
                    <th className="pb-3">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {trendingStocks.map((stock) => (
                    <tr 
                      key={stock.symbol}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => onStockSelect(stock.symbol)}
                    >
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {stock.symbol}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {stock.name}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 text-gray-900 dark:text-white">
                        ${stock.price.toFixed(2)}
                      </td>
                      <td className={`py-3 font-medium ${
                        stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stock.change >= 0 ? '+' : ''}{stock.change}%
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {stock.volume}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Sector Performance */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sector Performance
            </h3>
            <div className="space-y-3">
              {sectorPerformance.map((sector) => (
                <div key={sector.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`w-3 h-3 rounded-full ${sector.color}`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {sector.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          sector.change >= 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ 
                          width: `${Math.abs(sector.change) * 20}%`,
                          marginLeft: sector.change < 0 ? 'auto' : '0'
                        }}
                      />
                    </div>
                    <span className={`text-sm font-medium w-12 text-right ${
                      sector.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {sector.change >= 0 ? '+' : ''}{sector.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Insider Trades */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <InsiderTradesWidget onTradeClick={onTradeClick} />
          </motion.div>
        </div>

        {/* Right Column - Market News */}
        <div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <MarketNews />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MarketView; 