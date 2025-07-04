import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Plus,
  FileText, Settings, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardView = ({ 
  userStockData, 
  alerts, 
  riskScore,
  onViewChange 
}) => {
  // Calculate portfolio metrics
  const totalValue = userStockData.reduce((sum, stock) => 
    sum + (stock.price * (stock.shares || 100)), 0
  );
  
  const dailyChange = userStockData.reduce((sum, stock) => 
    sum + (stock.change * (stock.shares || 100)), 0
  );
  
  const dailyChangePercent = totalValue > 0 ? (dailyChange / totalValue) * 100 : 0;

  // Get recent high priority alerts
  const recentAlerts = alerts
    .filter(alert => alert.severity === 'high' || alert.severity === 'critical')
    .slice(0, 3);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Portfolio Value</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Daily Change</p>
          <div className={`flex items-center ${dailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {dailyChange >= 0 ? <ArrowUpRight className="w-6 h-6 mr-2" /> : <ArrowDownRight className="w-6 h-6 mr-2" />}
            <div>
              <p className="text-2xl font-bold">
                ${Math.abs(dailyChange).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm">
                ({dailyChange >= 0 ? '+' : ''}{dailyChangePercent.toFixed(2)}%)
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Risk Score</p>
          <div className="flex items-center">
            <div className={`text-3xl font-bold ${
              riskScore < 30 ? 'text-green-600' : 
              riskScore < 70 ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {riskScore}
            </div>
            <div className="ml-4 flex-1">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    riskScore < 30 ? 'bg-green-500' : 
                    riskScore < 70 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                  style={{ width: `${riskScore}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active Alerts</p>
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-orange-500 mr-3" />
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{alerts.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {recentAlerts.length} high priority
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mini Portfolio Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Portfolio Performance
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            {/* Placeholder for chart - will be replaced with actual chart component */}
            <p>Performance chart will be displayed here</p>
          </div>
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => onViewChange('portfolio')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Full Portfolio →
            </button>
          </div>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Alerts
            </h3>
            <button
              onClick={() => onViewChange('alerts')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          
          {recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {recentAlerts.map((alert, index) => (
                <div 
                  key={alert.id || index}
                  className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
                >
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {alert.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No recent alerts
            </p>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <button
          onClick={() => onViewChange('portfolio')}
          className="flex items-center justify-center space-x-2 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Stock</span>
        </button>
        
        <button
          onClick={() => onViewChange('analysis')}
          className="flex items-center justify-center space-x-2 p-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <FileText className="w-5 h-5" />
          <span>View Reports</span>
        </button>
        
        <button
          onClick={() => onViewChange('alerts')}
          className="flex items-center justify-center space-x-2 p-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
        >
          <AlertTriangle className="w-5 h-5" />
          <span>Set Alert</span>
        </button>
        
        <button
          className="flex items-center justify-center space-x-2 p-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </motion.div>
    </div>
  );
};

export default DashboardView; 