import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, BarChart3, TrendingUp, Plus } from 'lucide-react';
import WatchlistSection from '../components/WatchlistSection';
import PerformanceCard from '../components/PerformanceCard';
import StockManager from '../components/StockManager';

const PortfolioView = ({ 
  userStockData, 
  onStockSelect,
  onRemoveStock,
  onReorderStocks,
  onStockListUpdate 
}) => {
  // Calculate asset allocation
  const totalValue = userStockData.reduce((sum, stock) => 
    sum + (stock.price * (stock.shares || 100)), 0
  );

  const assetAllocation = userStockData.map(stock => ({
    name: stock.symbol,
    value: stock.price * (stock.shares || 100),
    percentage: totalValue > 0 ? ((stock.price * (stock.shares || 100)) / totalValue * 100) : 0
  }));

  // Calculate top performers
  const topPerformers = [...userStockData]
    .sort((a, b) => (b.change_percent || 0) - (a.change_percent || 0))
    .slice(0, 5);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Stock Manager */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Portfolio
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track your investment portfolio
          </p>
        </div>
        <StockManager onStockListUpdate={onStockListUpdate} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Watchlist - Takes 2 columns */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <WatchlistSection 
              userStockData={userStockData}
              onStockSelect={onStockSelect}
              onRemoveStock={onRemoveStock}
              onReorderStocks={onReorderStocks}
            />
          </motion.div>
        </div>

        {/* Asset Allocation */}
        <div className="space-y-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-blue-600" />
              Asset Allocation
            </h3>
            
            {assetAllocation.length > 0 ? (
              <div className="space-y-3">
                {assetAllocation.slice(0, 5).map((asset, index) => (
                  <div key={asset.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: `hsl(${index * 60}, 70%, 50%)` 
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {asset.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {asset.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
                {assetAllocation.length > 5 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                    +{assetAllocation.length - 5} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                Add stocks to see allocation
              </p>
            )}
          </motion.div>

          {/* Top Performers */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Top Performers
            </h3>
            
            {topPerformers.length > 0 ? (
              <div className="space-y-3">
                {topPerformers.map((stock) => (
                  <div 
                    key={stock.symbol}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => onStockSelect(stock.symbol)}
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {stock.symbol}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        ${stock.price?.toFixed(2)}
                      </p>
                    </div>
                    <div className={`text-sm font-medium ${
                      stock.change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stock.change_percent >= 0 ? '+' : ''}
                      {stock.change_percent?.toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                No stocks to display
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Performance Analysis */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <PerformanceCard userStockData={userStockData} />
      </motion.div>
    </div>
  );
};

export default PortfolioView; 