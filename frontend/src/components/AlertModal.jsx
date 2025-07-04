import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, TrendingDown, TrendingUp, Clock, Globe, BarChart3, Shield } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ProductRecommendations from './ProductRecommendations';

const AlertModal = ({ alert, onClose, riskScore }) => {
  if (!alert) return null;

  // Generate mock impact data
  const generateImpactData = () => {
    const data = [];
    for (let i = -10; i <= 10; i++) {
      data.push({
        time: i,
        price: 100 + (i < 0 ? Math.random() * 2 - 1 : i === 0 ? -5 : -5 + Math.random() * 3),
        volume: Math.abs(i) === 0 ? 150 : 100 + Math.random() * 20
      });
    }
    return data;
  };

  const impactData = generateImpactData();

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {alert.title}
                </h2>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  </span>
                  {alert.source && (
                    <span className="flex items-center space-x-1">
                      <Globe className="w-4 h-4" />
                      <span>{alert.source}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Event Summary */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Event Summary
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {alert.message}
              </p>
              {alert.details && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {alert.details.symbol && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Symbol</p>
                      <p className="font-bold text-gray-900 dark:text-white">{alert.details.symbol}</p>
                    </div>
                  )}
                  {alert.details.change_percent && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Change</p>
                      <p className={`font-bold ${alert.details.change_percent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {alert.details.change_percent > 0 ? '+' : ''}{alert.details.change_percent}%
                      </p>
                    </div>
                  )}
                  {alert.details.current_price && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current Price</p>
                      <p className="font-bold text-gray-900 dark:text-white">${alert.details.current_price}</p>
                    </div>
                  )}
                  {alert.impact?.score && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Impact Score</p>
                      <p className="font-bold text-gray-900 dark:text-white">{alert.impact.score}/100</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Impact Analysis */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Impact Analysis</span>
              </h3>
              
              {/* Price Impact Chart */}
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={impactData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#6B7280"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value === 0 ? 'Event' : `${value > 0 ? '+' : ''}${value}h`}
                    />
                    <YAxis 
                      stroke="#6B7280"
                      tick={{ fontSize: 12 }}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      dot={false}
                      name="Price Impact"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Impact Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-gray-900 dark:text-white">Immediate Impact</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Expected -5% to -8% price movement in the next 24 hours
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-gray-900 dark:text-white">Recovery Time</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Historical data suggests 3-5 days for similar events
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900 dark:text-white">Risk Mitigation</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Consider hedging strategies or portfolio rebalancing
                  </p>
                </div>
              </div>
            </div>

            {/* Recommended Products */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recommended Actions
              </h3>
              <ProductRecommendations riskScore={riskScore} />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Close
              </button>
              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  Download Report
                </button>
                <button className="px-4 py-2 bg-hsbc-red hover:bg-red-700 text-white rounded-lg transition-colors">
                  Contact Advisor
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AlertModal; 