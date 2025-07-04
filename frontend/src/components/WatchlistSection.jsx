import React, { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Plus, GripVertical, X, TrendingUp, TrendingDown } from 'lucide-react';
import MiniChart from './MiniChart';

const WatchlistSection = ({ userStockData, onStockSelect, onRemoveStock, onReorderStocks }) => {
  const [isAddingStock, setIsAddingStock] = useState(false);

  const handleReorder = (newOrder) => {
    if (onReorderStocks) {
      onReorderStocks(newOrder);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Watchlist Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Watchlist</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your favorite stocks
          </p>
        </div>
        <button
          onClick={() => setIsAddingStock(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          data-add-stock
        >
          <Plus className="w-4 h-4" />
          <span>Add Stock</span>
        </button>
      </div>

      {/* Watchlist Grid with Drag & Drop */}
      {userStockData.length > 0 ? (
        <Reorder.Group 
          axis="y" 
          values={userStockData} 
          onReorder={handleReorder}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {userStockData.map((stock) => (
            <Reorder.Item key={stock.symbol} value={stock}>
              <motion.div
                layout
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative group"
              >
                <div 
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all border border-gray-200 dark:border-gray-600"
                  onClick={() => onStockSelect(stock.symbol)}
                >
                  {/* Drag Handle */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                  </div>

                  {/* Stock Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                        {stock.symbol}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                        {stock.name}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveStock(stock.symbol);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>

                  {/* Price and Change */}
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${stock.price?.toFixed(2) || '0.00'}
                      </p>
                      <div className={`flex items-center space-x-1 text-sm font-medium ${
                        stock.change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stock.change_percent >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>
                          {stock.change_percent >= 0 ? '+' : ''}
                          {stock.change_percent?.toFixed(2) || '0.00'}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mini Chart */}
                  <div className="h-16">
                    <MiniChart 
                      symbol={stock.symbol}
                      color={stock.change_percent >= 0 ? '#10b981' : '#ef4444'}
                      height={64}
                    />
                  </div>
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No stocks in your watchlist yet
          </p>
          <button
            onClick={() => setIsAddingStock(true)}
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span>Add your first stock</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WatchlistSection; 