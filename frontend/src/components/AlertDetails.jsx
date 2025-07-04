import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, AlertTriangle, TrendingDown, Newspaper, 
  Calendar, Clock, Shield, ExternalLink,
  BarChart3, DollarSign, Activity, TrendingUp
} from 'lucide-react';
import MiniChart from './MiniChart';

const AlertDetails = ({ alert, onClose }) => {
  const [showChart, setShowChart] = useState(false);
  
  if (!alert) return null;

  const getAlertIcon = () => {
    switch (alert.type) {
      case 'price_drop':
        return <TrendingDown className="w-6 h-6" />;
      case 'major_news':
        return <Newspaper className="w-6 h-6" />;
      case 'risk_alert':
        return <AlertTriangle className="w-6 h-6" />;
      default:
        return <Activity className="w-6 h-6" />;
    }
  };

  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'high':
        return 'text-red-400 bg-red-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'low':
        return 'text-blue-400 bg-blue-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <motion.div
        key="alert-details-panel"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <motion.div 
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`relative p-6 ${getSeverityColor()} bg-opacity-10`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${getSeverityColor()}`}>
                  {getAlertIcon()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{alert.title}</h2>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`px-3 py-1 rounded-full font-medium ${getSeverityColor()}`}>
                      {alert.severity?.toUpperCase()}
                    </span>
                    <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(alert.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Main Message */}
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Alert Summary</h3>
                {/* View Chart Button - only show for price alerts */}
                {(alert.type === 'price_drop' || alert.details?.symbol) && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowChart(true)}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>View Chart</span>
                  </motion.button>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300">{alert.message}</p>
              
              {/* Chart teaser for price drops */}
              {(alert.type === 'price_drop' || alert.details?.symbol) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      📈 View 5-minute chart with volume analysis and drop context
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Details Section */}
            {alert.details && (
              <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  {alert.details.symbol && (
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Symbol</p>
                        <p className="text-gray-900 dark:text-white font-medium">{alert.details.symbol}</p>
                      </div>
                    </div>
                  )}
                  {alert.details.change_percent && (
                    <div className="flex items-center space-x-3">
                      <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Change</p>
                        <p className={`font-medium ${alert.details.change_percent < 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {alert.details.change_percent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  )}
                  {alert.details.current_price && (
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Current Price</p>
                        <p className="text-gray-900 dark:text-white font-medium">${alert.details.current_price.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                  {alert.source && (
                    <div className="flex items-center space-x-3">
                      <Newspaper className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Source</p>
                        <p className="text-gray-900 dark:text-white font-medium">{alert.source}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Impact Analysis */}
            {alert.impact && (
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/20">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Impact Analysis</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Risk Score Impact</span>
                    <span className="text-xl font-bold text-yellow-400">+{alert.impact.score || 0}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(alert.impact.score || 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced HSBC Recommendations */}
            <div className="bg-gradient-to-r from-hsbc-red/10 to-hsbc-red/5 rounded-xl p-6 border border-hsbc-red/20 relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path d="M0,0 L40,0 L40,20 L20,20 L20,40 L0,40 Z" fill="currentColor" />
                  <path d="M60,0 L100,0 L100,40 L80,40 L80,20 L60,20 Z" fill="currentColor" />
                  <path d="M0,60 L20,60 L20,80 L40,80 L40,100 L0,100 Z" fill="currentColor" />
                  <path d="M60,60 L80,60 L80,80 L100,80 L100,100 L60,100 Z" fill="currentColor" />
                </svg>
              </div>

              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                  <motion.div
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="p-3 bg-hsbc-red rounded-lg shadow-lg"
                  >
                    <Shield className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">HSBC Protection Solutions</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Personalized recommendations for your situation</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {alert.severity === 'high' ? (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Risk Management</h4>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300">Advanced hedging strategies and portfolio protection</p>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Advisor Consultation</h4>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300">One-on-one guidance from wealth management experts</p>
                      </motion.div>
                    </>
                  ) : alert.severity === 'medium' ? (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Diversification</h4>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300">Balanced portfolio strategies and asset allocation</p>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Wealth Management</h4>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300">Professional portfolio monitoring and optimization</p>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Market Research</h4>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300">Comprehensive market analysis and trend reports</p>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Portfolio Review</h4>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300">Regular health checks and performance optimization</p>
                      </motion.div>
                    </>
                  )}
                </div>

                {/* Enhanced CTA Button */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-r from-hsbc-red to-red-600 rounded-lg p-4 text-center"
                >
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 8px 25px rgba(220, 38, 38, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Track click for analytics
                      console.log('HSBC solution clicked', { alert: alert.id, severity: alert.severity });
                      // Open HSBC solutions page
                      window.open('https://www.hsbc.com.sg/investments/', '_blank');
                    }}
                    className="w-full flex items-center justify-center space-x-3 py-3 text-white font-semibold transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">H</span>
                      </div>
                      <span>Explore HSBC Solutions</span>
                    </div>
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="group-hover:translate-x-1 transition-transform"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </motion.div>
                  </motion.button>
                  
                  <p className="text-xs text-white/80 mt-2">
                    💎 Premium clients get exclusive access to advanced strategies
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Backdrop */}
      <motion.div
        key="alert-details-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />

      {/* Mini Chart Panel */}
      <MiniChart
        symbol={alert.details?.symbol || 'AAPL'}
        isOpen={showChart}
        onClose={() => setShowChart(false)}
      />
    </>
  );
};

export default AlertDetails; 