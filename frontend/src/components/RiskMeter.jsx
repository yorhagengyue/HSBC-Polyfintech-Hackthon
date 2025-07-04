import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Shield, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';

// Tooltip component
const Tooltip = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg z-50 max-w-xs whitespace-pre-wrap border border-gray-700"
          >
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RiskMeter = ({ riskScore = 30, onRiskChange }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [prevScore, setPrevScore] = useState(0);

  useEffect(() => {
    setPrevScore(displayScore);
    setDisplayScore(riskScore);
    if (onRiskChange) {
      onRiskChange(riskScore);
    }
  }, [riskScore]);

  // Risk level configuration
  const getRiskConfig = (score) => {
    if (score <= 25) return {
      level: 'Low Risk',
      color: '#10b981',
      bgGradient: 'from-emerald-500/10 to-emerald-600/5',
      icon: CheckCircle,
      description: 'Markets are stable',
      recommendation: 'Maintain current strategy'
    };
    if (score <= 50) return {
      level: 'Moderate Risk',
      color: '#f59e0b',
      bgGradient: 'from-amber-500/10 to-amber-600/5',
      icon: Activity,
      description: 'Some market volatility',
      recommendation: 'Monitor positions closely'
    };
    if (score <= 75) return {
      level: 'High Risk',
      color: '#f97316',
      bgGradient: 'from-orange-500/10 to-orange-600/5',
      icon: AlertTriangle,
      description: 'Significant volatility',
      recommendation: 'Consider hedging strategies'
    };
    return {
      level: 'Critical Risk',
      color: '#ef4444',
      bgGradient: 'from-red-500/10 to-red-600/5',
      icon: AlertTriangle,
      description: 'Extreme market conditions',
      recommendation: 'Immediate action recommended'
    };
  };

  const config = getRiskConfig(displayScore);
  const Icon = config.icon;

  // Calculate rotation angle for the meter
  const rotation = -90 + (displayScore / 100) * 180;

  return (
    <div className="bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-fluid border border-gray-200/50 dark:border-gray-700/50 shadow-lg card-adaptive card-hover">
      <div className="flex items-center justify-between mb-fluid-lg">
        <h3 className="text-xl-fluid font-bold text-gray-900 dark:text-white flex items-center">
          <Shield className="w-5 h-5 mr-2 text-hsbc-red" />
          Risk Assessment
        </h3>
    <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
    >
          <span className={`text-small px-3 py-1 rounded-full font-medium ${
            riskScore < 30 ? 'bg-green-500/20 text-green-500' :
            riskScore < 70 ? 'bg-yellow-500/20 text-yellow-500' :
            'bg-red-500/20 text-red-500'
          }`}>
            {riskScore < 30 ? 'Low Risk' : riskScore < 70 ? 'Medium Risk' : 'High Risk'}
          </span>
        </motion.div>
      </div>

      {/* Modern Semi-Circular Gauge */}
      <div className="relative w-full flex justify-center mb-8">
        <div className="relative w-56 h-40 pt-8">
          <svg className="w-full h-28" viewBox="0 0 256 140">
            <defs>
              {/* Segment gradients */}
              <linearGradient id="greenSegment" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
              <linearGradient id="orangeSegment" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              <linearGradient id="redSegment" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
            
            {/* Background arc */}
            <path
              d="M 20 120 A 108 108 0 0 1 236 120"
              fill="none"
              stroke="rgba(75, 85, 99, 0.3)"
              strokeWidth="16"
              strokeLinecap="round"
            />
            
            {/* Active progress arc based on score */}
            <motion.path
              d="M 20 120 A 108 108 0 0 1 236 120"
              fill="none"
              stroke={
                displayScore <= 33 ? "url(#greenSegment)" :
                displayScore <= 66 ? "url(#orangeSegment)" : 
                "url(#redSegment)"
              }
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={`${(displayScore / 100) * 339.29} 339.29`}
              initial={{ strokeDasharray: "0 339.29" }}
              animate={{ strokeDasharray: `${(displayScore / 100) * 339.29} 339.29` }}
              transition={{ duration: 1.5, delay: 0.3 }}
            />
            
            {/* Pointer */}
            <motion.g
              initial={{ rotate: -90 }}
              animate={{ rotate: (displayScore / 100) * 180 - 90 }}
              transition={{ type: "spring", damping: 15, stiffness: 80, delay: 1 }}
              style={{ transformOrigin: "128px 120px" }}
            >
              <line
                x1="128"
                y1="120"
                x2="128"
                y2="47"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-gray-700 dark:text-gray-300"
              />
              <circle
                cx="128"
                cy="120"
                r="6"
                fill="currentColor"
                className="text-gray-700 dark:text-gray-300"
              />
              <circle
                cx="128"
                cy="47"
                r="3"
                fill={
                  displayScore <= 33 ? "#10b981" :
                  displayScore <= 66 ? "#f59e0b" : 
                  "#ef4444"
                }
              />
            </motion.g>
            
            {/* Score labels */}
            <text x="20" y="137" textAnchor="middle" className="text-xs fill-gray-500">0</text>
            <text x="128" y="25" textAnchor="middle" className="text-xs fill-gray-500">50</text>
            <text x="236" y="137" textAnchor="middle" className="text-xs fill-gray-500">100</text>
          </svg>

          {/* Center score display */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
            <motion.div
              key={displayScore}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15, delay: 1 }}
              className="text-center"
            >
              <div className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
                {displayScore}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Risk Score
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Risk Level Card */}
      <motion.div
        className={`bg-gradient-to-r ${config.bgGradient} rounded-xl p-4 mb-4 border border-gray-600/20 backdrop-blur-sm`}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Icon className="w-5 h-5" style={{ color: config.color }} />
              <h4 className="text-lg font-semibold text-gray-100 dark:text-gray-100">
                {config.level}
              </h4>
            </div>
            <p className="text-sm text-gray-300 dark:text-gray-300">{config.description}</p>
            <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">{config.recommendation}</p>
          </div>
          {displayScore > prevScore && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5 }}
            >
              <TrendingUp className="w-4 h-4 text-red-400" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Enhanced Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <motion.div
          className="bg-gray-800/30 dark:bg-gray-800/30 light:bg-gray-100 rounded-lg p-3 border border-gray-700/30 dark:border-gray-700/30 light:border-gray-200"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center space-x-1 mb-1">
            <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">Market Volatility</p>
            <Tooltip content="Measures price swings and market uncertainty. Based on standard deviation of returns over the last 30 days.">
              <Info className="w-3 h-3 text-gray-500 hover:text-gray-400 transition-colors" />
            </Tooltip>
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-white dark:text-white light:text-gray-900">
              {displayScore > 75 ? 'Extreme' : displayScore > 50 ? 'High' : displayScore > 25 ? 'Moderate' : 'Low'}
            </p>
            <div className={`w-2 h-2 rounded-full ${
              displayScore > 75 ? 'bg-red-500' : 
              displayScore > 50 ? 'bg-orange-500' : 
              displayScore > 25 ? 'bg-yellow-500' : 'bg-green-500'
            }`} />
          </div>
        </motion.div>
        
        <motion.div
          className="bg-gray-800/30 dark:bg-gray-800/30 light:bg-gray-100 rounded-lg p-3 border border-gray-700/30 dark:border-gray-700/30 light:border-gray-200"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center space-x-1 mb-1">
            <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">Alert Frequency</p>
            <Tooltip content="Number of risk alerts triggered in the last 24 hours. Higher frequency indicates increased market activity.">
              <Info className="w-3 h-3 text-gray-500 hover:text-gray-400 transition-colors" />
            </Tooltip>
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-white dark:text-white light:text-gray-900">
              {displayScore > 75 ? 'Very High' : displayScore > 50 ? 'Elevated' : 'Normal'}
            </p>
            <div className={`w-2 h-2 rounded-full ${
              displayScore > 75 ? 'bg-red-500' : 
              displayScore > 50 ? 'bg-orange-500' : 'bg-green-500'
            }`} />
          </div>
        </motion.div>
      </div>

      {/* Additional semantic indicators */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <motion.div
          className="bg-gray-800/20 dark:bg-gray-800/20 light:bg-gray-50 rounded-lg p-2 text-center border border-gray-700/20 dark:border-gray-700/20 light:border-gray-200"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <p className="text-xs text-gray-500 mb-1">Portfolio Risk</p>
          <div className="flex items-center justify-center space-x-1">
            <span className="text-xs font-medium text-white dark:text-white light:text-gray-900">
              {displayScore > 60 ? 'HIGH' : displayScore > 30 ? 'MED' : 'LOW'}
            </span>
            <Tooltip content="Overall portfolio risk based on correlation between your watchlist stocks and market conditions.">
              <Info className="w-3 h-3 text-gray-500" />
            </Tooltip>
          </div>
        </motion.div>

        <motion.div
          className="bg-gray-800/20 dark:bg-gray-800/20 light:bg-gray-50 rounded-lg p-2 text-center border border-gray-700/20 dark:border-gray-700/20 light:border-gray-200"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <p className="text-xs text-gray-500 mb-1">Trend</p>
          <div className="flex items-center justify-center space-x-1">
            <span className="text-xs font-medium text-white dark:text-white light:text-gray-900">
              {displayScore > prevScore ? '↗ Rising' : displayScore < prevScore ? '↘ Falling' : '→ Stable'}
            </span>
          </div>
        </motion.div>

        <motion.div
          className="bg-gray-800/20 dark:bg-gray-800/20 light:bg-gray-50 rounded-lg p-2 text-center border border-gray-700/20 dark:border-gray-700/20 light:border-gray-200"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <p className="text-xs text-gray-500 mb-1">Confidence</p>
          <div className="flex items-center justify-center space-x-1">
            <span className="text-xs font-medium text-white dark:text-white light:text-gray-900">
              {displayScore > 70 ? '95%' : displayScore > 40 ? '87%' : '91%'}
            </span>
            <Tooltip content="Algorithm confidence level based on data quality and market stability.">
              <Info className="w-3 h-3 text-gray-500" />
            </Tooltip>
          </div>
        </motion.div>
      </div>

      {/* HSBC Action Card */}
      <AnimatePresence>
        {displayScore > 50 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-hsbc-red/10 to-hsbc-red/5 rounded-lg p-4 border border-hsbc-red/20"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-hsbc-red/20 rounded-lg">
                <Shield className="w-4 h-4 text-hsbc-red" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">HSBC Protection Available</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {displayScore > 75 
                    ? 'Speak with an advisor about hedging options'
                    : 'Risk management products can help protect your portfolio'
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RiskMeter; 