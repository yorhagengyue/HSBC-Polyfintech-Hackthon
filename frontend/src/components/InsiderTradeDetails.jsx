import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Building2, Calendar, DollarSign, 
  TrendingUp, TrendingDown, FileText, ExternalLink,
  BarChart3, Activity, Shield, ChevronRight
} from 'lucide-react';

const InsiderTradeDetails = ({ trade, onClose }) => {
  if (!trade) return null;

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTransactionTypeColor = () => {
    return trade.transactionType === 'BUY' ? 'text-green-400' : 'text-red-400';
  };

  const getTransactionIcon = () => {
    return trade.transactionType === 'BUY' ? 
      <TrendingUp className="w-6 h-6" /> : 
      <TrendingDown className="w-6 h-6" />;
  };

  return (
    <>
      <motion.div
        key="trade-details-panel"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <motion.div 
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`relative p-6 bg-gradient-to-r ${
            trade.transactionType === 'BUY' ? 
            'from-green-500/20 to-emerald-500/10' : 
            'from-red-500/20 to-pink-500/10'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  trade.transactionType === 'BUY' ? 
                  'bg-green-500/20 text-green-400' : 
                  'bg-red-500/20 text-red-400'
                }`}>
                  {getTransactionIcon()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {trade.symbol} - {trade.transactionType}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">{trade.companyName}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`text-2xl font-bold ${getTransactionTypeColor()}`}>
                      {formatCurrency(trade.value)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {trade.shares?.toLocaleString()} shares @ ${trade.pricePerShare?.toFixed(2)}
                    </span>
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
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Insider Information */}
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
                Insider Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Name</p>
                  <p className="text-gray-900 dark:text-white font-medium">{trade.insiderName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Title</p>
                  <p className="text-gray-900 dark:text-white font-medium">{trade.insiderTitle}</p>
                </div>
                {trade.relation && (
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Relation</p>
                    <p className="text-gray-900 dark:text-white font-medium">{trade.relation}</p>
                  </div>
                )}
                {trade.ownershipType && (
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ownership Type</p>
                    <p className="text-gray-900 dark:text-white font-medium">{trade.ownershipType}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Details */}
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
                Transaction Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Transaction Date</p>
                  <p className="text-gray-900 dark:text-white font-medium flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                    {formatDate(trade.transactionDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Filing Date</p>
                  <p className="text-gray-900 dark:text-white font-medium">{formatDate(trade.filingDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Transaction Code</p>
                  <p className="text-gray-900 dark:text-white font-medium">{trade.transactionCode}</p>
                </div>
              </div>

              {/* Holdings After Transaction */}
              {trade.sharesOwned && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Holdings After Transaction</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 dark:text-white font-medium">
                      {trade.sharesOwned.toLocaleString()} shares
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Value: {formatCurrency(trade.sharesOwned * (trade.currentPrice || trade.pricePerShare))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Market Context */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-5 border border-blue-500/20">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-400" />
                Market Context
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Current Stock Price</span>
                  <span className="text-gray-900 dark:text-white font-medium">${trade.currentPrice?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Price Change Since Transaction</span>
                  <span className={`font-medium ${
                    trade.priceChange > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {trade.priceChange > 0 ? '+' : ''}{trade.priceChange?.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Market Cap</span>
                  <span className="text-gray-900 dark:text-white font-medium">{trade.marketCap || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* HSBC Investment Insights */}
            <div className="bg-gradient-to-r from-hsbc-red/10 to-hsbc-red/5 rounded-xl p-5 border border-hsbc-red/20">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-5 h-5 text-hsbc-red" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">HSBC Investment Insights</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-200/50 dark:bg-gray-800/30 rounded-lg p-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {trade.transactionType === 'BUY' ? 
                      'Insider buying can signal confidence in the company\'s future prospects.' :
                      'Insider selling may occur for various reasons including diversification or personal needs.'
                    }
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Consider this alongside other factors when making investment decisions.
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700 dark:text-gray-300 flex items-start">
                    <ChevronRight className="w-4 h-4 mr-1 mt-0.5 text-hsbc-red flex-shrink-0" />
                    Access HSBC research reports for detailed analysis
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 flex items-start">
                    <ChevronRight className="w-4 h-4 mr-1 mt-0.5 text-hsbc-red flex-shrink-0" />
                    Consult with HSBC advisors for personalized guidance
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 flex items-start">
                    <ChevronRight className="w-4 h-4 mr-1 mt-0.5 text-hsbc-red flex-shrink-0" />
                    Explore HSBC trading platforms for execution
                  </p>
                </div>

                <button className="mt-4 w-full bg-hsbc-red/20 hover:bg-hsbc-red/30 text-hsbc-red py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                  <span className="font-medium">Learn More About HSBC Trading</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SEC Filing Link */}
            {trade.secFilingUrl && (
              <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">SEC Filing</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">View the official Form 4 filing</p>
                  </div>
                </div>
                <a 
                  href={trade.secFilingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span className="text-sm">View Filing</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Backdrop */}
      <motion.div
        key="trade-details-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />
    </>
  );
};

export default InsiderTradeDetails; 