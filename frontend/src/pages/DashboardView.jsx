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

  // Demo chart data (7 points for the week)
  const demoChartData = [
    { day: 'Mon', value: totalValue * 0.92 },
    { day: 'Tue', value: totalValue * 0.95 },
    { day: 'Wed', value: totalValue * 0.94 },
    { day: 'Thu', value: totalValue * 0.97 },
    { day: 'Fri', value: totalValue * 0.96 },
    { day: 'Sat', value: totalValue * 0.99 },
    { day: 'Sun', value: totalValue || 50000 }
  ];

  // Calculate chart scaling
  const chartValues = demoChartData.map(d => d.value);
  const minValue = Math.min(...chartValues);
  const maxValue = Math.max(...chartValues);
  const valueRange = maxValue - minValue || 1000; // Prevent division by zero
  const padding = valueRange * 0.1; // 10% padding
  const chartMinValue = minValue - padding;
  const chartMaxValue = maxValue + padding;
  const chartRange = chartMaxValue - chartMinValue;

  // Generate unique ID for this chart instance
  const chartId = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Enhanced alerts with realistic examples
  const enhancedAlerts = [
    {
      id: 'alert-1',
      title: 'Apple drops 5.2% — Click to view AI analysis',
      severity: 'high',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      clickable: true
    },
    {
      id: 'alert-2', 
      title: 'Tesla breaks resistance at $280',
      severity: 'high',
      timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      clickable: true
    },
    {
      id: 'alert-3',
      title: 'Portfolio risk increased to 68%',
      severity: 'critical',
      timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      clickable: true
    },
    ...alerts
  ];

  // Get recent high priority alerts from enhanced list
  const recentAlerts = enhancedAlerts
    .filter(alert => alert.severity === 'high' || alert.severity === 'critical')
    .slice(0, 3);

  // Risk level text based on score
  const getRiskLevel = (score) => {
    if (score < 30) return { text: 'Low Risk', color: 'text-green-500' };
    if (score < 70) return { text: 'Medium Risk', color: 'text-yellow-500' };
    return { text: 'High Risk', color: 'text-red-500' };
  };

  const riskLevel = getRiskLevel(riskScore);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl py-6 lg:py-7 px-6 shadow-lg"
        >
          <p className="text-xs text-gray-400 uppercase mb-2">Total Portfolio Value</p>
          <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl py-6 lg:py-7 px-6 shadow-lg"
        >
          <p className="text-xs text-gray-400 uppercase mb-2">Daily Change</p>
          <div className={`flex items-center ${dailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {dailyChange >= 0 ? <ArrowUpRight className="w-6 h-6 mr-2" /> : <ArrowDownRight className="w-6 h-6 mr-2" />}
            <div>
              <p className="text-4xl font-extrabold">
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
          className="bg-white dark:bg-gray-800 rounded-xl py-6 lg:py-7 px-6 shadow-lg"
        >
          <p className="text-xs text-gray-400 uppercase mb-2">Risk Score</p>
          <div className="flex items-center">
            <div className={`text-4xl font-extrabold ${
              riskScore < 30 ? 'text-green-600' : 
              riskScore < 70 ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {riskScore}
            </div>
            <div className="ml-3">
              <span className={`text-sm font-medium ${riskLevel.color}`}>
                {riskLevel.text}
              </span>
            </div>
            <div className="ml-4 flex-1">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    riskScore < 30 ? 'bg-green-500' : 
                    riskScore < 70 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 
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
          className="bg-white dark:bg-gray-800 rounded-xl py-6 lg:py-7 px-6 shadow-lg border-l-4 border-red-600"
        >
          <p className="text-xs text-gray-400 uppercase mb-2">Active Alerts</p>
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-orange-500 mr-3" />
            <div>
              <p className="text-4xl font-extrabold text-gray-900 dark:text-white">{alerts.length}</p>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Portfolio Performance
            </h3>
            <span className="text-xs text-gray-400 uppercase px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              Demo Data
            </span>
          </div>
          <div className="h-64 relative">
            <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
              {/* Grid lines */}
              <defs>
                <pattern id={`grid-${chartId}`} width="40" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 25" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-300 dark:text-gray-600"/>
                </pattern>
                <linearGradient id={`gradient-${chartId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill={`url(#grid-${chartId})`} />
              
              {/* Chart area fill */}
              <path
                d={`M 20,180 ${demoChartData.map((point, index) => {
                  const x = (index / (demoChartData.length - 1)) * 360 + 20;
                  const y = 180 - ((point.value - chartMinValue) / chartRange) * 140;
                  return `L ${x},${y}`;
                }).join(' ')} L 380,180 Z`}
                fill={`url(#gradient-${chartId})`}
              />
              
              {/* Chart line */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={demoChartData.map((point, index) => {
                  const x = (index / (demoChartData.length - 1)) * 360 + 20;
                  const y = 180 - ((point.value - chartMinValue) / chartRange) * 140;
                  return `${x},${y}`;
                }).join(' ')}
              />
              
              {/* Data points */}
              {demoChartData.map((point, index) => {
                const x = (index / (demoChartData.length - 1)) * 360 + 20;
                const y = 180 - ((point.value - chartMinValue) / chartRange) * 140;
                return (
                  <circle
                    key={point.day}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="drop-shadow-sm hover:r-6 transition-all duration-200"
                  />
                );
              })}
              
              {/* Y-axis labels */}
              <text
                x="15"
                y="20"
                textAnchor="end"
                className="text-xs fill-gray-500 dark:fill-gray-400"
              >
                ${Math.round(chartMaxValue / 1000)}k
              </text>
              <text
                x="15"
                y="100"
                textAnchor="end"
                className="text-xs fill-gray-500 dark:fill-gray-400"
              >
                ${Math.round((chartMaxValue + chartMinValue) / 2000)}k
              </text>
              <text
                x="15"
                y="180"
                textAnchor="end"
                className="text-xs fill-gray-500 dark:fill-gray-400"
              >
                ${Math.round(chartMinValue / 1000)}k
              </text>
              
              {/* X-axis labels */}
              {demoChartData.map((point, index) => {
                const x = (index / (demoChartData.length - 1)) * 360 + 20;
                return (
                  <text
                    key={`label-${point.day}`}
                    x={x}
                    y="195"
                    textAnchor="middle"
                    className="text-xs fill-gray-500 dark:fill-gray-400"
                  >
                    {point.day}
                  </text>
                );
              })}
            </svg>
            
            {/* Value display */}
            <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Value</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ${demoChartData[demoChartData.length - 1].value.toLocaleString('en-US', { 
                  minimumFractionDigits: 0, 
                  maximumFractionDigits: 0 
                })}
              </p>
            </div>
            
            {/* Trend indicator */}
            <div className="absolute top-4 right-4 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  +8.2%
                </span>
              </div>
            </div>
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
                  className={`p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 ${
                    alert.clickable ? 'cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors' : ''
                  }`}
                  onClick={alert.clickable ? () => {/* TODO: Handle alert click */} : undefined}
                >
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {alert.title}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                    {alert.clickable && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Click to view details
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                No active alerts
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                System is monitoring your portfolio for risks
              </p>
            </div>
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